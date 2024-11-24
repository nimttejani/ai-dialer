-- First disable RLS on all tables to avoid any permission issues during cleanup
ALTER TABLE IF EXISTS settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS appointments DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DROP POLICY IF EXISTS "Allow authenticated users to read settings" ON settings;
DROP POLICY IF EXISTS "Allow authenticated users to update settings" ON settings;
DROP POLICY IF EXISTS "Allow authenticated users to insert settings" ON settings;
DROP POLICY IF EXISTS "Allow authenticated users to read leads" ON leads;
DROP POLICY IF EXISTS "Allow authenticated users to insert leads" ON leads;
DROP POLICY IF EXISTS "Allow authenticated users to update leads" ON leads;
DROP POLICY IF EXISTS "Allow authenticated users to delete leads" ON leads;

-- Drop existing tables with CASCADE to ensure all dependencies are removed
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- Drop triggers and trigger functions from both current schema and public schema
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Drop custom types and enums
DROP TYPE IF EXISTS lead_status CASCADE;

-- Drop any remaining functions, triggers, or types that might exist
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all triggers in both current and public schemas
    FOR r IN (SELECT DISTINCT trigger_name, event_object_table 
              FROM information_schema.triggers 
              WHERE trigger_schema IN (current_schema(), 'public')) 
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || 
                ' ON ' || quote_ident(r.event_object_table) || ' CASCADE';
    END LOOP;
    
    -- Drop all functions in both current and public schemas
    FOR r IN (SELECT p.proname, p.oid as proc_oid, n.nspname as schema_name
              FROM pg_proc p
              JOIN pg_namespace n ON p.pronamespace = n.oid
              WHERE n.nspname IN (current_schema(), 'public')) 
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.schema_name) || '.' || 
                quote_ident(r.proname) || 
                '(' || pg_get_function_identity_arguments(r.proc_oid) || ') CASCADE';
    END LOOP;
    
    -- Drop all types in both current and public schemas
    FOR r IN (SELECT t.typname, n.nspname as schema_name
              FROM pg_type t
              JOIN pg_namespace n ON t.typnamespace = n.oid
              WHERE n.nspname IN (current_schema(), 'public')
              AND t.typtype = 'e') 
    LOOP
        EXECUTE 'DROP TYPE IF EXISTS ' || 
                quote_ident(r.schema_name) || '.' || 
                quote_ident(r.typname) || ' CASCADE';
    END LOOP;
END $$;
