-- Add a deterministic CPU roster without manufacturing auth.users rows.
-- These fighters can be selected as level-matched opponents, but cannot post,
-- receive social interactions, or become the authenticated World Champion.

create table if not exists public.cage_seed_fighters (
  id uuid primary key,
  handle text not null,
  city text not null,
  archetype text not null,
  fighter_avatar text not null,
  level integer not null,
  wins integer not null,
  losses integer not null,
  base_power integer not null,
  base_speed integer not null,
  base_chin integer not null,
  base_cardio integer not null,
  power integer not null,
  speed integer not null,
  chin integer not null,
  cardio integer not null,
  attribute_total integer generated always as (power+speed+chin+cardio) stored,
  ranking_history jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cage_seed_fighters_handle_format check (handle ~ '^[A-Za-z][A-Za-z0-9_]{2,31}$'),
  constraint cage_seed_fighters_city check (
    city in (
      'phoenix','los-angeles','chicago','new-york','miami','houston','cleveland',
      'seattle','new-orleans','hawaii','boston','atlanta','san-francisco','denver',
      'tampa-bay','philadelphia','san-antonio','las-vegas','portland','baltimore'
    )
  ),
  constraint cage_seed_fighters_archetype check (archetype in ('striker','grappler')),
  constraint cage_seed_fighters_avatar check (fighter_avatar ~ '^fighter-(0[1-9]|[1-4][0-9]|50)$'),
  constraint cage_seed_fighters_level check (level between 2 and 99),
  constraint cage_seed_fighters_record check (wins between 0 and 9999 and losses between 0 and 9999),
  constraint cage_seed_fighters_base_allocation check (
    base_power between 2 and 8 and base_speed between 2 and 8
    and base_chin between 2 and 8 and base_cardio between 2 and 8
    and base_power+base_speed+base_chin+base_cardio=20
  ),
  constraint cage_seed_fighters_current_attributes check (
    power>=base_power and speed>=base_speed and chin>=base_chin and cardio>=base_cardio
  ),
  constraint cage_seed_fighters_ranking_history check (
    jsonb_typeof(ranking_history)='array' and jsonb_array_length(ranking_history)<=10
  )
);

create unique index if not exists cage_seed_fighters_handle_lower_idx
on public.cage_seed_fighters (lower(handle));

create index if not exists cage_seed_fighters_level_active_idx
on public.cage_seed_fighters (level,id) where active;

alter table public.cage_seed_fighters enable row level security;
revoke all on table public.cage_seed_fighters from public,anon,authenticated;
grant select on table public.cage_seed_fighters to authenticated;

drop policy if exists "Authenticated players read seeded Cage fighters"
on public.cage_seed_fighters;

create policy "Authenticated players read seeded Cage fighters"
on public.cage_seed_fighters for select to authenticated using (active);

-- recent_wins/recent_losses are used only to deterministically construct each
-- fighter's latest public ranking entries. Quality values are the same values
-- emitted by rankingFightEntry for same-level, ranked, and one-level-up bouts.
with seed_data (
  id,handle,city,archetype,fighter_avatar,level,wins,losses,
  base_power,base_speed,base_chin,base_cardio,power,speed,chin,cardio,
  recent_wins,recent_losses
) as (
  values
    ('ca6e0000-0000-4000-8000-000000020001'::uuid,'DominicanWildfireMIA','miami','grappler','fighter-49',2,3,1,3,5,6,6,3,7,6,7,3,1),
    ('ca6e0000-0000-4000-8000-000000020002'::uuid,'FrenchHitmanSEA','seattle','grappler','fighter-50',2,3,1,4,4,7,5,4,4,8,7,3,1),
    ('ca6e0000-0000-4000-8000-000000030001'::uuid,'WickedAlligatorBOS','boston','striker','fighter-45',3,5,1,7,3,4,6,11,5,4,6,5,1),
    ('ca6e0000-0000-4000-8000-000000030002'::uuid,'IronWhirlwindPHL','philadelphia','grappler','fighter-46',3,5,2,2,6,4,8,3,7,6,10,5,2),
    ('ca6e0000-0000-4000-8000-000000040001'::uuid,'OrangeHurricaneATL','atlanta','striker','fighter-47',4,8,2,4,7,4,5,6,12,5,6,8,2),
    ('ca6e0000-0000-4000-8000-000000040002'::uuid,'ScarletStormNYC','new-york','striker','fighter-48',4,7,3,3,8,5,4,5,11,6,7,7,3),
    ('ca6e0000-0000-4000-8000-000000050001'::uuid,'BronzeTempestBOS','boston','striker','fighter-49',5,12,3,4,6,2,8,10,8,2,13,8,2),
    ('ca6e0000-0000-4000-8000-000000050002'::uuid,'ScottishBlackoutSEA','seattle','grappler','fighter-50',5,10,6,5,4,6,5,8,4,8,12,7,3),
    ('ca6e0000-0000-4000-8000-000000060001'::uuid,'GeorgianOnslaughtPHX','phoenix','grappler','fighter-45',6,13,8,2,5,7,6,7,5,13,11,7,3),
    ('ca6e0000-0000-4000-8000-000000060002'::uuid,'CrimsonDevilPDX','portland','grappler','fighter-46',6,13,9,4,5,8,3,7,8,13,6,6,4),
    ('ca6e0000-0000-4000-8000-000000070001'::uuid,'FilipinoHammerSEA','seattle','grappler','fighter-47',7,16,9,4,5,4,7,10,10,5,15,5,5),
    ('ca6e0000-0000-4000-8000-000000070002'::uuid,'ArmenianWildfireTPA','tampa-bay','striker','fighter-48',7,18,4,4,7,3,6,11,15,7,8,9,1),
    ('ca6e0000-0000-4000-8000-000000080001'::uuid,'ObsidianKnuckleBWI','baltimore','striker','fighter-49',8,20,12,4,6,6,4,11,12,9,11,8,2),
    ('ca6e0000-0000-4000-8000-000000080002'::uuid,'GoldenAnvilPHL','philadelphia','striker','fighter-50',8,21,9,5,6,5,4,13,15,8,7,8,2),
    ('ca6e0000-0000-4000-8000-000000090001'::uuid,'PortugueseCloudburstHOU','houston','striker','fighter-45',9,22,18,6,4,7,3,15,16,8,5,3,7),
    ('ca6e0000-0000-4000-8000-000000090002'::uuid,'DominicanJackalLAX','los-angeles','striker','fighter-46',9,26,7,4,6,6,4,13,17,10,9,8,2),
    ('ca6e0000-0000-4000-8000-000000100001'::uuid,'FrenchBlizzardNOLA','new-orleans','striker','fighter-47',10,28,15,7,6,4,3,24,9,10,9,6,4),
    ('ca6e0000-0000-4000-8000-000000100002'::uuid,'SpanishMonsterNOLA','new-orleans','striker','fighter-48',10,27,13,7,4,5,4,24,13,8,7,5,5),
    ('ca6e0000-0000-4000-8000-000000110001'::uuid,'NeonOrcaDEN','denver','striker','fighter-49',11,31,17,6,8,3,3,18,22,7,8,7,3),
    ('ca6e0000-0000-4000-8000-000000110002'::uuid,'UkrainianDownpourATL','atlanta','striker','fighter-50',11,33,13,7,5,4,4,19,19,11,8,8,2),
    ('ca6e0000-0000-4000-8000-000000120001'::uuid,'ScarletOnslaughtCHI','chicago','striker','fighter-45',12,34,22,7,6,5,2,25,20,10,7,6,4),
    ('ca6e0000-0000-4000-8000-000000120002'::uuid,'ArmenianChokerTPA','tampa-bay','striker','fighter-46',12,32,28,7,3,7,3,24,17,9,7,5,5),
    ('ca6e0000-0000-4000-8000-000000130001'::uuid,'PolishHornetLAX','los-angeles','grappler','fighter-47',13,40,28,4,5,3,8,18,12,9,26,4,6),
    ('ca6e0000-0000-4000-8000-000000130002'::uuid,'ThaiWindDEN','denver','grappler','fighter-48',13,42,19,4,4,7,5,14,10,22,22,6,4),
    ('ca6e0000-0000-4000-8000-000000140001'::uuid,'SilentHaymakerNOLA','new-orleans','striker','fighter-49',14,45,31,6,7,4,3,22,30,7,10,6,4),
    ('ca6e0000-0000-4000-8000-000000140002'::uuid,'SilentBlackoutTPA','tampa-bay','striker','fighter-50',14,50,17,6,6,5,3,31,26,11,7,8,2),
    ('ca6e0000-0000-4000-8000-000000150001'::uuid,'UkrainianHornetBOS','boston','striker','fighter-45',15,51,27,5,8,3,4,27,25,7,17,6,4),
    ('ca6e0000-0000-4000-8000-000000150002'::uuid,'CosmicBearATL','atlanta','striker','fighter-46',15,50,29,4,6,5,5,28,29,9,13,5,5)
), normalized as (
  select seed_data.*,
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'won',fight.won,
          'quality',case
            when seed_data.level<5 then (array[50,50,50,60])[1+(abs(hashtext(seed_data.handle||'|quality|'||fight.position::text)::bigint)%4)]
            else (array[50,50,55,60,65])[1+(abs(hashtext(seed_data.handle||'|quality|'||fight.position::text)::bigint)%5)]
          end
        ) order by fight.position
      )
      from (
        select ordered.position,
          row_number() over (order by md5(seed_data.handle||'|result|'||ordered.position::text))<=seed_data.recent_wins as won
        from generate_series(1,least(10,seed_data.recent_wins+seed_data.recent_losses)) as ordered(position)
      ) as fight
    ),'[]'::jsonb) as ranking_history
  from seed_data
)
insert into public.cage_seed_fighters (
  id,handle,city,archetype,fighter_avatar,level,wins,losses,
  base_power,base_speed,base_chin,base_cardio,power,speed,chin,cardio,
  ranking_history,active,created_at,updated_at
)
select
  id,handle,city,archetype,fighter_avatar,level,wins,losses,
  base_power,base_speed,base_chin,base_cardio,power,speed,chin,cardio,
  ranking_history,true,'2026-09-03 12:00:00+00'::timestamptz,'2026-09-03 12:00:00+00'::timestamptz
from normalized
on conflict (id) do update set
  handle=excluded.handle,
  city=excluded.city,
  archetype=excluded.archetype,
  fighter_avatar=excluded.fighter_avatar,
  level=excluded.level,
  wins=excluded.wins,
  losses=excluded.losses,
  base_power=excluded.base_power,
  base_speed=excluded.base_speed,
  base_chin=excluded.base_chin,
  base_cardio=excluded.base_cardio,
  power=excluded.power,
  speed=excluded.speed,
  chin=excluded.chin,
  cardio=excluded.cardio,
  ranking_history=excluded.ranking_history,
  active=true,
  updated_at=excluded.updated_at;

do $$
begin
  if exists (
    select 1
    from public.cage_seed_fighters as seed
    join public.cage_profiles as profile on lower(profile.handle)=lower(seed.handle)
    where seed.active and profile.retired_at is null
  ) then
    raise exception 'A seeded fighter handle conflicts with an active player profile';
  end if;
end;
$$;

-- Keep the six newest player-selectable portraits valid in the database too.
alter table public.cage_profiles drop constraint if exists cage_profiles_fighter_avatar;
alter table public.cage_profiles add constraint cage_profiles_fighter_avatar
check (fighter_avatar is null or fighter_avatar ~ '^fighter-(0[1-9]|[1-4][0-9]|50)$');

create or replace function public.get_cage_opponent_candidates(
  p_level integer,
  p_limit integer default 12
)
returns table (
  id uuid,
  handle text,
  city text,
  archetype text,
  fighter_avatar text,
  level integer,
  wins integer,
  losses integer,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_level integer := greatest(1,least(99,coalesce(p_level,1)));
  v_limit integer := greatest(1,least(20,coalesce(p_limit,12)));
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  return query
  select candidate.id,candidate.handle,candidate.city,candidate.archetype,
         candidate.fighter_avatar,candidate.level,candidate.wins,candidate.losses,
         candidate.updated_at
  from (
    select profile.id,profile.handle,profile.city,profile.archetype,profile.fighter_avatar,
           profile.level,profile.wins,profile.losses,profile.updated_at
    from public.cage_profiles as profile
    where profile.id<>v_user_id
      and profile.retired_at is null
      and profile.level=v_level
      and profile.fighter_avatar is not null
      and profile.updated_at>=now()-interval '30 days'
    union all
    select seed.id,seed.handle,seed.city,seed.archetype,seed.fighter_avatar,
           seed.level,seed.wins,seed.losses,seed.updated_at
    from public.cage_seed_fighters as seed
    where seed.active and seed.level=v_level
  ) as candidate
  order by md5(candidate.id::text||'|'||v_user_id::text)
  limit v_limit;
end;
$$;

revoke execute on function public.get_cage_opponent_candidates(integer,integer) from public,anon;
grant execute on function public.get_cage_opponent_candidates(integer,integer) to authenticated;

-- This read-only RPC exposes the approved attributes for inspection and future
-- ranking UI integration without treating CPU fighters as authenticated users.
create or replace function public.get_cage_seed_fighter_roster()
returns setof public.cage_seed_fighters
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  return query
  select seed.*
  from public.cage_seed_fighters as seed
  where seed.active
  order by seed.level,lower(seed.handle),seed.id;
end;
$$;

revoke execute on function public.get_cage_seed_fighter_roster() from public,anon;
grant execute on function public.get_cage_seed_fighter_roster() to authenticated;

-- Allow interaction posts to name a seeded opponent while leaving the nullable
-- target_profile_id empty; that column intentionally references human profiles.
create or replace function public.publish_cage_post(
  p_post_kind text,
  p_body text,
  p_target_profile_id uuid default null
)
returns public.cage_feed_posts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_body text := trim(coalesce(p_body,''));
  v_author public.cage_profiles;
  v_target public.cage_profiles;
  v_seed_target public.cage_seed_fighters;
  v_target_id uuid;
  v_target_handle text;
  v_post public.cage_feed_posts;
  v_is_interaction boolean := p_post_kind in ('callout','props','welcome','respect','watching');
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_post_kind not in ('player','reporter','callout','props','welcome','respect','watching') then
    raise exception 'Invalid Cage Feed post type';
  end if;
  if char_length(v_body) not between 2 and 280 then
    raise exception 'Cage Feed posts must contain 2 to 280 characters';
  end if;

  select * into v_author
  from public.cage_profiles
  where id=v_user_id and retired_at is null;
  if not found then raise exception 'Create a Cage profile before posting'; end if;

  if (
    select count(*) from public.cage_feed_posts
    where author_id=v_user_id and created_at>now()-interval '24 hours'
  )>=40 then raise exception 'Daily shared Cage Feed post limit reached'; end if;

  if v_is_interaction then
    if p_target_profile_id is null or p_target_profile_id=v_user_id then
      raise exception 'Choose another fighter';
    end if;

    select * into v_target
    from public.cage_profiles
    where id=p_target_profile_id and retired_at is null;

    if found then
      v_target_id := v_target.id;
      v_target_handle := v_target.handle;
    else
      select * into v_seed_target
      from public.cage_seed_fighters
      where id=p_target_profile_id and active;
      if not found then raise exception 'That fighter is no longer available'; end if;
      v_target_id := null;
      v_target_handle := v_seed_target.handle;
    end if;

    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user_id::text,0));
    if public.get_cage_interactions_remaining()<1 then
      raise exception 'Five daily fighter interactions already used';
    end if;
  elsif p_target_profile_id is not null then
    raise exception 'Only fighter interactions may target another fighter';
  end if;

  insert into public.cage_feed_posts (
    author_id,author_handle,post_kind,body,target_profile_id,target_handle
  ) values (
    v_user_id,
    case when p_post_kind='reporter' then 'cagereporter' else v_author.handle end,
    p_post_kind,
    v_body,
    v_target_id,
    v_target_handle
  ) returning * into v_post;
  return v_post;
end;
$$;

revoke execute on function public.publish_cage_post(text,text,uuid) from public,anon;
grant execute on function public.publish_cage_post(text,text,uuid) to authenticated;

-- Recreate identity claim validation so player names cannot collide with the
-- seeded roster and avatars fighter-45 through fighter-50 can be claimed.
create or replace function public.claim_cage_identity(
  p_candidates text[],
  p_city text,
  p_archetype text,
  p_fighter_avatar text,
  p_level integer,
  p_wins integer,
  p_losses integer
)
returns public.cage_profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_candidate text;
  v_profile public.cage_profiles;
  v_attempts integer := 0;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_city not in (
    'phoenix','los-angeles','chicago','new-york','miami','houston','cleveland',
    'seattle','new-orleans','hawaii','boston','atlanta','san-francisco','denver',
    'tampa-bay','philadelphia','san-antonio','las-vegas','portland','baltimore'
  ) then raise exception 'Invalid fighter city'; end if;
  if p_archetype not in ('striker','grappler') then raise exception 'Invalid fighter archetype'; end if;
  if p_fighter_avatar is null or p_fighter_avatar !~ '^fighter-(0[1-9]|[1-4][0-9]|50)$' then
    raise exception 'Invalid fighter avatar';
  end if;

  select * into v_profile
  from public.cage_profiles
  where id=v_user_id and retired_at is null
  for update;
  if found then return v_profile; end if;

  foreach v_candidate in array coalesce(p_candidates,array[]::text[]) loop
    v_attempts := v_attempts+1;
    exit when v_attempts>300;
    v_candidate := trim(v_candidate);
    if v_candidate !~ '^[A-Za-z][A-Za-z0-9_]{2,31}$' then continue; end if;
    if exists (
      select 1 from public.cage_seed_fighters as seed
      where seed.active and lower(seed.handle)=lower(v_candidate)
    ) then continue; end if;

    insert into public.cage_name_registry (name,owner_id)
    values (v_candidate,v_user_id)
    on conflict do nothing;

    if not found then
      update public.cage_name_registry
      set retired_at=null
      where lower(name)=lower(v_candidate) and owner_id=v_user_id;
    end if;

    if found then
      insert into public.cage_profiles (
        id,handle,city,archetype,fighter_avatar,level,wins,losses,
        created_at,updated_at,retired_at
      ) values (
        v_user_id,v_candidate,p_city,p_archetype,p_fighter_avatar,
        greatest(1,least(99,coalesce(p_level,1))),
        greatest(0,least(9999,coalesce(p_wins,0))),
        greatest(0,least(9999,coalesce(p_losses,0))),
        now(),now(),null
      )
      on conflict (id) do update set
        handle=excluded.handle,
        city=excluded.city,
        archetype=excluded.archetype,
        fighter_avatar=excluded.fighter_avatar,
        level=excluded.level,
        wins=excluded.wins,
        losses=excluded.losses,
        created_at=now(),
        updated_at=now(),
        retired_at=null
      returning * into v_profile;
      return v_profile;
    end if;
  end loop;

  raise exception 'No unique Cage Grind name was available';
end;
$$;

revoke execute on function public.claim_cage_identity(text[],text,text,text,integer,integer,integer)
from public,anon;
grant execute on function public.claim_cage_identity(text[],text,text,text,integer,integer,integer)
to authenticated;

create or replace function public.sync_cage_profile(
  p_level integer,
  p_wins integer,
  p_losses integer,
  p_fighter_avatar text
)
returns public.cage_profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.cage_profiles;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_fighter_avatar is null or p_fighter_avatar !~ '^fighter-(0[1-9]|[1-4][0-9]|50)$' then
    raise exception 'Invalid fighter avatar';
  end if;

  update public.cage_profiles
  set level=greatest(1,least(99,coalesce(p_level,1))),
      wins=greatest(0,least(9999,coalesce(p_wins,0))),
      losses=greatest(0,least(9999,coalesce(p_losses,0))),
      fighter_avatar=p_fighter_avatar,
      updated_at=now()
  where id=v_user_id and retired_at is null
  returning * into v_profile;

  if not found then raise exception 'Create a permanent fighter identity before syncing'; end if;
  return v_profile;
end;
$$;

revoke execute on function public.sync_cage_profile(integer,integer,integer,text)
from public,anon;
grant execute on function public.sync_cage_profile(integer,integer,integer,text)
to authenticated;

comment on table public.cage_seed_fighters is
'Deterministic read-only CPU roster generated from Cage Grind onboarding and progression rules.';

comment on function public.get_cage_opponent_candidates(integer,integer) is
'Returns active human and deterministic CPU opponents at the requested level.';

comment on column public.cage_profiles.fighter_avatar is
'Public ID of the fighter portrait selected during career setup (fighter-01 through fighter-50).';
