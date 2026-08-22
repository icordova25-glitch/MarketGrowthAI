create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  industry text,
  business_type text,
  website_url text,
  ideal_customers text,
  products_and_services text,
  differentiator text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.business_locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  city text,
  state text,
  country_code text default 'US',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.marketing_channels (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null check (category in ('website', 'google', 'social', 'email')),
  created_at timestamptz not null default timezone('utc', now())
);

create table public.connected_accounts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  marketing_channel_id uuid not null references public.marketing_channels(id),
  provider text not null,
  external_account_id text,
  display_name text,
  status text not null default 'pending' check (status in ('pending', 'connected', 'disconnected', 'error')),
  connected_at timestamptz,
  last_synced_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (business_id, marketing_channel_id, provider, external_account_id)
);

create table public.website_profiles (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  canonical_url text not null,
  platform text,
  indexed_pages integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.website_pages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  url text not null,
  title text,
  meta_description text,
  status_code integer,
  content_hash text,
  last_crawled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (business_id, url)
);

create table public.website_audits (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  score numeric(5,2),
  pages_crawled integer not null default 0,
  summary jsonb not null default '{}'::jsonb,
  audited_at timestamptz not null default timezone('utc', now())
);

create table public.website_issues (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  website_audit_id uuid references public.website_audits(id) on delete set null,
  page_url text,
  issue_type text not null,
  severity text not null check (severity in ('critical', 'high', 'medium', 'low')),
  description text not null,
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.google_search_data (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  recorded_on date not null,
  clicks integer not null default 0,
  impressions integer not null default 0,
  average_position numeric(8,2),
  dimensions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (business_id, recorded_on, dimensions)
);

create table public.google_analytics_data (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  recorded_on date not null,
  sessions integer not null default 0,
  users_count integer not null default 0,
  conversions numeric(12,2) not null default 0,
  dimensions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (business_id, recorded_on, dimensions)
);

create table public.google_business_data (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  recorded_on date not null,
  views integer not null default 0,
  calls integer not null default 0,
  direction_requests integer not null default 0,
  website_clicks integer not null default 0,
  rating numeric(3,2),
  review_count integer,
  created_at timestamptz not null default timezone('utc', now()),
  unique (business_id, recorded_on)
);

create table public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  platform text not null,
  handle text,
  followers_count integer,
  connected_account_id uuid references public.connected_accounts(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (business_id, platform, handle)
);

create table public.social_posts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  social_account_id uuid references public.social_accounts(id) on delete set null,
  external_post_id text,
  published_at timestamptz,
  content text,
  permalink text,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.social_metrics (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  social_post_id uuid references public.social_posts(id) on delete cascade,
  recorded_at timestamptz not null default timezone('utc', now()),
  impressions integer not null default 0,
  reach integer not null default 0,
  engagements integer not null default 0,
  shares integer not null default 0,
  metadata jsonb not null default '{}'::jsonb
);

create table public.social_content (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  channel text,
  content_type text,
  body text not null,
  status text not null default 'draft' check (status in ('draft', 'approved', 'published', 'archived')),
  scheduled_for timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  category text not null,
  priority text not null check (priority in ('critical', 'high', 'medium', 'low')),
  title text not null,
  description text not null,
  impact text,
  evidence jsonb not null default '{}'::jsonb,
  dismissed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  ai_insight_id uuid references public.ai_insights(id) on delete set null,
  title text not null,
  detail text not null,
  status text not null default 'proposed' check (status in ('proposed', 'accepted', 'completed', 'dismissed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.ai_actions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  ai_recommendation_id uuid references public.ai_recommendations(id) on delete set null,
  action_type text not null,
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed', 'cancelled')),
  input jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.competitors (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  website_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.keywords (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  keyword text not null,
  search_volume integer,
  position numeric(8,2),
  recorded_on date,
  created_at timestamptz not null default timezone('utc', now()),
  unique (business_id, keyword, recorded_on)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  source text not null,
  external_review_id text,
  rating numeric(3,2),
  review_text text,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (business_id, source, external_review_id)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  provider text not null default 'stripe',
  external_customer_id text,
  external_subscription_id text,
  plan text not null default 'starter',
  status text not null default 'trialing',
  current_period_end timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.usage (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  metric text not null,
  quantity integer not null default 0,
  period_start date not null,
  period_end date not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (business_id, metric, period_start, period_end)
);

create index businesses_owner_id_idx on public.businesses(owner_id);
create index connected_accounts_business_id_idx on public.connected_accounts(business_id);
create index website_pages_business_id_idx on public.website_pages(business_id);
create index website_issues_business_id_idx on public.website_issues(business_id);
create index google_search_data_business_id_recorded_on_idx on public.google_search_data(business_id, recorded_on desc);
create index google_analytics_data_business_id_recorded_on_idx on public.google_analytics_data(business_id, recorded_on desc);
create index social_posts_business_id_idx on public.social_posts(business_id);
create index ai_insights_business_id_priority_idx on public.ai_insights(business_id, priority);

create or replace function public.owns_business(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.businesses
    where id = target_business_id and owner_id = auth.uid()
  );
$$;

alter table public.users enable row level security;
alter table public.businesses enable row level security;
alter table public.business_locations enable row level security;
alter table public.marketing_channels enable row level security;

create policy "Users manage their own profile" on public.users
  for all using (id = auth.uid()) with check (id = auth.uid());
create policy "Users manage their businesses" on public.businesses
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "Users manage their business locations" on public.business_locations
  for all using (public.owns_business(business_id)) with check (public.owns_business(business_id));
create policy "Anyone authenticated can view marketing channels" on public.marketing_channels
  for select to authenticated using (true);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'connected_accounts', 'website_profiles', 'website_pages', 'website_audits', 'website_issues',
    'google_search_data', 'google_analytics_data', 'google_business_data', 'social_accounts',
    'social_posts', 'social_metrics', 'social_content', 'ai_insights', 'ai_recommendations',
    'ai_actions', 'ai_conversations', 'competitors', 'keywords', 'reviews', 'subscriptions', 'usage'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format(
      'create policy %I on public.%I for all using (public.owns_business(business_id)) with check (public.owns_business(business_id))',
      'Users manage their business ' || replace(table_name, '_', ' '), table_name
    );
  end loop;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, first_name, last_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'users', 'businesses', 'business_locations', 'connected_accounts', 'website_profiles',
    'website_pages', 'website_issues', 'social_accounts', 'social_content', 'ai_insights',
    'ai_recommendations', 'ai_actions', 'ai_conversations', 'competitors', 'subscriptions'
  ] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute procedure public.set_updated_at()',
      table_name || '_set_updated_at', table_name
    );
  end loop;
end;
$$;

insert into public.marketing_channels (slug, name, category) values
  ('website', 'Website', 'website'),
  ('google-business-profile', 'Google Business Profile', 'google'),
  ('google-search-console', 'Google Search Console', 'google'),
  ('google-analytics', 'Google Analytics', 'google'),
  ('instagram', 'Instagram', 'social'),
  ('facebook', 'Facebook', 'social'),
  ('tiktok', 'TikTok', 'social'),
  ('youtube', 'YouTube', 'social'),
  ('linkedin', 'LinkedIn', 'social'),
  ('email-marketing', 'Email marketing', 'email')
on conflict (slug) do update set name = excluded.name, category = excluded.category;