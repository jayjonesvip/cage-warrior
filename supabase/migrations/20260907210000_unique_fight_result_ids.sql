-- Stable result IDs replace mutable career fight totals as the deduplication key.
begin;
alter table public.cage_news_results add column if not exists result_id uuid;
update public.cage_news_results set result_id=
  md5(profile_id::text||'|'||extract(epoch from career_started_at)::text||'|'||extract(epoch from occurred_at)::text||'|'||opponent_handle)::uuid
where result_id is null;
alter table public.cage_news_results alter column result_id set not null;
alter table public.cage_news_results drop constraint if exists cage_news_results_pkey;
alter table public.cage_news_results add primary key(result_id);
create unique index if not exists cage_news_result_event_idx
on public.cage_news_results(profile_id,career_started_at,occurred_at,opponent_handle);
create or replace function public.record_cage_news_result(p_result jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare
  p public.cage_profiles; s public.cage_seed_fighters;
  n integer; happened timestamptz; seed uuid; inserted uuid; event_id uuid; existing public.cage_news_results;
  player_rank integer; opponent_rank integer; player_level integer; quality integer;
begin
  select * into p from public.cage_profiles where id=auth.uid() and retired_at is null;
  if p.id is null then raise exception 'Active fighter required'; end if;
  n=(p_result->>'bout')::integer;happened=(p_result->>'at')::timestamptz;
  if n is null or n<1 or n>19998 or happened is null
    or happened<p.created_at or happened<now()-interval '7 days' or happened>now()+interval '5 minutes'
    or (p_result->>'career')::timestamptz is distinct from p.created_at
    or jsonb_typeof(p_result->'won') is distinct from 'boolean' then raise exception 'Invalid career result'; end if;
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
      and existing.seed_id is not distinct from nullif(p_result->>'seedId','')::uuid then return;
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
    player_level=greatest(1,least(p.level,coalesce((p_result->>'playerLevel')::integer,p.level)));
    quality=case when player_rank=1 then 95 when player_rank between 2 and 5 then 90
      when player_rank between 6 and 10 then 80 when player_rank between 11 and 25 then 65
      when player_rank between 26 and 50 then 50 when player_rank between 51 and 100 then 40
      when player_rank>100 then 30 else 35 end;
    quality=greatest(0,least(100,quality+greatest(-10,least(5,(player_level-s.level)*2))));
  end if;
  insert into public.cage_news_results
    (result_id,profile_id,career_started_at,bout_number,fighter_handle,opponent_handle,won,player_rank,opponent_rank,occurred_at,seed_id,seed_opposition_quality)
  values(event_id,p.id,p.created_at,n,p.handle,case when seed is not null then s.handle else left(coalesce(p_result->>'opponent','Opponent'),40) end,
    (p_result->>'won')::boolean,player_rank,opponent_rank,happened,seed,quality)
  on conflict do nothing returning profile_id into inserted;
  if inserted is null then
    -- A concurrent retry can win the insert after the initial lookup.
    select * into existing from public.cage_news_results where result_id=event_id
      or (profile_id=p.id and career_started_at=p.created_at and occurred_at=happened
        and opponent_handle=left(coalesce(p_result->>'opponent','Opponent'),40)) limit 1;
    if existing.profile_id=p.id and existing.career_started_at=p.created_at
      and existing.occurred_at=happened and existing.won=(p_result->>'won')::boolean
      and existing.opponent_handle=left(coalesce(p_result->>'opponent','Opponent'),40)
      and existing.seed_id is not distinct from seed then return;
    end if;
    raise exception 'Conflicting fight result ID';
  end if;
  if seed is null then return; end if;
  update public.cage_seed_fighters set
    wins=least(9999,wins+case when (p_result->>'won')::boolean then 0 else 1 end),
    losses=least(9999,losses+case when (p_result->>'won')::boolean then 1 else 0 end),
    ranking_history=(select coalesce(jsonb_agg(jsonb_build_object('won',not recent.won,'quality',recent.seed_opposition_quality)
      order by recent.occurred_at,recent.profile_id,recent.bout_number),'[]'::jsonb)
      from (select won,seed_opposition_quality,occurred_at,profile_id,bout_number from public.cage_news_results
        where seed_id=seed order by occurred_at desc,profile_id desc,bout_number desc limit 30) recent),
    updated_at=now()
  where id=seed;
end $$;
revoke all on function public.record_cage_news_result(jsonb) from public,anon;
grant execute on function public.record_cage_news_result(jsonb) to authenticated;
commit;
