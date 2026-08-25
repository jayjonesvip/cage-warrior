-- Select championship defense challengers from proven World Standings contenders.
-- The displayed matchup and server-authorized matchup must use the same ordering.

create or replace function public.select_cage_championship_defense_challenger(
  p_champion_id uuid,
  p_challenge_day date
)
returns uuid
language sql stable security definer set search_path = ''
as $$
  select candidate.id
  from public.cage_profiles as candidate
  where candidate.retired_at is null
    and candidate.id<>p_champion_id
    and coalesce(candidate.wins,0)+coalesce(candidate.losses,0)>0
    and not exists (
      select 1
      from public.cage_championship_challenges as bout
      where bout.championship_key='world'
        and bout.challenger_id=candidate.id
        and bout.challenge_day=p_challenge_day
    )
  order by
    candidate.level desc,
    coalesce(candidate.wins,0)::numeric /
      greatest(coalesce(candidate.wins,0)+coalesce(candidate.losses,0),1) desc,
    coalesce(candidate.wins,0)+coalesce(candidate.losses,0) desc,
    lower(candidate.handle),
    candidate.id
  limit 1;
$$;

revoke all on function public.select_cage_championship_defense_challenger(uuid,date)
  from public,anon,authenticated;

comment on function public.select_cage_championship_defense_challenger(uuid,date) is
'Returns the highest-ranked active fighter with a completed bout who remains available for the requested championship defense day.';

drop function if exists public.get_cage_championship();

create function public.get_cage_championship()
returns table (
  championship_key text, champion_id uuid, champion_handle text, champion_city text,
  champion_archetype text, champion_avatar text, champion_level integer,
  champion_wins integer, champion_losses integer, won_at timestamptz, defenses integer,
  viewer_level integer, is_champion boolean, challenge_eligible boolean,
  rematch_blocked boolean, level_eligible boolean, daily_bout_used boolean,
  daily_opponent_ids uuid[], eligibility_status text, cooldown_until timestamptz,
  former_champion boolean, former_champion_rematch boolean, last_title_loss_id bigint,
  last_title_loss_opponent_handle text, last_title_loss_at timestamptz,
  defense_used_today boolean, selected_challenger_id uuid, selected_challenger_handle text,
  selected_challenger_city text, selected_challenger_archetype text,
  selected_challenger_avatar text, selected_challenger_level integer,
  selected_challenger_wins integer, selected_challenger_losses integer
)
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_today date := (now() at time zone 'utc')::date;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  return query
  select
    title.championship_key, champion.id, champion.handle, champion.city,
    champion.archetype, champion.fighter_avatar, champion.level, champion.wins,
    champion.losses, title.won_at, title.defenses, viewer.level,
    champion.id=v_user_id,
    viewer.id is not null and champion.id is not null and champion.id<>v_user_id
      and (viewer.level>=champion.level or career.rematch_right) and not daily.used
      and (not career.rematch_right or career.rematch_available),
    daily.used or (career.rematch_right and not career.rematch_available),
    viewer.id is not null and champion.id is not null
      and (viewer.level>=champion.level or career.rematch_right),
    daily.used or (career.rematch_right and not career.rematch_available), daily.opponent_ids,
    case
      when champion.id=v_user_id and defense.used then 'champion_defended_today'
      when champion.id=v_user_id then 'champion'
      when champion.id is null then 'vacant'
      when viewer.id is null then 'profile_unavailable'
      when daily.used or (career.rematch_right and not career.rematch_available) then 'daily_bout_used'
      when career.rematch_right then 'former_champion_rematch'
      when viewer.level>=champion.level then 'eligible'
      else 'level_locked'
    end,
    case when daily.used or defense.used or (career.rematch_right and not career.rematch_available) then ((v_today+1)::timestamp at time zone 'utc') else null end,
    career.former_champion, career.rematch_right, loss.history_id, loss.opponent_handle,
    loss.lost_at, defense.used,
    case when champion.id=v_user_id and not defense.used then challenger.id end,
    case when champion.id=v_user_id and not defense.used then challenger.handle end,
    case when champion.id=v_user_id and not defense.used then challenger.city end,
    case when champion.id=v_user_id and not defense.used then challenger.archetype end,
    case when champion.id=v_user_id and not defense.used then challenger.fighter_avatar end,
    case when champion.id=v_user_id and not defense.used then challenger.level end,
    case when champion.id=v_user_id and not defense.used then challenger.wins end,
    case when champion.id=v_user_id and not defense.used then challenger.losses end
  from public.cage_championship as title
  left join public.cage_profiles as champion
    on champion.id=title.champion_id and champion.retired_at is null
  left join public.cage_profiles as viewer
    on viewer.id=v_user_id and viewer.retired_at is null
  cross join lateral (
    select
      exists (
        select 1 from public.cage_championship_challenges as bout
        where bout.championship_key='world' and bout.challenger_id=viewer.id
          and bout.challenge_day=v_today
      ) as used,
      coalesce(array(
        select bout.challenger_id from public.cage_championship_challenges as bout
        where bout.championship_key='world' and bout.challenge_day=v_today
      ),array[]::uuid[]) as opponent_ids
  ) as daily
  cross join lateral (
    select exists (
      select 1 from public.cage_championship_challenges as bout
      where bout.championship_key='world' and bout.champion_id=viewer.id
        and bout.initiated_by=viewer.id and bout.challenge_day=v_today
    ) as used
  ) as defense
  cross join lateral (
    select
      exists (
        select 1 from public.cage_championship_history as history
        where history.champion_id=viewer.id and history.created_at>=viewer.created_at
      ) as former_champion,
      exists (
        select 1 from public.cage_championship_history as history
        where history.action='transfer' and history.champion_id=champion.id
          and history.former_champion_id=viewer.id
          and history.created_at>=greatest(champion.created_at,viewer.created_at)
          and history.created_at>=title.won_at
          and not exists (
            select 1 from public.cage_championship_challenges as rematch
            where rematch.champion_id=champion.id and rematch.challenger_id=viewer.id
              and rematch.started_at>=history.created_at
          )
      ) as rematch_right,
      exists (
        select 1 from public.cage_championship_history as history
        where history.action='transfer' and history.champion_id=champion.id
          and history.former_champion_id=viewer.id
          and history.created_at>=greatest(champion.created_at,viewer.created_at)
          and history.created_at>=title.won_at
          and (history.created_at at time zone 'utc')::date<v_today
          and not exists (
            select 1 from public.cage_championship_challenges as rematch
            where rematch.champion_id=champion.id and rematch.challenger_id=viewer.id
              and rematch.started_at>=history.created_at
          )
      ) as rematch_available
  ) as career
  left join lateral (
    select history.id as history_id,winner.handle as opponent_handle,history.created_at as lost_at
    from public.cage_championship_history as history
    left join public.cage_profiles as winner on winner.id=history.champion_id
    where history.action='transfer' and history.former_champion_id=viewer.id
      and history.created_at>=viewer.created_at
    order by history.created_at desc,history.id desc limit 1
  ) as loss on true
  left join public.cage_profiles as challenger
    on challenger.id=public.select_cage_championship_defense_challenger(champion.id,v_today)
    and champion.id=v_user_id
  where title.championship_key='world';
end;
$$;

revoke execute on function public.get_cage_championship() from public,anon;
grant execute on function public.get_cage_championship() to authenticated;

comment on function public.get_cage_championship() is
'Returns the global belt, daily title state, and the highest-ranked available proven challenger for a champion defense.';

create or replace function public.begin_cage_championship_challenge(p_opponent_id uuid default null)
returns table (
  status text, challenge_id bigint, champion_id uuid, champion_handle text,
  champion_level integer, challenger_id uuid, challenger_handle text,
  challenger_level integer, initiated_by uuid, player_is_champion boolean,
  expires_at timestamptz
)
language plpgsql security definer set search_path = ''
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
  v_rematch_available boolean := false;
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
    perform pg_advisory_xact_lock(hashtext('cage-championship-defense|' || v_user_id::text || '|' || v_today::text));
    if exists (
      select 1 from public.cage_championship_challenges as prior
      where prior.championship_key='world' and prior.champion_id=v_user_id
        and prior.initiated_by=v_user_id and prior.challenge_day=v_today
    ) then raise exception 'Your next World Championship defense is available at midnight'; end if;
    select * into v_challenger
    from public.cage_profiles
    where id=public.select_cage_championship_defense_challenger(v_champion.id,v_today)
    for update;
    if not found then raise exception 'No eligible ranked challenger is available'; end if;
    if p_opponent_id is distinct from v_challenger.id then
      raise exception 'The selected challenger changed. Refresh the Fight page';
    end if;
  else
    if p_opponent_id is not null and p_opponent_id<>v_champion.id then
      raise exception 'The World Championship changed hands. Refresh the Fight page';
    end if;
    select
      count(*)>0,
      count(*) filter (where (history.created_at at time zone 'utc')::date<v_today)>0
    into v_rematch_right,v_rematch_available
    from public.cage_championship_history as history
    where history.action='transfer' and history.champion_id=v_champion.id
      and history.former_champion_id=v_player.id
      and history.created_at>=greatest(v_champion.created_at,v_player.created_at)
      and history.created_at>=v_title.won_at
      and not exists (
        select 1 from public.cage_championship_challenges as rematch
        where rematch.champion_id=v_champion.id and rematch.challenger_id=v_player.id
          and rematch.started_at>=history.created_at
      );
    if v_rematch_right and not v_rematch_available then
      raise exception 'Your title rematch is available at midnight';
    end if;
    if v_player.level<v_champion.level and not v_rematch_right then
      raise exception 'Reach Level % to challenge @% for the World Championship',v_champion.level,v_champion.handle;
    end if;
    v_challenger := v_player;
  end if;

  perform pg_advisory_xact_lock(hashtext('cage-championship-challenger|' || v_challenger.id::text || '|' || v_today::text));
  if exists (
    select 1 from public.cage_championship_challenges as prior
    where prior.championship_key='world' and prior.challenger_id=v_challenger.id
      and prior.challenge_day=v_today
  ) then
    if v_player_is_champion then raise exception 'The selected challenger is no longer available today'; end if;
    raise exception 'Your next World Championship fight is available at midnight';
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
    v_user_id,'cagegrindceo','ceo',
    case when v_player_is_champion then
      '@' || v_champion.handle || ' will defend the Cage Grind World Championship against @' || v_challenger.handle || '. The belt is on the line.'
    when v_rematch_right then
      '@' || v_challenger.handle || ' will try to reclaim the Cage Grind World Championship from @' || v_champion.handle || '.'
    else
      '@' || v_challenger.handle || ' will challenge @' || v_champion.handle || ' for the Cage Grind World Championship.' end,
    'global_title_shot_' || v_challenge.id::text,now()
  );
  return query select 'ready'::text,v_challenge.id,v_champion.id,v_champion.handle,
    v_champion.level,v_challenger.id,v_challenger.handle,v_challenger.level,
    v_user_id,v_player_is_champion,v_challenge.started_at+interval '2 hours';
end;
$$;

revoke all on function public.begin_cage_championship_challenge(uuid) from public,anon;
grant execute on function public.begin_cage_championship_challenge(uuid) to authenticated;

comment on function public.begin_cage_championship_challenge(uuid) is
'Starts only the displayed championship matchup and revalidates the highest-ranked available proven defense challenger.';
