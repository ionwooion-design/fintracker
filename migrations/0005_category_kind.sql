-- Category kind: expense | income (default expense for existing rows)

alter table categories
  add column if not exists kind text not null default 'expense';

-- Allow same display name for income vs expense categories
alter table categories drop constraint if exists categories_user_id_name_key;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'categories_user_id_name_kind_key'
  ) then
    alter table categories
      add constraint categories_user_id_name_kind_key unique (user_id, name, kind);
  end if;
end $$;

create index if not exists categories_user_kind_idx on categories (user_id, kind);
