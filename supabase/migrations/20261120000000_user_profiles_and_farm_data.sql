-- User-owned profile and farm records. Every exposed table is protected by RLS.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 1 and 100),
  username text check (username is null or username ~ '^[a-z0-9_]{3,30}$'),
  bio text not null default '' check (char_length(bio) <= 280),
  avatar_url text check (avatar_url is null or (char_length(avatar_url) <= 2048 and avatar_url ~ '^https://')),
  occupation text check (occupation is null or occupation in ('Farmer', 'Researcher', 'Gardener', 'Other')),
  notification_preferences jsonb not null default '{"weather":true,"market":true,"disease":true,"harvest":true,"email":true,"sms":false}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_notification_preferences_valid check (
    jsonb_typeof(notification_preferences) = 'object'
    and notification_preferences ?& array['weather', 'market', 'disease', 'harvest', 'email', 'sms']
    and jsonb_typeof(notification_preferences -> 'weather') = 'boolean'
    and jsonb_typeof(notification_preferences -> 'market') = 'boolean'
    and jsonb_typeof(notification_preferences -> 'disease') = 'boolean'
    and jsonb_typeof(notification_preferences -> 'harvest') = 'boolean'
    and jsonb_typeof(notification_preferences -> 'email') = 'boolean'
    and jsonb_typeof(notification_preferences -> 'sms') = 'boolean'
  )
);

create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username)) where username is not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text;
  requested_occupation text;
begin
  requested_username := lower(btrim(coalesce(new.raw_user_meta_data ->> 'username', '')));
  if requested_username !~ '^[a-z0-9_]{3,30}$' then
    requested_username := null;
  end if;

  requested_occupation := new.raw_user_meta_data ->> 'occupation';
  if requested_occupation not in ('Farmer', 'Researcher', 'Gardener', 'Other') then
    requested_occupation := null;
  end if;

  begin
    insert into public.profiles (id, full_name, username, occupation)
    values (
      new.id,
      left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(coalesce(new.email, 'user'), '@', 1)), 100),
      requested_username,
      requested_occupation
    );
  exception when unique_violation then
    -- A duplicate optional username must not prevent the Auth account from being created.
    insert into public.profiles (id, full_name, occupation)
    values (
      new.id,
      left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(coalesce(new.email, 'user'), '@', 1)), 100),
      requested_occupation
    );
  end;
  return new;
end;
$$;

revoke all on function private.create_profile_for_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function private.create_profile_for_new_user();

-- Backfill profiles for accounts created before this migration; usernames remain unset.
insert into public.profiles (id, full_name)
select
  users.id,
  left(coalesce(nullif(btrim(users.raw_user_meta_data ->> 'full_name'), ''), split_part(coalesce(users.email, 'user'), '@', 1)), 100)
from auth.users as users
on conflict (id) do nothing;

alter table public.profiles enable row level security;
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name, username, bio, avatar_url, occupation, notification_preferences)
  on table public.profiles to authenticated;

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create table if not exists public.farm_settings (
  id uuid primary key references auth.users (id) on delete cascade,
  farm_name text not null default '' check (char_length(farm_name) <= 120),
  area_acres numeric(12, 2) check (area_acres is null or area_acres between 0 and 1000000),
  location text not null default '' check (char_length(location) <= 160),
  soil_type text not null default '' check (char_length(soil_type) <= 60),
  farming_type text not null default '' check (char_length(farming_type) <= 80),
  irrigation_method text not null default '' check (char_length(irrigation_method) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists farm_settings_set_updated_at on public.farm_settings;
create trigger farm_settings_set_updated_at
before update on public.farm_settings
for each row execute function public.set_updated_at();

alter table public.farm_settings enable row level security;
revoke all on table public.farm_settings from anon, authenticated;
grant select, delete on table public.farm_settings to authenticated;
grant insert (id, farm_name, area_acres, location, soil_type, farming_type, irrigation_method)
  on public.farm_settings to authenticated;
grant update (farm_name, area_acres, location, soil_type, farming_type, irrigation_method)
  on public.farm_settings to authenticated;

drop policy if exists farm_settings_select_self on public.farm_settings;
create policy farm_settings_select_self on public.farm_settings
  for select to authenticated using ((select auth.uid()) = id);
drop policy if exists farm_settings_insert_self on public.farm_settings;
create policy farm_settings_insert_self on public.farm_settings
  for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists farm_settings_update_self on public.farm_settings;
create policy farm_settings_update_self on public.farm_settings
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
drop policy if exists farm_settings_delete_self on public.farm_settings;
create policy farm_settings_delete_self on public.farm_settings
  for delete to authenticated using ((select auth.uid()) = id);

create table if not exists public.crops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  crop_name text not null check (char_length(btrim(crop_name)) between 1 and 100),
  variety text check (variety is null or char_length(variety) <= 100),
  planted_on date,
  planned_harvest_on date,
  area_acres numeric(12, 2) check (area_acres is null or area_acres between 0 and 1000000),
  status text not null default 'planned' check (status in ('planned', 'growing', 'harvested')),
  notes text not null default '' check (char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crops_harvest_after_planting check (planted_on is null or planned_harvest_on is null or planned_harvest_on >= planted_on)
);

create index if not exists crops_user_status_created_idx
  on public.crops (user_id, status, created_at desc);
create index if not exists crops_user_harvest_idx
  on public.crops (user_id, planned_harvest_on) where planned_harvest_on is not null;

drop trigger if exists crops_set_updated_at on public.crops;
create trigger crops_set_updated_at
before update on public.crops
for each row execute function public.set_updated_at();

alter table public.crops enable row level security;
revoke all on table public.crops from anon, authenticated;
grant select, delete on table public.crops to authenticated;
grant insert (user_id, crop_name, variety, planted_on, planned_harvest_on, area_acres, status, notes)
  on public.crops to authenticated;
grant update (crop_name, variety, planted_on, planned_harvest_on, area_acres, status, notes)
  on public.crops to authenticated;

drop policy if exists crops_select_self on public.crops;
create policy crops_select_self on public.crops
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists crops_insert_self on public.crops;
create policy crops_insert_self on public.crops
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists crops_update_self on public.crops;
create policy crops_update_self on public.crops
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists crops_delete_self on public.crops;
create policy crops_delete_self on public.crops
  for delete to authenticated using ((select auth.uid()) = user_id);

create table if not exists public.farm_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  category text not null default 'General' check (char_length(category) between 1 and 60),
  due_date date not null default current_date,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists farm_tasks_user_due_idx
  on public.farm_tasks (user_id, completed, due_date);

drop trigger if exists farm_tasks_set_updated_at on public.farm_tasks;
create trigger farm_tasks_set_updated_at
before update on public.farm_tasks
for each row execute function public.set_updated_at();

alter table public.farm_tasks enable row level security;
revoke all on table public.farm_tasks from anon, authenticated;
grant select, delete on table public.farm_tasks to authenticated;
grant insert (user_id, title, category, due_date, completed)
  on public.farm_tasks to authenticated;
grant update (title, category, due_date, completed)
  on public.farm_tasks to authenticated;

drop policy if exists farm_tasks_select_self on public.farm_tasks;
create policy farm_tasks_select_self on public.farm_tasks
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists farm_tasks_insert_self on public.farm_tasks;
create policy farm_tasks_insert_self on public.farm_tasks
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists farm_tasks_update_self on public.farm_tasks;
create policy farm_tasks_update_self on public.farm_tasks
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists farm_tasks_delete_self on public.farm_tasks;
create policy farm_tasks_delete_self on public.farm_tasks
  for delete to authenticated using ((select auth.uid()) = user_id);
