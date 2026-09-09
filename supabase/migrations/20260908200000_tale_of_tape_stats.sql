-- Retain finish methods for Tale of the Tape; publish aggregate counts only.
begin;
alter table public.cage_news_results add column if not exists finish_category text
  check (finish_category in ('ko','sub','dec','other'));

create or replace function public.cage_finish_category(p_method text)
returns text language sql immutable set search_path='' as $$
  select case
    when upper(trim(p_method)) ~ '\m(KO|TKO)\M' then 'ko'
    when upper(trim(p_method)) like 'SUBMISSION%' or upper(trim(p_method))='SUB' then 'sub'
    when upper(trim(p_method)) like '%DECISION%' then 'dec'
    when upper(trim(p_method)) in ('FORFEIT','DQ','DISQUALIFICATION','NO CONTEST','OTHER') then 'other'
    else null end;
$$;
revoke all on function public.cage_finish_category(text) from public,anon,authenticated;

-- Only match saved history to an existing result belonging to the same career.
update public.cage_news_results as result set finish_category=public.cage_finish_category(entry->>'method')
from public.cage_career_saves as save
cross join lateral jsonb_array_elements(case when jsonb_typeof(save.state->'fightHistory')='array' then save.state->'fightHistory' else '[]'::jsonb end) as entry
where result.profile_id=save.owner_id and result.finish_category is null
  and result.result_id::text=entry->>'resultId'
  and entry->'won'=to_jsonb(result.won)
  and exists(select 1 from public.cage_profiles as profile where profile.id=save.owner_id and profile.created_at=result.career_started_at);

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
      and (opponent is null or existing.opponent_profile_id=opponent)
      and (public.cage_finish_category(p_result->>'finishMethod') is null or existing.finish_category is not distinct from public.cage_finish_category(p_result->>'finishMethod')) then return;
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
    (result_id,profile_id,career_started_at,bout_number,fighter_handle,opponent_handle,won,player_rank,opponent_rank,occurred_at,seed_id,seed_opposition_quality,opponent_level_at_booking,quality_points,seed_opponent_level_at_booking,opponent_profile_id,finish_category)
  values(event_id,p.id,p.created_at,n,p.handle,case when seed is not null then s.handle else left(coalesce(p_result->>'opponent','Opponent'),40) end,
    (p_result->>'won')::boolean,player_rank,opponent_rank,happened,seed,quality,(p_result->'rankingSnapshot'->>'opponent_level_at_booking')::integer,(p_result->'rankingSnapshot'->>'quality_points')::numeric,player_level,opponent,public.cage_finish_category(p_result->>'finishMethod'))
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
      and (opponent is null or existing.opponent_profile_id=opponent)
      and (public.cage_finish_category(p_result->>'finishMethod') is null or existing.finish_category is not distinct from public.cage_finish_category(p_result->>'finishMethod')) then return;
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

create or replace function public.get_cage_finish_stats(p_ids uuid[])
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required';end if;
  if coalesce(cardinality(p_ids),0)>2000 then raise exception 'Too many fighters';end if;
  return (
    with recorded as (
      select result.profile_id as fighter_id,result.finish_category
      from public.cage_news_results as result
      join public.cage_profiles as profile on profile.id=result.profile_id and profile.created_at=result.career_started_at
      where result.profile_id=any(p_ids) and result.won and result.finish_category is not null
      union all
      select result.seed_id,result.finish_category
      from public.cage_news_results as result
      where result.seed_id=any(p_ids) and not result.won and result.finish_category is not null
    ), totals as (
      select fighter_id,jsonb_build_object('wins',count(*),'ko',count(*) filter(where finish_category='ko'),
        'sub',count(*) filter(where finish_category='sub'),'dec',count(*) filter(where finish_category='dec'),
        'other',count(*) filter(where finish_category='other')) as stats
      from recorded group by fighter_id
    ) select coalesce(jsonb_object_agg(fighter_id::text,stats),'{}'::jsonb) from totals
  );
end $$;
revoke all on function public.get_cage_finish_stats(uuid[]) from public,anon;
grant execute on function public.get_cage_finish_stats(uuid[]) to authenticated;
commit;
