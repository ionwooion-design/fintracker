-- Savings goals (separate from period final_target)

create table if not exists savings_goals (
  id              serial primary key,
  user_id         text not null,
  name            text not null,
  target_amount   numeric not null check (target_amount > 0),
  current_amount  numeric not null default 0 check (current_amount >= 0),
  deadline        date,
  color           text not null default '#3F6B5C',
  icon            text not null default 'target',
  is_completed    boolean not null default false,
  completed_at    timestamptz,
  note            text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists savings_goals_user_idx
  on savings_goals (user_id);

create index if not exists savings_goals_user_active_idx
  on savings_goals (user_id, is_completed);

-- Contributions history (optional audit trail)
create table if not exists savings_goal_contributions (
  id              serial primary key,
  user_id         text not null,
  goal_id         integer not null references savings_goals(id) on delete cascade,
  amount          numeric not null,
  note            text not null default '',
  transaction_id  integer references transactions(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists savings_goal_contrib_goal_idx
  on savings_goal_contributions (goal_id);

create index if not exists savings_goal_contrib_user_idx
  on savings_goal_contributions (user_id);
