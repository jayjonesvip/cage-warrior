-- Add protected, one-time Cage Grind CEO announcements to the shared feed.
-- Players may request only known career event keys; the database owns the copy.

alter table public.cage_feed_posts
add column if not exists official_event_key text;

alter table public.cage_feed_posts
drop constraint if exists cage_feed_posts_kind;

alter table public.cage_feed_posts
add constraint cage_feed_posts_kind
check (post_kind in ('player','reporter','ceo','callout','props','welcome','respect','watching'));

create unique index if not exists cage_feed_posts_official_event_idx
on public.cage_feed_posts (author_id,post_kind,official_event_key)
where official_event_key is not null;

create or replace function public.publish_cage_ceo_post(p_event_key text)
returns public.cage_feed_posts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_event_key text := lower(trim(coalesce(p_event_key,'')));
  v_profile public.cage_profiles;
  v_existing public.cage_feed_posts;
  v_post public.cage_feed_posts;
  v_body text;
  v_min_level integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  if v_event_key not in (
    'debut','city_offer','city_title','regional_offer','regional_title',
    'us_offer','us_title','world_offer','world_title','performance_bonus'
  ) then
    raise exception 'Invalid Cage Grind CEO event';
  end if;

  select * into v_profile
  from public.cage_profiles
  where id=v_user_id and retired_at is null
  for update;
  if not found then raise exception 'Create a permanent fighter identity first'; end if;

  v_min_level := case
    when v_event_key in ('city_offer','city_title') then 5
    when v_event_key in ('regional_offer','regional_title') then 9
    when v_event_key in ('us_offer','us_title') then 12
    when v_event_key in ('world_offer','world_title') then 15
    else 1
  end;
  if v_profile.level < v_min_level then raise exception 'CEO event is not unlocked'; end if;

  select * into v_existing
  from public.cage_feed_posts
  where author_id=v_user_id and post_kind='ceo' and official_event_key=v_event_key;
  if found then return v_existing; end if;

  v_body := case v_event_key
    when 'debut' then 'Welcome to Cage Grind, @' || v_profile.handle || '. Build a record worth putting under the bright lights.'
    when 'city_offer' then '@' || v_profile.handle || ', you have made enough noise. Beat the city champion and take the first belt.'
    when 'city_title' then 'First belt secured. Congratulations, @' || v_profile.handle || '. The climb gets steeper from here.'
    when 'regional_offer' then '@' || v_profile.handle || ', your region needs a champion. Win the next one and make it yours.'
    when 'regional_title' then '@' || v_profile.handle || ' now owns the regional stage. National attention comes next.'
    when 'us_offer' then 'The U.S. Title is waiting, @' || v_profile.handle || '. This is where contenders become headliners.'
    when 'us_title' then '@' || v_profile.handle || ' is the new U.S. Champion. Every serious name in the sport is watching now.'
    when 'world_offer' then '@' || v_profile.handle || ', one fight remains between you and the top of the world. Finish the climb.'
    when 'world_title' then 'Welcome to the summit, @' || v_profile.handle || '. You are the Cage Grind World Champion.'
    when 'performance_bonus' then 'I noticed that performance, @' || v_profile.handle || '. A bonus is already on the way.'
  end;

  insert into public.cage_feed_posts (
    author_id,author_handle,post_kind,body,official_event_key,created_at
  ) values (
    v_user_id,'cagegrindceo','ceo',v_body,v_event_key,now()
  )
  returning * into v_post;

  return v_post;
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
  where author_id=v_user_id and post_kind not in ('reporter','ceo');

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

revoke execute on function public.publish_cage_ceo_post(text) from public, anon;
grant execute on function public.publish_cage_ceo_post(text) to authenticated;

comment on function public.publish_cage_ceo_post(text)
is 'Publishes one server-authored Cage Grind CEO announcement for a validated career event key.';
