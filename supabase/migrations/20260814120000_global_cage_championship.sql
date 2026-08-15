-- Replace browser-local title ownership with one shared Cage Grind championship.
-- The belt can only be held or challenged by active, authenticated Cage profiles.

create table if not exists public.cage_championship (
  championship_key text primary key default 'world',
  champion_id uuid references public.cage_profiles(id) on delete set null,
  champion_level_at_win integer,
  won_at timestamptz,
  defenses integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint cage_championship_singleton check (championship_key='world'),
  constraint cage_championship_level check (champion_level_at_win is null or champion_level_at_win between 1 and 99),
  constraint cage_championship_defenses check (defenses>=0),
  constraint cage_championship_holder_fields check (
    (champion_id is null and champion_level_at_win is null and won_at is null)
    or
    (champion_id is not null and champion_level_at_win is not null and won_at is not null)
  )
);

insert into public.cage_championship (championship_key)
values ('world')
on conflict (championship_key) do nothing;

create table if not exists public.cage_championship_challenges (
  id bigint generated always as identity primary key,
  championship_key text not null default 'world' references public.cage_championship(championship_key),
  champion_id uuid not null references public.cage_profiles(id) on delete cascade,
  challenger_id uuid not null references public.cage_profiles(id) on delete cascade,
  champion_level integer not null,
  challenger_level integer not null,
  status text not null default 'pending',
  started_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint cage_championship_challenge_fighters check (champion_id<>challenger_id),
  constraint cage_championship_challenge_levels check (
    champion_level between 1 and 99
    and challenger_level between 1 and 99
    and challenger_level>=champion_level
  ),
  constraint cage_championship_challenge_status check (
    status in ('pending','challenger_won','champion_defended','stale','expired')
  ),
  constraint cage_championship_challenge_resolution check (
    (status='pending' and resolved_at is null)
    or
    (status<>'pending' and resolved_at is not null)
  )
);

create unique index if not exists cage_championship_one_pending_challenge_idx
on public.cage_championship_challenges (challenger_id)
where status='pending';

create index if not exists cage_championship_challenges_started_idx
on public.cage_championship_challenges (started_at desc);

create table if not exists public.cage_championship_history (
  id bigint generated always as identity primary key,
  championship_key text not null default 'world',
  action text not null,
  champion_id uuid references public.cage_profiles(id) on delete set null,
  former_champion_id uuid references public.cage_profiles(id) on delete set null,
  challenger_id uuid references public.cage_profiles(id) on delete set null,
  challenge_id bigint references public.cage_championship_challenges(id) on delete set null,
  champion_level integer,
  defenses integer not null default 0,
  created_at timestamptz not null default now(),
  constraint cage_championship_history_key check (championship_key='world'),
  constraint cage_championship_history_action check (action in ('bootstrap','succession','transfer','defense')),
  constraint cage_championship_history_level check (champion_level is null or champion_level between 1 and 99),
  constraint cage_championship_history_defenses check (defenses>=0)
);

create index if not exists cage_championship_history_created_idx
on public.cage_championship_history (created_at desc);

alter table public.cage_championship enable row level security;
alter table public.cage_championship_challenges enable row level security;
alter table public.cage_championship_history enable row level security;

revoke all on table public.cage_championship from public, anon, authenticated;
revoke all on table public.cage_championship_challenges from public, anon, authenticated;
revoke all on table public.cage_championship_history from public, anon, authenticated;

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

  select * into v_profile
  from public.cage_profiles
  where retired_at is null and id is distinct from p_former_champion_id
  order by level desc,wins desc,losses asc,updated_at asc,id asc
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
  );

  return v_profile.id;
end;
$$;

create or replace function public.get_cage_championship()
returns table (
  championship_key text,
  champion_id uuid,
  champion_handle text,
  champion_city text,
  champion_archetype text,
  champion_avatar text,
  champion_level integer,
  champion_wins integer,
  champion_losses integer,
  won_at timestamptz,
  defenses integer,
  viewer_level integer,
  is_champion boolean,
  challenge_eligible boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  return query
  select
    title.championship_key,
    champion.id,
    champion.handle,
    champion.city,
    champion.archetype,
    champion.fighter_avatar,
    champion.level,
    champion.wins,
    champion.losses,
    title.won_at,
    title.defenses,
    viewer.level,
    champion.id=v_user_id,
    viewer.id is not null
      and champion.id is not null
      and champion.id<>v_user_id
      and viewer.level>=champion.level
  from public.cage_championship as title
  left join public.cage_profiles as champion
    on champion.id=title.champion_id and champion.retired_at is null
  left join public.cage_profiles as viewer
    on viewer.id=v_user_id and viewer.retired_at is null
  where title.championship_key='world';
end;
$$;

create or replace function public.begin_cage_championship_challenge()
returns table (
  status text,
  challenge_id bigint,
  champion_id uuid,
  champion_handle text,
  champion_level integer,
  challenger_level integer,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_title public.cage_championship;
  v_champion public.cage_profiles;
  v_challenger public.cage_profiles;
  v_challenge public.cage_championship_challenges;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  perform public.ensure_cage_champion();

  select * into v_title
  from public.cage_championship
  where championship_key='world'
  for update;

  select * into v_challenger
  from public.cage_profiles
  where id=v_user_id and retired_at is null
  for update;
  if not found then raise exception 'Create a permanent fighter identity first'; end if;

  select * into v_champion
  from public.cage_profiles
  where id=v_title.champion_id and retired_at is null
  for update;
  if not found then raise exception 'The Cage Grind championship is vacant'; end if;

  if v_champion.id=v_user_id then
    return query select 'champion'::text,null::bigint,v_champion.id,v_champion.handle,
      v_champion.level,v_challenger.level,null::timestamptz;
    return;
  end if;

  if v_challenger.level<v_champion.level then
    raise exception 'Reach Level % to challenge @% for the Cage Grind championship',v_champion.level,v_champion.handle;
  end if;

  update public.cage_championship_challenges as challenge
  set status='expired',resolved_at=now()
  where challenge.challenger_id=v_user_id and challenge.status='pending'
    and challenge.started_at<=now()-interval '2 hours';

  update public.cage_championship_challenges as challenge
  set status='stale',resolved_at=now()
  where challenge.challenger_id=v_user_id and challenge.status='pending'
    and challenge.champion_id<>v_champion.id;

  select * into v_challenge
  from public.cage_championship_challenges as challenge
  where challenge.challenger_id=v_user_id and challenge.champion_id=v_champion.id
    and challenge.status='pending'
  for update;

  if not found then
    insert into public.cage_championship_challenges (
      championship_key,champion_id,challenger_id,champion_level,challenger_level
    ) values (
      'world',v_champion.id,v_user_id,v_champion.level,v_challenger.level
    ) returning * into v_challenge;
  end if;

  return query select 'ready'::text,v_challenge.id,v_champion.id,v_champion.handle,
    v_challenge.champion_level,v_challenge.challenger_level,v_challenge.started_at+interval '2 hours';
end;
$$;

create or replace function public.resolve_cage_championship_challenge(
  p_challenge_id bigint,
  p_challenger_id uuid,
  p_challenger_won boolean
)
returns table (
  status text,
  champion_id uuid,
  champion_handle text,
  champion_level integer,
  defenses integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_title public.cage_championship;
  v_challenge public.cage_championship_challenges;
  v_challenger public.cage_profiles;
  v_champion public.cage_profiles;
begin
  if p_challenger_id is null then raise exception 'Challenger identity is required'; end if;
  if p_challenger_won is null then raise exception 'Challenge result is required'; end if;

  select * into v_challenge
  from public.cage_championship_challenges
  where id=p_challenge_id and challenger_id=p_challenger_id
  for update;
  if not found then raise exception 'Championship challenge not found'; end if;
  if v_challenge.status<>'pending' then raise exception 'Championship challenge is already resolved'; end if;

  if v_challenge.started_at<=now()-interval '2 hours' then
    update public.cage_championship_challenges
    set status='expired',resolved_at=now()
    where id=v_challenge.id;
    return query select 'expired'::text,null::uuid,null::text,null::integer,null::integer;
    return;
  end if;

  select * into v_title
  from public.cage_championship
  where championship_key='world'
  for update;

  if v_title.champion_id is distinct from v_challenge.champion_id then
    update public.cage_championship_challenges
    set status='stale',resolved_at=now()
    where id=v_challenge.id;
    return query
    select 'stale'::text,profile.id,profile.handle,profile.level,title.defenses
    from public.cage_championship as title
    left join public.cage_profiles as profile on profile.id=title.champion_id
    where title.championship_key='world';
    return;
  end if;

  select * into v_challenger
  from public.cage_profiles
  where id=p_challenger_id and retired_at is null
  for update;
  if not found then raise exception 'The challenger profile is no longer active'; end if;

  select * into v_champion
  from public.cage_profiles
  where id=v_title.champion_id and retired_at is null
  for update;
  if not found then raise exception 'The champion profile is no longer active'; end if;

  if p_challenger_won then
    update public.cage_championship_challenges
    set status='challenger_won',resolved_at=now()
    where id=v_challenge.id;

    update public.cage_championship
    set champion_id=v_challenger.id,
        champion_level_at_win=v_challenger.level,
        won_at=now(),
        defenses=0,
        updated_at=now()
    where championship_key='world';

    insert into public.cage_championship_history (
      championship_key,action,champion_id,former_champion_id,challenger_id,
      challenge_id,champion_level,defenses
    ) values (
      'world','transfer',v_challenger.id,v_champion.id,v_challenger.id,
      v_challenge.id,v_challenger.level,0
    );

    insert into public.cage_feed_posts (
      author_id,author_handle,post_kind,body,official_event_key,created_at
    ) values (
      v_challenger.id,
      'cagegrindceo',
      'ceo',
      'The belt changed hands. @' || v_challenger.handle || ' defeated @' ||
        v_champion.handle || ' and is the new Cage Grind World Champion.',
      'global_title_' || v_challenge.id::text,
      now()
    );

    update public.cage_championship_challenges as challenge
    set status='stale',resolved_at=now()
    where challenge.status='pending' and challenge.id<>v_challenge.id
      and challenge.champion_id=v_champion.id;
  else
    update public.cage_championship_challenges
    set status='champion_defended',resolved_at=now()
    where id=v_challenge.id;

    update public.cage_championship as title
    set defenses=title.defenses+1,updated_at=now()
    where title.championship_key='world';

    insert into public.cage_championship_history (
      championship_key,action,champion_id,former_champion_id,challenger_id,
      challenge_id,champion_level,defenses
    ) values (
      'world','defense',v_champion.id,v_champion.id,v_challenger.id,
      v_challenge.id,v_champion.level,v_title.defenses+1
    );

    insert into public.cage_feed_posts (
      author_id,author_handle,post_kind,body,created_at
    ) values (
      v_champion.id,
      'cagereporter',
      'reporter',
      '@' || v_champion.handle || ' defended the Cage Grind World Championship against @' ||
        v_challenger.handle || '. The champion now has ' || (v_title.defenses+1)::text ||
        case when v_title.defenses+1=1 then ' successful defense.' else ' successful defenses.' end,
      now()
    );
  end if;

  return query
  select case when p_challenger_won then 'new_champion' else 'champion_defended' end,
         profile.id,profile.handle,profile.level,title.defenses
  from public.cage_championship as title
  join public.cage_profiles as profile on profile.id=title.champion_id
  where title.championship_key='world';
end;
$$;

-- Legacy clients may still request local-ladder CEO events. Keep harmless career
-- events working, but make all championship announcements database-owned.
create or replace function public.publish_cage_ceo_post(p_event_key text)
returns public.cage_feed_posts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_event_key text := lower(trim(coalesce(p_event_key,'')));
  v_profile public.cage_profiles;
  v_existing public.cage_feed_posts;
  v_post public.cage_feed_posts;
  v_body text;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if v_event_key not in ('debut','performance_bonus') then
    raise exception 'Championship announcements are managed by the global belt';
  end if;

  select * into v_profile
  from public.cage_profiles
  where id=v_user_id and retired_at is null
  for update;
  if not found then raise exception 'Create a permanent fighter identity first'; end if;

  select * into v_existing
  from public.cage_feed_posts
  where author_id=v_user_id and post_kind='ceo' and official_event_key=v_event_key;
  if found then return v_existing; end if;

  v_body := case v_event_key
    when 'debut' then 'Welcome to Cage Grind, @' || v_profile.handle || '. Build a record worth putting under the bright lights.'
    when 'performance_bonus' then 'I noticed that performance, @' || v_profile.handle || '. A bonus is already on the way.'
  end;

  insert into public.cage_feed_posts (
    author_id,author_handle,post_kind,body,official_event_key,created_at
  ) values (
    v_user_id,'cagegrindceo','ceo',v_body,v_event_key,now()
  ) returning * into v_post;

  return v_post;
end;
$$;

create or replace function public.handle_retired_cage_champion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op='DELETE' or (old.retired_at is null and new.retired_at is not null) then
    update public.cage_championship
    set champion_id=null,champion_level_at_win=null,won_at=null,defenses=0,updated_at=now()
    where championship_key='world' and champion_id=old.id;

    if found then
      update public.cage_championship_challenges
      set status='stale',resolved_at=now()
      where status='pending' and champion_id=old.id;
      perform public.ensure_cage_champion(old.id);
    end if;
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists cage_champion_retirement on public.cage_profiles;
create trigger cage_champion_retirement
after update of retired_at on public.cage_profiles
for each row execute function public.handle_retired_cage_champion();

drop trigger if exists cage_champion_profile_delete on public.cage_profiles;
create trigger cage_champion_profile_delete
before delete on public.cage_profiles
for each row execute function public.handle_retired_cage_champion();

-- Establish the first real champion from the strongest active public profile.
select public.ensure_cage_champion();

revoke execute on function public.ensure_cage_champion(uuid) from public, anon, authenticated;
revoke execute on function public.handle_retired_cage_champion() from public, anon, authenticated;
revoke execute on function public.get_cage_championship() from public, anon;
revoke execute on function public.begin_cage_championship_challenge() from public, anon;
revoke execute on function public.resolve_cage_championship_challenge(bigint,uuid,boolean) from public, anon, authenticated;
revoke execute on function public.publish_cage_ceo_post(text) from public, anon;

grant execute on function public.get_cage_championship() to authenticated;
grant execute on function public.begin_cage_championship_challenge() to authenticated;
grant execute on function public.resolve_cage_championship_challenge(bigint,uuid,boolean) to service_role;
grant execute on function public.publish_cage_ceo_post(text) to authenticated;

comment on table public.cage_championship is
'Singleton global Cage Grind championship held only by an active real fighter profile.';
comment on table public.cage_championship_challenges is
'Short-lived, authenticated challenges against the champion snapshot that was current when the fight began.';
comment on table public.cage_championship_history is
'Immutable audit history of global championship succession, transfers, and defenses.';
comment on function public.get_cage_championship() is
'Returns the reigning real-player champion and whether the authenticated viewer meets the champion level requirement.';
comment on function public.begin_cage_championship_challenge() is
'Creates or resumes a two-hour challenge only when the authenticated fighter meets or exceeds the champion level.';
comment on function public.resolve_cage_championship_challenge(bigint,uuid,boolean) is
'Service-role-only settlement that records a defense or transfers the global belt if the challenged champion still holds it.';
