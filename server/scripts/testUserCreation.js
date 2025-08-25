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

const testUserCreation = async () => {
  try {
    console.log('🧪 Testing user creation...\n');
    
    // Try to create a test user with minimal fields
    console.log('📋 Attempting to create test user...');
    
    const testUserData = {
      first_name: 'Test',
      last_name: 'User',
      email: 'test@test.com',
      password_hash: 'test_hash_123',
      role: 'user',
      is_active: true
    };

    console.log('📊 Test user data:', JSON.stringify(testUserData, null, 2));

    const { data: testUser, error: testError } = await supabase
      .from('users')
      .insert(testUserData)
      .select()
      .single();

    if (testError) {
      console.error('❌ Test user creation failed:', testError);
      console.log('\n📊 Error details:');
      console.log(`   Code: ${testError.code}`);
      console.log(`   Message: ${testError.message}`);
      console.log(`   Details: ${testError.details}`);
      console.log(`   Hint: ${testError.hint}`);
      
      // Try to get more info about the table structure
      console.log('\n🔍 Trying to get table info...');
      try {
        const { data: tableInfo, error: tableError } = await supabase
          .rpc('get_table_info', { table_name: 'users' });
        
        if (tableError) {
          console.log('❌ Could not get table info via RPC:', tableError);
        } else {
          console.log('📊 Table info:', tableInfo);
        }
      } catch (rpcErr) {
        console.log('❌ RPC call failed:', rpcErr.message);
      }
      
      return;
    }

    console.log('✅ Test user created successfully!');
    console.log('📊 Created user:', JSON.stringify(testUser, null, 2));
    
    // Clean up - delete the test user
    console.log('\n🧹 Cleaning up test user...');
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', testUser.id);
    
    if (deleteError) {
      console.error('❌ Failed to delete test user:', deleteError);
    } else {
      console.log('✅ Test user cleaned up successfully');
    }

  } catch (error) {
    console.error('\n❌ Failed to test user creation:', error);
    console.log('\n🔍 Troubleshooting:');
    console.log('1. Check your .env file has correct Supabase credentials');
    console.log('2. Ensure you have access to the database');
    console.log('3. Verify your Supabase service role key has write permissions');
    process.exit(1);
  }
};

// Run the test
testUserCreation();
