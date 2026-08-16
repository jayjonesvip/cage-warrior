-- Championship rematches reset per challenger at the UTC-day boundary.
-- A dethroned champion keeps a level-override rematch right against the fighter
-- who took the belt, and the client receives explicit eligibility/rank history
-- instead of inferring every unavailable title shot as a level lock.

-- The original challenge table encoded a minimum-level ordering. A
-- dethroned champion can now use the rematch path even when the new champion
-- is a higher level, so eligibility belongs in the RPC transaction rather
-- than in this row-shape constraint.
alter table public.cage_championship_challenges
  drop constraint if exists cage_championship_challenge_levels;

alter table public.cage_championship_challenges
  add constraint cage_championship_challenge_levels check (
    champion_level between 1 and 99
    and challenger_level between 1 and 99
  );

drop index if exists public.cage_championship_one_world_bout_per_day_idx;

create unique index if not exists cage_championship_one_attempt_per_challenger_day_idx
on public.cage_championship_challenges (championship_key,challenger_id,challenge_day);

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
  rematch_blocked boolean,
  level_eligible boolean,
  daily_bout_used boolean,
  daily_opponent_ids uuid[],
  eligibility_status text,
  cooldown_until timestamptz,
  former_champion boolean,
  former_champion_rematch boolean,
  last_title_loss_id bigint,
  last_title_loss_opponent_handle text,
  last_title_loss_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_today date := (now() at time zone 'utc')::date;
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
    viewer.id is not null and champion.id is not null and champion.id<>v_user_id
      and (viewer.level>=champion.level or career.rematch_right)
      and not daily.used,
    daily.used,
    viewer.id is not null and champion.id is not null
      and (viewer.level>=champion.level or career.rematch_right),
    daily.used,
    daily.opponent_ids,
    case
      when champion.id=v_user_id then 'champion'
      when champion.id is null then 'vacant'
      when viewer.id is null then 'profile_unavailable'
      when daily.used then 'daily_bout_used'
      when career.rematch_right then 'former_champion_rematch'
      when viewer.level>=champion.level then 'eligible'
      else 'level_locked'
    end,
    case when daily.used then ((v_today+1)::timestamp at time zone 'utc') else null end,
    career.former_champion,
    career.rematch_right,
    loss.history_id,
    loss.opponent_handle,
    loss.lost_at
  from public.cage_championship as title
  left join public.cage_profiles as champion
    on champion.id=title.champion_id and champion.retired_at is null
  left join public.cage_profiles as viewer
    on viewer.id=v_user_id and viewer.retired_at is null
  cross join lateral (
    select
      exists (
        select 1 from public.cage_championship_challenges as bout
        where bout.championship_key='world'
          and bout.challenger_id=viewer.id
          and bout.challenge_day=v_today
      ) as used,
      coalesce(array(
        select bout.challenger_id
        from public.cage_championship_challenges as bout
        where bout.championship_key='world'
          and bout.challenge_day=v_today
      ),array[]::uuid[]) as opponent_ids
  ) as daily
  cross join lateral (
    select
      exists (
        select 1 from public.cage_championship_history as history
        where history.champion_id=viewer.id
          and history.created_at>=viewer.created_at
      ) as former_champion,
      exists (
        select 1 from public.cage_championship_history as history
        where history.action='transfer'
          and history.champion_id=champion.id
          and history.former_champion_id=viewer.id
          and history.created_at>=greatest(champion.created_at,viewer.created_at)
          and history.created_at>=title.won_at
      ) as rematch_right
  ) as career
  left join lateral (
    select history.id as history_id,winner.handle as opponent_handle,
      history.created_at as lost_at
    from public.cage_championship_history as history
    left join public.cage_profiles as winner on winner.id=history.champion_id
    where history.action='transfer'
      and history.former_champion_id=viewer.id
      and history.created_at>=viewer.created_at
    order by history.created_at desc,history.id desc
    limit 1
  ) as loss on true
  where title.championship_key='world';
end;
$$;

revoke execute on function public.get_cage_championship() from public,anon;
grant execute on function public.get_cage_championship() to authenticated;

comment on function public.get_cage_championship() is
'Returns per-challenger daily title eligibility, fighters whose daily title attempt is already used, former-champion status, rematch rights, and the latest title loss for the authenticated current career.';

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
  v_rematch_right boolean := false;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  perform public.ensure_cage_champion();
  select * into v_title from public.cage_championship
  where championship_key='world' for update;
  select * into v_player from public.cage_profiles
  where id=v_user_id and retired_at is null for update;
  if not found then raise exception 'Create a permanent fighter identity first'; end if;
  select * into v_champion from public.cage_profiles
  where id=v_title.champion_id and retired_at is null for update;
  if not found then raise exception 'The Cage Grind championship is vacant'; end if;

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
      raise exception 'The World Championship changed hands. Refresh the Fight page and select the current champion';
    end if;
    select exists (
      select 1 from public.cage_championship_history as history
      where history.action='transfer'
        and history.champion_id=v_champion.id
        and history.former_champion_id=v_player.id
        and history.created_at>=greatest(v_champion.created_at,v_player.created_at)
        and history.created_at>=v_title.won_at
    ) into v_rematch_right;
    if v_player.level<v_champion.level and not v_rematch_right then
      raise exception 'Reach Level % to challenge @% for the Cage Grind championship',v_champion.level,v_champion.handle;
    end if;
    v_challenger := v_player;
  end if;

  perform pg_advisory_xact_lock(
    hashtext('cage-championship-challenger|' || v_challenger.id::text || '|' || v_today::text)
  );

  if exists (
    select 1 from public.cage_championship_challenges as prior
    where prior.championship_key='world'
      and prior.challenger_id=v_challenger.id
      and prior.challenge_day=v_today
  ) then
    if v_player_is_champion then
      raise exception '@% already had a World Championship fight today',v_challenger.handle;
    end if;
    raise exception 'Your next World Championship challenge opens at UTC midnight';
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
    case
      when v_player_is_champion then
        'The champion called for this one. @' || v_champion.handle ||
        ' will defend the Cage Grind World Championship against @' ||
        v_challenger.handle || '. The belt is on the line.'
      when v_rematch_right then
        'The former champion wants the belt back. @' || v_challenger.handle ||
        ' will challenge @' || v_champion.handle ||
        ' in a Cage Grind World Championship rematch.'
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
'Gives each challenger one world-title attempt per UTC day, lets the champion defend against different real fighters, and preserves a dethroned champion level-override rematch right against the current champion.';
