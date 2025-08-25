const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const checkTableStructure = async () => {
  try {
    console.log('🔍 Checking database table structures...\n');

    // Check users table structure
    console.log('📋 Users table structure:');
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (usersError) {
        console.error('❌ Error accessing users table:', usersError);
      } else {
        console.log('✅ Users table accessible');
        if (usersData && usersData.length > 0) {
          console.log('📊 Sample user data columns:');
          const sampleUser = usersData[0];
          Object.keys(sampleUser).forEach(key => {
            console.log(`   • ${key}: ${typeof sampleUser[key]} (${sampleUser[key]})`);
          });
        } else {
          console.log('📊 Users table is empty');
        }
      }
    } catch (error) {
      console.error('❌ Error with users table:', error);
    }

    // Check if we can insert a test user
    console.log('\n📋 Testing user creation...');
    try {
      // Try different column combinations to understand the structure
      const testCases = [
        {
          name: 'Basic user with first_name',
          data: {
            first_name: 'Test',
            email: 'test@example.com',
            password_hash: 'test_hash'
          }
        },
        {
          name: 'User with more fields',
          data: {
            first_name: 'Test',
            last_name: 'User',
            email: 'test2@example.com',
            password_hash: 'test_hash',
            role: 'user'
          }
        },
        {
          name: 'User with username',
          data: {
            first_name: 'Test',
            username: 'testuser',
            email: 'test3@example.com',
            password_hash: 'test_hash'
          }
        }
      ];

      for (const testCase of testCases) {
        console.log(`\n   Trying: ${testCase.name}`);
        try {
          const { data: insertData, error: insertError } = await supabase
            .from('users')
            .insert(testCase.data)
            .select()
            .single();

          if (insertError) {
            console.log(`   ❌ Failed: ${insertError.message}`);
          } else {
            console.log(`   ✅ Success! User ID: ${insertData.id}`);
            console.log(`   📊 Created user data:`, insertData);
            
            // Clean up - delete the test user
            await supabase
              .from('users')
              .delete()
              .eq('id', insertData.id);
            console.log(`   🧹 Test user cleaned up`);
            break; // Stop after first successful insert
          }
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('❌ Error testing user creation:', error);
    }

    // Check other tables
    const tablesToCheck = ['user_sessions', 'invites', 'referrals', 'categories', 'credit_cards', 'bots', 'cart'];
    
    for (const tableName of tablesToCheck) {
      console.log(`\n📋 Checking ${tableName} table...`);
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: Accessible`);
          if (data && data.length > 0) {
            const sample = data[0];
            console.log(`   Columns: ${Object.keys(sample).join(', ')}`);
          }
        }
      } catch (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
      }
    }

    console.log('\n🎯 Next Steps:');
    console.log('1. Review the table structures above');
    console.log('2. Update the createAdmin script to match your actual table structure');
    console.log('3. Or recreate the tables with the correct structure');

  } catch (error) {
    console.error('\n❌ Error checking table structures:', error);
  }
};

// Run the check
checkTableStructure();
