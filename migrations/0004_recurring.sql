-- Recurring transactions (subscriptions, salary, rent, etc.)

create table if not exists recurring_transactions (
  id              serial primary key,
  user_id         text not null,

  amount          numeric not null,
  type            text not null check (type in ('income', 'expense')),
  description     text not null default '',
  category_id     integer references categories(id) on delete set null,
  envelope_id     integer references envelopes(id) on delete set null,

  frequency       text not null check (frequency in (
                    'daily', 'weekly', 'monthly', 'yearly', 'custom'
                  )),
  interval        integer not null default 1,
  day_of_week     integer,
  day_of_month    integer,
  month_of_year   integer,
  custom_rrule    text,

  start_date      date not null,
  end_date        date,
  next_occurrence date not null,
  last_generated  date,

  is_active       boolean not null default true,
  auto_create     boolean not null default true,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists recurring_user_active_idx
  on recurring_transactions (user_id, is_active);

create index if not exists recurring_next_idx
  on recurring_transactions (user_id, next_occurrence)
  where is_active = true;

alter table transactions
  add column if not exists recurring_id integer
  references recurring_transactions(id) on delete set null;

create index if not exists transactions_recurring_idx
  on transactions (recurring_id)
  where recurring_id is not null;
