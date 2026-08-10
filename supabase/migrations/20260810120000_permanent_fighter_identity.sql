-- Unify the public fighter name and Cage Feed handle into one permanent identity.
-- Retired names remain reserved forever and cannot be claimed by another career.

alter table public.cage_profiles
add column if not exists retired_at timestamptz;

create table if not exists public.cage_name_registry (
  name text primary key,
  owner_id uuid not null,
  claimed_at timestamptz not null default now(),
  retired_at timestamptz,
  constraint cage_name_registry_format check (name ~ '^[a-z][a-z0-9_]{2,31}$')
);

alter table public.cage_name_registry enable row level security;
revoke all on table public.cage_name_registry from public, anon, authenticated;

insert into public.cage_name_registry (name,owner_id,claimed_at)
select lower(profile.handle),profile.id,profile.created_at
from public.cage_profiles as profile
on conflict (name) do nothing;

update public.cage_feed_posts set author_handle=lower(author_handle) where author_handle<>'CageReporter';
update public.cage_feed_posts set target_handle=lower(target_handle) where target_handle is not null;
update public.cage_profiles set handle=lower(handle);

drop function if exists public.register_cage_profile(text,text,text,integer,integer,integer,text);
drop function if exists public.register_cage_profile(text,text,text,integer,integer,integer);
drop function if exists public.get_cage_opponent_candidates(integer,integer);

alter table public.cage_profiles drop constraint if exists cage_profiles_handle_format;
alter table public.cage_profiles drop constraint if exists cage_profiles_name_length;
alter table public.cage_profiles drop constraint if exists cage_profiles_city;
alter table public.cage_profiles drop column if exists fighter_name;
alter table public.cage_profiles add constraint cage_profiles_handle_format check (handle ~ '^[a-z][a-z0-9_]{2,31}$');
alter table public.cage_profiles add constraint cage_profiles_city check (city in ('phoenix','los-angeles','chicago','new-york','miami','houston','cleveland','seattle','new-orleans','hawaii'));

alter table public.cage_feed_posts drop column if exists author_name;
alter table public.cage_feed_posts drop column if exists target_name;

create index if not exists cage_profiles_active_updated_at_idx
on public.cage_profiles (updated_at desc) where retired_at is null;

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
  v_profile public.cage_profiles;
  v_attempts integer := 0;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_city not in ('phoenix','los-angeles','chicago','new-york','miami','houston','cleveland','seattle','new-orleans','hawaii') then raise exception 'Invalid fighter city'; end if;
  if p_archetype not in ('pressure','counter','brawler','trickster','control','submission','wrestleBox') then raise exception 'Invalid fighter archetype'; end if;
  if p_fighter_avatar is null or p_fighter_avatar !~ '^fighter-(0[1-9]|1[0-9]|20)$' then raise exception 'Invalid fighter avatar'; end if;

  select * into v_profile
  from public.cage_profiles
  where id=v_user_id and retired_at is null
  for update;
  if found then return v_profile; end if;

  foreach v_candidate in array coalesce(p_candidates,array[]::text[]) loop
    v_attempts := v_attempts + 1;
    exit when v_attempts > 300;
    v_candidate := lower(trim(v_candidate));
    if v_candidate !~ '^[a-z][a-z0-9]{2,31}$' then continue; end if;

    insert into public.cage_name_registry (name,owner_id)
    values (v_candidate,v_user_id)
    on conflict (name) do nothing;

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

create or replace function public.sync_cage_profile(
  p_level integer,
  p_wins integer,
  p_losses integer,
  p_fighter_avatar text
)
returns public.cage_profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.cage_profiles;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_fighter_avatar is null or p_fighter_avatar !~ '^fighter-(0[1-9]|1[0-9]|20)$' then raise exception 'Invalid fighter avatar'; end if;

  update public.cage_profiles
  set level=greatest(1,least(99,coalesce(p_level,1))),
      wins=greatest(0,least(9999,coalesce(p_wins,0))),
      losses=greatest(0,least(9999,coalesce(p_losses,0))),
      fighter_avatar=p_fighter_avatar,
      updated_at=now()
  where id=v_user_id and retired_at is null
  returning * into v_profile;

  if not found then raise exception 'Create a permanent fighter identity before syncing'; end if;
  return v_profile;
end;
$$;

create or replace function public.retire_cage_profile()
returns public.cage_profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.cage_profiles;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  select * into v_profile
  from public.cage_profiles
  where id=v_user_id and retired_at is null
  for update;
  if not found then return null; end if;

  delete from public.cage_feed_posts
  where author_id=v_user_id and post_kind<>'reporter';

  update public.cage_feed_posts
  set target_profile_id=null
  where target_profile_id=v_user_id;

  insert into public.cage_feed_posts (
    author_id,author_handle,post_kind,body,created_at
  ) values (
    v_user_id,'cagereporter','reporter',
    '@' || v_profile.handle || ' has officially retired from competition. Their Cage Grind career is now part of the record.',
    now()
  );

  update public.cage_profiles
  set retired_at=now(),updated_at=now()
  where id=v_user_id
  returning * into v_profile;

  update public.cage_name_registry
  set retired_at=now()
  where name=v_profile.handle and owner_id=v_user_id;

  return v_profile;
end;
$$;

create or replace function public.publish_cage_post(
  p_post_kind text,
  p_body text,
  p_target_profile_id uuid default null
)
returns public.cage_feed_posts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_body text := trim(coalesce(p_body,''));
  v_author public.cage_profiles;
  v_target public.cage_profiles;
  v_post public.cage_feed_posts;
  v_is_interaction boolean := p_post_kind in ('callout','props','welcome','respect','watching');
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_post_kind not in ('player','reporter','callout','props','welcome','respect','watching') then raise exception 'Invalid Cage Feed post type'; end if;
  if char_length(v_body) not between 2 and 280 then raise exception 'Cage Feed posts must contain 2 to 280 characters'; end if;

  select * into v_author from public.cage_profiles where id=v_user_id and retired_at is null;
  if not found then raise exception 'Create a Cage profile before posting'; end if;

  if (select count(*) from public.cage_feed_posts where author_id=v_user_id and created_at>now()-interval '24 hours') >= 40 then
    raise exception 'Daily shared Cage Feed post limit reached';
  end if;

  if v_is_interaction then
    if p_target_profile_id is null or p_target_profile_id=v_user_id then raise exception 'Choose another fighter'; end if;
    select * into v_target from public.cage_profiles where id=p_target_profile_id and retired_at is null;
    if not found then raise exception 'That fighter is no longer available'; end if;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user_id::text, 0));
    if public.get_cage_interactions_remaining() < 1 then raise exception 'Five daily fighter interactions already used'; end if;
  elsif p_target_profile_id is not null then
    raise exception 'Only fighter interactions may target another fighter';
  end if;

  insert into public.cage_feed_posts (
    author_id,author_handle,post_kind,body,target_profile_id,target_handle
  ) values (
    v_user_id,
    case when p_post_kind='reporter' then 'cagereporter' else v_author.handle end,
    p_post_kind,
    v_body,
    v_target.id,
    v_target.handle
  ) returning * into v_post;
  return v_post;
end;
$$;

create or replace function public.get_cage_profile_count()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer from public.cage_profiles where retired_at is null;
$$;

create function public.get_cage_opponent_candidates(
  p_level integer,
  p_limit integer default 12
)
returns table (
  id uuid,
  handle text,
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
  if v_user_id is null then raise exception 'Authentication required'; end if;
  return query
  select profile.id,profile.handle,profile.city,profile.archetype,profile.fighter_avatar,
         profile.level,profile.wins,profile.losses,profile.updated_at
  from public.cage_profiles as profile
  where profile.id<>v_user_id
    and profile.retired_at is null
    and profile.level=v_level
    and profile.fighter_avatar is not null
    and profile.updated_at>=now()-interval '30 days'
  order by md5(profile.id::text || '|' || v_user_id::text)
  limit v_limit;
end;
$$;

revoke execute on function public.claim_cage_identity(text[],text,text,text,integer,integer,integer) from public, anon;
revoke execute on function public.sync_cage_profile(integer,integer,integer,text) from public, anon;
revoke execute on function public.retire_cage_profile() from public, anon;
revoke execute on function public.publish_cage_post(text,text,uuid) from public, anon;
revoke execute on function public.get_cage_profile_count() from public, anon;
revoke execute on function public.get_cage_opponent_candidates(integer,integer) from public, anon;
grant execute on function public.claim_cage_identity(text[],text,text,text,integer,integer,integer) to authenticated;
grant execute on function public.sync_cage_profile(integer,integer,integer,text) to authenticated;
grant execute on function public.retire_cage_profile() to authenticated;
grant execute on function public.publish_cage_post(text,text,uuid) to authenticated;
grant execute on function public.get_cage_profile_count() to authenticated;
grant execute on function public.get_cage_opponent_candidates(integer,integer) to authenticated;

comment on table public.cage_name_registry is 'Permanent global reservation of every Cage Grind fighter identity, including retired fighters.';
comment on function public.retire_cage_profile() is 'Publishes a CageReporter retirement announcement and retires the authenticated public fighter.';
