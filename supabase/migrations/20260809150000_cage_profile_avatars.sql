-- Add the career-selected fighter portrait to public Cage Feed profiles.
-- Existing profiles remain valid and receive their portrait on their next feed sync.

alter table public.cage_profiles
add column if not exists fighter_avatar text;

alter table public.cage_profiles
drop constraint if exists cage_profiles_fighter_avatar;

alter table public.cage_profiles
add constraint cage_profiles_fighter_avatar
check (fighter_avatar is null or fighter_avatar ~ '^fighter-(0[1-9]|1[0-9]|20)$');

create or replace function public.register_cage_profile(
  p_fighter_name text,
  p_city text,
  p_archetype text,
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
  if p_fighter_avatar is null or p_fighter_avatar !~ '^fighter-(0[1-9]|1[0-9]|20)$' then
    raise exception 'Invalid fighter avatar';
  end if;

  -- Keep handle allocation and all existing validation in the original RPC.
  v_profile := public.register_cage_profile(
    p_fighter_name,
    p_city,
    p_archetype,
    p_level,
    p_wins,
    p_losses
  );

  update public.cage_profiles
  set fighter_avatar = p_fighter_avatar,
      updated_at = now()
  where id = v_user_id
  returning * into v_profile;

  return v_profile;
end;
$$;

revoke execute on function public.register_cage_profile(text,text,text,integer,integer,integer,text) from public, anon;
grant execute on function public.register_cage_profile(text,text,text,integer,integer,integer,text) to authenticated;

comment on column public.cage_profiles.fighter_avatar is 'Public ID of the fighter portrait selected during career setup.';
