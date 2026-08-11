-- New fighters use a shared Color + Weather/Animal + CityCode identity.
-- Existing lowercase identities remain valid and permanently reserved.

alter table public.cage_name_registry
drop constraint if exists cage_name_registry_format;

alter table public.cage_name_registry
add constraint cage_name_registry_format check (
  name ~ '^[a-z][a-z0-9_]{2,31}$'
  or name ~ '^[A-Z][A-Za-z]{2,27}(PHX|LAX|CHI|NYC|MIA|HOU|CLE|SEA|NOLA|HNL)$'
);

create unique index if not exists cage_name_registry_lower_name_idx
on public.cage_name_registry (lower(name));

alter table public.cage_profiles
drop constraint if exists cage_profiles_handle_format;

alter table public.cage_profiles
add constraint cage_profiles_handle_format check (
  handle ~ '^[a-z][a-z0-9_]{2,31}$'
  or handle ~ '^[A-Z][A-Za-z]{2,27}(PHX|LAX|CHI|NYC|MIA|HOU|CLE|SEA|NOLA|HNL)$'
);

create or replace function public.claim_cage_identity(
  p_candidates text[],
  p_city text,
  p_archetype text,
  p_fighter_avatar text,
  p_level integer,
  p_wins integer,
  p_losses integer
)
returns public.cage_profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_candidate text;
  v_city_code text;
  v_profile public.cage_profiles;
  v_attempts integer := 0;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_city not in ('phoenix','los-angeles','chicago','new-york','miami','houston','cleveland','seattle','new-orleans','hawaii') then raise exception 'Invalid fighter city'; end if;
  if p_archetype not in ('pressure','counter','brawler','trickster','control','submission','wrestleBox') then raise exception 'Invalid fighter archetype'; end if;
  if p_fighter_avatar is null or p_fighter_avatar !~ '^fighter-(0[1-9]|1[0-9]|20)$' then raise exception 'Invalid fighter avatar'; end if;

  v_city_code := case p_city
    when 'phoenix' then 'PHX'
    when 'los-angeles' then 'LAX'
    when 'chicago' then 'CHI'
    when 'new-york' then 'NYC'
    when 'miami' then 'MIA'
    when 'houston' then 'HOU'
    when 'cleveland' then 'CLE'
    when 'seattle' then 'SEA'
    when 'new-orleans' then 'NOLA'
    when 'hawaii' then 'HNL'
  end;

  select * into v_profile
  from public.cage_profiles
  where id=v_user_id and retired_at is null
  for update;
  if found then return v_profile; end if;

  foreach v_candidate in array coalesce(p_candidates,array[]::text[]) loop
    v_attempts := v_attempts + 1;
    exit when v_attempts > 300;
    v_candidate := trim(v_candidate);
    if v_candidate !~ '^[A-Z][A-Za-z]{2,27}(PHX|LAX|CHI|NYC|MIA|HOU|CLE|SEA|NOLA|HNL)$' then continue; end if;
    if right(v_candidate,length(v_city_code))<>v_city_code then continue; end if;

    insert into public.cage_name_registry (name,owner_id)
    values (v_candidate,v_user_id)
    on conflict do nothing;

    if found then
      insert into public.cage_profiles (
        id,handle,city,archetype,fighter_avatar,level,wins,losses,created_at,updated_at,retired_at
      ) values (
        v_user_id,v_candidate,p_city,p_archetype,p_fighter_avatar,
        greatest(1,least(99,coalesce(p_level,1))),
        greatest(0,least(9999,coalesce(p_wins,0))),
        greatest(0,least(9999,coalesce(p_losses,0))),
        now(),now(),null
      )
      on conflict (id) do update set
        handle=excluded.handle,
        city=excluded.city,
        archetype=excluded.archetype,
        fighter_avatar=excluded.fighter_avatar,
        level=excluded.level,
        wins=excluded.wins,
        losses=excluded.losses,
        created_at=now(),
        updated_at=now(),
        retired_at=null
      returning * into v_profile;
      return v_profile;
    end if;
  end loop;

  raise exception 'No unique Cage Grind name was available';
end;
$$;

revoke execute on function public.claim_cage_identity(text[],text,text,text,integer,integer,integer) from public, anon;
grant execute on function public.claim_cage_identity(text[],text,text,text,integer,integer,integer) to authenticated;

comment on function public.claim_cage_identity(text[],text,text,text,integer,integer,integer)
is 'Claims a permanent case-preserved Color + Weather/Animal + CityCode fighter identity.';
