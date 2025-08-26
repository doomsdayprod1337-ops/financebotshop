const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async function(event, context) {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      }
    };
  }

  try {
    console.log('Debug DB: Starting database connection test...');
    
    // Log environment variables (without exposing sensitive data)
    console.log('Debug DB: Environment check:', {
      supabase_url_exists: !!process.env.SUPABASE_URL,
      supabase_key_exists: !!process.env.SUPABASE_ANON_KEY,
      supabase_url_length: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.length : 0,
      supabase_key_length: process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.length : 0
    });

    // Test 1: Basic connection
    console.log('Debug DB: Testing basic connection...');
    const { data: users, error: usersError, count } = await supabase
      .from('users')
      .select('*', { count: 'exact' });

    if (usersError) {
      console.error('Debug DB: Basic connection failed:', usersError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Database connection failed',
          details: usersError.message,
          code: usersError.code,
          hint: usersError.hint
        })
      };
    }

    console.log('Debug DB: Basic connection successful');
    console.log('Debug DB: Total users found:', count || users?.length || 0);

    // Test 2: Look up the specific user by ID
    const testUserId = 'df09d2ea-3224-47dd-9271-8ebbd686d6bc';
    console.log('Debug DB: Looking up user by ID:', testUserId);
    
    const { data: userById, error: userByIdError } = await supabase
      .from('users')
      .select('*')
      .eq('id', testUserId)
      .single();

    console.log('Debug DB: User lookup by ID result:', {
      found: !!userById,
      error: userByIdError ? userByIdError.message : null,
      user: userById ? { id: userById.id, email: userById.email, username: userById.username } : null
    });

    // Test 3: Look up the specific user by email
    const testEmail = 'doomsdayprod1337@gmail.com';
    console.log('Debug DB: Looking up user by email:', testEmail);
    
    const { data: userByEmail, error: userByEmailError } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail) // Changed back to 'email'
      .single();

    console.log('Debug DB: User lookup by email result:', {
      found: !!userByEmail,
      error: userByEmailError ? userByEmailError.message : null,
      user: userByEmail ? { id: userByEmail.id, email: userByEmail.email, username: userByEmail.username } : null
    });

    // Test 4: Check table structure
    console.log('Debug DB: Checking table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('users')
      .select('id, email, username, role, status')
      .limit(3);

    console.log('Debug DB: Table structure check:', {
      success: !tableError,
      error: tableError ? tableError.message : null,
      sample_data: tableInfo
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Database debug completed',
        environment: {
          supabase_url_set: !!process.env.SUPABASE_URL,
          supabase_key_set: !!process.env.SUPABASE_ANON_KEY
        },
        connection: {
          total_users: count || users?.length || 0,
          connection_successful: true
        },
        user_lookup: {
          by_id: {
            success: !userByIdError,
            found: !!userById,
            error: userByIdError ? userByIdError.message : null,
            user_id: testUserId
          },
          by_email: {
            success: !userByEmailError,
            found: !!userByEmail,
            error: userByEmailError ? userByEmailError.message : null,
            email: testEmail
          }
        },
        table_structure: {
          success: !tableError,
          sample_data: tableInfo
        }
      })
    };

  } catch (error) {
    console.error('Debug DB: Unexpected error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Unexpected error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};
