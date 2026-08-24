-- Keep the stable `volt` sponsor ID for saved careers while updating its public brand.

create or replace function public.publish_cage_sponsor_post(p_sponsor_id text)
returns public.cage_feed_posts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_sponsor_id text := lower(trim(coalesce(p_sponsor_id,'')));
  v_profile public.cage_profiles;
  v_existing public.cage_feed_posts;
  v_post public.cage_feed_posts;
  v_brand text;
  v_handle text;
  v_min_level integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  v_brand := case v_sponsor_id
    when 'bobs-auto' then 'Bob''s Auto Shop'
    when 'garys-bar-grill' then 'Gary''s Bar & Grill'
    when 'volt' then 'Surge Core'
    when 'ironhide' then 'Ironhide Athletics'
    when 'apex-wireless' then 'Apex Wireless'
    when 'northline-auto' then 'Northline Auto'
    when 'titan-global' then 'Titan Global'
  end;
  if v_brand is null then raise exception 'Invalid Cage Grind sponsor'; end if;
  v_handle := replace(replace(replace(v_brand,' ',''),'''',''),'&','');
  v_min_level := case v_sponsor_id
    when 'bobs-auto' then 2 when 'garys-bar-grill' then 3 when 'volt' then 4
    when 'ironhide' then 6 when 'apex-wireless' then 8
    when 'northline-auto' then 10 when 'titan-global' then 13
  end;

  select * into v_profile
  from public.cage_profiles
  where id=v_user_id and retired_at is null
  for update;
  if not found then raise exception 'Create a permanent fighter identity first'; end if;
  if v_profile.level < v_min_level then raise exception 'Sponsor is not unlocked'; end if;

  select * into v_existing
  from public.cage_feed_posts
  where author_id=v_user_id and post_kind='sponsor' and sponsor_id=v_sponsor_id;
  if found then return v_existing; end if;

  insert into public.cage_feed_posts (
    author_id,author_handle,post_kind,body,target_profile_id,target_handle,sponsor_id,created_at
  ) values (
    v_user_id,v_handle,'sponsor',
    'Welcome @' || v_profile.handle || ' to the ' || v_brand || ' team. We are proud to back the next stage of the climb.',
    v_user_id,v_profile.handle,v_sponsor_id,now()
  ) returning * into v_post;

  return v_post;
end;
$$;

revoke execute on function public.publish_cage_sponsor_post(text) from public, anon;
grant execute on function public.publish_cage_sponsor_post(text) to authenticated;

comment on function public.publish_cage_sponsor_post(text)
is 'Publishes one verified sponsor signing post per fighter and endorsement tier.';
