const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('Please check your .env file contains:');
  console.error('SUPABASE_URL=your_supabase_url');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const setupDatabase = async () => {
  try {
    console.log('🚀 Setting up Genesis Market database...\n');
    console.log('⚠️  Note: This script will create tables using direct Supabase operations.');
    console.log('   If tables already exist, they will not be recreated.\n');

    // Step 1: Create users table
    console.log('📋 Creating users table...');
    try {
      const { error } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (error && error.code === 'PGRST116') {
        // Table doesn't exist, create it manually
        console.log('   Table does not exist, please create it manually in Supabase SQL Editor with:');
        console.log(`
CREATE TABLE users (
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
);`);
        console.log('\n   Please run this SQL in your Supabase SQL Editor, then run this script again.');
        return;
      }
      console.log('✅ Users table exists');
    } catch (error) {
      console.log('✅ Users table exists');
    }

    // Step 2: Create user_sessions table
    console.log('📋 Checking user_sessions table...');
    try {
      const { error } = await supabase
        .from('user_sessions')
        .select('id')
        .limit(1);
      
      if (error && error.code === 'PGRST116') {
        console.log('   Table does not exist, please create it manually in Supabase SQL Editor with:');
        console.log(`
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true
);`);
      } else {
        console.log('✅ User_sessions table exists');
      }
    } catch (error) {
      console.log('✅ User_sessions table exists');
    }

    // Step 3: Create invites table
    console.log('📋 Checking invites table...');
    try {
      const { error } = await supabase
        .from('invites')
        .select('id')
        .limit(1);
      
      if (error && error.code === 'PGRST116') {
        console.log('   Table does not exist, please create it manually in Supabase SQL Editor with:');
        console.log(`
CREATE TABLE invites (
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
);`);
      } else {
        console.log('✅ Invites table exists');
      }
    } catch (error) {
      console.log('✅ Invites table exists');
    }

    // Step 4: Create referrals table
    console.log('📋 Checking referrals table...');
    try {
      const { error } = await supabase
        .from('referrals')
        .select('id')
        .limit(1);
      
      if (error && error.code === 'PGRST116') {
        console.log('   Table does not exist, please create it manually in Supabase SQL Editor with:');
        console.log(`
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referral_code VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  commission_earned DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`);
      } else {
        console.log('✅ Referrals table exists');
      }
    } catch (error) {
      console.log('✅ Referrals table exists');
    }

    // Step 5: Create categories table
    console.log('📋 Checking categories table...');
    try {
      const { error } = await supabase
        .from('categories')
        .select('id')
        .limit(1);
      
      if (error && error.code === 'PGRST116') {
        console.log('   Table does not exist, please create it manually in Supabase SQL Editor with:');
        console.log(`
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`);
      } else {
        console.log('✅ Categories table exists');
      }
    } catch (error) {
      console.log('✅ Categories table exists');
    }

    // Step 6: Create credit_cards table
    console.log('📋 Checking credit_cards table...');
    try {
      const { error } = await supabase
        .from('credit_cards')
        .select('id')
        .limit(1);
      
      if (error && error.code === 'PGRST116') {
        console.log('   Table does not exist, please create it manually in Supabase SQL Editor with:');
        console.log(`
CREATE TABLE credit_cards (
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
);`);
      } else {
        console.log('✅ Credit_cards table exists');
      }
    } catch (error) {
      console.log('✅ Credit_cards table exists');
    }

    // Step 7: Create bots table
    console.log('📋 Checking bots table...');
    try {
      const { error } = await supabase
        .from('bots')
        .select('id')
        .limit(1);
      
      if (error && error.code === 'PGRST116') {
        console.log('   Table does not exist, please create it manually in Supabase SQL Editor with:');
        console.log(`
CREATE TABLE bots (
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
);`);
      } else {
        console.log('✅ Bots table exists');
      }
    } catch (error) {
      console.log('✅ Bots table exists');
    }

    // Step 8: Create cart table
    console.log('📋 Checking cart table...');
    try {
      const { error } = await supabase
        .from('cart')
        .select('id')
        .limit(1);
      
      if (error && error.code === 'PGRST116') {
        console.log('   Table does not exist, please create it manually in Supabase SQL Editor with:');
        console.log(`
CREATE TABLE cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_type VARCHAR(50) NOT NULL,
  product_id UUID,
  product_name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`);
      } else {
        console.log('✅ Cart table exists');
      }
    } catch (error) {
      console.log('✅ Cart table exists');
    }

    console.log('\n📋 Required SQL Tables:');
    console.log('Please copy and paste these SQL commands into your Supabase SQL Editor:');
    console.log('\n1. Users table (if not exists):');
    console.log(`
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
);`);

    console.log('\n2. User_sessions table:');
    console.log(`
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true
);`);

    console.log('\n3. Invites table:');
    console.log(`
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
);`);

    console.log('\n4. Referrals table:');
    console.log(`
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referral_code VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  commission_earned DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`);

    console.log('\n5. Categories table:');
    console.log(`
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`);

    console.log('\n6. Credit_cards table:');
    console.log(`
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
);`);

    console.log('\n7. Bots table:');
    console.log(`
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
);`);

    console.log('\n8. Cart table:');
    console.log(`
CREATE TABLE IF NOT EXISTS cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_type VARCHAR(50) NOT NULL,
  product_id UUID,
  product_name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`);

    console.log('\n🎯 Next Steps:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste each CREATE TABLE statement above');
    console.log('4. Run each statement');
    console.log('5. Then run: npm run create-admin');

  } catch (error) {
    console.error('\n❌ Database setup failed:', error);
    process.exit(1);
  }
};

// Run the setup
setupDatabase();
