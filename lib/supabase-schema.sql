-- Run this in the Supabase SQL editor to set up your database
-- Single-user app: all records are tied to HARDCODED_USER_ID = '11111111-1111-1111-1111-111111111111'

create table if not exists user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  email text,
  created_at timestamptz default now()
);

create table if not exists medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  dose text not null,
  times text[] not null default '{}',
  color text not null default '#6366f1',
  created_at timestamptz default now()
);

create table if not exists daily_doses (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references medications(id) on delete cascade,
  date date not null,
  time_of_day text not null,
  taken boolean not null default false,
  taken_at timestamptz,
  unique(medication_id, date, time_of_day)
);

create table if not exists cycle_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  peptide_name text not null,
  dose text not null,
  frequency text not null,
  duration text not null,
  start_date date not null,
  notes text,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table user_settings enable row level security;
alter table medications enable row level security;
alter table daily_doses enable row level security;
alter table cycle_log enable row level security;

-- Single-user: allow all operations
create policy "Allow all" on user_settings for all using (true) with check (true);
create policy "Allow all" on medications for all using (true) with check (true);
create policy "Allow all" on daily_doses for all using (true) with check (true);
create policy "Allow all" on cycle_log for all using (true) with check (true);
