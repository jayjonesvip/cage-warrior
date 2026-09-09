-- Apply after 20260908180000_level_grouped_fighter_roster.sql.
-- Level descending, exact win percentage, wins, then tied-group head-to-head.
begin;

alter table public.cage_news_results add column if not exists opponent_profile_id uuid references public.cage_profiles(id) on delete set null;
create index if not exists cage_news_results_opponent_profile_idx on public.cage_news_results(opponent_profile_id,profile_id) where opponent_profile_id is not null;

-- Historical ranked human bouts have permanent handles. Do not guess Circuit identities.
update public.cage_news_results as result
set opponent_profile_id=opponent.id
from public.cage_profiles as opponent
where result.opponent_profile_id is null and result.seed_id is null and result.opponent_rank>0
  and lower(ltrim(result.opponent_handle,'@'))=lower(opponent.handle)
  and opponent.id<>result.profile_id and opponent.created_at<=result.occurred_at;

create or replace function public.cage_head_to_head(p_ids uuid[])
returns table(fighter_id uuid,opponent_id uuid,wins bigint,losses bigint)
language sql stable security definer set search_path='' as $$
  with bouts as (
    select result.profile_id as a,coalesce(result.seed_id,result.opponent_profile_id) as b,result.won
    from public.cage_news_results as result
    join public.cage_profiles as fighter on fighter.id=result.profile_id and fighter.created_at=result.career_started_at
    where result.profile_id=any(p_ids)
      and coalesce(result.seed_id,result.opponent_profile_id)=any(p_ids)
      and result.profile_id<>coalesce(result.seed_id,result.opponent_profile_id)
  ), sides as (
    select a,b,won from bouts union all select b,a,not won from bouts
  )
  select a,b,count(*) filter(where won),count(*) filter(where not won)
  from sides group by a,b;
$$;
revoke all on function public.cage_head_to_head(uuid[]) from public,anon,authenticated;

create or replace function public.get_cage_head_to_head(p_ids uuid[])
returns table(fighter_id uuid,opponent_id uuid,wins bigint,losses bigint)
language plpgsql stable security definer set search_path='' as $$
begin
  if cardinality(p_ids)>2000 then raise exception 'Too many fighters'; end if;
  return query select * from public.cage_head_to_head(p_ids);
end;
$$;
revoke all on function public.get_cage_head_to_head(uuid[]) from public,anon;
grant execute on function public.get_cage_head_to_head(uuid[]) to authenticated;

-- Private common ordering for server-side title selection. list_order is positional only.
create or replace function public.cage_fighter_order(p_ids uuid[])
returns table(fighter_id uuid,list_order bigint)
language sql stable security definer set search_path='' as $$
  with fighters as (
    select id,level,coalesce(wins,0) as wins,coalesce(losses,0) as losses,coalesce(draws,0) as draws
    from public.cage_profiles where id=any(p_ids) and retired_at is null
    union all
    select id,level,coalesce(wins,0),coalesce(losses,0),0
    from public.cage_seed_fighters where id=any(p_ids) and active
  ), records as (
    select *,wins::numeric/greatest(wins+losses+draws,1) as win_ratio from fighters
  ), meetings as (
    select * from public.cage_head_to_head(p_ids)
  ), scored as (
    select fighter.id,fighter.level,fighter.win_ratio,fighter.wins,
      coalesce(sum(case when tied.id is not null then meeting.wins-meeting.losses else 0 end),0) as h2h
    from records as fighter
    left join meetings as meeting on meeting.fighter_id=fighter.id
    left join records as tied on tied.id=meeting.opponent_id and tied.id<>fighter.id
      and tied.level=fighter.level and tied.win_ratio=fighter.win_ratio and tied.wins=fighter.wins
    group by fighter.id,fighter.level,fighter.win_ratio,fighter.wins
  )
  select id,row_number() over(order by level desc,win_ratio desc,wins desc,h2h desc,id) from scored;
$$;
revoke all on function public.cage_fighter_order(uuid[]) from public,anon,authenticated;

create or replace function public.record_cage_news_result(p_result jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare
  p public.cage_profiles; s public.cage_seed_fighters;
  n integer; happened timestamptz; seed uuid; opponent uuid; inserted uuid; event_id uuid; existing public.cage_news_results;
  player_rank integer; opponent_rank integer; player_level integer; quality numeric;
begin
  select * into p from public.cage_profiles where id=auth.uid() and retired_at is null;
  if p.id is null then raise exception 'Active fighter required'; end if;
  n=(p_result->>'bout')::integer;happened=(p_result->>'at')::timestamptz;
  if n is null or n<1 or n>19998 or happened is null
    or happened<p.created_at or happened<now()-interval '7 days' or happened>now()+interval '5 minutes'
    or (p_result->>'career')::timestamptz is distinct from p.created_at
    or jsonb_typeof(p_result->'won') is distinct from 'boolean' then raise exception 'Invalid career result'; end if;
  opponent=nullif(p_result->>'opponentId','')::uuid;
  if opponent is null and nullif(p_result->>'seedId','') is null and coalesce((p_result->>'opponentRank')::integer,0)>0 then
    select candidate.id into opponent from public.cage_profiles as candidate
    where lower(candidate.handle)=lower(ltrim(p_result->>'opponent','@')) and candidate.id<>p.id and candidate.created_at<=happened;
  end if;
  if opponent is not null and (
    opponent=p.id or nullif(p_result->>'seedId','') is not null or not exists (
      select 1 from public.cage_profiles as candidate
      where candidate.id=opponent and candidate.created_at<=happened
        and lower(candidate.handle)=lower(ltrim(p_result->>'opponent','@'))
    )
  ) then raise exception 'Invalid opponent identity'; end if;
  event_id=coalesce(nullif(p_result->>'resultId','')::uuid,
    md5(p.id::text||'|'||extract(epoch from p.created_at)::text||'|'||extract(epoch from happened)::text||'|'||coalesce(p_result->>'opponent','Opponent'))::uuid);
  -- A matching event is a retry; a conflicting UUID is an error, never silently discarded.
  select * into existing from public.cage_news_results
    where result_id=event_id or (profile_id=p.id and career_started_at=p.created_at and occurred_at=happened
      and opponent_handle=left(coalesce(p_result->>'opponent','Opponent'),40)) limit 1;
  if existing.result_id is not null then
    if existing.profile_id=p.id and existing.career_started_at=p.created_at
      and existing.occurred_at=happened and existing.won=(p_result->>'won')::boolean
      and existing.opponent_handle=left(coalesce(p_result->>'opponent','Opponent'),40)
      and existing.seed_id is not distinct from nullif(p_result->>'seedId','')::uuid
      and (opponent is null or existing.opponent_profile_id=opponent) then return;
    end if;
    raise exception 'Conflicting fight result ID';
  end if;
  seed=nullif(p_result->>'seedId','')::uuid;
  player_rank=greatest(0,least(10000,coalesce((p_result->>'playerRank')::integer,0)));
  opponent_rank=greatest(0,least(10000,coalesce((p_result->>'opponentRank')::integer,0)));
  if seed is not null then
    -- Serialize different challengers so wins, losses and history cannot overwrite.
    select * into s from public.cage_seed_fighters where id=seed and active for update;
    if s.id is null then raise exception 'Seeded fighter unavailable'; end if;
    player_level=(p_result->'seedRankingSnapshot'->>'opponent_level_at_booking')::integer;
    quality=coalesce((p_result->'seedRankingSnapshot'->>'quality_points')::numeric,35);
    if quality<0 or quality>100 or player_level<1 then raise exception 'Invalid booked seed snapshot';end if;
  end if;
  insert into public.cage_news_results
    (result_id,profile_id,career_started_at,bout_number,fighter_handle,opponent_handle,won,player_rank,opponent_rank,occurred_at,seed_id,seed_opposition_quality,opponent_level_at_booking,quality_points,seed_opponent_level_at_booking,opponent_profile_id)
  values(event_id,p.id,p.created_at,n,p.handle,case when seed is not null then s.handle else left(coalesce(p_result->>'opponent','Opponent'),40) end,
    (p_result->>'won')::boolean,player_rank,opponent_rank,happened,seed,quality,(p_result->'rankingSnapshot'->>'opponent_level_at_booking')::integer,(p_result->'rankingSnapshot'->>'quality_points')::numeric,player_level,opponent)
  on conflict do nothing returning profile_id into inserted;
  if inserted is null then
    -- A concurrent retry can win the insert after the initial lookup.
    select * into existing from public.cage_news_results where result_id=event_id
      or (profile_id=p.id and career_started_at=p.created_at and occurred_at=happened
        and opponent_handle=left(coalesce(p_result->>'opponent','Opponent'),40)) limit 1;
    if existing.profile_id=p.id and existing.career_started_at=p.created_at
      and existing.occurred_at=happened and existing.won=(p_result->>'won')::boolean
      and existing.opponent_handle=left(coalesce(p_result->>'opponent','Opponent'),40)
      and existing.seed_id is not distinct from seed
      and (opponent is null or existing.opponent_profile_id=opponent) then return;
    end if;
    raise exception 'Conflicting fight result ID';
  end if;
  if seed is null then return; end if;
  update public.cage_seed_fighters set
    wins=least(9999,wins+case when (p_result->>'won')::boolean then 0 else 1 end),
    losses=least(9999,losses+case when (p_result->>'won')::boolean then 1 else 0 end),
    ranking_history=(select coalesce(jsonb_agg(jsonb_build_object('resultId',recent.result_id,'won',not recent.won,'outcome',case when recent.won then 'loss' else 'win' end,'quality',recent.seed_opposition_quality,'quality_points',recent.seed_opposition_quality,'opponent_rank_at_booking',recent.player_rank,'opponent_level_at_booking',recent.seed_opponent_level_at_booking)
      order by recent.occurred_at,recent.profile_id,recent.bout_number),'[]'::jsonb)
      from (select results.result_id,results.won,results.seed_opposition_quality,results.occurred_at,results.profile_id,results.bout_number,results.player_rank,results.seed_opponent_level_at_booking from public.cage_news_results results
        where seed_id=seed order by occurred_at desc,profile_id desc,bout_number desc limit 30) recent),
    updated_at=now()
  where id=seed;
end $$;
revoke all on function public.record_cage_news_result(jsonb) from public,anon;
grant execute on function public.record_cage_news_result(jsonb) to authenticated;

create or replace function public.ensure_cage_champion(p_former_champion_id uuid default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_title public.cage_championship;
  v_profile public.cage_profiles;
  v_action text;
  v_history_id bigint;
  v_former_handle text;
begin
  select * into v_title
  from public.cage_championship
  where championship_key='world'
  for update;

  if not found then
    insert into public.cage_championship (championship_key)
    values ('world')
    returning * into v_title;
  end if;

  if v_title.champion_id is not null and exists (
    select 1 from public.cage_profiles
    where id=v_title.champion_id and retired_at is null
  ) then
    return v_title.champion_id;
  end if;

  select candidate.* into v_profile
  from public.cage_profiles as candidate
  join public.cage_fighter_order(array(
    select eligible.id from public.cage_profiles as eligible
    where eligible.retired_at is null and eligible.id is distinct from p_former_champion_id
    order by eligible.level desc,eligible.id
  )) as ordered on ordered.fighter_id=candidate.id
  order by ordered.list_order
  limit 1
  for update of candidate;

  if not found then
    update public.cage_championship
    set champion_id=null,champion_level_at_win=null,won_at=null,defenses=0,updated_at=now()
    where championship_key='world';
    return null;
  end if;

  v_action := case when p_former_champion_id is null then 'bootstrap' else 'succession' end;

  update public.cage_championship
  set champion_id=v_profile.id,
      champion_level_at_win=v_profile.level,
      won_at=now(),
      defenses=0,
      updated_at=now()
  where championship_key='world';

  insert into public.cage_championship_history (
    championship_key,action,champion_id,former_champion_id,champion_level,defenses
  ) values (
    'world',v_action,v_profile.id,coalesce(p_former_champion_id,v_title.champion_id),v_profile.level,0
  ) returning id into v_history_id;

  if v_action='succession' then
    select handle into v_former_handle
    from public.cage_profiles
    where id=p_former_champion_id;

    insert into public.cage_feed_posts (
      author_id,author_handle,post_kind,body,official_event_key,created_at
    ) values (
      v_profile.id,'cagegrindceo','ceo',
      case when v_former_handle is null then
        '@' || v_profile.handle || ' inherits the vacant Cage Grind World Championship as the leading active fighter by level and record.'
      else
        '@' || v_former_handle || ' retired as World Champion. @' || v_profile.handle || ' inherits the vacant title as the leading active fighter by level and record.'
      end,
      'global_title_succession_' || v_history_id::text,now()
    );
  end if;

  return v_profile.id;
end;
$$;

create or replace function public.select_cage_championship_defense_challenger(
  p_champion_id uuid,
  p_challenge_day date
)
returns uuid
language sql stable security definer set search_path = ''
as $$
  select ordered.fighter_id
  from public.cage_fighter_order(array(
    select candidate.id from public.cage_profiles as candidate
    where candidate.retired_at is null and candidate.id<>p_champion_id
      and candidate.combat_stats is not null
      and coalesce(candidate.wins,0)+coalesce(candidate.losses,0)>0
      and not exists (
        select 1 from public.cage_championship_challenges as bout
        where bout.championship_key='world' and bout.challenger_id=candidate.id and bout.challenge_day=p_challenge_day
      )
    order by candidate.level desc,candidate.id
  )) as ordered
  order by ordered.list_order limit 1;
$$;
revoke all on function public.ensure_cage_champion(uuid),public.select_cage_championship_defense_challenger(uuid,date) from public,anon,authenticated;
commit;
