alter table public.businesses
  add column if not exists service_area text,
  add column if not exists marketing_channels jsonb not null default '[]'::jsonb;
