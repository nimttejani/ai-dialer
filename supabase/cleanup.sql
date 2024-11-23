-- Drop existing tables
-- First, drop tables (this will automatically drop their policies)
DROP TABLE IF EXISTS appointments CASCADE;  -- Drop this first because it references leads
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- Drop triggers and trigger functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop custom types and enums
DROP TYPE IF EXISTS lead_status CASCADE;

-- Drop extensions (only if you want to completely clean up)
-- DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;

-- Drop existing policies
-- DROP POLICY IF EXISTS "Allow authenticated users to read leads" ON leads;
-- DROP POLICY IF EXISTS "Allow authenticated users to insert leads" ON leads;
-- DROP POLICY IF EXISTS "Allow authenticated users to update leads" ON leads;
-- DROP POLICY IF EXISTS "Allow authenticated users to delete leads" ON leads;
