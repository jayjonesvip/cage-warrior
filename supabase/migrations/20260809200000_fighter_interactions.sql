-- Move player posting into direct, avatar-driven fighter interactions.
-- Career-event reports do not consume the five daily fighter interactions.

alter table public.cage_feed_posts
drop constraint if exists cage_feed_posts_kind;

alter table public.cage_feed_posts
add constraint cage_feed_posts_kind
check (post_kind in ('player','reporter','callout','props','welcome','respect','watching'));

create or replace function public.get_cage_interactions_remaining()
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_used integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  select count(*)::integer into v_used
  from public.cage_feed_posts
  where author_id = v_user_id
    and post_kind in ('callout','props','welcome','respect','watching')
    and created_at >= date_trunc('day', now());

  return greatest(0, 5 - v_used);
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

  select * into v_author from public.cage_profiles where id=v_user_id;
  if not found then raise exception 'Create a Cage profile before posting'; end if;

  if (select count(*) from public.cage_feed_posts where author_id=v_user_id and created_at>now()-interval '24 hours') >= 40 then
    raise exception 'Daily shared Cage Feed post limit reached';
  end if;

  if v_is_interaction then
    if p_target_profile_id is null or p_target_profile_id=v_user_id then raise exception 'Choose another fighter'; end if;
    select * into v_target from public.cage_profiles where id=p_target_profile_id;
    if not found then raise exception 'That fighter is no longer available'; end if;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user_id::text, 0));
    if public.get_cage_interactions_remaining() < 1 then raise exception 'Five daily fighter interactions already used'; end if;
  elsif p_target_profile_id is not null then
    raise exception 'Only fighter interactions may target another fighter';
  end if;

  insert into public.cage_feed_posts (
    author_id,author_handle,author_name,post_kind,body,target_profile_id,target_handle,target_name
  ) values (
    v_user_id,
    case when p_post_kind='reporter' then 'CageReporter' else v_author.handle end,
    case when p_post_kind='reporter' then 'CageReporter' else v_author.fighter_name end,
    p_post_kind,
    v_body,
    v_target.id,
    v_target.handle,
    v_target.fighter_name
  ) returning * into v_post;
  return v_post;
end;
$$;

revoke execute on function public.get_cage_interactions_remaining() from public, anon;
revoke execute on function public.publish_cage_post(text,text,uuid) from public, anon;
grant execute on function public.get_cage_interactions_remaining() to authenticated;
grant execute on function public.publish_cage_post(text,text,uuid) to authenticated;

comment on function public.get_cage_interactions_remaining() is 'Returns the authenticated fighter interactions remaining in the current UTC day.';
