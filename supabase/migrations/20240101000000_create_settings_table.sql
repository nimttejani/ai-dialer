create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  automation_enabled boolean default false,
  max_calls_batch integer default 5,
  retry_interval integer default 4,
  max_attempts integer default 3,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert default settings if table is empty
insert into settings (automation_enabled, max_calls_batch, retry_interval, max_attempts)
select false, 5, 4, 3
where not exists (select 1 from settings);

-- Create an update trigger to set updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists settings_updated_at on settings;
create trigger settings_updated_at
  before update on settings
  for each row
  execute function update_updated_at_column();
