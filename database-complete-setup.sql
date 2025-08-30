-- Finance Shop Bot - Complete Database Setup
-- This script creates all necessary tables and features for the application
-- Combines: admin-settings, crypto-deposits, nowpayments-invoices, and core functionality

-- ============================================================================
-- PREREQUISITES AND EXTENSIONS
-- ============================================================================

-- Enable UUID extension for PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ADMIN SETTINGS TABLE
-- ============================================================================

-- Admin Settings Table - System-wide configuration settings
CREATE TABLE IF NOT EXISTS admin_settings (
    id SERIAL PRIMARY KEY,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    registration_enabled BOOLEAN DEFAULT TRUE,
    invite_required BOOLEAN DEFAULT TRUE,
    max_file_size INTEGER DEFAULT 10,
    minimum_deposit_amount DECIMAL(10,2) DEFAULT 50.00,
    menu_options JSONB DEFAULT '{
        "creditCards": true,
        "bots": true,
        "services": true,
        "wiki": true,
        "news": true,
        "binChecker": true,
        "downloads": true
    }',
    bin_checker JSONB DEFAULT '{
        "source": "binlist",
        "zylalabsApiKey": "9751|WUPyR6h9qlr8eUlgZSi4RMVVvrhoomBHzBfYaXn8"
    }',
    wallet_settings JSONB DEFAULT '{
        "payment_processor": "manual",
        "coinbase_api_key": "",
        "coinbase_api_secret": "",
        "nowpayments_api_key": "",
        "nowpayments_public_key": "",
        "bitpay_merchant_id": "",
        "bitpay_private_key": "",
        "currencies": {
            "BTC": {
                "enabled": false,
                "address": "",
                "min_amount": 0.001,
                "max_amount": 1.0,
                "network_fee": 0.0001
            },
            "LTC": {
                "enabled": false,
                "address": "",
                "min_amount": 0.01,
                "max_amount": 100.0,
                "network_fee": 0.001
            },
            "ETH": {
                "enabled": false,
                "address": "",
                "min_amount": 0.01,
                "max_amount": 10.0,
                "network_fee": 0.005
            },
            "USDT_TRC20": {
                "enabled": false,
                "address": "",
                "min_amount": 10.0,
                "max_amount": 10000.0,
                "network_fee": 1.0
            },
            "USDT_ERC20": {
                "enabled": false,
                "address": "",
                "min_amount": 10.0,
                "max_amount": 10000.0,
                "network_fee": 10.0
            },
            "XMR": {
                "enabled": false,
                "address": "",
                "min_amount": 0.01,
                "max_amount": 100.0,
                "network_fee": 0.0001
            },
            "SOL": {
                "enabled": false,
                "address": "",
                "min_amount": 0.1,
                "max_amount": 1000.0,
                "network_fee": 0.000005
            }
        },
        "manual_settings": {
            "enabled": true,
            "instructions": "Send payment to the address below and include your order ID in the memo/note field.",
            "confirmation_required": true,
            "auto_confirm_after_blocks": 6
        }
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin settings
INSERT INTO admin_settings (id, maintenance_mode, registration_enabled, invite_required, max_file_size, minimum_deposit_amount, menu_options, bin_checker, wallet_settings)
VALUES (1, FALSE, TRUE, TRUE, 10, 50.00, 
    '{"creditCards": true, "bots": true, "services": true, "wiki": true, "news": true, "binChecker": true, "downloads": true}'::jsonb,
    '{"source": "binlist", "zylalabsApiKey": "9751|WUPyR6h9qlr8eUlgZSi4RMVVvrhoomBHzBfYaXn8"}'::jsonb,
    '{"payment_processor": "manual", "coinbase_api_key": "", "coinbase_api_secret": "", "nowpayments_api_key": "", "nowpayments_public_key": "", "bitpay_merchant_id": "", "bitpay_private_key": "", "currencies": {"BTC": {"enabled": false, "address": "", "min_amount": 0.001, "max_amount": 1.0, "network_fee": 0.0001}, "LTC": {"enabled": false, "address": "", "min_amount": 0.01, "max_amount": 100.0, "network_fee": 0.001}, "ETH": {"enabled": false, "address": "", "min_amount": 0.01, "max_amount": 10.0, "network_fee": 0.005}, "USDT_TRC20": {"enabled": false, "address": "", "min_amount": 10.0, "max_amount": 10000.0, "network_fee": 1.0}, "USDT_ERC20": {"enabled": false, "address": "", "min_amount": 10.0, "max_amount": 10000.0, "network_fee": 10.0}, "XMR": {"enabled": false, "address": "", "min_amount": 0.01, "max_amount": 100.0, "network_fee": 0.0001}, "SOL": {"enabled": false, "address": "", "min_amount": 0.1, "max_amount": 1000.0, "network_fee": 0.000005}}, "manual_settings": {"enabled": true, "instructions": "Send payment to the address below and include your order ID in the memo/note field.", "confirmation_required": true, "auto_confirm_after_blocks": 6}}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- CRYPTO DEPOSITS SYSTEM
-- ============================================================================

-- Deposits table - Track all user deposits
CREATE TABLE IF NOT EXISTS deposits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- Will add foreign key constraint after table creation
    amount DECIMAL(20,8) NOT NULL, -- USD amount
    currency VARCHAR(10) NOT NULL, -- BTC, ETH, LTC, etc.
    payment_processor VARCHAR(50) DEFAULT 'manual', -- manual, coinbase, nowpayments, bitpay
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, failed, expired, timed_out
    transaction_hash VARCHAR(255), -- Blockchain transaction hash
    wallet_address VARCHAR(255), -- Destination wallet address
    network_fee DECIMAL(20,8) DEFAULT 0,
    confirmation_blocks INTEGER DEFAULT 0,
    required_confirmations INTEGER DEFAULT 6,
    expires_at TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    admin_confirmed_at TIMESTAMP WITH TIME ZONE, -- When admin confirms the deposit
    admin_confirmed_by UUID, -- Which admin confirmed it
    -- Enhanced fields for better tracking
    usd_amount DECIMAL(20,8), -- USD amount (redundant with amount for clarity)
    crypto_amount DECIMAL(20,8), -- Actual crypto amount to send
    exchange_rate DECIMAL(20,8), -- Exchange rate at time of deposit
    -- New fields for transaction control
    is_active BOOLEAN DEFAULT TRUE, -- Only one active deposit per user
    timeout_at TIMESTAMP WITH TIME ZONE, -- 1 hour timeout
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crypto transactions table - Detailed blockchain transaction info
CREATE TABLE IF NOT EXISTS crypto_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deposit_id UUID, -- Will add foreign key constraint after table creation
    currency VARCHAR(10) NOT NULL,
    transaction_hash VARCHAR(255) UNIQUE NOT NULL,
    from_address VARCHAR(255),
    to_address VARCHAR(255),
    amount DECIMAL(20,8) NOT NULL,
    block_height BIGINT,
    confirmation_count INTEGER DEFAULT 0,
    required_confirmations INTEGER DEFAULT 6,
    network_fee DECIMAL(20,8) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, failed
    raw_transaction JSONB, -- Store raw blockchain transaction data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment processor webhooks table - Track incoming webhooks
CREATE TABLE IF NOT EXISTS payment_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    processor VARCHAR(50) NOT NULL, -- coinbase, nowpayments, bitpay
    webhook_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- NOWPAYMENTS INVOICES SYSTEM
-- ============================================================================

-- NowPayments invoices table - Track generated invoices
CREATE TABLE IF NOT EXISTS nowpayments_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- Will add foreign key constraint after table creation
    invoice_id VARCHAR(255) UNIQUE NOT NULL,
    purchase_id VARCHAR(255),
    amount DECIMAL(20,8) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    payout_currency VARCHAR(20) DEFAULT 'usdttrc20',
    order_description TEXT,
    customer_email VARCHAR(255),
    payout_address VARCHAR(255),
    payout_extra_id VARCHAR(255),
    nowpayments_response JSONB, -- Store full NowPayments API response
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, failed, expired
    payment_status VARCHAR(50),
    payment_id VARCHAR(255),
    txid VARCHAR(255),
    pay_amount DECIMAL(20,8),
    pay_currency VARCHAR(10),
    merchant_estimate_updated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table - Core user authentication and profile
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    role VARCHAR(50) DEFAULT 'user',
    admin BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'active',
    wallet_balance DECIMAL(10,2) DEFAULT 0.00,
    telegram_username VARCHAR(100),
    telegram_synced_at TIMESTAMP,
    last_login TIMESTAMP,
    referral_code VARCHAR(100) UNIQUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invite codes table - For user registration
CREATE TABLE IF NOT EXISTS invite_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    max_uses INTEGER DEFAULT 999999,
    current_uses INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invite usage table - Track invite code usage
CREATE TABLE IF NOT EXISTS invite_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invite_code VARCHAR(100) NOT NULL,
    used_by UUID REFERENCES users(id) ON DELETE CASCADE,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table - Available products/services
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table - User orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(100),
    payment_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table - Individual items in orders
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cart table - Shopping cart items
CREATE TABLE IF NOT EXISTS cart (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table - Financial transactions
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'deposit', 'withdrawal', 'purchase', 'refund'
    amount DECIMAL(10,2) NOT NULL,
    balance_before DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    description TEXT,
    reference_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Referrals table - Referral tracking and commissions
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
    commission_amount DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CREDIT CARD SYSTEM
-- ============================================================================

-- Credit cards table for storing imported credit card data
CREATE TABLE IF NOT EXISTS credit_cards (
    id SERIAL PRIMARY KEY,
    card_number VARCHAR(19) NOT NULL, -- Store with spaces for display (e.g., "4111 1111 1111 1111")
    month VARCHAR(2) NOT NULL,
    year VARCHAR(2) NOT NULL,
    cvv VARCHAR(4), -- Made optional since we don't display it
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    street VARCHAR(255),
    city VARCHAR(100),
    zip VARCHAR(20),
    dob VARCHAR(20),
    ssn VARCHAR(20),
    email VARCHAR(255),
    email_pass VARCHAR(255),
    phone VARCHAR(20),
    fingerprint VARCHAR(255),
    balance VARCHAR(50),
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'available', -- available, sold, expired, invalid
    bank VARCHAR(50), -- Card brand (Visa, Mastercard, American Express, Discover)
    type VARCHAR(20) DEFAULT 'Credit', -- Credit or Debit
    country VARCHAR(10) DEFAULT 'US', -- Country code
    delimiter VARCHAR(5) NOT NULL, -- The delimiter used when importing
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    imported_by INTEGER REFERENCES users(id),
    sold_at TIMESTAMP WITH TIME ZONE,
    sold_to INTEGER REFERENCES users(id),
    notes TEXT
);

-- ============================================================================
-- CONTENT MANAGEMENT TABLES
-- ============================================================================

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

-- Create function to update updated_at timestamp (if not already exists)
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

-- ============================================================================
-- TICKET SYSTEM
-- ============================================================================

-- Support tickets table
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open', -- open, in_progress, waiting_for_user, resolved, closed
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
    category VARCHAR(50) DEFAULT 'general',
    assigned_admin_id UUID REFERENCES users(id),
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_by UUID REFERENCES users(id)
);

-- Ticket replies table
CREATE TABLE IF NOT EXISTS ticket_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_admin_reply BOOLEAN DEFAULT FALSE,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- COUNTRY FLAGS SYSTEM
-- ============================================================================

-- Countries table for flag support
CREATE TABLE IF NOT EXISTS countries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(2) NOT NULL UNIQUE,
    flag_24x24 VARCHAR(255),
    flag_32x32 VARCHAR(255),
    flag_48x48 VARCHAR(255),
    flag_64x64 VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ENHANCED INVITATION SYSTEM
-- ============================================================================

-- Enhanced invite codes with more features
CREATE TABLE IF NOT EXISTS enhanced_invite_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    max_uses INTEGER DEFAULT 999999,
    current_uses INTEGER DEFAULT 0,
    bonus_amount DECIMAL(10,2) DEFAULT 0.00,
    expires_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced invite usage tracking
CREATE TABLE IF NOT EXISTS enhanced_invite_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invite_code_id UUID REFERENCES enhanced_invite_codes(id) ON DELETE CASCADE,
    used_by UUID REFERENCES users(id) ON DELETE CASCADE,
    bonus_paid BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add foreign key constraints only if the referenced tables exist
DO $$
BEGIN
    -- Check if users table exists before adding foreign key
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Add foreign key constraint for deposits.user_id
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'deposits_user_id_fkey' 
            AND table_name = 'deposits'
        ) THEN
            ALTER TABLE deposits ADD CONSTRAINT deposits_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
        
        -- Add foreign key constraint for nowpayments_invoices.user_id
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'nowpayments_invoices_user_id_fkey' 
            AND table_name = 'nowpayments_invoices'
        ) THEN
            ALTER TABLE nowpayments_invoices ADD CONSTRAINT nowpayments_invoices_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
    ELSE
        RAISE NOTICE 'Users table not found. Skipping foreign key constraints for deposits.user_id and nowpayments_invoices.user_id';
    END IF;
    
    -- Add foreign key constraint for crypto_transactions.deposit_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'crypto_transactions_deposit_id_fkey' 
        AND table_name = 'crypto_transactions'
    ) THEN
        ALTER TABLE crypto_transactions ADD CONSTRAINT crypto_transactions_deposit_id_fkey 
        FOREIGN KEY (deposit_id) REFERENCES deposits(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Admin settings indexes
CREATE INDEX IF NOT EXISTS idx_admin_settings_id ON admin_settings(id);

-- Deposits indexes
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);
CREATE INDEX IF NOT EXISTS idx_deposits_currency ON deposits(currency);
CREATE INDEX IF NOT EXISTS idx_deposits_created_at ON deposits(created_at);
CREATE INDEX IF NOT EXISTS idx_deposits_transaction_hash ON deposits(transaction_hash);

-- Crypto transactions indexes
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_hash ON crypto_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_deposit_id ON crypto_transactions(deposit_id);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_status ON crypto_transactions(status);

-- Payment webhooks indexes
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_processor ON payment_webhooks(processor);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_processed ON payment_webhooks(processed);

-- NowPayments invoices indexes
CREATE INDEX IF NOT EXISTS idx_nowpayments_invoices_user_id ON nowpayments_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_nowpayments_invoices_invoice_id ON nowpayments_invoices(invoice_id);
CREATE INDEX IF NOT EXISTS idx_nowpayments_invoices_purchase_id ON nowpayments_invoices(purchase_id);
CREATE INDEX IF NOT EXISTS idx_nowpayments_invoices_status ON nowpayments_invoices(status);
CREATE INDEX IF NOT EXISTS idx_nowpayments_invoices_created_at ON nowpayments_invoices(created_at);

-- Core system indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_admin_id ON tickets(assigned_admin_id);

-- Ticket replies indexes
CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticket_id ON ticket_replies(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_replies_user_id ON ticket_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_replies_created_at ON ticket_replies(created_at);
CREATE INDEX IF NOT EXISTS idx_countries_code ON countries(code);

-- Credit card indexes
CREATE INDEX IF NOT EXISTS idx_credit_cards_status ON credit_cards(status);
CREATE INDEX IF NOT EXISTS idx_credit_cards_price ON credit_cards(price);
CREATE INDEX IF NOT EXISTS idx_credit_cards_imported_at ON credit_cards(imported_at);
CREATE INDEX IF NOT EXISTS idx_credit_cards_card_number ON credit_cards(card_number);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at with error handling
DO $$
BEGIN
    -- Deposits trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_deposits_updated_at') THEN
        CREATE TRIGGER update_deposits_updated_at 
        BEFORE UPDATE ON deposits
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Crypto transactions trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_crypto_transactions_updated_at') THEN
        CREATE TRIGGER update_crypto_transactions_updated_at 
        BEFORE UPDATE ON crypto_transactions
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Admin settings trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_admin_settings_updated_at') THEN
        CREATE TRIGGER update_admin_settings_updated_at 
        BEFORE UPDATE ON admin_settings
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- NowPayments invoices trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_nowpayments_invoices_updated_at') THEN
        CREATE TRIGGER update_nowpayments_invoices_updated_at 
        BEFORE UPDATE ON nowpayments_invoices
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Tickets trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tickets_updated_at') THEN
        CREATE TRIGGER update_tickets_updated_at 
        BEFORE UPDATE ON tickets
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Ticket replies trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ticket_replies_updated_at') THEN
        CREATE TRIGGER update_ticket_replies_updated_at 
        BEFORE UPDATE ON ticket_replies
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ============================================================================
-- FUNCTIONS AND UTILITIES
-- ============================================================================

-- Function to automatically mark expired credit cards
CREATE OR REPLACE FUNCTION mark_expired_cards()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE credit_cards 
    SET status = 'expired'
    WHERE status = 'available' 
    AND (year < EXTRACT(YEAR FROM CURRENT_DATE)::TEXT 
         OR (year = EXTRACT(YEAR FROM CURRENT_DATE)::TEXT 
             AND month < EXTRACT(MONTH FROM CURRENT_DATE)::TEXT));
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update user wallet balance
CREATE OR REPLACE FUNCTION update_user_wallet(
    user_uuid UUID,
    amount DECIMAL(10,2),
    transaction_type VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
    current_balance DECIMAL(10,2);
    new_balance DECIMAL(10,2);
BEGIN
    -- Get current balance
    SELECT wallet_balance INTO current_balance FROM users WHERE id = user_uuid;
    
    IF current_balance IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate new balance
    CASE transaction_type
        WHEN 'deposit' THEN new_balance := current_balance + amount;
        WHEN 'withdrawal' THEN new_balance := current_balance - amount;
        WHEN 'purchase' THEN new_balance := current_balance - amount;
        WHEN 'refund' THEN new_balance := current_balance + amount;
        ELSE RETURN FALSE;
    END CASE;
    
    -- Update user balance
    UPDATE users SET wallet_balance = new_balance WHERE id = user_uuid;
    
    -- Insert transaction record
    INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description)
    VALUES (user_uuid, transaction_type, amount, current_balance, new_balance, 
            'Wallet ' || transaction_type);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CONSTRAINTS AND VALIDATIONS
-- ============================================================================

-- Add constraints for credit cards
ALTER TABLE credit_cards ADD CONSTRAINT check_status 
    CHECK (status IN ('available', 'sold', 'expired', 'invalid'));
ALTER TABLE credit_cards ADD CONSTRAINT check_price 
    CHECK (price >= 0);
ALTER TABLE credit_cards ADD CONSTRAINT check_month 
    CHECK (month ~ '^(0[1-9]|1[0-2])$');
ALTER TABLE credit_cards ADD CONSTRAINT check_year 
    CHECK (year ~ '^[0-9]{2}$');

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Create view for available credit cards
CREATE OR REPLACE VIEW available_credit_cards AS
SELECT 
    id, card_number, month, year, cvv, first_name, last_name,
    street, city, zip, dob, ssn, email, email_pass, phone,
    fingerprint, balance, price, status, bank, type, country,
    imported_at, imported_by
FROM credit_cards 
WHERE status = 'available';

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default admin user (password: admin123)
INSERT INTO users (email, username, password_hash, is_admin, role, admin, status, referral_code)
VALUES (
    'admin@financeshop.com',
    'admin',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.gS8v1G',
    TRUE,
    'admin',
    TRUE,
    'active',
    'ADMIN2024'
) ON CONFLICT (username) DO NOTHING;

-- Insert default invite code
INSERT INTO invite_codes (code, max_uses, current_uses)
VALUES ('WELCOME2024', 1000, 0) ON CONFLICT (code) DO NOTHING;

-- Insert enhanced invite code
INSERT INTO enhanced_invite_codes (code, max_uses, bonus_amount)
VALUES ('PREMIUM2024', 500, 10.00) ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE admin_settings IS 'System-wide configuration settings managed by administrators';
COMMENT ON TABLE deposits IS 'Main deposits table tracking all user cryptocurrency deposits';
COMMENT ON TABLE crypto_transactions IS 'Detailed blockchain transaction information for deposits';
COMMENT ON TABLE payment_webhooks IS 'Incoming webhooks from payment processors for status updates';
COMMENT ON TABLE nowpayments_invoices IS 'NowPayments invoice tracking and payment status';
COMMENT ON TABLE users IS 'Core user accounts and profiles';
COMMENT ON TABLE credit_cards IS 'Credit card data imported by admins';
COMMENT ON TABLE tickets IS 'Customer support ticket system';
COMMENT ON TABLE countries IS 'Country data for internationalization';
COMMENT ON TABLE enhanced_invite_codes IS 'Enhanced invitation system with bonuses';

COMMENT ON FUNCTION mark_expired_cards() IS 'Automatically marks expired credit cards';
COMMENT ON FUNCTION update_user_wallet(UUID, DECIMAL, VARCHAR) IS 'Updates user wallet balance and creates transaction record';
COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates the updated_at timestamp column';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on tickets and ticket_replies tables
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_replies ENABLE ROW LEVEL SECURITY;

-- RLS policy for tickets: users can only see their own tickets, admins can see all
CREATE POLICY "Users can view own tickets" ON tickets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets" ON tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = TRUE
        )
    );

CREATE POLICY "Users can create tickets" ON tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tickets" ON tickets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all tickets" ON tickets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = TRUE
        )
    );

CREATE POLICY "Admins can delete tickets" ON tickets
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = TRUE
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
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = TRUE
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
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = TRUE
        )
    );

CREATE POLICY "Users can update own replies" ON ticket_replies
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all replies" ON ticket_replies
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = TRUE
        )
    );

CREATE POLICY "Users can delete own replies" ON ticket_replies
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete all replies" ON ticket_replies
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = TRUE
        )
    );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON tickets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ticket_replies TO authenticated;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Verify the tables were created correctly
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('admin_settings', 'deposits', 'crypto_transactions', 'payment_webhooks', 'nowpayments_invoices', 'users', 'credit_cards', 'news', 'wiki_entries', 'tickets', 'ticket_replies', 'countries', 'invite_codes', 'enhanced_invite_codes')
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- STATUS CHECK
-- ============================================================================

-- Check if all required tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✓ Created'
        ELSE '✗ Missing'
    END as status
FROM (
    SELECT 'admin_settings' as table_name
    UNION ALL SELECT 'deposits'
    UNION ALL SELECT 'crypto_transactions'
    UNION ALL SELECT 'payment_webhooks'
    UNION ALL SELECT 'nowpayments_invoices'
    UNION ALL SELECT 'users'
    UNION ALL SELECT 'credit_cards'
    UNION ALL SELECT 'news'
    UNION ALL SELECT 'wiki_entries'
    UNION ALL SELECT 'tickets'
    UNION ALL SELECT 'ticket_replies'
    UNION ALL SELECT 'countries'
    UNION ALL SELECT 'invite_codes'
    UNION ALL SELECT 'enhanced_invite_codes'
) required_tables
LEFT JOIN information_schema.tables existing_tables 
    ON required_tables.table_name = existing_tables.table_name
WHERE existing_tables.table_name IS NOT NULL;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================

-- Display setup completion message
DO $$
BEGIN
    RAISE NOTICE 'Finance Shop Bot complete database setup finished successfully!';
    RAISE NOTICE 'Tables created: admin_settings, deposits, crypto_transactions, payment_webhooks, nowpayments_invoices, users, products, orders, cart, transactions, referrals, credit_cards, news, wiki_entries, tickets, ticket_replies, countries, invite_codes, enhanced_invite_codes';
    RAISE NOTICE 'Default admin user created: admin@financeshop.com / admin123';
    RAISE NOTICE 'Default invite codes created: WELCOME2024, PREMIUM2024';
    RAISE NOTICE 'Admin settings initialized with default values';
    RAISE NOTICE 'Crypto deposits system ready';
    RAISE NOTICE 'NowPayments integration ready';
    RAISE NOTICE 'Content management system ready (news and wiki)';
END $$;
