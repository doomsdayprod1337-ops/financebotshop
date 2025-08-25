-- Create invite_codes table for Genesis Market
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS invite_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    max_uses INTEGER DEFAULT -1, -- -1 means unlimited
    current_uses INTEGER DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    bonus_credits DECIMAL(10,2) DEFAULT 0,
    is_public BOOLEAN DEFAULT false,
    allowed_roles TEXT[] DEFAULT ARRAY['user']
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_active ON invite_codes(is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_invite_codes_updated_at 
    BEFORE UPDATE ON invite_codes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert the default GRANDOPEN invite code
INSERT INTO invite_codes (code, description, is_active, max_uses, current_uses, created_by, expires_at, discount_percentage, bonus_credits, is_public)
VALUES (
    'GRANDOPEN',
    'Grand Opening Invite Code - Unlimited Access',
    true,
    -1, -- unlimited uses
    0,
    'system',
    NULL, -- never expires
    0, -- no discount
    0 -- no bonus credits
) ON CONFLICT (code) DO NOTHING;

-- Create invite_usage table to track who used which codes
CREATE TABLE IF NOT EXISTS invite_usage (
    id SERIAL PRIMARY KEY,
    invite_code_id INTEGER REFERENCES invite_codes(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    UNIQUE(invite_code_id, user_id)
);

-- Create index for invite usage
CREATE INDEX IF NOT EXISTS idx_invite_usage_user_id ON invite_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_invite_usage_code_id ON invite_usage(invite_code_id);

-- Grant necessary permissions
GRANT ALL ON invite_codes TO authenticated;
GRANT ALL ON invite_usage TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Enable Row Level Security (RLS)
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for invite_codes
CREATE POLICY "Invite codes are viewable by everyone" ON invite_codes
    FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can manage invite codes" ON invite_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Create policies for invite_usage
CREATE POLICY "Users can view their own invite usage" ON invite_usage
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Only admins can manage invite usage" ON invite_usage
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Insert some additional sample invite codes
INSERT INTO invite_codes (code, description, is_active, max_uses, current_uses, created_by, expires_at, discount_percentage, bonus_credits, is_public)
VALUES 
    ('VIP2024', 'VIP Access Code - Limited to 100 users', true, 100, 0, 'system', '2024-12-31 23:59:59+00', 10.00, 50.00, false),
    ('EARLYBIRD', 'Early Bird Special - 50% off first purchase', true, 500, 0, 'system', '2024-06-30 23:59:59+00', 50.00, 25.00, true),
    ('FRIEND', 'Friend Referral Code - 25% off', true, 1000, 0, 'system', '2024-12-31 23:59:59+00', 25.00, 10.00, false)
ON CONFLICT (code) DO NOTHING;

-- Display the created invite codes
SELECT 
    code,
    description,
    is_active,
    CASE 
        WHEN max_uses = -1 THEN 'Unlimited'
        ELSE max_uses::text
    END as max_uses,
    current_uses,
    created_by,
    expires_at,
    discount_percentage,
    bonus_credits
FROM invite_codes
ORDER BY created_at;
