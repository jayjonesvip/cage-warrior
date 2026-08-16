-- Collapse the seven legacy fighting styles into the two permanent Cage Grind
-- archetypes used by fighter creation, public profiles, and matchmaking.

alter table public.cage_profiles
drop constraint if exists cage_profiles_archetype;

update public.cage_profiles
set archetype = case
  when archetype in ('control','submission','wrestleBox','wrestle','wrestler','grappler') then 'grappler'
  else 'striker'
end
where archetype not in ('striker','grappler');

alter table public.cage_profiles
add constraint cage_profiles_archetype check (archetype in ('striker','grappler'));

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
  if p_city not in ('phoenix','los-angeles','chicago','new-york','miami','houston','cleveland','seattle','new-orleans','hawaii') then raise exception 'Invalid fighter city'; end if;
  if p_archetype not in ('striker','grappler') then raise exception 'Invalid fighter archetype'; end if;
  if p_fighter_avatar is null or p_fighter_avatar !~ '^fighter-(0[1-9]|[123][0-9]|40)$' then raise exception 'Invalid fighter avatar'; end if;

  select * into v_profile
  from public.cage_profiles
  where id=v_user_id and retired_at is null
  for update;
  if found then return v_profile; end if;

  foreach v_candidate in array coalesce(p_candidates,array[]::text[]) loop
    v_attempts := v_attempts + 1;
    exit when v_attempts > 300;
    v_candidate := trim(v_candidate);
    if v_candidate !~ '^[A-Za-z][A-Za-z0-9_]{2,31}$' then continue; end if;

    insert into public.cage_name_registry (name,owner_id)
    values (v_candidate,v_user_id)
    on conflict do nothing;

    if found then
      insert into public.cage_profiles (
        id,handle,city,archetype,fighter_avatar,level,wins,losses,created_at,updated_at,retired_at
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

revoke execute on function public.claim_cage_identity(text[],text,text,text,integer,integer,integer) from public, anon;
grant execute on function public.claim_cage_identity(text[],text,text,text,integer,integer,integer) to authenticated;

comment on function public.claim_cage_identity(text[],text,text,text,integer,integer,integer) is
'Permanently reserves a unique fighter handle using the Striker or Grappler archetype.';
