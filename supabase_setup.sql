-- ============================================================
-- Djup Terminal — Supabase schema bootstrap
-- ============================================================
-- Run this in the Supabase SQL editor against your project once.
-- It creates two tables (profiles, user_events), enables RLS, and
-- installs policies so each user can only read/write their own rows.
--
-- The Welcome page's AuthPanel uses Supabase auth's email + password
-- flow, so no extra auth tables are required.
-- ============================================================

-- ----- profiles ------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  firm text,
  avatar_url text,
  preferences jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Keep updated_at fresh on every UPDATE
create or replace function public.touch_profiles_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.touch_profiles_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);


-- ----- user_events --------------------------------------------
-- Continuous activity stream: page views, signin/out, profile updates,
-- AI invocations. Every authenticated session writes rows here.
create table if not exists public.user_events (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,         -- 'page_view' | 'signin' | 'signout' | 'signup' | 'profile_update' | 'ai_analyze' | 'ai_summarize_news' | ...
  path text,
  metadata jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_user_events_user_created
  on public.user_events (user_id, created_at desc);

alter table public.user_events enable row level security;

drop policy if exists "user_events_select_self" on public.user_events;
create policy "user_events_select_self" on public.user_events
  for select using (auth.uid() = user_id);

drop policy if exists "user_events_insert_self" on public.user_events;
create policy "user_events_insert_self" on public.user_events
  for insert with check (auth.uid() = user_id);


-- ----- auto-create profile row on signup -----------------------
-- When a new auth.users row appears, materialise a profiles row so the
-- ProfilePage has something to read on first visit.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, firm)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'firm', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
