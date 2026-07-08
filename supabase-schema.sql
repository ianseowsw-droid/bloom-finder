-- Production Supabase schema for Florist.ar / Bloom Finder.
-- Client apps use the anon key. Security comes from Supabase Auth + RLS.
-- Enable anonymous sign-ins in Supabase Auth while the app does not yet require
-- Sign in with Apple. Before App Store launch, add Apple auth and account deletion.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  region text,
  experience text,
  share_location boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.specimens (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  latin text,
  notes text,
  image_path text not null,
  created_at_ms bigint not null,
  found_at text,
  habitat text,
  color text,
  confidence integer,
  tags text[] not null default '{}',
  latitude double precision,
  longitude double precision,
  location_accuracy_m double precision,
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can read own profile"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

create policy "Users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

alter table public.specimens
  add column if not exists image_path text;

alter table public.specimens
  drop column if exists image_data_url;

alter table public.specimens
  alter column owner_id type uuid using owner_id::uuid;

alter table public.specimens
  alter column owner_id set not null;

alter table public.specimens
  alter column image_path set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'specimens_owner_id_fkey'
      and conrelid = 'public.specimens'::regclass
  ) then
    alter table public.specimens
      add constraint specimens_owner_id_fkey
      foreign key (owner_id) references auth.users(id) on delete cascade;
  end if;
end $$;

create index if not exists specimens_owner_created_idx
  on public.specimens (owner_id, created_at_ms desc);

alter table public.specimens enable row level security;

drop policy if exists "prototype device read" on public.specimens;
drop policy if exists "prototype device insert" on public.specimens;
drop policy if exists "prototype device update" on public.specimens;
drop policy if exists "prototype device delete" on public.specimens;

drop policy if exists "Users can read own specimens" on public.specimens;
drop policy if exists "Users can insert own specimens" on public.specimens;
drop policy if exists "Users can update own specimens" on public.specimens;
drop policy if exists "Users can delete own specimens" on public.specimens;

create policy "Users can read own specimens"
  on public.specimens
  for select
  to authenticated
  using (owner_id = auth.uid());

create policy "Users can insert own specimens"
  on public.specimens
  for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Users can update own specimens"
  on public.specimens
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Users can delete own specimens"
  on public.specimens
  for delete
  to authenticated
  using (owner_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('specimens', 'specimens', false)
on conflict (id) do update set public = false;

drop policy if exists "Users can read own specimen images" on storage.objects;
drop policy if exists "Users can upload own specimen images" on storage.objects;
drop policy if exists "Users can update own specimen images" on storage.objects;
drop policy if exists "Users can delete own specimen images" on storage.objects;

create policy "Users can read own specimen images"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'specimens'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "Users can upload own specimen images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'specimens'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "Users can update own specimen images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'specimens'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'specimens'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "Users can delete own specimen images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'specimens'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists specimens_set_updated_at on public.specimens;
create trigger specimens_set_updated_at
before update on public.specimens
for each row
execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();
