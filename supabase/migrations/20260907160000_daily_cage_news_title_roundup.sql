-- Aggregate the whole day's defenses before selecting headline groups.
begin;
create or replace function public.get_daily_cage_news(p_start timestamptz,p_end timestamptz)
returns jsonb language plpgsql security definer set search_path='' as $$
declare career timestamptz; result jsonb;
begin
  select created_at into career from public.cage_profiles where id=auth.uid() and retired_at is null;
  if career is null then raise exception 'Active fighter required'; end if;
  if p_start is null or p_end is null or p_end<=p_start or p_end-p_start>interval '26 hours'
    or p_start<now()-interval '3 days' or p_end>now() then raise exception 'Invalid edition'; end if;
  select jsonb_build_object(
    'career',career::text,
    'newFighters',(select count(*) from public.cage_profiles where created_at>=p_start and created_at<p_end and retired_at is null),
    'fights',(select count(*) from public.cage_news_results where occurred_at>=p_start and occurred_at<p_end),
    'titles',coalesce((select jsonb_agg(t) from (
      select h.action,coalesce(p.handle,'The champion') as handle,max(h.defenses) as defenses,count(*) as count
      from public.cage_championship_history h left join public.cage_profiles p on p.id=h.champion_id
      where h.created_at>=p_start and h.created_at<p_end and h.action in ('transfer','defense')
      group by h.action,h.champion_id,p.handle
      order by max(h.created_at) desc limit 3
    ) t),'[]'::jsonb),
    'upset',(select jsonb_build_object('winner',fighter_handle,'opponent',opponent_handle,'gap',player_rank-opponent_rank)
      from public.cage_news_results where occurred_at>=p_start and occurred_at<p_end
      and won and opponent_rank>0 and player_rank>opponent_rank
      order by player_rank-opponent_rank desc,occurred_at desc limit 1)
  ) into result;
  return result;
end $$;
revoke all on function public.get_daily_cage_news(timestamptz,timestamptz) from public,anon;
grant execute on function public.get_daily_cage_news(timestamptz,timestamptz) to authenticated;
commit;
