-- Persist the public inputs used by the hybrid World Rank calculation.
-- Existing profiles remain valid and begin with neutral recent-form/opponent-quality history.

alter table public.cage_profiles
add column if not exists attribute_total integer not null default 20;

alter table public.cage_profiles
add column if not exists ranking_history jsonb not null default '[]'::jsonb;

update public.cage_profiles
set attribute_total=greatest(20,20+greatest(0,coalesce(level,1)-1))
where attribute_total=20;

alter table public.cage_profiles
drop constraint if exists cage_profiles_attribute_total;

alter table public.cage_profiles
add constraint cage_profiles_attribute_total
check (attribute_total between 4 and 40000);

alter table public.cage_profiles
drop constraint if exists cage_profiles_ranking_history;

alter table public.cage_profiles
add constraint cage_profiles_ranking_history
check (
  jsonb_typeof(ranking_history)='array'
  and jsonb_array_length(ranking_history)<=10
);

create or replace function public.cage_world_rank_score(
  p_wins integer,
  p_losses integer,
  p_level integer,
  p_attribute_total integer,
  p_ranking_history jsonb
)
returns numeric
language sql
immutable
set search_path = ''
as $$
  with values_normalized as (
    select
      greatest(0,coalesce(p_wins,0))::numeric as wins,
      greatest(0,coalesce(p_losses,0))::numeric as losses,
      greatest(4,coalesce(p_attribute_total,20+greatest(0,coalesce(p_level,1)-1)))::numeric as attributes,
      case when jsonb_typeof(p_ranking_history)='array' then p_ranking_history else '[]'::jsonb end as history
  ), components as (
    select
      case when wins+losses>0 then wins/(wins+losses) else 0 end as win_rate,
      wins+losses as fights,
      attributes,
      history
    from values_normalized
  ), history_components as (
    select
      components.*,
      coalesce(jsonb_array_length(history),0) as history_count,
      coalesce((select count(*) from jsonb_array_elements(history) entry where entry->>'won'='true'),0) as recent_wins,
      coalesce((select avg((entry->>'quality')::numeric) from jsonb_array_elements(history) entry where entry->>'won'='true' and jsonb_typeof(entry->'quality')='number'),50) as quality_score
    from components
  )
  select round((
    ((win_rate*75)+(least(fights,50)/50*25))*.50
    + quality_score*.25
    + (case when history_count>0 then recent_wins::numeric/history_count*100 else win_rate*100 end)*.15
    + least(100,attributes/150*100)*.10
  )::numeric,6)
  from history_components;
$$;

revoke all on function public.cage_world_rank_score(integer,integer,integer,integer,jsonb)
from public,anon,authenticated;

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
  if jsonb_typeof(v_history)<>'array' or jsonb_array_length(v_history)>10 then
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

create or replace function public.select_cage_championship_defense_challenger(
  p_champion_id uuid,
  p_challenge_day date
)
returns uuid
language sql stable security definer set search_path = ''
as $$
  select candidate.id
  from public.cage_profiles as candidate
  where candidate.retired_at is null
    and candidate.id<>p_champion_id
    and coalesce(candidate.wins,0)+coalesce(candidate.losses,0)>0
    and not exists (
      select 1
      from public.cage_championship_challenges as bout
      where bout.championship_key='world'
        and bout.challenger_id=candidate.id
        and bout.challenge_day=p_challenge_day
    )
  order by
    public.cage_world_rank_score(candidate.wins,candidate.losses,candidate.level,candidate.attribute_total,candidate.ranking_history) desc,
    coalesce(candidate.wins,0)::numeric/greatest(coalesce(candidate.wins,0)+coalesce(candidate.losses,0),1) desc,
    coalesce(candidate.wins,0)+coalesce(candidate.losses,0) desc,
    lower(candidate.handle),
    candidate.id
  limit 1;
$$;

revoke all on function public.select_cage_championship_defense_challenger(uuid,date)
from public,anon,authenticated;

comment on column public.cage_profiles.attribute_total is
'Permanent Power, Speed, Chin, and Cardio total used by World Rank; equipped gear is excluded.';

comment on column public.cage_profiles.ranking_history is
'Latest ten public fight-quality entries used for opponent quality and recent form.';

comment on function public.sync_cage_ranking(integer,jsonb) is
'Updates authenticated fighter World Rank inputs without exposing direct profile writes.';
