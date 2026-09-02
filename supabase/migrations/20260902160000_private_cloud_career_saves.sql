-- Private cloud backups for authenticated Cage Grind careers.
-- Public fighter profiles remain ranking/feed data; full game state is owner-only.

create table if not exists public.cage_career_saves (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cage_career_saves_state_object check (jsonb_typeof(state)='object'),
  constraint cage_career_saves_state_size check (octet_length(state::text)<=524288)
);

alter table public.cage_career_saves enable row level security;
revoke all on table public.cage_career_saves from public, anon, authenticated;

create or replace function public.load_cage_career()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select save.state
  from public.cage_career_saves save
  join public.cage_profiles profile on profile.id=save.owner_id and profile.retired_at is null
  where save.owner_id=auth.uid()
$$;

create or replace function public.save_cage_career(p_state jsonb)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_updated_at timestamptz;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.cage_profiles
    where id=v_user_id and retired_at is null
  ) then
    raise exception 'Create a permanent fighter identity before saving a career';
  end if;
  if p_state is null or jsonb_typeof(p_state)<>'object' then
    raise exception 'Invalid Cage Grind career state';
  end if;
  if octet_length(p_state::text)>524288 then
    raise exception 'Cage Grind career state is too large';
  end if;
  if coalesce((p_state->>'nameLocked')::boolean,false) is not true then
    raise exception 'Only completed fighter identities can be saved';
  end if;
  if nullif(p_state->>'socialProfileId','')::uuid is distinct from v_user_id then
    raise exception 'Career identity does not match the authenticated fighter';
  end if;

  insert into public.cage_career_saves (owner_id,state)
  values (v_user_id,p_state)
  on conflict (owner_id) do update set
    state=excluded.state,
    updated_at=now()
  returning updated_at into v_updated_at;

  return v_updated_at;
end;
$$;

revoke execute on function public.load_cage_career() from public, anon;
revoke execute on function public.save_cage_career(jsonb) from public, anon;
grant execute on function public.load_cage_career() to authenticated;
grant execute on function public.save_cage_career(jsonb) to authenticated;

comment on table public.cage_career_saves is
'Private owner-only Cage Grind career backups accessed through authenticated RPCs.';
comment on function public.load_cage_career() is
'Returns the authenticated fighter owner private cloud career backup.';
comment on function public.save_cage_career(jsonb) is
'Validates and upserts the authenticated fighter owner private cloud career backup.';
comment on table public.cage_profiles is
'Public Cage Grind fighter identities; private full career backups live in cage_career_saves.';
