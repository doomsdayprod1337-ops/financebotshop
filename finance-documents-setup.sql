-- Finance Documents Table Setup
-- This table stores finance document data with the format: AN|RN|ADDRESS|CITY|STATE|ZIP|BALANCE|DOWNLOAD_LINK

CREATE TABLE IF NOT EXISTS finance_documents (
    id SERIAL PRIMARY KEY,
    account_number VARCHAR(255) NOT NULL, -- AN (obscured in user view)
    reference_number VARCHAR(255) NOT NULL, -- RN (visible to users)
    address TEXT NOT NULL, -- ADDRESS (obscured in user view)
    city VARCHAR(255) NOT NULL, -- CITY (visible to users)
    state VARCHAR(100) NOT NULL, -- STATE (visible to users)
    zip_code VARCHAR(20) NOT NULL, -- ZIP (visible to users)
    balance DECIMAL(15,2) NOT NULL, -- BALANCE (visible to users)
    download_link TEXT NOT NULL, -- DOWNLOAD_LINK (hidden from users)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_finance_docs_reference_number ON finance_documents(reference_number);
CREATE INDEX IF NOT EXISTS idx_finance_docs_city ON finance_documents(city);
CREATE INDEX IF NOT EXISTS idx_finance_docs_state ON finance_documents(state);

-- Add comment to table
COMMENT ON TABLE finance_documents IS 'Stores finance document data with obscured sensitive information for user display';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_finance_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_finance_documents_updated_at
    BEFORE UPDATE ON finance_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_finance_documents_updated_at();
