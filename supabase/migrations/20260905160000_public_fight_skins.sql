-- Public cosmetic tier; legacy profiles retain the starter kit until next sync.
alter table public.cage_profiles
  add column if not exists fight_skin_aura integer not null default 0
  check (fight_skin_aura between 0 and 100);

create or replace function public.sync_cage_fight_skin(p_aura integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  update public.cage_profiles
    set fight_skin_aura=greatest(0,least(100,coalesce(p_aura,0)))
    where id=auth.uid() and retired_at is null;
end;
$$;
revoke execute on function public.sync_cage_fight_skin(integer) from public,anon;
grant execute on function public.sync_cage_fight_skin(integer) to authenticated;
