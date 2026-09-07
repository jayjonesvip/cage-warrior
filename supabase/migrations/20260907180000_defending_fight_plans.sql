begin;
alter table public.cage_profiles add column if not exists defending_plan jsonb not null
default '{"pace":"slow","offense":"conservative","tactics":"stick"}'::jsonb;
create or replace function public.save_cage_defending_plan(p_plan jsonb)
returns void language plpgsql security definer set search_path='' as $$
begin
  if p_plan is null or jsonb_typeof(p_plan)<>'object'
    or coalesce(p_plan->>'pace','') not in ('slow','fast')
    or coalesce(p_plan->>'offense','') not in ('conservative','aggressive')
    or coalesce(p_plan->>'tactics','') not in ('stick','adapt') then raise exception 'Invalid fight plan'; end if;
  update public.cage_profiles set defending_plan=jsonb_build_object('pace',p_plan->>'pace','offense',p_plan->>'offense','tactics',p_plan->>'tactics')
  where id=auth.uid() and retired_at is null;
  if not found then raise exception 'Active fighter required'; end if;
end $$;
create or replace function public.get_cage_defending_plans(p_ids uuid[])
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if coalesce(cardinality(p_ids),0)>1000 then raise exception 'Too many fighters'; end if;
  return (select coalesce(jsonb_object_agg(id::text,defending_plan),'{}'::jsonb) from public.cage_profiles where id=any(p_ids) and retired_at is null);
end $$;
create or replace function public.reset_cage_defending_plan()
returns trigger language plpgsql set search_path='' as $$
begin
  if new.created_at is distinct from old.created_at then
    new.defending_plan='{"pace":"slow","offense":"conservative","tactics":"stick"}'::jsonb;
  end if;return new;
end $$;
drop trigger if exists reset_defending_plan_on_new_career on public.cage_profiles;
create trigger reset_defending_plan_on_new_career before update of created_at on public.cage_profiles
for each row execute function public.reset_cage_defending_plan();
revoke all on function public.save_cage_defending_plan(jsonb),public.get_cage_defending_plans(uuid[]) from public,anon;
grant execute on function public.save_cage_defending_plan(jsonb),public.get_cage_defending_plans(uuid[]) to authenticated;
commit;
