-- A Supabase session survives retirement, so a new fighter reuses the same
-- authenticated profile id. The profile's created_at value is reset when the
-- new identity is claimed; use that career boundary when enforcing the
-- champion/challenger no-rematch rule. Historical bouts remain preserved.

create or replace function public.get_cage_championship()
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
          and prior.started_at>=greatest(champion.created_at,viewer.created_at)
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
          and prior.started_at>=greatest(champion.created_at,viewer.created_at)
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
'Returns the reigning champion and scopes title-rematch eligibility to the current career incarnation of both fighters.';

create or replace function public.begin_cage_championship_challenge(p_opponent_id uuid default null)
returns table (
  status text,
  challenge_id bigint,
  champion_id uuid,
  champion_handle text,
  champion_level integer,
  challenger_id uuid,
  challenger_handle text,
  challenger_level integer,
  initiated_by uuid,
  player_is_champion boolean,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_today date := (now() at time zone 'utc')::date;
  v_title public.cage_championship;
  v_player public.cage_profiles;
  v_champion public.cage_profiles;
  v_challenger public.cage_profiles;
  v_challenge public.cage_championship_challenges;
  v_player_is_champion boolean;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  perform public.ensure_cage_champion();
  perform pg_advisory_xact_lock(hashtext('cage-championship-daily|' || v_today::text));

  select * into v_title from public.cage_championship
  where championship_key='world' for update;
  select * into v_player from public.cage_profiles
  where id=v_user_id and retired_at is null for update;
  if not found then raise exception 'Create a permanent fighter identity first'; end if;
  select * into v_champion from public.cage_profiles
  where id=v_title.champion_id and retired_at is null for update;
  if not found then raise exception 'The Cage Grind championship is vacant'; end if;

  if exists (
    select 1 from public.cage_championship_challenges
    where championship_key='world' and challenge_day=v_today
  ) then
    raise exception 'The World Championship already had its sanctioned bout today';
  end if;

  v_player_is_champion := v_champion.id=v_user_id;
  if v_player_is_champion then
    if p_opponent_id is null or p_opponent_id=v_user_id then
      raise exception 'Choose another real fighter for the title defense';
    end if;
    select * into v_challenger from public.cage_profiles
    where id=p_opponent_id and retired_at is null for update;
    if not found then raise exception 'That real fighter is no longer active'; end if;
  else
    if p_opponent_id is not null and p_opponent_id<>v_champion.id then
      raise exception 'Only the reigning champion can sanction this fight';
    end if;
    if v_player.level<v_champion.level then
      raise exception 'Reach Level % to challenge @% for the Cage Grind championship',v_champion.level,v_champion.handle;
    end if;
    v_challenger := v_player;
  end if;

  if exists (
    select 1 from public.cage_championship_challenges as prior
    where prior.champion_id=v_champion.id and prior.challenger_id=v_challenger.id
      and prior.status in ('challenger_won','champion_defended')
      and prior.started_at>=greatest(v_champion.created_at,v_challenger.created_at)
  ) then
    raise exception 'No championship rematches are allowed between these fighters';
  end if;

  update public.cage_championship_challenges as challenge
  set status='expired',resolved_at=now()
  where challenge.status='pending' and challenge.started_at<=now()-interval '2 hours';

  insert into public.cage_championship_challenges (
    championship_key,champion_id,challenger_id,champion_level,challenger_level,
    initiated_by,challenge_day
  ) values (
    'world',v_champion.id,v_challenger.id,v_champion.level,v_challenger.level,
    v_user_id,v_today
  ) returning * into v_challenge;

  insert into public.cage_feed_posts (
    author_id,author_handle,post_kind,body,official_event_key,created_at
  ) values (
    v_user_id,
    'cagegrindceo',
    'ceo',
    case when v_player_is_champion then
      'The champion called for this one. @' || v_champion.handle ||
      ' will defend the Cage Grind World Championship against @' ||
      v_challenger.handle || '. The belt is on the line.'
    else
      'The title shot is official. @' || v_challenger.handle ||
      ' will challenge @' || v_champion.handle ||
      ' for the Cage Grind World Championship.'
    end,
    'global_title_shot_' || v_challenge.id::text,
    now()
  );

  return query select
    'ready'::text,v_challenge.id,v_champion.id,v_champion.handle,v_champion.level,
    v_challenger.id,v_challenger.handle,v_challenger.level,v_user_id,
    v_player_is_champion,v_challenge.started_at+interval '2 hours';
end;
$$;

revoke all on function public.begin_cage_championship_challenge(uuid) from public,anon;
grant execute on function public.begin_cage_championship_challenge(uuid) to authenticated;

comment on function public.begin_cage_championship_challenge(uuid) is
'Sanctions the daily world-title bout and applies no-rematch history only within both fighters current career incarnations.';
