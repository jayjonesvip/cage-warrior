create index if not exists cage_profiles_level_updated_at_idx
on public.cage_profiles (level, updated_at desc);

create or replace function public.get_cage_opponent_candidates(
  p_level integer,
  p_limit integer default 12
)
returns table (
  id uuid,
  handle text,
  fighter_name text,
  city text,
  archetype text,
  fighter_avatar text,
  level integer,
  wins integer,
  losses integer,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_level integer := greatest(1,least(99,coalesce(p_level,1)));
  v_limit integer := greatest(1,least(20,coalesce(p_limit,12)));
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  return query
  select
    profile.id,
    profile.handle,
    profile.fighter_name,
    profile.city,
    profile.archetype,
    profile.fighter_avatar,
    profile.level,
    profile.wins,
    profile.losses,
    profile.updated_at
  from public.cage_profiles as profile
  where profile.id <> v_user_id
    and profile.level = v_level
    and profile.fighter_avatar is not null
    and profile.updated_at >= now() - interval '30 days'
  order by md5(profile.id::text || '|' || v_user_id::text)
  limit v_limit;
end;
$$;

revoke execute on function public.get_cage_opponent_candidates(integer,integer) from public, anon;
grant execute on function public.get_cage_opponent_candidates(integer,integer) to authenticated;

comment on function public.get_cage_opponent_candidates(integer,integer) is
'Returns a stable, exact-level pool of recently active public fighter profiles for local AI-controlled opponent snapshots.';
