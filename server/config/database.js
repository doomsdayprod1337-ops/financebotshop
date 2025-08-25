const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const createTables = async () => {
  try {
    console.log('Creating database tables...');

    // Drop existing tables if they exist to ensure clean schema
    await supabase.rpc('exec_sql', {
      sql: `
        DROP TABLE IF EXISTS 
          wallet_transactions, notifications, system_settings, 
          ticket_messages, tickets, payments, reviews, 
          cart, order_items, orders, services, bots, 
          credit_cards, products, categories, referrals, 
          invites, user_sessions, users CASCADE;
      `
    });

    // Create users table with all required columns
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(20) DEFAULT 'user',
          status VARCHAR(20) DEFAULT 'active',
          referral_code VARCHAR(20) UNIQUE,
          wallet_balance DECIMAL(10,2) DEFAULT 0.00,
          total_spent DECIMAL(10,2) DEFAULT 0.00,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_login TIMESTAMP WITH TIME ZONE,
          is_verified BOOLEAN DEFAULT false,
          two_factor_enabled BOOLEAN DEFAULT false,
          two_factor_secret VARCHAR(255),
          profile_image_url VARCHAR(500),
          country VARCHAR(100),
          timezone VARCHAR(50),
          language VARCHAR(10) DEFAULT 'en'
        );
      `
    });

    // Create user_sessions table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          token VARCHAR(500) NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          ip_address INET,
          user_agent TEXT,
          is_active BOOLEAN DEFAULT true
        );
      `
    });

    // Create invites table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS invites (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          inviter_id UUID REFERENCES users(id) ON DELETE CASCADE,
          invite_code VARCHAR(20) UNIQUE NOT NULL,
          email VARCHAR(255),
          status VARCHAR(20) DEFAULT 'pending',
          used_by UUID REFERENCES users(id),
          used_at TIMESTAMP WITH TIME ZONE,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          bonus_amount DECIMAL(10,2) DEFAULT 10.00,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    // Create referrals table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS referrals (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
          referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
          referral_code VARCHAR(20) NOT NULL,
          status VARCHAR(20) DEFAULT 'active',
          commission_earned DECIMAL(10,2) DEFAULT 0.00,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    // Create categories table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL,
          slug VARCHAR(100) UNIQUE NOT NULL,
          description TEXT,
          parent_id UUID REFERENCES categories(id),
          is_active BOOLEAN DEFAULT true,
          sort_order INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    // Create products table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS products (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          category_id UUID REFERENCES categories(id),
          price DECIMAL(10,2) NOT NULL,
          currency VARCHAR(3) DEFAULT 'USD',
          stock_quantity INTEGER DEFAULT 0,
          status VARCHAR(20) DEFAULT 'active',
          is_featured BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    // Create credit_cards table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS credit_cards (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          card_number VARCHAR(255) NOT NULL,
          card_type VARCHAR(50) NOT NULL,
          bin VARCHAR(20) NOT NULL,
          bank VARCHAR(100),
          country VARCHAR(100),
          level VARCHAR(50),
          price DECIMAL(10,2) NOT NULL,
          currency VARCHAR(3) DEFAULT 'USD',
          status VARCHAR(20) DEFAULT 'available',
          has_ssn BOOLEAN DEFAULT false,
          has_dob BOOLEAN DEFAULT false,
          has_address BOOLEAN DEFAULT false,
          has_phone BOOLEAN DEFAULT false,
          has_email BOOLEAN DEFAULT false,
          has_dl BOOLEAN DEFAULT false,
          added_date DATE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    // Create bots table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS bots (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          bot_id VARCHAR(100) UNIQUE NOT NULL,
          timestamp1 TIMESTAMP WITH TIME ZONE,
          timestamp2 TIMESTAMP WITH TIME ZONE,
          multiplier DECIMAL(5,2) DEFAULT 1.00,
          price DECIMAL(10,2) NOT NULL,
          currency VARCHAR(3) DEFAULT 'USD',
          status VARCHAR(20) DEFAULT 'available',
          system_info JSONB,
          logins JSONB,
          cookies JSONB,
          extensions JSONB,
          applications JSONB,
          passwords JSONB,
          autofill JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    // Create services table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS services (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          category VARCHAR(100),
          price DECIMAL(10,2) NOT NULL,
          currency VARCHAR(3) DEFAULT 'USD',
          status VARCHAR(20) DEFAULT 'active',
          rating DECIMAL(3,2) DEFAULT 0.00,
          review_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    // Create orders table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS orders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          order_number VARCHAR(50) UNIQUE NOT NULL,
          total_amount DECIMAL(10,2) NOT NULL,
          currency VARCHAR(3) DEFAULT 'USD',
          status VARCHAR(20) DEFAULT 'pending',
          payment_method VARCHAR(50),
          payment_status VARCHAR(20) DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    // Create order_items table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS order_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
          product_type VARCHAR(50) NOT NULL,
          product_id UUID,
          product_name VARCHAR(255) NOT NULL,
          quantity INTEGER DEFAULT 1,
          unit_price DECIMAL(10,2) NOT NULL,
          total_price DECIMAL(10,2) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    // Create cart table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS cart (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          product_type VARCHAR(50) NOT NULL,
          product_id UUID,
          product_name VARCHAR(255) NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    // Create reviews table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS reviews (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          product_id UUID,
          product_type VARCHAR(50) NOT NULL,
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          comment TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    // Create tickets table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS tickets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          subject VARCHAR(255) NOT NULL,
          status VARCHAR(20) DEFAULT 'open',
          priority VARCHAR(20) DEFAULT 'medium',
          category VARCHAR(100),
          assigned_to UUID REFERENCES users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    // Create ticket_messages table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS ticket_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          message TEXT NOT NULL,
          is_internal BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    // Create payments table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS payments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          order_id UUID REFERENCES orders(id),
          amount DECIMAL(10,2) NOT NULL,
          currency VARCHAR(3) DEFAULT 'USD',
          payment_method VARCHAR(50) NOT NULL,
          transaction_id VARCHAR(255),
          status VARCHAR(20) DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    // Create wallet_transactions table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS wallet_transactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(20) NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          balance_after DECIMAL(10,2) NOT NULL,
          description TEXT,
          reference_id UUID,
          reference_type VARCHAR(50),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    // Create notifications table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          type VARCHAR(20) DEFAULT 'info',
          is_read BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    // Create system_settings table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS system_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          setting_key VARCHAR(100) UNIQUE NOT NULL,
          setting_value TEXT,
          setting_type VARCHAR(50) DEFAULT 'string',
          description TEXT,
          is_public BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    console.log('Database tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

const insertDefaultData = async () => {
  try {
    console.log('Inserting default data...');

    // Insert default categories
    await supabase.rpc('exec_sql', {
      sql: `
        INSERT INTO categories (name, slug, description, sort_order) VALUES
        ('Credit Cards', 'credit-cards', 'Premium stolen credit card data', 1),
        ('Bot Dumps', 'bot-dumps', 'Comprehensive data from infected devices', 2),
        ('Services', 'services', 'Professional cybercrime services', 3),
        ('Software', 'software', 'Malware and hacking tools', 4)
        ON CONFLICT (slug) DO NOTHING;
      `
    });

    // Insert system settings
    await supabase.rpc('exec_sql', {
      sql: `
        INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
        ('site_name', 'Genesis Market', 'string', 'Website name', true),
        ('site_description', 'Premium marketplace for stolen credentials', 'string', 'Website description', true),
        ('maintenance_mode', 'false', 'boolean', 'Maintenance mode status', false),
        ('registration_enabled', 'true', 'boolean', 'User registration status', false),
        ('invite_required', 'true', 'boolean', 'Invite requirement for registration', false),
        ('referral_bonus', '10.00', 'decimal', 'Referral bonus amount', true),
        ('commission_rate', '0.05', 'decimal', 'Referral commission rate', true)
        ON CONFLICT (setting_key) DO NOTHING;
      `
    });

    console.log('Default data inserted successfully!');
  } catch (error) {
    console.error('Error inserting default data:', error);
    throw error;
  }
};

const createMasterAdmin = async () => {
  try {
    console.log('Creating master admin account...');
    
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash('CashOut123!@', 12);
    
    // Check if admin already exists
    const { data: existingAdmin } = await supabase
      .from('users')
      .select('id')
      .eq('username', 'DoomsdayProductions')
      .single();

    if (existingAdmin) {
      console.log('Master admin account already exists');
      return;
    }

    // Create master admin account using direct insert
    const { data: admin, error } = await supabase
      .from('users')
      .insert({
        username: 'DoomsdayProductions',
        email: 'admin@doomsdayproductions.com',
        password_hash: passwordHash,
        role: 'admin',
        status: 'active',
        referral_code: 'DOOMSADMIN',
        wallet_balance: 10000.00,
        is_verified: true,
        country: 'US',
        timezone: 'America/New_York',
        language: 'en'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating master admin:', error);
      throw error;
    }

    console.log('Master admin account created successfully!');
    console.log('Username: DoomsdayProductions');
    console.log('Password: CashOut123!@');
    console.log('Role: Admin');
    console.log('Wallet Balance: $10,000.00');

    // Create initial wallet transaction
    await supabase
      .from('wallet_transactions')
      .insert({
        user_id: admin.id,
        type: 'initial',
        amount: 10000.00,
        balance_after: 10000.00,
        description: 'Initial admin account balance',
        reference_type: 'system'
      });

  } catch (error) {
    console.error('Error creating master admin:', error);
    throw error;
  }
};

const initDatabase = async () => {
  try {
    await createTables();
    await insertDefaultData();
    await createMasterAdmin();
    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

module.exports = {
  supabase,
  initDatabase,
  createTables
};
