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

const createMasterAdmin = async () => {
  try {
    console.log('🚀 Creating master admin account...\n');
    
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash('admin', 12);
    
    // Check if admin already exists
    console.log('📋 Checking if admin account already exists...');
    const { data: existingAdmin, error: checkError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role')
      .eq('email', 'admin@admin.com')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking for existing admin:', checkError);
      throw checkError;
    }

    if (existingAdmin) {
      console.log('✅ Master admin account already exists:');
      console.log(`   Name: ${existingAdmin.first_name} ${existingAdmin.last_name}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      return;
    }

    console.log('📋 Creating new master admin account...');
    
    // Create master admin account
    const { data: admin, error: createError } = await supabase
      .from('users')
      .insert({
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@admin.com',
        password_hash: passwordHash,
        role: 'admin',
        is_active: true,
        is_verified: true,
        country: 'US',
        timezone: 'America/New_York',
        language: 'en',
        referral_code: 'ADMIN2024'
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating master admin:', createError);
      throw createError;
    }

    console.log('✅ Master admin account created successfully!');
    console.log('📊 Account Details:');
    console.log(`   Name: Admin User`);
    console.log(`   Email: admin@admin.com`);
    console.log(`   Password: admin`);
    console.log(`   Role: Admin`);
    console.log(`   User ID: ${admin.id}`);

    // Create initial wallet transaction
    console.log('📋 Creating initial wallet transaction...');
    const { error: walletError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: admin.id,
        type: 'initial',
        amount: 10000.00,
        balance_after: 10000.00,
        description: 'Initial admin account balance',
        reference_type: 'system'
      });

    if (walletError) {
      console.error('⚠️  Warning: Could not create wallet transaction:', walletError);
      console.log('   This is not critical - the admin account was created successfully.');
    } else {
      console.log('✅ Initial wallet transaction created');
    }

    console.log('\n🎉 Admin account setup completed successfully!');
    console.log('🔑 You can now login with:');
    console.log('   Email: admin@admin.com');
    console.log('   Password: admin');

  } catch (error) {
    console.error('\n❌ Failed to create master admin:', error);
    console.log('\n🔍 Troubleshooting:');
    console.log('1. Check your .env file has correct Supabase credentials');
    console.log('2. Ensure all database tables exist');
    console.log('3. Verify your Supabase service role key has write permissions');
    process.exit(1);
  }
};

// Run the admin creation
createMasterAdmin();
