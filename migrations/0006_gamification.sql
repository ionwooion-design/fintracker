-- Gamification: levels, XP, expanded achievements

alter table user_settings
  add column if not exists level integer not null default 1,
  add column if not exists total_xp integer not null default 0,
  add column if not exists title text not null default 'Новичок',
  add column if not exists longest_streak integer not null default 0,
  add column if not exists total_transactions integer not null default 0,
  add column if not exists days_logged integer not null default 0,
  add column if not exists last_login_date date;

-- Progress for multi-step / progressive achievements
create table if not exists achievement_progress (
  user_id text not null,
  code text not null,
  progress integer not null default 0,
  target integer not null default 1,
  updated_at timestamptz not null default now(),
  primary key (user_id, code)
);

create index if not exists achievement_progress_user_idx on achievement_progress (user_id);

-- Store rarity & xp on unlock for historical display
alter table achievements
  add column if not exists rarity text not null default 'common',
  add column if not exists xp_reward integer not null default 0;
