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

const checkUsersTable = async () => {
  try {
    console.log('🔍 Checking users table structure...\n');
    
    // Check if users table exists
    console.log('📋 Checking if users table exists...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'users');

    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError);
      throw tablesError;
    }

    if (!tables || tables.length === 0) {
      console.log('❌ Users table does not exist!');
      console.log('📝 You need to create the users table first.');
      return;
    }

    console.log('✅ Users table exists!');
    
    // Get table structure
    console.log('\n📋 Getting users table structure...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'users')
      .order('ordinal_position');

    if (columnsError) {
      console.error('❌ Error getting columns:', columnsError);
      throw columnsError;
    }

    console.log('📊 Users table structure:');
    console.log('┌─────────────────────┬─────────────────┬──────────┬─────────────────┐');
    console.log('│ Column Name         │ Data Type       │ Nullable │ Default         │');
    console.log('├─────────────────────┼─────────────────┼──────────┼─────────────────┤');
    
    columns.forEach(col => {
      const name = col.column_name.padEnd(19);
      const type = col.data_type.padEnd(17);
      const nullable = col.is_nullable === 'YES' ? 'YES' : 'NO';
      const nullablePadded = nullable.padEnd(10);
      const defaultValue = (col.column_default || '').padEnd(17);
      
      console.log(`│ ${name} │ ${type} │ ${nullablePadded} │ ${defaultValue} │`);
    });
    
    console.log('└─────────────────────┴─────────────────┴──────────┴─────────────────┘');

    // Check if table has any data
    console.log('\n📋 Checking if users table has any data...');
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error counting users:', countError);
    } else {
      console.log(`📊 Users table has ${count} records`);
    }

    // Try to get a sample user
    console.log('\n📋 Getting sample user data...');
    const { data: sampleUser, error: sampleError } = await supabase
      .from('users')
      .select('*')
      .limit(1)
      .single();

    if (sampleError) {
      if (sampleError.code === 'PGRST116') {
        console.log('📊 No users found in table');
      } else {
        console.error('❌ Error getting sample user:', sampleError);
      }
    } else {
      console.log('📊 Sample user data:');
      console.log(JSON.stringify(sampleUser, null, 2));
    }

  } catch (error) {
    console.error('\n❌ Failed to check users table:', error);
    console.log('\n🔍 Troubleshooting:');
    console.log('1. Check your .env file has correct Supabase credentials');
    console.log('2. Ensure you have access to the database');
    console.log('3. Verify your Supabase service role key has read permissions');
    process.exit(1);
  }
};

// Run the check
checkUsersTable();
