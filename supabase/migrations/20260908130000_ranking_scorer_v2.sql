-- Ranking v2. Apply before publishing the browser change. Safe to re-run.
-- Historical quality is preserved; missing booking metadata stays NULL, never guessed.
begin;
alter table public.cage_profiles add column if not exists draws integer not null default 0 check (draws>=0);
alter table public.cage_profiles add column if not exists score_with_perks numeric;
create or replace function public.normalize_cage_ranking_history(p_history jsonb)
returns jsonb language sql immutable set search_path='' as $$
with raw as (
 select e,n,case when exists(select 1 from unnest(array[e->>'outcome',e->>'result',e->>'method']) kind where lower(kind) in ('nc','no contest','no-contest','vacate','vacated','dq','disqualification')) then null
 when lower(coalesce(e->>'outcome',e->>'result','')) in ('win','loss','draw') then lower(coalesce(e->>'outcome',e->>'result'))
 when jsonb_typeof(e->'won')='boolean' then case when (e->>'won')::boolean then 'win' else 'loss' end end outcome
 from jsonb_array_elements(case when jsonb_typeof(p_history)='array' then p_history else '[]'::jsonb end) with ordinality r(e,n)
), dedup as (
 select *,row_number() over(partition by coalesce(nullif(e->>'resultId',''),'legacy-'||n) order by n) duplicate from raw where outcome is not null
), latest as (select * from dedup where duplicate=1 order by n desc limit 30), normalized as (
 select n,(case when coalesce(e->>'resultId','')<>'' then jsonb_build_object('resultId',e->>'resultId') else '{}'::jsonb end)||jsonb_build_object(
 'outcome',outcome,'won',outcome='win',
 'quality',greatest(0,least(100,coalesce((e->>'quality_points')::numeric,(e->>'quality')::numeric,20))),
 'quality_points',greatest(0,least(100,coalesce((e->>'quality_points')::numeric,(e->>'quality')::numeric,20))),
 'opponent_rank_at_booking',(e->>'opponent_rank_at_booking')::integer,
 'opponent_level_at_booking',(e->>'opponent_level_at_booking')::integer) value from latest
) select coalesce(jsonb_agg(value order by n),'[]'::jsonb) from normalized;
$$;
create or replace function public.cage_ranking_breakdown(p_wins integer,p_losses integer,p_draws integer,p_attribute_total integer,p_history jsonb)
returns jsonb language sql immutable set search_path='' as $$
with inputs as (
 select greatest(0,coalesce(p_wins,0))::numeric wins,greatest(0,coalesce(p_losses,0))::numeric losses,greatest(0,coalesce(p_draws,0))::numeric draws,greatest(0,coalesce(p_attribute_total,20))::numeric attributes,
 public.normalize_cage_ranking_history(p_history) history
), rows as (
 select e,n,jsonb_array_length(history)-n+1 age,(e->>'quality_points')::numeric quality,e->>'outcome' outcome from inputs,jsonb_array_elements(history) with ordinality r(e,n)
), decayed as (select *,quality*case when age<=8 then 1 when age<=18 then .7 else .4 end decayed_quality from rows where outcome='win'),
best as (select * from decayed order by decayed_quality desc,n asc limit 5),
form as (select *,case outcome when 'win' then 50+.5*quality when 'draw' then 50 else 10+.3*quality end points from rows where age<=10),
metrics as (
 select *,(wins+.5*draws+2)/(wins+losses+draws+4) wr,
 case when not exists(select 1 from rows) then 20 when (select count(*) from decayed)<5 then coalesce((select avg(decayed_quality) from decayed),0)
 else .7*(select avg(decayed_quality) from best)+.3*(select avg(decayed_quality) from decayed) end q from inputs
), pillars as (
 select *,greatest(0,least(100,85*wr+15*least(wins,50)/50)) career,
 greatest(0,least(100,coalesce((select avg(points) from form),100*wr))) recent,
 greatest(0,least(100,100*attributes/150)) skill from metrics
) select jsonb_build_object('bestDecayedWins',coalesce((select jsonb_agg(jsonb_build_object('quality_points',quality,'age',age,'decayedQuality',decayed_quality) order by decayed_quality desc,n asc) from best),'[]'::jsonb),
 'lastTenForm',coalesce((select jsonb_agg(jsonb_build_object('outcome',outcome,'quality_points',quality,'formPoints',points) order by n) from form),'[]'::jsonb),
 'smoothedRecord',jsonb_build_object('wins',wins,'losses',losses,'draws',draws,'fights',wins+losses+draws,'rate',wr),'attributeTotal',attributes,
 'pillars',jsonb_build_object('quality',q,'career',career,'recent',recent,'attributes',skill),
 'score',round((.45*q+.25*career+.25*recent+.05*skill)::numeric,6)) from pillars;
$$;
create or replace function public.cage_world_rank_score(p_wins integer,p_losses integer,p_level integer,p_attribute_total integer,p_ranking_history jsonb)
returns numeric language sql immutable set search_path='' as $$
 select (public.cage_ranking_breakdown(p_wins,p_losses,0,coalesce(p_attribute_total,20+greatest(0,coalesce(p_level,1)-1)),p_ranking_history)->>'score')::numeric;
$$;
-- All new snapshots are supplied at booking; sync only validates and preserves them.
drop function if exists public.sync_cage_ranking(integer,jsonb);
create or replace function public.sync_cage_ranking(p_attribute_total integer,p_ranking_history jsonb,p_draws integer default 0)
returns public.cage_profiles language plpgsql security definer set search_path='' as $$
declare v_profile public.cage_profiles; normalized jsonb;
begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 if p_ranking_history is null or jsonb_typeof(p_ranking_history)<>'array' or jsonb_array_length(p_ranking_history)>30 then raise exception 'Invalid ranking history';end if;
 if exists(select 1 from jsonb_array_elements(p_ranking_history) e where jsonb_typeof(e)<>'object'
 or coalesce(e->>'outcome',case when jsonb_typeof(e->'won')='boolean' then case when (e->>'won')::boolean then 'win' else 'loss' end end,'') not in ('win','loss','draw','nc','vacate','dq')
 or jsonb_typeof(coalesce(e->'quality_points',e->'quality')) is distinct from 'number'
 or coalesce((e->>'quality_points')::numeric,(e->>'quality')::numeric) not between 0 and 100
 or (e->>'opponent_rank_at_booking')::integer<0 or (e->>'opponent_level_at_booking')::integer<1)
 then raise exception 'Invalid ranking snapshot';end if;
 normalized=public.normalize_cage_ranking_history(p_ranking_history);
 update public.cage_profiles set attribute_total=greatest(4,least(40000,coalesce(p_attribute_total,20))),draws=greatest(0,coalesce(p_draws,0)),ranking_history=normalized,updated_at=now()
 where id=auth.uid() and retired_at is null returning * into v_profile;
 if v_profile.id is null then raise exception 'Permanent fighter identity required';end if;
 return v_profile;
end $$;
-- Normalize legacy rows without recomputing their quality or inventing booked ranks.
update public.cage_profiles set ranking_history=public.normalize_cage_ranking_history(ranking_history);
update public.cage_seed_fighters set ranking_history=public.normalize_cage_ranking_history(ranking_history);
-- Perk score is a shadow only. No live ordering function reads this column.
create or replace function public.refresh_cage_perk_shadow()
returns trigger language plpgsql set search_path='' as $$
begin
 new.score_with_perks=case when new.combat_stats is null then null else
 (public.cage_ranking_breakdown(new.wins,new.losses,new.draws,(new.combat_stats->>'power')::integer+(new.combat_stats->>'speed')::integer+(new.combat_stats->>'chin')::integer+(new.combat_stats->>'cardio')::integer,new.ranking_history)->>'score')::numeric end;
 return new;
end $$;
drop trigger if exists cage_perk_shadow on public.cage_profiles;
create trigger cage_perk_shadow before insert or update of wins,losses,draws,combat_stats,ranking_history on public.cage_profiles for each row execute function public.refresh_cage_perk_shadow();
update public.cage_profiles set combat_stats=combat_stats;
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
    and candidate.combat_stats is not null
    and coalesce(candidate.wins,0)+coalesce(candidate.losses,0)>0
    and not exists (
      select 1
      from public.cage_championship_challenges as bout
      where bout.championship_key='world'
        and bout.challenger_id=candidate.id
        and bout.challenge_day=p_challenge_day
    )
  order by
    (public.cage_ranking_breakdown(candidate.wins,candidate.losses,candidate.draws,candidate.attribute_total,candidate.ranking_history)->>'score')::numeric desc,
    coalesce(candidate.wins,0)::numeric/greatest(coalesce(candidate.wins,0)+coalesce(candidate.losses,0)+candidate.draws,1) desc,
    coalesce(candidate.wins,0)+coalesce(candidate.losses,0)+candidate.draws desc,
    candidate.id
  limit 1;
$$;

revoke all on function public.select_cage_championship_defense_challenger(uuid,date)
from public,anon,authenticated;


revoke all on function public.normalize_cage_ranking_history(jsonb),public.cage_ranking_breakdown(integer,integer,integer,integer,jsonb),public.refresh_cage_perk_shadow() from public,anon,authenticated;
revoke all on function public.sync_cage_ranking(integer,jsonb,integer) from public,anon;
grant execute on function public.sync_cage_ranking(integer,jsonb,integer) to authenticated;
comment on column public.cage_profiles.attribute_total is 'Permanent base combat total. Live ranking uses base attributes only.';
comment on column public.cage_profiles.score_with_perks is 'Shadow score only; never used for live rank ordering.';
-- Durable result rows carry both sides' booked metadata, including seeded fighters.
alter table public.cage_news_results alter column seed_opposition_quality type numeric using seed_opposition_quality::numeric;
alter table public.cage_news_results add column if not exists opponent_level_at_booking integer;
alter table public.cage_news_results add column if not exists quality_points numeric check (quality_points between 0 and 100);
alter table public.cage_news_results add column if not exists seed_opponent_level_at_booking integer;
create or replace function public.record_cage_news_result(p_result jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare
  p public.cage_profiles; s public.cage_seed_fighters;
  n integer; happened timestamptz; seed uuid; inserted uuid; event_id uuid; existing public.cage_news_results;
  player_rank integer; opponent_rank integer; player_level integer; quality numeric;
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
    player_level=(p_result->'seedRankingSnapshot'->>'opponent_level_at_booking')::integer;
    quality=coalesce((p_result->'seedRankingSnapshot'->>'quality_points')::numeric,35);
    if quality<0 or quality>100 or player_level<1 then raise exception 'Invalid booked seed snapshot';end if;
  end if;
  insert into public.cage_news_results
    (result_id,profile_id,career_started_at,bout_number,fighter_handle,opponent_handle,won,player_rank,opponent_rank,occurred_at,seed_id,seed_opposition_quality,opponent_level_at_booking,quality_points,seed_opponent_level_at_booking)
  values(event_id,p.id,p.created_at,n,p.handle,case when seed is not null then s.handle else left(coalesce(p_result->>'opponent','Opponent'),40) end,
    (p_result->>'won')::boolean,player_rank,opponent_rank,happened,seed,quality,(p_result->'rankingSnapshot'->>'opponent_level_at_booking')::integer,(p_result->'rankingSnapshot'->>'quality_points')::numeric,player_level)
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
    ranking_history=(select coalesce(jsonb_agg(jsonb_build_object('resultId',recent.result_id,'won',not recent.won,'outcome',case when recent.won then 'loss' else 'win' end,'quality',recent.seed_opposition_quality,'quality_points',recent.seed_opposition_quality,'opponent_rank_at_booking',recent.player_rank,'opponent_level_at_booking',recent.seed_opponent_level_at_booking)
      order by recent.occurred_at,recent.profile_id,recent.bout_number),'[]'::jsonb)
      from (select results.result_id,results.won,results.seed_opposition_quality,results.occurred_at,results.profile_id,results.bout_number,results.player_rank,results.seed_opponent_level_at_booking from public.cage_news_results results
        where seed_id=seed order by occurred_at desc,profile_id desc,bout_number desc limit 30) recent),
    updated_at=now()
  where id=seed;
end $$;
revoke all on function public.record_cage_news_result(jsonb) from public,anon;
grant execute on function public.record_cage_news_result(jsonb) to authenticated;

commit;
