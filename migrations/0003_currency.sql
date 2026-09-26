-- Add currency support to user settings (ISO 4217 code)
alter table user_settings
  add column if not exists currency text not null default 'RUB';
