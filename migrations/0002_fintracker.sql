-- FinTracker PRO schema (per-user, TEXT user_id)

create table if not exists user_settings (
  user_id text primary key,
  user_name text not null default '',
  start_date date not null,
  initial_balance numeric not null default 0,
  end_date date not null,
  final_target numeric not null default 0,
  current_streak integer not null default 0,
  last_streak_date date,
  last_budget_day date,
  privacy_accepted boolean not null default false,
  dark_theme boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists categories (
  id serial primary key,
  user_id text not null,
  name text not null,
  color text not null,
  icon text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);
create index if not exists categories_user_id_idx on categories (user_id);

create table if not exists envelopes (
  id serial primary key,
  user_id text not null,
  name text not null,
  budget numeric not null,
  color text not null,
  icon text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);
create index if not exists envelopes_user_id_idx on envelopes (user_id);

create table if not exists transactions (
  id serial primary key,
  user_id text not null,
  amount numeric not null,
  type text not null,
  description text not null default 'Без названия',
  transaction_date date not null,
  category_id integer,
  envelope_id integer,
  created_at timestamptz not null default now()
);
create index if not exists transactions_user_date_idx on transactions (user_id, transaction_date);
create index if not exists transactions_category_idx on transactions (category_id);
create index if not exists transactions_envelope_idx on transactions (envelope_id);

create table if not exists fixed_events (
  id serial primary key,
  user_id text not null,
  amount numeric not null,
  description text not null,
  event_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists fixed_events_user_id_idx on fixed_events (user_id);

create table if not exists categorization_rules (
  id serial primary key,
  user_id text not null,
  pattern text not null,
  category_id integer,
  envelope_id integer
);
create index if not exists categorization_rules_user_idx on categorization_rules (user_id, pattern);

create table if not exists achievements (
  id serial primary key,
  user_id text not null,
  code text not null,
  name text not null,
  description text not null,
  icon text not null,
  unlocked_at timestamptz not null default now(),
  unique (user_id, code)
);
create index if not exists achievements_user_id_idx on achievements (user_id);
