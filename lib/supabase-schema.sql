-- Run this in the Supabase SQL editor to set up your database

create table if not exists user_settings (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz default now()
);

create table if not exists medications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  dose text not null,
  times text[] not null default '{}',
  color text not null default '#6366f1',
  user_email text not null,
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
  peptide_name text not null,
  dose text not null,
  frequency text not null,
  duration text not null,
  start_date date not null,
  notes text,
  created_at timestamptz default now()
);

-- Enable Row Level Security (optional but recommended)
alter table user_settings enable row level security;
alter table medications enable row level security;
alter table daily_doses enable row level security;
alter table cycle_log enable row level security;

-- For a single-user app, allow all operations (adjust for multi-user auth)
create policy "Allow all" on user_settings for all using (true) with check (true);
create policy "Allow all" on medications for all using (true) with check (true);
create policy "Allow all" on daily_doses for all using (true) with check (true);
create policy "Allow all" on cycle_log for all using (true) with check (true);
