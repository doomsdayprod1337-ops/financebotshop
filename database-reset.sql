-- Finance Shop Bot Database Reset Script
-- WARNING: This will delete all existing data!
-- Only run this if you want to start completely fresh

-- Drop all tables (in correct order due to foreign key constraints)
DROP TABLE IF EXISTS ticket_responses CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS deposits CASCADE;
DROP TABLE IF EXISTS credit_cards CASCADE;
DROP TABLE IF EXISTS bots CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS invites CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS cart CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS invite_usage CASCADE;
DROP TABLE IF EXISTS invite_codes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop functions and triggers
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop indexes (they will be recreated by the main setup script)
-- Note: Indexes are automatically dropped when tables are dropped

-- Reset sequences if they exist
-- Note: In Supabase, sequences are typically handled automatically

-- Now you can run the main database.sql script to recreate everything fresh
