-- Preserve earned ranking performance through wins; losses/draws release it.
-- Apply after ranking_scorer_v2 and before publishing this browser version.
begin;
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
 'opponent_level_at_booking',(e->>'opponent_level_at_booking')::integer)
 ||case when outcome='win' and jsonb_typeof(e->'win_score_floor')='number'
 then jsonb_build_object('win_score_floor',greatest(0,least(95,(e->>'win_score_floor')::numeric))) else '{}'::jsonb end value from latest
) select coalesce(jsonb_agg(value order by n),'[]'::jsonb) from normalized;
$$;
create or replace function public.cage_ranking_raw_breakdown(p_wins integer,p_losses integer,p_draws integer,p_attribute_total integer,p_history jsonb)
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
 'performanceScore',.45*q+.25*career+.25*recent,
 'score',round((.45*q+.25*career+.25*recent+.05*skill)::numeric,6)) from pillars;
$$;
create or replace function public.cage_ranking_breakdown(p_wins integer,p_losses integer,p_draws integer,p_attribute_total integer,p_history jsonb)
returns jsonb language plpgsql immutable set search_path='' as $$
declare
 history jsonb=public.normalize_cage_ranking_history(p_history);
 current_result jsonb; earlier jsonb; entry jsonb;
 remaining_wins integer=greatest(0,coalesce(p_wins,0));
 performance numeric; final_score numeric;
begin
 current_result=public.cage_ranking_raw_breakdown(p_wins,p_losses,p_draws,p_attribute_total,history);
 performance=(current_result->>'performanceScore')::numeric;
 -- Only wins preserve the earned score. A loss or draw ends protection.
 while jsonb_array_length(history)>0 and remaining_wins>0 loop
  entry=history->-1;
  exit when entry->>'outcome'<>'win';
  performance=greatest(performance,coalesce((entry->>'win_score_floor')::numeric,0));
  history=history-(jsonb_array_length(history)-1);
  remaining_wins=remaining_wins-1;
  earlier=public.cage_ranking_raw_breakdown(remaining_wins,p_losses,p_draws,p_attribute_total,history);
  performance=greatest(performance,(earlier->>'performanceScore')::numeric);
 end loop;
 final_score=round(performance+.05*(current_result->'pillars'->>'attributes')::numeric,6);
 return current_result||jsonb_build_object('performanceScore',performance,'rawScore',current_result->'score',
 'winProtection',final_score-(current_result->>'score')::numeric,'score',final_score);
end $$;

-- Seed result settlement rebuilds its 30-row history from durable results. Carry
-- the previous earned score onto each new win before that rebuild discards it.
create or replace function public.preserve_cage_seed_win_score()
returns trigger language plpgsql set search_path='' as $$
declare history jsonb; floor_score numeric; last_index integer;
begin
 history=public.normalize_cage_ranking_history(new.ranking_history);
 last_index=jsonb_array_length(history)-1;
 if new.wins>old.wins and history is distinct from old.ranking_history and history->last_index->>'outcome'='win' then
  floor_score=ceil((public.cage_ranking_breakdown(old.wins,old.losses,0,0,old.ranking_history)->>'performanceScore')::numeric*1000000)/1000000;
  history=jsonb_set(history,array[last_index::text],(history->last_index)||jsonb_build_object('win_score_floor',greatest(floor_score,coalesce((history->last_index->>'win_score_floor')::numeric,0))));
  new.ranking_history=history;
 end if;
 return new;
end $$;
drop trigger if exists cage_seed_win_score on public.cage_seed_fighters;
create trigger cage_seed_win_score before update of wins,ranking_history on public.cage_seed_fighters for each row execute function public.preserve_cage_seed_win_score();

revoke all on function public.cage_ranking_raw_breakdown(integer,integer,integer,integer,jsonb),public.preserve_cage_seed_win_score() from public,anon,authenticated;
-- Refresh the existing diagnostic shadow with the same protection rule.
update public.cage_profiles set combat_stats=combat_stats;
commit;
