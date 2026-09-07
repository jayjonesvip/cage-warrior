begin;
alter table public.cage_profiles add column if not exists combat_stats jsonb;
alter table public.cage_profiles add column if not exists combat_stats_updated_at timestamptz;
create or replace function public.save_cage_combat_stats(p_stats jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare k text; clean jsonb='{}'::jsonb;
begin
  if p_stats is null or jsonb_typeof(p_stats)<>'object' then raise exception 'Invalid combat stats'; end if;
  foreach k in array array['power','speed','chin','cardio'] loop
    if jsonb_typeof(p_stats->k) is distinct from 'number' then raise exception 'Invalid combat stat'; end if;
    if (p_stats->>k)::numeric<1 or (p_stats->>k)::numeric>10000 or trunc((p_stats->>k)::numeric)<>(p_stats->>k)::numeric then raise exception 'Invalid combat stat'; end if;
    clean=clean||jsonb_build_object(k,(p_stats->>k)::integer);
  end loop;
  update public.cage_profiles set combat_stats=clean,combat_stats_updated_at=now()
  where id=auth.uid() and retired_at is null;
  if not found then raise exception 'Active fighter required'; end if;
end $$;
create or replace function public.get_cage_combat_stats(p_ids uuid[])
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if coalesce(cardinality(p_ids),0)>1000 then raise exception 'Too many fighters'; end if;
  return (select coalesce(jsonb_object_agg(id::text,jsonb_build_object('stats',combat_stats,'updatedAt',combat_stats_updated_at)),'{}'::jsonb)
    from public.cage_profiles where id=any(p_ids) and retired_at is null);
end $$;
create or replace function public.reset_cage_combat_stats()
returns trigger language plpgsql set search_path='' as $$
begin
  if new.created_at is distinct from old.created_at then new.combat_stats=null;new.combat_stats_updated_at=null;end if;
  return new;
end $$;
drop trigger if exists reset_combat_stats_on_new_career on public.cage_profiles;
create trigger reset_combat_stats_on_new_career before update of created_at on public.cage_profiles
for each row execute function public.reset_cage_combat_stats();
revoke all on function public.save_cage_combat_stats(jsonb),public.get_cage_combat_stats(uuid[]) from public,anon;
grant execute on function public.save_cage_combat_stats(jsonb),public.get_cage_combat_stats(uuid[]) to authenticated;
comment on column public.cage_profiles.combat_stats is 'Last client-synced effective combat attributes including equipped bonuses. NULL means unavailable, never estimated.';
commit;
