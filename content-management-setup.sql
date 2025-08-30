-- Content Management Database Setup
-- This script creates the necessary tables for news and wiki management

-- Create news table
CREATE TABLE IF NOT EXISTS news (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    full_content TEXT,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wiki_entries table
CREATE TABLE IF NOT EXISTS wiki_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    section VARCHAR(255),
    subsections TEXT[], -- Array of strings
    steps TEXT[], -- Array of strings
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at);
CREATE INDEX IF NOT EXISTS idx_wiki_category ON wiki_entries(category);
CREATE INDEX IF NOT EXISTS idx_wiki_created_at ON wiki_entries(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_news_updated_at 
    BEFORE UPDATE ON news 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wiki_updated_at 
    BEFORE UPDATE ON wiki_entries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO news (title, content, full_content, category) VALUES
(
    'New Anti-Detect Browser Released',
    'Version 7.2 of our anti-detect browser is now available with improved fingerprinting evasion.',
    'We''re excited to announce the release of Version 7.2 of our advanced anti-detect browser! This major update brings significant improvements in fingerprinting evasion and user privacy protection.

Key Features:
• Enhanced Canvas fingerprinting protection
• Improved WebGL spoofing capabilities
• Advanced audio fingerprinting prevention
• Better timezone and language handling
• Optimized performance and memory usage

The new version includes over 50+ new evasion techniques that make it virtually impossible for websites to track and identify users. Our team has spent months researching the latest detection methods and implementing countermeasures.

This update is available immediately for all existing users and will be automatically applied to new installations. The browser maintains its user-friendly interface while providing enterprise-level privacy protection.',
    'Software'
),
(
    'Increased Bot Availability',
    'We''ve added 50,000+ new bots from various countries to our marketplace.',
    'Great news for our users! We''ve significantly expanded our bot marketplace with the addition of over 50,000 new high-quality bots from various countries around the world.

New Additions:
• 15,000+ bots from European countries
• 20,000+ bots from North America
• 10,000+ bots from Asia-Pacific region
• 5,000+ bots from emerging markets

Each bot has been thoroughly tested and verified to ensure optimal performance and reliability. Our expanded network now covers 45+ countries, giving users unprecedented access to diverse IP addresses and locations.

The new bots are available immediately and can be purchased through our standard pricing tiers. We''ve also introduced bulk purchase discounts for users requiring large quantities.',
    'Market'
);

INSERT INTO wiki_entries (title, content, category, section, subsections, steps, details) VALUES
(
    'Reaper Market Overview',
    'Reaper Market is a premium, invitation-only marketplace for stolen credentials, digital fingerprints, and cookie tools. Our platform provides access to high-quality stolen data from infected devices worldwide.',
    'overview',
    'What is Reaper Market?',
    ARRAY['Premium credential marketplace', 'Bot dump collections', 'Professional services', 'Secure and anonymous transactions'],
    NULL,
    'Our platform offers a comprehensive suite of tools and services designed for professionals and security researchers.'
),
(
    'Getting Started Guide',
    'Creating an account on Reaper Market requires an invitation from an existing member. This ensures quality and security of our community.',
    'gettingStarted',
    'Account Creation',
    NULL,
    ARRAY['Obtain an invite code from a trusted member', 'Visit the registration page', 'Fill in your details and invite code', 'Verify your email address', 'Complete your profile setup'],
    'Follow these steps carefully to ensure your account is properly set up and verified. Remember to use strong passwords and enable two-factor authentication for maximum security.'
);

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON news TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON wiki_entries TO authenticated;
-- GRANT USAGE ON SEQUENCE news_id_seq TO authenticated;
-- GRANT USAGE ON SEQUENCE wiki_entries_id_seq TO authenticated;

COMMENT ON TABLE news IS 'News articles and announcements for the platform';
COMMENT ON TABLE wiki_entries IS 'Wiki documentation and guides for users';
COMMENT ON COLUMN news.full_content IS 'Extended content for detailed view';
COMMENT ON COLUMN wiki_entries.subsections IS 'Array of subsection titles';
COMMENT ON COLUMN wiki_entries.steps IS 'Array of step-by-step instructions';
