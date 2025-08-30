-- Support Tickets System Schema
-- This file contains the SQL schema for the comprehensive support ticket system

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('technical', 'billing', 'account', 'general', 'bug_report', 'feature_request')),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(30) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_for_user', 'resolved', 'closed')),
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create ticket replies table
CREATE TABLE IF NOT EXISTS ticket_replies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_admin_reply BOOLEAN DEFAULT FALSE,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_admin_id ON tickets(assigned_admin_id);

CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticket_id ON ticket_replies(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_replies_user_id ON ticket_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_replies_created_at ON ticket_replies(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticket_replies_updated_at BEFORE UPDATE ON ticket_replies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS (Row Level Security) policies
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_replies ENABLE ROW LEVEL SECURITY;

-- RLS policy for tickets: users can only see their own tickets, admins can see all
CREATE POLICY "Users can view own tickets" ON tickets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets" ON tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can create tickets" ON tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tickets" ON tickets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all tickets" ON tickets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete tickets" ON tickets
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- RLS policy for ticket replies: users can see replies to tickets they own, admins can see all
CREATE POLICY "Users can view replies to own tickets" ON ticket_replies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tickets 
            WHERE tickets.id = ticket_replies.ticket_id 
            AND tickets.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all replies" ON ticket_replies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can create replies to own tickets" ON ticket_replies
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM tickets 
            WHERE tickets.id = ticket_replies.ticket_id 
            AND tickets.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can create replies to any ticket" ON ticket_replies
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can update own replies" ON ticket_replies
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all replies" ON ticket_replies
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can delete own replies" ON ticket_replies
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete all replies" ON ticket_replies
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Insert some sample data for testing (optional)
-- INSERT INTO tickets (user_id, title, description, category, priority, status) VALUES
--     ('sample-user-id', 'Sample Technical Issue', 'This is a sample technical support ticket', 'technical', 'medium', 'open'),
--     ('sample-user-id', 'Billing Question', 'I have a question about my recent bill', 'billing', 'low', 'open');

-- Create a view for ticket statistics (useful for admin dashboard)
CREATE OR REPLACE VIEW ticket_stats AS
SELECT 
    COUNT(*) as total_tickets,
    COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tickets,
    COUNT(CASE WHEN status = 'waiting_for_user' THEN 1 END) as waiting_tickets,
    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_tickets,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_tickets,
    COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_tickets,
    COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_tickets,
    COUNT(CASE WHEN priority = 'medium' THEN 1 END) as medium_priority_tickets,
    COUNT(CASE WHEN priority = 'low' THEN 1 END) as low_priority_tickets,
    AVG(EXTRACT(EPOCH FROM (COALESCE(closed_at, NOW()) - created_at))/3600) as avg_resolution_hours
FROM tickets;

-- Create a view for recent ticket activity
CREATE OR REPLACE VIEW recent_ticket_activity AS
SELECT 
    t.id,
    t.title,
    t.status,
    t.priority,
    t.category,
    t.created_at,
    u.email as user_email,
    u.full_name as user_name,
    COUNT(tr.id) as reply_count,
    MAX(tr.created_at) as last_reply_at
FROM tickets t
LEFT JOIN auth.users u ON t.user_id = u.id
LEFT JOIN ticket_replies tr ON t.id = tr.ticket_id
WHERE t.created_at >= NOW() - INTERVAL '7 days'
GROUP BY t.id, t.title, t.status, t.priority, t.category, t.created_at, u.email, u.full_name
ORDER BY t.created_at DESC;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON tickets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ticket_replies TO authenticated;
GRANT SELECT ON ticket_stats TO authenticated;
GRANT SELECT ON recent_ticket_activity TO authenticated;

-- Create function to get ticket with all replies
CREATE OR REPLACE FUNCTION get_ticket_with_replies(ticket_uuid UUID)
RETURNS TABLE (
    ticket_data JSON,
    replies_data JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        to_json(t.*) as ticket_data,
        COALESCE(
            (SELECT json_agg(to_json(tr.*)) 
             FROM ticket_replies tr 
             WHERE tr.ticket_id = t.id
             ORDER BY tr.created_at ASC), 
            '[]'::json
        ) as replies_data
    FROM tickets t
    WHERE t.id = ticket_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_ticket_with_replies(UUID) TO authenticated;
