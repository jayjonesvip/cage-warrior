-- Hand a retired champion's belt to the highest-ranked active fighter.
-- Succession uses the same ordering as World Rankings after the champion slot:
-- fighter level, win percentage, total professional fights, then stable identity.

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
  v_history_id bigint;
  v_former_handle text;
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

  select candidate.* into v_profile
  from public.cage_profiles as candidate
  where candidate.retired_at is null
    and candidate.id is distinct from p_former_champion_id
  order by
    candidate.level desc,
    coalesce(candidate.wins,0)::numeric
      / greatest(coalesce(candidate.wins,0)+coalesce(candidate.losses,0),1) desc,
    coalesce(candidate.wins,0)+coalesce(candidate.losses,0) desc,
    lower(candidate.handle),
    candidate.id
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
  ) returning id into v_history_id;

  if v_action='succession' then
    select handle into v_former_handle
    from public.cage_profiles
    where id=p_former_champion_id;

    insert into public.cage_feed_posts (
      author_id,author_handle,post_kind,body,official_event_key,created_at
    ) values (
      v_profile.id,'cagegrindceo','ceo',
      case when v_former_handle is null then
        '@' || v_profile.handle || ' inherits the vacant Cage Grind World Championship as the highest-ranked active fighter.'
      else
        '@' || v_former_handle || ' retired as World Champion. @' || v_profile.handle || ' inherits the vacant title as the highest-ranked active fighter.'
      end,
      'global_title_succession_' || v_history_id::text,now()
    );
  end if;

  return v_profile.id;
end;
$$;

create or replace function public.retire_cage_profile()
returns public.cage_profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.cage_profiles;
  v_retired_as_champion boolean := false;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  select * into v_profile
  from public.cage_profiles
  where id=v_user_id and retired_at is null
  for update;
  if not found then return null; end if;

  select exists (
    select 1 from public.cage_championship
    where championship_key='world' and champion_id=v_user_id
  ) into v_retired_as_champion;

  delete from public.cage_feed_posts
  where author_id=v_user_id and post_kind not in ('reporter','ceo','sponsor');

  update public.cage_feed_posts
  set target_profile_id=null
  where target_profile_id=v_user_id;

  insert into public.cage_feed_posts (
    author_id,author_handle,post_kind,body,official_event_key,created_at
  ) values (
    v_user_id,'cagegrindceo','ceo',
    case when v_retired_as_champion then
      '@' || v_profile.handle || ' has retired as Cage Grind World Champion. Their reign and career are now part of the permanent record.'
    else
      '@' || v_profile.handle || ' has officially retired from Cage Grind. Their career is now part of the record.'
    end,
    'retirement',now()
  );

  update public.cage_profiles
  set retired_at=now(),updated_at=now()
  where id=v_user_id
  returning * into v_profile;

  update public.cage_name_registry
  set retired_at=now()
  where name=v_profile.handle and owner_id=v_user_id;

  return v_profile;
end;
$$;

revoke execute on function public.ensure_cage_champion(uuid) from public, anon, authenticated;
revoke execute on function public.retire_cage_profile() from public, anon;
grant execute on function public.retire_cage_profile() to authenticated;

comment on function public.ensure_cage_champion(uuid) is
'Keeps the World Championship with an active fighter and transfers a retired champion''s belt using World Rankings order.';

comment on function public.retire_cage_profile() is
'Permanently retires the authenticated fighter, preserves champion legacy copy, and triggers ranked championship succession.';
