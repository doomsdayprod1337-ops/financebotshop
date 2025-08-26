const { createClient } = require('@supabase/supabase-js');

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
    console.log('=== TEST CONNECTION API START ===');
    
    // Check environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    console.log('Environment variables check:');
    console.log('- SUPABASE_URL exists:', !!supabaseUrl);
    console.log('- SUPABASE_ANON_KEY exists:', !!supabaseKey);
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Missing environment variables',
          message: 'SUPABASE_URL and SUPABASE_ANON_KEY must be configured',
          environment: {
            supabaseUrlExists: !!supabaseUrl,
            supabaseKeyExists: !!supabaseKey
          }
        })
      };
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client created');
    
    // Test basic connection
    console.log('Testing basic connection...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('Database connection test failed:', testError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Database connection failed',
          message: testError.message,
          details: testError.details,
          hint: testError.hint
        })
      };
    }
    
    console.log('Database connection test successful');
    
    // Test user table access
    console.log('Testing user table access...');
    const { data: userCount, error: userError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (userError) {
      console.error('User table access test failed:', userError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'User table access failed',
          message: userError.message,
          details: userError.details
        })
      };
    }
    
    console.log('User table access test successful');
    console.log('=== TEST CONNECTION API END ===');
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'All connection tests passed',
        tests: {
          environment: {
            supabaseUrlExists: !!supabaseUrl,
            supabaseKeyExists: !!supabaseKey
          },
          database: {
            connection: 'success',
            userTableAccess: 'success'
          }
        }
      })
    });
    
  } catch (error) {
    console.error('=== TEST CONNECTION API ERROR ===');
    console.error('Error details:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Connection test failed',
        message: error.message,
        details: error.stack
      })
    };
  }
};
