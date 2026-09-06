alter table public.users
  add column if not exists email text;

update public.users u
set email = au.email
from auth.users au
where au.id = u.id and (u.email is distinct from au.email);

create unique index if not exists users_email_unique_idx on public.users (email);

create or replace function public.handle_auth_user_email_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
  set email = new.email
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated_email on auth.users;
create trigger on_auth_user_updated_email
  after update of email on auth.users
  for each row execute procedure public.handle_auth_user_email_sync();
