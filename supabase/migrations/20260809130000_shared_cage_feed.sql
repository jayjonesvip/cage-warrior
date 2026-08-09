-- Cage Grind shared Cage Feed, phase one.
-- Careers remain local. Supabase stores only public fighter profiles and posts.

create table if not exists public.cage_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null unique,
  fighter_name text not null,
  city text not null,
  archetype text not null,
  level integer not null default 1,
  wins integer not null default 0,
  losses integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cage_profiles_handle_format check (handle ~ '^[A-Za-z][A-Za-z0-9]{2,31}_[0-9]{2,3}$'),
  constraint cage_profiles_name_length check (char_length(fighter_name) between 2 and 24),
  constraint cage_profiles_city check (city in ('phoenix','los-angeles','chicago','new-york','miami','houston','cleveland')),
  constraint cage_profiles_archetype check (archetype in ('pressure','counter','brawler','trickster','control','submission','wrestleBox')),
  constraint cage_profiles_level check (level between 1 and 99),
  constraint cage_profiles_record check (wins between 0 and 9999 and losses between 0 and 9999)
);

create table if not exists public.cage_feed_posts (
  id bigint generated always as identity primary key,
  author_id uuid not null references public.cage_profiles(id) on delete cascade,
  author_handle text not null,
  author_name text not null,
  post_kind text not null,
  body text not null,
  target_profile_id uuid references public.cage_profiles(id) on delete set null,
  target_handle text,
  target_name text,
  created_at timestamptz not null default now(),
  constraint cage_feed_posts_kind check (post_kind in ('player','reporter','callout')),
  constraint cage_feed_posts_body_length check (char_length(body) between 2 and 280)
);

create index if not exists cage_feed_posts_created_at_idx on public.cage_feed_posts (created_at desc);
create index if not exists cage_feed_posts_author_id_idx on public.cage_feed_posts (author_id, created_at desc);
create index if not exists cage_profiles_updated_at_idx on public.cage_profiles (updated_at desc);

alter table public.cage_profiles enable row level security;
alter table public.cage_feed_posts enable row level security;

revoke all on table public.cage_profiles from anon, authenticated;
revoke all on table public.cage_feed_posts from anon, authenticated;
grant select on table public.cage_profiles to authenticated;
grant select on table public.cage_feed_posts to authenticated;

drop policy if exists "Authenticated players read Cage profiles" on public.cage_profiles;
create policy "Authenticated players read Cage profiles"
on public.cage_profiles for select to authenticated using (true);

drop policy if exists "Authenticated players read Cage Feed" on public.cage_feed_posts;
create policy "Authenticated players read Cage Feed"
on public.cage_feed_posts for select to authenticated using (true);

create or replace function public.register_cage_profile(
  p_fighter_name text,
  p_city text,
  p_archetype text,
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
  v_name text := left(regexp_replace(trim(coalesce(p_fighter_name,'')), '\s+', ' ', 'g'),24);
  v_city_code text;
  v_style_label text;
  v_handle text;
  v_profile public.cage_profiles;
  v_suffix integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if char_length(v_name) < 2 then raise exception 'Invalid fighter name'; end if;
  if p_city not in ('phoenix','los-angeles','chicago','new-york','miami','houston','cleveland') then raise exception 'Invalid fighter city'; end if;
  if p_archetype not in ('pressure','counter','brawler','trickster','control','submission','wrestleBox') then raise exception 'Invalid fighter archetype'; end if;

  select * into v_profile from public.cage_profiles where id = v_user_id;
  if found then
    update public.cage_profiles
    set fighter_name=v_name,
        city=p_city,
        archetype=p_archetype,
        level=greatest(1,least(99,coalesce(p_level,1))),
        wins=greatest(0,least(9999,coalesce(p_wins,0))),
        losses=greatest(0,least(9999,coalesce(p_losses,0))),
        updated_at=now()
    where id=v_user_id
    returning * into v_profile;
    return v_profile;
  end if;

  v_city_code := case p_city
    when 'phoenix' then 'PHX'
    when 'los-angeles' then 'LA'
    when 'chicago' then 'CHI'
    when 'new-york' then 'NYC'
    when 'miami' then 'MIA'
    when 'houston' then 'HOU'
    when 'cleveland' then 'CLE'
  end;
  v_style_label := case p_archetype
    when 'pressure' then 'Pressure'
    when 'counter' then 'Counter'
    when 'brawler' then 'Brawler'
    when 'trickster' then 'Trickster'
    when 'control' then 'Grappler'
    when 'submission' then 'Submission'
    when 'wrestleBox' then 'WrestleBoxer'
  end;

  for v_suffix in 1..999 loop
    v_handle := v_city_code || v_style_label || '_' || lpad(v_suffix::text,2,'0');
    begin
      insert into public.cage_profiles (id,handle,fighter_name,city,archetype,level,wins,losses)
      values (
        v_user_id,v_handle,v_name,p_city,p_archetype,
        greatest(1,least(99,coalesce(p_level,1))),
        greatest(0,least(9999,coalesce(p_wins,0))),
        greatest(0,least(9999,coalesce(p_losses,0)))
      ) returning * into v_profile;
      return v_profile;
    exception when unique_violation then
      -- Another fighter owns this suffix. Try the next one atomically.
    end;
  end loop;

  raise exception 'No Cage Feed handles remain for this identity';
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
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_post_kind not in ('player','reporter','callout') then raise exception 'Invalid Cage Feed post type'; end if;
  if char_length(v_body) not between 2 and 280 then raise exception 'Cage Feed posts must contain 2 to 280 characters'; end if;

  select * into v_author from public.cage_profiles where id=v_user_id;
  if not found then raise exception 'Create a Cage profile before posting'; end if;

  if (select count(*) from public.cage_feed_posts where author_id=v_user_id and created_at>now()-interval '24 hours') >= 40 then
    raise exception 'Daily shared Cage Feed post limit reached';
  end if;

  if p_post_kind='callout' then
    if p_target_profile_id is null or p_target_profile_id=v_user_id then raise exception 'Choose another fighter to call out'; end if;
    select * into v_target from public.cage_profiles where id=p_target_profile_id;
    if not found then raise exception 'That fighter is no longer available'; end if;
  elsif p_target_profile_id is not null then
    raise exception 'Only callouts may target another fighter';
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

revoke execute on function public.register_cage_profile(text,text,text,integer,integer,integer) from public, anon;
revoke execute on function public.publish_cage_post(text,text,uuid) from public, anon;
grant execute on function public.register_cage_profile(text,text,text,integer,integer,integer) to authenticated;
grant execute on function public.publish_cage_post(text,text,uuid) to authenticated;

comment on table public.cage_profiles is 'Public Cage Grind fighter identities; career saves remain in the browser.';
comment on table public.cage_feed_posts is 'Shared player and CageReporter posts for the global Cage Feed.';
