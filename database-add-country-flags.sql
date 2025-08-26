-- Database Migration: Add Country Flags Support
-- This script adds country_code field to bots table and populates with sample data

-- Add country_code column to bots table
ALTER TABLE bots ADD COLUMN IF NOT EXISTS country_code VARCHAR(3) DEFAULT 'US';

-- Add index for better performance on country-based queries
CREATE INDEX IF NOT EXISTS idx_bots_country_code ON bots(country_code);

-- Update existing bots with sample country codes (you can modify these as needed)
UPDATE bots SET country_code = 'US' WHERE id = 1;
UPDATE bots SET country_code = 'GB' WHERE id = 2;
UPDATE bots SET country_code = 'DE' WHERE id = 3;
UPDATE bots SET country_code = 'JP' WHERE id = 4;
UPDATE bots SET country_code = 'CA' WHERE id = 5;
UPDATE bots SET country_code = 'AU' WHERE id = 6;
UPDATE bots SET country_code = 'FR' WHERE id = 7;
UPDATE bots SET country_code = 'NL' WHERE id = 8;
UPDATE bots SET country_code = 'SG' WHERE id = 9;
UPDATE bots SET country_code = 'CH' WHERE id = 10;

-- Add country_name and country_region computed columns for easier querying
-- Note: These are virtual columns that will be computed from the country_code
-- You can also create a view or use application-level logic for this

-- Create a view for bots with country information
CREATE OR REPLACE VIEW bots_with_countries AS
SELECT 
    b.*,
    CASE 
        WHEN b.country_code = 'US' THEN 'United States'
        WHEN b.country_code = 'GB' THEN 'United Kingdom'
        WHEN b.country_code = 'DE' THEN 'Germany'
        WHEN b.country_code = 'JP' THEN 'Japan'
        WHEN b.country_code = 'CA' THEN 'Canada'
        WHEN b.country_code = 'AU' THEN 'Australia'
        WHEN b.country_code = 'FR' THEN 'France'
        WHEN b.country_code = 'NL' THEN 'Netherlands'
        WHEN b.country_code = 'SG' THEN 'Singapore'
        WHEN b.country_code = 'CH' THEN 'Switzerland'
        WHEN b.country_code = 'IT' THEN 'Italy'
        WHEN b.country_code = 'ES' THEN 'Spain'
        WHEN b.country_code = 'KR' THEN 'South Korea'
        WHEN b.country_code = 'CN' THEN 'China'
        WHEN b.country_code = 'IN' THEN 'India'
        WHEN b.country_code = 'BR' THEN 'Brazil'
        WHEN b.country_code = 'MX' THEN 'Mexico'
        WHEN b.country_code = 'SE' THEN 'Sweden'
        WHEN b.country_code = 'NO' THEN 'Norway'
        WHEN b.country_code = 'DK' THEN 'Denmark'
        ELSE 'Unknown'
    END as country_name,
    CASE 
        WHEN b.country_code IN ('US', 'CA', 'MX') THEN 'North America'
        WHEN b.country_code IN ('GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'CH', 'SE', 'NO', 'DK') THEN 'Europe'
        WHEN b.country_code IN ('JP', 'KR', 'CN', 'IN', 'SG') THEN 'Asia'
        WHEN b.country_code IN ('AU') THEN 'Oceania'
        WHEN b.country_code IN ('BR') THEN 'South America'
        ELSE 'Other'
    END as country_region
FROM bots b;

-- Add constraint to ensure country_code is valid
ALTER TABLE bots ADD CONSTRAINT chk_valid_country_code 
CHECK (country_code ~ '^[A-Z]{2,3}$');

-- Create a function to validate country codes
CREATE OR REPLACE FUNCTION validate_country_code(country_code VARCHAR(3))
RETURNS BOOLEAN AS $$
BEGIN
    -- Add your validation logic here
    -- For now, just check if it's 2-3 uppercase letters
    RETURN country_code ~ '^[A-Z]{2,3}$';
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to validate country codes on insert/update
CREATE OR REPLACE FUNCTION check_country_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT validate_country_code(NEW.country_code) THEN
        RAISE EXCEPTION 'Invalid country code: %', NEW.country_code;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER trigger_check_country_code
    BEFORE INSERT OR UPDATE ON bots
    FOR EACH ROW
    EXECUTE FUNCTION check_country_code();

-- Sample data for testing (uncomment if you want to add sample bots)
/*
INSERT INTO bots (name, description, price, country_code, status, category, created_at) VALUES
('US Trading Bot', 'Advanced trading bot for US markets', 299.99, 'US', 'available', 'Trading', NOW()),
('UK Crypto Bot', 'Cryptocurrency bot optimized for UK regulations', 199.99, 'GB', 'available', 'Crypto', NOW()),
('German Forex Bot', 'Forex trading bot with German market focus', 399.99, 'DE', 'available', 'Forex', NOW()),
('Japanese Stock Bot', 'Stock trading bot for Japanese markets', 249.99, 'JP', 'available', 'Stocks', NOW()),
('Canadian Options Bot', 'Options trading bot for Canadian markets', 349.99, 'CA', 'available', 'Options', NOW());
*/

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT ON bots_with_countries TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON bots TO your_app_user;

-- Verify the changes
SELECT 
    'Migration completed successfully' as status,
    COUNT(*) as total_bots,
    COUNT(DISTINCT country_code) as unique_countries
FROM bots;

-- Show sample of bots with country information
SELECT 
    id,
    name,
    country_code,
    country_name,
    country_region
FROM bots_with_countries 
LIMIT 10;
