create table if not exists public.admin_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  role text not null check (role in ('owner', 'platform_admin', 'support', 'analyst')),
  status text not null default 'active' check (status in ('invited', 'active', 'revoked')),
  invited_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users(id) on delete set null,
  target_user_id uuid references public.users(id) on delete set null,
  action text not null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.admin_memberships enable row level security;
alter table public.admin_audit_events enable row level security;

create policy "Platform owner manages admin memberships" on public.admin_memberships
  for all using (public.is_platform_owner()) with check (public.is_platform_owner());
create policy "Platform owner reads admin audit events" on public.admin_audit_events
  for select using (public.is_platform_owner());

create trigger admin_memberships_set_updated_at
  before update on public.admin_memberships
  for each row execute procedure public.set_updated_at();

-- Production role assignment must also update immutable auth.users app_metadata through the Supabase Admin API.
-- Client-side profile metadata and browser storage must never grant admin permissions.