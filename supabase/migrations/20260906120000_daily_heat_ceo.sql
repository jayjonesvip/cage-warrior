-- One public CEO Daily Heat acknowledgement per fighter/local career day.
-- Eligibility follows the game's client-simulated, private career backup model.
create or replace function public.publish_cage_daily_heat_post(p_event_key text)
returns public.cage_feed_posts
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_profile public.cage_profiles;
  v_post public.cage_feed_posts;
  v_state jsonb;
  v_day text;
  v_index integer;
  v_key text;
  v_messages text[] := array[
    'Ten straight today, @{name}. That is not luck. That is a fighter making the whole roster uncomfortable. Keep the lights on for this one.',
    'I asked for someone to own the day. @{name} answered with ten straight qualifying wins. Message received.',
    '@{name} just hit ten straight today. Matchmakers, put the coffee down and pay attention. We have business to discuss.',
    'There are busy fighters, and there are dangerous fighters. Ten straight today puts @{name} firmly in the second group.',
    'My phone has not stopped buzzing about @{name}. Ten straight qualifying wins in one day will do that. You earned this spotlight.',
    'Ten fights. Ten straight wins on the Daily Heat run. @{name} did not come here to blend into the rankings.',
    '@{name}, I saw all ten. No soft touches on this run. That is the kind of work that gets the boss out of his chair.',
    'The locker room has a new problem today: @{name}. Ten straight qualifying wins. Someone better have an answer.',
    'I do not hand out attention for showing up. @{name} earned it with ten straight today. Take your bow. Then get back to work.',
    'Tonight''s memo is short: remember @{name}. Ten straight on the Daily Heat run. That name belongs under brighter lights.'
  ];
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_event_key is null or p_event_key !~ '^daily_heat_[0-9]{4}-[0-9]{2}-[0-9]{2}_[0-9]$' then raise exception 'Invalid heat event'; end if;
  v_day := substring(p_event_key from 12 for 10);
  v_index := right(p_event_key,1)::integer + 1;
  v_key := 'daily_heat_' || v_day;
  select * into v_profile from public.cage_profiles where id=v_user and retired_at is null for update;
  if not found then raise exception 'Active fighter required'; end if;
  select * into v_post from public.cage_feed_posts where author_id=v_user and post_kind='ceo' and official_event_key=v_key limit 1;
  if found then return v_post; end if;
  select state into v_state from public.cage_career_saves where owner_id=v_user;
  if not coalesce((v_state->'pendingHeatPosts') ? p_event_key,false) then raise exception 'Heat reward is not queued'; end if;
  -- A queued event survives midnight/offline retries; current-day posts must have the reward flag.
  if v_state #>> '{dailyCounters,date}' = v_day and coalesce(v_state #>> '{dailyCounters,heatAuraAwarded}','false') <> 'true' then
    raise exception 'Ten-win heat not earned';
  end if;
  insert into public.cage_feed_posts(author_id,author_handle,post_kind,body,official_event_key,created_at)
  values(v_user,'cagegrindceo','ceo',replace(v_messages[v_index],'@{name}','@'||v_profile.handle),v_key,now())
  returning * into v_post;
  return v_post;
end;
$$;
revoke all on function public.publish_cage_daily_heat_post(text) from public, anon;
grant execute on function public.publish_cage_daily_heat_post(text) to authenticated;
