-- Expose a completed champion/challenger pairing before fight selection so the
-- client can block a forbidden title rematch instead of waiting for sanctioning.
-- Championship defense outcomes also belong to the CEO, matching title-shot
-- announcements and title-transfer results.

drop function if exists public.get_cage_championship();

create function public.get_cage_championship()
returns table (
  championship_key text,
  champion_id uuid,
  champion_handle text,
  champion_city text,
  champion_archetype text,
  champion_avatar text,
  champion_level integer,
  champion_wins integer,
  champion_losses integer,
  won_at timestamptz,
  defenses integer,
  viewer_level integer,
  is_champion boolean,
  challenge_eligible boolean,
  rematch_blocked boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  return query
  select
    title.championship_key,
    champion.id,
    champion.handle,
    champion.city,
    champion.archetype,
    champion.fighter_avatar,
    champion.level,
    champion.wins,
    champion.losses,
    title.won_at,
    title.defenses,
    viewer.level,
    champion.id=v_user_id,
    viewer.id is not null
      and champion.id is not null
      and champion.id<>v_user_id
      and viewer.level>=champion.level
      and not exists (
        select 1
        from public.cage_championship_challenges as prior
        where prior.champion_id=champion.id
          and prior.challenger_id=viewer.id
          and prior.status in ('challenger_won','champion_defended')
      ),
    viewer.id is not null
      and champion.id is not null
      and champion.id<>v_user_id
      and exists (
        select 1
        from public.cage_championship_challenges as prior
        where prior.champion_id=champion.id
          and prior.challenger_id=viewer.id
          and prior.status in ('challenger_won','champion_defended')
      )
  from public.cage_championship as title
  left join public.cage_profiles as champion
    on champion.id=title.champion_id and champion.retired_at is null
  left join public.cage_profiles as viewer
    on viewer.id=v_user_id and viewer.retired_at is null
  where title.championship_key='world';
end;
$$;

revoke execute on function public.get_cage_championship() from public,anon;
grant execute on function public.get_cage_championship() to authenticated;

comment on function public.get_cage_championship() is
'Returns the reigning real-player champion plus level eligibility and whether the authenticated viewer already used a title shot against that champion.';

-- Correct previously published defense outcomes so the official voice is the CEO.
update public.cage_feed_posts
set author_handle='cagegrindceo',post_kind='ceo'
where post_kind='reporter'
  and body like '%defended the Cage Grind World Championship against%';

create or replace function public.route_cage_title_defense_to_ceo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.post_kind='reporter'
    and new.body like '%defended the Cage Grind World Championship against%'
  then
    new.author_handle := 'cagegrindceo';
    new.post_kind := 'ceo';
  end if;
  return new;
end;
$$;

drop trigger if exists cage_title_defense_ceo_voice on public.cage_feed_posts;
create trigger cage_title_defense_ceo_voice
before insert on public.cage_feed_posts
for each row execute function public.route_cage_title_defense_to_ceo();

revoke execute on function public.route_cage_title_defense_to_ceo() from public,anon,authenticated;

comment on function public.route_cage_title_defense_to_ceo() is
'Routes every Cage Grind World Championship defense result through the verified CEO feed voice.';
