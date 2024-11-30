-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Create enum for lead status
create type lead_status as enum (
  'pending',
  'calling',
  'no_answer',
  'scheduled',
  'not_interested'
);

-- Create updated_at trigger function (used by multiple tables)
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create leads table
create table leads (
  id uuid primary key default uuid_generate_v4(),
  company_name text not null,
  phone text not null,
  email text not null,
  status lead_status default 'pending',
  call_attempts integer default 0,
  last_called_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create trigger for leads updated_at
create trigger update_leads_updated_at 
  before update on leads 
  for each row 
  execute function update_updated_at_column();

-- Create settings table
create table settings (
  id uuid primary key default gen_random_uuid(),
  automation_enabled boolean default false,
  max_calls_batch integer default 10,
  retry_interval integer default 15,
  max_attempts integer default 3,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create trigger for settings updated_at
create trigger update_settings_updated_at 
  before update on settings 
  for each row 
  execute function update_updated_at_column();

-- Insert default settings record
insert into settings (automation_enabled, max_calls_batch, retry_interval, max_attempts)
values (false, 5, 4, 3)
on conflict (id) do nothing;

-- Enable RLS for settings table
alter table settings enable row level security;

-- Create RLS policy for settings table
create policy "Allow authenticated users to read settings"
  on settings for select
  to authenticated
  using (true);

create policy "Allow authenticated users to update settings"
  on settings for update
  to authenticated
  using (true)
  with check (true);

create policy "Allow authenticated users to insert settings"
  on settings for insert
  to authenticated
  with check (true);

-- Create appointments table
create table appointments (
  id uuid primary key default gen_random_uuid(),
  cal_booking_uid text unique not null,
  customer_name text,
  customer_email text,
  customer_phone text,
  start_time timestamptz,
  end_time timestamptz,
  status text not null,
  cancellation_reason text,
  created_at timestamptz default timezone('utc'::text, now()),
  updated_at timestamptz default timezone('utc'::text, now())
);

-- Create trigger for appointments updated_at
create trigger update_appointments_updated_at
  before update on appointments
  for each row
  execute function update_updated_at_column();

-- Create indexes
create index idx_appointments_cal_booking_uid on appointments(cal_booking_uid);
create index idx_appointments_status on appointments(status);
create index idx_leads_status on leads(status);
create index idx_leads_last_called_at on leads(last_called_at);

-- Enable RLS on all tables
alter table leads enable row level security;
alter table appointments enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Allow all operations for authenticated users" on leads;
drop policy if exists "Allow all operations for authenticated users" on settings;
drop policy if exists "Allow all operations for authenticated users" on appointments;

-- RLS Policies for leads
create policy "Enable read access for authenticated users" on leads
  for select
  to authenticated
  using (true);

create policy "Enable insert access for authenticated users" on leads
  for insert
  to authenticated
  with check (true);

create policy "Enable update access for authenticated users" on leads
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Enable delete access for authenticated users" on leads
  for delete
  to authenticated
  using (true);

-- RLS Policies for appointments
create policy "Enable read access for authenticated users" on appointments
  for select
  to authenticated
  using (true);

create policy "Enable insert access for authenticated users" on appointments
  for insert
  to authenticated
  with check (true);

create policy "Enable update access for authenticated users" on appointments
  for update
  to authenticated
  using (true)
  with check (true);

-- Optional test data (commented out by default)
-- insert into leads (company_name, phone, email) values
--   ('ACME HVAC', '+1234567890', 'contact@acmehvac.com'),
--   ('Cool Air Services', '+1987654321', 'sales@coolair.com');
