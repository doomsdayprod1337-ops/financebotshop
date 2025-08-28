-- Database Verification Script
-- This script helps diagnose the current database state and identify issues

-- ============================================================================
-- CHECK EXTENSIONS
-- ============================================================================

SELECT 
    extname as extension_name,
    extversion as version,
    CASE 
        WHEN extname = 'uuid-ossp' THEN '✓ Required for UUID generation'
        ELSE 'ℹ Other extension'
    END as status
FROM pg_extension 
WHERE extname = 'uuid-ossp';

-- ============================================================================
-- CHECK EXISTING TABLES
-- ============================================================================

-- Check all tables in the current schema
SELECT 
    table_name,
    table_type,
    CASE 
        WHEN table_name IN ('admin_settings', 'deposits', 'crypto_transactions', 'payment_webhooks', 'users') THEN '✓ Required table'
        ELSE 'ℹ Other table'
    END as importance
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY 
    CASE 
        WHEN table_name IN ('admin_settings', 'deposits', 'crypto_transactions', 'payment_webhooks', 'users') THEN 1
        ELSE 2
    END,
    table_name;

-- ============================================================================
-- CHECK REQUIRED TABLES STRUCTURE
-- ============================================================================

-- Check admin_settings table structure
SELECT 
    'admin_settings' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_settings') THEN '✓ Exists'
        ELSE '✗ Missing'
    END as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_settings') THEN 
            (SELECT COUNT(*)::text FROM information_schema.columns WHERE table_name = 'admin_settings')
        ELSE 'N/A'
    END as column_count
UNION ALL
-- Check deposits table structure
SELECT 
    'deposits' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deposits') THEN '✓ Exists'
        ELSE '✗ Missing'
    END as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deposits') THEN 
            (SELECT COUNT(*)::text FROM information_schema.columns WHERE table_name = 'deposits')
        ELSE 'N/A'
    END as column_count
UNION ALL
-- Check crypto_transactions table structure
SELECT 
    'crypto_transactions' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crypto_transactions') THEN '✓ Exists'
        ELSE '✗ Missing'
    END as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crypto_transactions') THEN 
            (SELECT COUNT(*)::text FROM information_schema.columns WHERE table_name = 'crypto_transactions')
        ELSE 'N/A'
    END as column_count
UNION ALL
-- Check payment_webhooks table structure
SELECT 
    'payment_webhooks' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_webhooks') THEN '✓ Exists'
        ELSE '✗ Missing'
    END as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_webhooks') THEN 
            (SELECT COUNT(*)::text FROM information_schema.columns WHERE table_name = 'payment_webhooks')
        ELSE 'N/A'
    END as column_count;

-- ============================================================================
-- CHECK SPECIFIC COLUMNS
-- ============================================================================

-- Check if currency column exists in deposits table
SELECT 
    'deposits.currency' as column_check,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'deposits' AND column_name = 'currency'
        ) THEN '✓ Exists'
        ELSE '✗ Missing'
    END as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'deposits' AND column_name = 'currency'
        ) THEN 
            (SELECT data_type FROM information_schema.columns 
             WHERE table_name = 'deposits' AND column_name = 'currency')
        ELSE 'N/A'
    END as data_type;

-- ============================================================================
-- CHECK CONSTRAINTS AND INDEXES
-- ============================================================================

-- Check foreign key constraints
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('deposits', 'crypto_transactions', 'payment_webhooks');

-- Check indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('deposits', 'crypto_transactions', 'payment_webhooks', 'admin_settings')
ORDER BY tablename, indexname;

-- ============================================================================
-- CHECK TRIGGERS
-- ============================================================================

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('deposits', 'crypto_transactions', 'payment_webhooks', 'admin_settings')
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- CHECK FUNCTIONS
-- ============================================================================

SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'update_updated_at_column';

-- ============================================================================
-- RECOMMENDATIONS
-- ============================================================================

-- Summary of what needs to be done
SELECT 
    'Database Setup Status' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_settings') 
             AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deposits')
             AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crypto_transactions')
             AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_webhooks')
        THEN '✓ All required tables exist'
        ELSE '✗ Some required tables are missing'
    END as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_settings') 
             AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deposits')
             AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crypto_transactions')
             AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_webhooks')
        THEN 'Database is properly set up'
        ELSE 'Run admin-settings-setup.sql and crypto-deposits-setup.sql to create missing tables'
    END as recommendation;
