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

const simpleCheck = async () => {
  try {
    console.log('🔍 Simple database check...\n');
    
    // Test basic connection
    console.log('📋 Testing basic connection...');
    const { data: healthData, error: healthError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (healthError) {
      console.error('❌ Database connection error:', healthError);
      console.log('\n🔍 This suggests:');
      console.log('1. The users table might not exist');
      console.log('2. There might be permission issues');
      console.log('3. The table structure might be different');
      
      // Try to create a simple test user to see what error we get
      console.log('\n📋 Trying to create a test user to see the exact error...');
      try {
        const { data: testUser, error: testError } = await supabase
          .from('users')
          .insert({
            first_name: 'Test',
            last_name: 'User',
            email: 'test@test.com',
            password_hash: 'test_hash',
            role: 'user',
            is_active: true
          })
          .select()
          .single();

        if (testError) {
          console.error('❌ Test user creation error:', testError);
          console.log('\n📊 Error details:');
          console.log(`   Code: ${testError.code}`);
          console.log(`   Message: ${testError.message}`);
          console.log(`   Details: ${testError.details}`);
          console.log(`   Hint: ${testError.hint}`);
        }
      } catch (testErr) {
        console.error('❌ Exception during test:', testErr);
      }
      
      return;
    }

    console.log('✅ Database connection successful!');
    console.log('📊 Users table exists and is accessible');

  } catch (error) {
    console.error('\n❌ Failed to check database:', error);
    console.log('\n🔍 Troubleshooting:');
    console.log('1. Check your .env file has correct Supabase credentials');
    console.log('2. Ensure you have access to the database');
    console.log('3. Verify your Supabase service role key has read permissions');
    process.exit(1);
  }
};

// Run the check
simpleCheck();
