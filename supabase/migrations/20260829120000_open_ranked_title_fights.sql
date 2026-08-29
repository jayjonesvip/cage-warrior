-- Open the World Championship row to every challenger and let the reigning
-- champion choose any proven fighter from the World Fight Rankings.

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
    if p_opponent_id is null then raise exception 'Choose a ranked fighter for your title defense'; end if;

    select * into v_challenger
    from public.cage_profiles
    where id=p_opponent_id and retired_at is null and id<>v_champion.id
      and coalesce(wins,0)+coalesce(losses,0)>0
    for update;
    if not found then raise exception 'That ranked fighter is not available for a title defense'; end if;
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
    v_challenger := v_player;
  end if;

  perform pg_advisory_xact_lock(hashtext('cage-championship-challenger|' || v_challenger.id::text || '|' || v_today::text));
  if not v_player_is_champion and exists (
    select 1 from public.cage_championship_challenges as prior
    where prior.championship_key='world' and prior.challenger_id=v_challenger.id
      and prior.challenge_day=v_today
  ) then
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
'Starts one daily title attempt against the champion, or one champion-selected defense against any proven ranked fighter.';
