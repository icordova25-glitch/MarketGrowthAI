alter table public.users
  add column if not exists platform_role text not null default 'customer'
  check (platform_role in ('customer', 'owner'));

create or replace function public.is_platform_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'platform_role') = 'owner', false);
$$;

drop policy if exists "Users manage their own profile" on public.users;
create policy "Users view their own profile or platform owner views all profiles" on public.users
  for select using (id = auth.uid() or public.is_platform_owner());
create policy "Users update their own profile without role changes" on public.users
  for update using (id = auth.uid()) with check (id = auth.uid() and platform_role = (select platform_role from public.users where id = auth.uid()));
create policy "Platform owner manages user profiles" on public.users
  for all using (public.is_platform_owner()) with check (public.is_platform_owner());

drop policy if exists "Users manage their businesses" on public.businesses;
create policy "Owners manage their businesses and platform owner views all businesses" on public.businesses
  for all using (owner_id = auth.uid() or public.is_platform_owner()) with check (owner_id = auth.uid() or public.is_platform_owner());

-- Assign platform ownership only through Supabase Admin API or SQL run by a service-role process:
-- update auth.users set raw_app_meta_data = raw_app_meta_data || '{"platform_role":"owner"}'::jsonb where email = 'owner@your-domain.com';
-- update public.users set platform_role = 'owner' where id = '<same-user-id>';