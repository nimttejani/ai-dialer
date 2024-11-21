-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Create enum for lead status
create type lead_status as enum (
  'pending',
  'no_answer',
  'scheduled',
  'not_interested'
);

-- Create leads table
create table leads (
  id uuid primary key default uuid_generate_v4(),
  company_name text not null,
  phone text not null,
  email text not null,
  status lead_status default 'pending',
  call_attempts integer default 0,
  last_called_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create updated_at trigger
create or replace function update_updated_at_column() returns trigger as $$ begin new.updated_at = now();

return new;

end;

$$ language plpgsql;

create trigger update_leads_updated_at before
update on leads for each row execute function update_updated_at_column();

-- Add some test data
-- insert into leads (company_name, phone, email) values
--   ('ACME HVAC', '+1234567890', 'contact@acmehvac.com'),
--   ('Cool Air Services', '+1987654321', 'sales@coolair.com');
-- Enable RLS
alter table leads enable row level security;

-- Create a policy that allows all operations for now (we can restrict this later)
create policy "Allow all operations" on leads for all using (true) with check (true);