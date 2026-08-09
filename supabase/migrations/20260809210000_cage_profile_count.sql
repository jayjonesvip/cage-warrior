create or replace function public.get_cage_profile_count()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.cage_profiles;
$$;

revoke execute on function public.get_cage_profile_count() from public, anon;
grant execute on function public.get_cage_profile_count() to authenticated;
