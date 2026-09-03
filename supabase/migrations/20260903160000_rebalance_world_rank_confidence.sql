-- Keep tiny undefeated records from outranking established winning careers.
-- The 2-2 prior preserves win percentage as the main resume signal while
-- requiring real fight volume before a perfect percentage receives full credit.

create or replace function public.cage_world_rank_score(
  p_wins integer,
  p_losses integer,
  p_level integer,
  p_attribute_total integer,
  p_ranking_history jsonb
)
returns numeric
language sql
immutable
set search_path = ''
as $$
  with values_normalized as (
    select
      greatest(0,coalesce(p_wins,0))::numeric as wins,
      greatest(0,coalesce(p_losses,0))::numeric as losses,
      greatest(4,coalesce(p_attribute_total,20+greatest(0,coalesce(p_level,1)-1)))::numeric as attributes,
      case when jsonb_typeof(p_ranking_history)='array' then p_ranking_history else '[]'::jsonb end as history
  ), components as (
    select
      case when wins+losses>0 then wins/(wins+losses) else 0 end as win_rate,
      case when wins+losses>0 then (wins+2)/(wins+losses+4) else 0 end as proven_win_rate,
      wins+losses as fights,
      attributes,
      history
    from values_normalized
  ), history_components as (
    select
      components.*,
      coalesce(jsonb_array_length(history),0) as history_count,
      coalesce((select count(*) from jsonb_array_elements(history) entry where entry->>'won'='true'),0) as recent_wins,
      coalesce((select avg((entry->>'quality')::numeric) from jsonb_array_elements(history) entry where entry->>'won'='true' and jsonb_typeof(entry->'quality')='number'),50) as quality_score
    from components
  )
  select round((
    ((proven_win_rate*75)+(least(fights,50)/50*25))*.50
    + quality_score*.25
    + (case when history_count>0 then recent_wins::numeric/history_count*100 else proven_win_rate*100 end)*.15
    + least(100,attributes/150*100)*.10
  )::numeric,6)
  from history_components;
$$;

revoke all on function public.cage_world_rank_score(integer,integer,integer,integer,jsonb)
from public,anon,authenticated;

comment on function public.cage_world_rank_score(integer,integer,integer,integer,jsonb) is
'Hybrid World Rank score using a 2-2 record prior so small samples do not overpower proven resumes.';
