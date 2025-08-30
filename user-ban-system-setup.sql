-- User Ban System Setup
-- This script ensures the users table has proper status management for bans and suspensions

-- Check if status column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'status'
    ) THEN
        ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    END IF;
END $$;

-- Add status constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_status_check'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_status_check 
        CHECK (status IN ('active', 'suspended', 'banned'));
    END IF;
END $$;

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Create index on status and last_login for admin queries
CREATE INDEX IF NOT EXISTS idx_users_status_last_login ON users(status, last_login);

-- Update existing users to have 'active' status if they don't have one
UPDATE users SET status = 'active' WHERE status IS NULL;

-- Create a function to ban a user
CREATE OR REPLACE FUNCTION ban_user(user_id UUID, ban_reason TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE users 
    SET 
        status = 'banned',
        updated_at = NOW()
    WHERE id = user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create a function to suspend a user
CREATE OR REPLACE FUNCTION suspend_user(user_id UUID, suspension_reason TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE users 
    SET 
        status = 'suspended',
        updated_at = NOW()
    WHERE id = user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create a function to reactivate a user
CREATE OR REPLACE FUNCTION reactivate_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE users 
    SET 
        status = 'active',
        updated_at = NOW()
    WHERE id = user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create a view for banned users
CREATE OR REPLACE VIEW banned_users AS
SELECT 
    id,
    username,
    email,
    status,
    created_at,
    updated_at,
    last_login
FROM users 
WHERE status = 'banned'
ORDER BY updated_at DESC;

-- Create a view for suspended users
CREATE OR REPLACE VIEW suspended_users AS
SELECT 
    id,
    username,
    email,
    status,
    created_at,
    updated_at,
    last_login
FROM users 
WHERE status = 'suspended'
ORDER BY updated_at DESC;

-- Create a view for active users
CREATE OR REPLACE VIEW active_users AS
SELECT 
    id,
    username,
    email,
    status,
    created_at,
    updated_at,
    last_login
FROM users 
WHERE status = 'active'
ORDER BY last_login DESC NULLS LAST;

-- Create a function to get user status statistics
CREATE OR REPLACE FUNCTION get_user_status_stats()
RETURNS TABLE(
    total_users BIGINT,
    active_users BIGINT,
    suspended_users BIGINT,
    banned_users BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_users,
        COUNT(*) FILTER (WHERE status = 'active')::BIGINT as active_users,
        COUNT(*) FILTER (WHERE status = 'suspended')::BIGINT as suspended_users,
        COUNT(*) FILTER (WHERE status = 'banned')::BIGINT as banned_users
    FROM users;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION ban_user(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION suspend_user(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reactivate_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_status_stats() TO authenticated;

-- Create audit log table for user status changes (optional)
CREATE TABLE IF NOT EXISTS user_status_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by UUID REFERENCES users(id),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_status_log
CREATE INDEX IF NOT EXISTS idx_user_status_log_user_id ON user_status_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_status_log_created_at ON user_status_log(created_at);

-- Create trigger to log status changes
CREATE OR REPLACE FUNCTION log_user_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO user_status_log (user_id, old_status, new_status, reason)
        VALUES (NEW.id, OLD.status, NEW.status, 'Status changed via admin panel');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_log_user_status_change'
    ) THEN
        CREATE TRIGGER trigger_log_user_status_change
        AFTER UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION log_user_status_change();
    END IF;
END $$;

-- Insert sample data for testing (optional - remove in production)
-- INSERT INTO users (email, username, password_hash, status) VALUES 
-- ('banned@example.com', 'banned_user', 'dummy_hash', 'banned'),
-- ('suspended@example.com', 'suspended_user', 'dummy_hash', 'suspended');

COMMENT ON TABLE users IS 'Users table with status management for bans and suspensions';
COMMENT ON COLUMN users.status IS 'User account status: active, suspended, or banned';
COMMENT ON FUNCTION ban_user(UUID, TEXT) IS 'Bans a user account';
COMMENT ON FUNCTION suspend_user(UUID, TEXT) IS 'Suspends a user account';
COMMENT ON FUNCTION reactivate_user(UUID) IS 'Reactivates a suspended or banned user account';
