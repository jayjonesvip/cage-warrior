-- Replace performance rankings with level and effective-attribute ordering.
-- Existing result history and the reigning champion are preserved.
create or replace function public.cage_fighter_attribute_total(p_base integer,p_stats jsonb)
returns integer language plpgsql immutable set search_path='' as $$
declare k text; v numeric; total integer:=0;
begin
  foreach k in array array['power','speed','chin','cardio'] loop
    if jsonb_typeof(p_stats->k) is distinct from 'number' then
      return greatest(0,least(40000,coalesce(p_base,20)));
    end if;
    v:=(p_stats->>k)::numeric;
    if v<1 or v>10000 or v<>trunc(v) then
      return greatest(0,least(40000,coalesce(p_base,20)));
    end if;
    total:=total+v::integer;
  end loop;
  return total;
end;
$$;
revoke all on function public.cage_fighter_attribute_total(integer,jsonb) from public,anon,authenticated;

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
  where candidate.retired_at is null
    and candidate.id is distinct from p_former_champion_id
  order by
    candidate.level desc,
    public.cage_fighter_attribute_total(candidate.attribute_total,candidate.combat_stats) desc,
    candidate.id
  limit 1
  for update;

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
        '@' || v_profile.handle || ' inherits the vacant Cage Grind World Championship as the leading active fighter by level and total attributes.'
      else
        '@' || v_former_handle || ' retired as World Champion. @' || v_profile.handle || ' inherits the vacant title as the leading active fighter by level and total attributes.'
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
    candidate.level desc,
    public.cage_fighter_attribute_total(candidate.attribute_total,candidate.combat_stats) desc,
    candidate.id
  limit 1;
$$;

revoke all on function public.ensure_cage_champion(uuid),public.select_cage_championship_defense_challenger(uuid,date) from public,anon,authenticated;
comment on column public.cage_profiles.attribute_total is 'Permanent base combat total; fighter lists sort by level then synced effective combat attributes.';

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
    'Ten fights. Ten straight wins on the Daily Heat run. @{name} did not come here to blend into the roster.',
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

revoke all on function public.publish_cage_daily_heat_post(text) from public,anon;
grant execute on function public.publish_cage_daily_heat_post(text) to authenticated;
