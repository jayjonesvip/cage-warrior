-- Daily Cage: public aggregates, not private career saves. Results are client-reported
-- like existing career records; they are not server-verified competitive outcomes.
begin;
create table if not exists public.cage_news_results (
  profile_id uuid not null references public.cage_profiles(id) on delete cascade,
  career_started_at timestamptz not null,
  bout_number integer not null check (bout_number between 1 and 19998),
  fighter_handle text not null,
  opponent_handle text not null,
  won boolean not null,
  player_rank integer not null,
  opponent_rank integer not null,
  occurred_at timestamptz not null,
  primary key (profile_id,career_started_at,bout_number)
);
create index if not exists cage_news_results_date_idx on public.cage_news_results(occurred_at);
alter table public.cage_news_results enable row level security;
revoke all on public.cage_news_results from anon,authenticated;

create or replace function public.record_cage_news_result(p_result jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare p public.cage_profiles; n integer; happened timestamptz;
begin
  select * into p from public.cage_profiles where id=auth.uid() and retired_at is null;
  if p.id is null then raise exception 'Active fighter required'; end if;
  n=(p_result->>'bout')::integer;
  happened=(p_result->>'at')::timestamptz;
  if n is null or n<1 or n>p.wins+p.losses or happened is null
    or happened<p.created_at or happened<now()-interval '7 days' or happened>now()+interval '5 minutes'
    or (p_result->>'career')::timestamptz is distinct from p.created_at
    or jsonb_typeof(p_result->'won') is distinct from 'boolean' then
    raise exception 'Invalid career result';
  end if;
  insert into public.cage_news_results values (
    p.id,p.created_at,n,p.handle,left(coalesce(p_result->>'opponent','Opponent'),40),
    (p_result->>'won')::boolean,
    greatest(0,least(10000,coalesce((p_result->>'playerRank')::integer,0))),
    greatest(0,least(10000,coalesce((p_result->>'opponentRank')::integer,0))),happened
  ) on conflict do nothing;
end $$;
revoke all on function public.record_cage_news_result(jsonb) from public,anon;
grant execute on function public.record_cage_news_result(jsonb) to authenticated;

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
      select h.action,coalesce(p.handle,'The champion') as handle,h.defenses
      from public.cage_championship_history h left join public.cage_profiles p on p.id=h.champion_id
      where h.created_at>=p_start and h.created_at<p_end and h.action in ('transfer','defense')
      order by h.created_at desc limit 3
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
