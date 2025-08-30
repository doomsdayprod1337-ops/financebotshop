-- Checker Files Management System Setup
-- This script creates the necessary tables and indexes for managing checker tool files

-- Create checker_files table
CREATE TABLE IF NOT EXISTS checker_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL, -- Stored filename on server
    original_name VARCHAR(255) NOT NULL, -- Original filename from user
    file_type VARCHAR(50) NOT NULL, -- silverbullet, openbullet, bas, cookiebullet, bl_tools
    file_size BIGINT NOT NULL, -- File size in bytes
    metadata JSONB, -- Additional file metadata (format, description, etc.)
    configuration JSONB, -- User configuration settings
    status VARCHAR(50) DEFAULT 'pending_configuration', -- pending_configuration, configured, active, inactive, deleted
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_checker_files_file_type ON checker_files(file_type);
CREATE INDEX IF NOT EXISTS idx_checker_files_status ON checker_files(status);
CREATE INDEX IF NOT EXISTS idx_checker_files_uploaded_by ON checker_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_checker_files_created_at ON checker_files(created_at);
CREATE INDEX IF NOT EXISTS idx_checker_files_filename ON checker_files(filename);

-- Create index for JSONB fields
CREATE INDEX IF NOT EXISTS idx_checker_files_metadata_gin ON checker_files USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_checker_files_configuration_gin ON checker_files USING GIN (configuration);

-- Add comments to clarify field purposes
COMMENT ON TABLE checker_files IS 'Stores uploaded checker tool files with their configurations';
COMMENT ON COLUMN checker_files.filename IS 'Unique filename stored on server';
COMMENT ON COLUMN checker_files.original_name IS 'Original filename as uploaded by user';
COMMENT ON COLUMN checker_files.file_type IS 'Type of checker tool (silverbullet, openbullet, bas, cookiebullet, bl_tools)';
COMMENT ON COLUMN checker_files.file_size IS 'File size in bytes';
COMMENT ON COLUMN checker_files.metadata IS 'JSON object containing file format, description, and other metadata';
COMMENT ON COLUMN checker_files.configuration IS 'JSON object containing user configuration settings';
COMMENT ON COLUMN checker_files.status IS 'Current status of the file (pending_configuration, configured, active, inactive, deleted)';
COMMENT ON COLUMN checker_files.uploaded_by IS 'User ID who uploaded the file';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_checker_files_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_checker_files_updated_at 
    BEFORE UPDATE ON checker_files 
    FOR EACH ROW 
    EXECUTE FUNCTION update_checker_files_updated_at_column();

-- Insert sample data for testing (optional)
INSERT INTO checker_files (filename, original_name, file_type, file_size, metadata, status) VALUES
(
    'sample-silverbullet-123.svb',
    'my_checker.svb',
    'silverbullet',
    1024,
    '{"format": "SilverBullet (.SVB)", "description": "SilverBullet checker configuration file"}',
    'pending_configuration'
),
(
    'sample-openbullet-456.loli',
    'checker_config.loli',
    'openbullet',
    2048,
    '{"format": "OpenBullet (.Loli/.Anom/.Opk)", "description": "OpenBullet checker configuration file"}',
    'pending_configuration'
),
(
    'sample-bas-789.xml',
    'automation_project.xml',
    'bas',
    3072,
    '{"format": "BAS (.XML)", "description": "BAS (Browser Automation Studio) project file"}',
    'pending_configuration'
)
ON CONFLICT (id) DO NOTHING;

-- Create view for easy access to configured files
CREATE OR REPLACE VIEW configured_checker_files AS
SELECT 
    cf.id,
    cf.filename,
    cf.original_name,
    cf.file_type,
    cf.file_size,
    cf.metadata,
    cf.configuration,
    cf.status,
    cf.created_at,
    cf.updated_at,
    u.username as uploaded_by_username
FROM checker_files cf
LEFT JOIN users u ON cf.uploaded_by = u.id
WHERE cf.status = 'configured' OR cf.status = 'active';

-- Create function to get file statistics
CREATE OR REPLACE FUNCTION get_checker_files_stats()
RETURNS TABLE (
    total_files BIGINT,
    pending_configuration BIGINT,
    configured BIGINT,
    active BIGINT,
    inactive BIGINT,
    deleted BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_files,
        COUNT(*) FILTER (WHERE status = 'pending_configuration') as pending_configuration,
        COUNT(*) FILTER (WHERE status = 'configured') as configured,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'inactive') as inactive,
        COUNT(*) FILTER (WHERE status = 'deleted') as deleted
    FROM checker_files;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON checker_files TO authenticated;
GRANT SELECT ON configured_checker_files TO authenticated;
GRANT EXECUTE ON FUNCTION get_checker_files_stats() TO authenticated;

-- Display completion message
DO $$
BEGIN
    RAISE NOTICE 'Checker files management system setup completed successfully!';
    RAISE NOTICE 'Table: checker_files created with indexes and triggers';
    RAISE NOTICE 'View: configured_checker_files created for easy access';
    RAISE NOTICE 'Function: get_checker_files_stats() created for statistics';
    RAISE NOTICE 'Sample data inserted for testing';
END $$;
