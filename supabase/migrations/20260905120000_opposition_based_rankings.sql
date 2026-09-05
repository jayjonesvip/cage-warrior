-- Apply before deploying the browser update: ranking history expands to 30 bouts.
begin;
alter table public.cage_profiles drop constraint if exists cage_profiles_ranking_history;
alter table public.cage_profiles add constraint cage_profiles_ranking_history
check (jsonb_typeof(ranking_history)='array' and jsonb_array_length(ranking_history)<=30);

create or replace function public.cage_world_rank_score(
 p_wins integer,p_losses integer,p_level integer,p_attribute_total integer,p_ranking_history jsonb
) returns numeric language sql immutable set search_path = '' as $$
with inputs as (
 select greatest(0,coalesce(p_wins,0))::numeric wins,
 greatest(0,coalesce(p_losses,0))::numeric losses,
 greatest(20,coalesce(p_attribute_total,20+greatest(0,coalesce(p_level,1)-1)))::numeric attributes,
 case when jsonb_typeof(p_ranking_history)='array' then p_ranking_history else '[]'::jsonb end history
), entries as (
 select (e->>'won')::boolean won,
 greatest(0,least(100,coalesce((e->>'quality')::numeric,20))) quality,ordinal
 from inputs,jsonb_array_elements(history) with ordinality as h(e,ordinal)
 where jsonb_typeof(e->'won')='boolean'
 order by ordinal desc limit 30
), recent as (select * from entries order by ordinal desc limit 10),
best as (select quality from entries where won order by quality desc limit 5),
components as (
 select *,
 case when wins+losses>0 then (wins+2)/(wins+losses+4) else 0 end proven,
 case when exists(select 1 from entries)
 then coalesce((select sum(quality) from best),0)/5*.7
   +coalesce((select avg(quality) from entries where won),0)*.3
 else 20 end quality_score
 from inputs
)
select round((
 (proven*75+least(wins,50)/50*25)*.30
 +quality_score*.45
 +coalesce((select avg(case when won then 50+quality*.5 else quality*.3 end) from recent),proven*100)*.20
 +least(100,attributes/150*100)*.05
)::numeric,6) from components;
$$;
revoke all on function public.cage_world_rank_score(integer,integer,integer,integer,jsonb) from public,anon,authenticated;

create or replace function public.sync_cage_ranking(
  p_attribute_total integer,
  p_ranking_history jsonb
)
returns public.cage_profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_history jsonb := coalesce(p_ranking_history,'[]'::jsonb);
  v_normalized jsonb;
  v_profile public.cage_profiles;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(v_history)<>'array' or jsonb_array_length(v_history)>30 then
    raise exception 'Invalid ranking history';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(v_history) entry
    where jsonb_typeof(entry) is distinct from 'object'
      or jsonb_typeof(entry->'won') is distinct from 'boolean'
      or jsonb_typeof(entry->'quality') is distinct from 'number'
      or (entry->>'quality')::numeric<0
      or (entry->>'quality')::numeric>100
  ) then raise exception 'Invalid ranking history entry'; end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'won',(entry->>'won')::boolean,
        'quality',round((entry->>'quality')::numeric)
      ) order by ordinal
    ),
    '[]'::jsonb
  ) into v_normalized
  from jsonb_array_elements(v_history) with ordinality as result(entry,ordinal);

  update public.cage_profiles
  set attribute_total=greatest(4,least(40000,coalesce(p_attribute_total,20))),
      ranking_history=v_normalized,
      updated_at=now()
  where id=v_user_id and retired_at is null
  returning * into v_profile;

  if v_profile.id is null then raise exception 'Permanent fighter identity required'; end if;
  return v_profile;
end;
$$;

revoke execute on function public.sync_cage_ranking(integer,jsonb) from public,anon;
grant execute on function public.sync_cage_ranking(integer,jsonb) to authenticated;


comment on column public.cage_profiles.ranking_history is
'Latest 30 fight-quality snapshots; top five wins anchor quality and last ten bouts determine recent form.';
commit;
