-- Server-authoritative fighter referrals. An invite belongs to one new fighter,
-- qualifies after that fighter completes a bout, and pays the inviter once.

create table if not exists public.cage_fighter_referrals (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references public.cage_profiles(id),
  invitee_id uuid not null unique references public.cage_profiles(id),
  created_at timestamptz not null default now(),
  qualified_at timestamptz,
  claimed_at timestamptz,
  constraint cage_fighter_referrals_distinct_fighters check (inviter_id<>invitee_id),
  constraint cage_fighter_referrals_claim_requires_qualification check (claimed_at is null or qualified_at is not null)
);

create index if not exists cage_fighter_referrals_inviter_reward_idx
on public.cage_fighter_referrals (inviter_id,qualified_at,claimed_at);

alter table public.cage_fighter_referrals enable row level security;
revoke all on table public.cage_fighter_referrals from public,anon,authenticated;

create or replace function public.register_cage_fighter_referral(p_inviter_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invitee_id uuid := auth.uid();
begin
  if v_invitee_id is null then raise exception 'Authentication required'; end if;
  if p_inviter_id is null or p_inviter_id=v_invitee_id then return false; end if;
  if not exists (
    select 1 from public.cage_profiles
    where id=p_inviter_id and retired_at is null
  ) then return false; end if;
  if not exists (
    select 1 from public.cage_profiles
    where id=v_invitee_id and retired_at is null and wins=0 and losses=0
  ) then return false; end if;

  insert into public.cage_fighter_referrals (inviter_id,invitee_id)
  values (p_inviter_id,v_invitee_id)
  on conflict (invitee_id) do nothing;
  return found;
end;
$$;

create or replace function public.qualify_cage_fighter_referral()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invitee_id uuid := auth.uid();
begin
  if v_invitee_id is null then raise exception 'Authentication required'; end if;

  update public.cage_fighter_referrals referral
  set qualified_at=now()
  where referral.invitee_id=v_invitee_id
    and referral.qualified_at is null
    and exists (
      select 1 from public.cage_profiles profile
      where profile.id=v_invitee_id
        and profile.retired_at is null
        and profile.wins+profile.losses>0
    );
  return found;
end;
$$;

create or replace function public.claim_cage_fighter_referral_reward()
returns table (referral_id uuid,invitee_handle text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inviter_id uuid := auth.uid();
begin
  if v_inviter_id is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.cage_profiles
    where id=v_inviter_id and retired_at is null
  ) then return; end if;

  return query
  with reward as (
    select referral.id,profile.handle
    from public.cage_fighter_referrals referral
    join public.cage_profiles profile on profile.id=referral.invitee_id
    where referral.inviter_id=v_inviter_id
      and referral.qualified_at is not null
      and referral.claimed_at is null
    order by referral.qualified_at,referral.created_at
    for update of referral skip locked
    limit 1
  ), claimed as (
    update public.cage_fighter_referrals referral
    set claimed_at=now()
    from reward
    where referral.id=reward.id
    returning referral.id,reward.handle
  )
  select claimed.id,claimed.handle from claimed;
end;
$$;

revoke execute on function public.register_cage_fighter_referral(uuid) from public,anon;
revoke execute on function public.qualify_cage_fighter_referral() from public,anon;
revoke execute on function public.claim_cage_fighter_referral_reward() from public,anon;
grant execute on function public.register_cage_fighter_referral(uuid) to authenticated;
grant execute on function public.qualify_cage_fighter_referral() to authenticated;
grant execute on function public.claim_cage_fighter_referral_reward() to authenticated;

comment on table public.cage_fighter_referrals is
'One-time fighter invitations that qualify after the invited career completes its first bout.';
