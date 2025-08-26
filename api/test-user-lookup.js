const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    };
  }

  try {
    console.log('=== TEST USER LOOKUP API START ===');
    
    // Check environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
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
          message: 'SUPABASE_URL and SUPABASE_ANON_KEY must be configured'
        })
      };
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get query parameters
    const queryParams = event.queryStringParameters || {};
    const testEmail = queryParams.email;
    const testUsername = queryParams.username;
    
    console.log('Test parameters:', { email: testEmail, username: testUsername });
    
    let results = {};
    
    // Test 1: Get all users (limited to 10 for security)
    console.log('Testing: Get all users...');
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, email, username, is_admin, status')
      .limit(10);
    
    if (allUsersError) {
      results.allUsers = { error: allUsersError.message };
    } else {
      results.allUsers = { 
        count: allUsers.length, 
        users: allUsers.map(u => ({ 
          id: u.id, 
          email: u.email, 
          username: u.username,
          is_admin: u.is_admin,
          status: u.status
        }))
      };
    }
    
    // Test 2: Look up by email if provided
    if (testEmail) {
      console.log('Testing: Look up by email...');
      const { data: emailUser, error: emailError } = await supabase
        .from('users')
        .select('*')
        .eq('email', testEmail)
        .single();
      
      if (emailError) {
        results.emailLookup = { error: emailError.message, details: emailError.details };
      } else {
        results.emailLookup = { 
          found: true, 
          user: { 
            id: emailUser.id, 
            email: emailUser.email, 
            username: emailUser.username 
          } 
        };
      }
    }
    
    // Test 3: Look up by username if provided
    if (testUsername) {
      console.log('Testing: Look up by username...');
      const { data: usernameUser, error: usernameError } = await supabase
        .from('users')
        .select('*')
        .eq('username', testUsername)
        .single();
      
      if (usernameError) {
        results.usernameLookup = { error: usernameError.message, details: usernameError.details };
      } else {
        results.usernameLookup = { 
          found: true, 
          user: { 
            id: usernameUser.id, 
            email: usernameUser.email, 
            username: usernameUser.username 
          } 
        };
      }
    }
    
    // Test 4: Check table structure
    console.log('Testing: Check table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (tableError) {
      results.tableStructure = { error: tableError.message };
    } else if (tableInfo && tableInfo.length > 0) {
      const sampleUser = tableInfo[0];
      results.tableStructure = { 
        columns: Object.keys(sampleUser),
        sampleData: {
          id: sampleUser.id,
          email: sampleUser.email,
          username: sampleUser.username
        }
      };
    }
    
    console.log('=== TEST USER LOOKUP API END ===');
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'User lookup tests completed',
        results: results,
        environment: {
          supabaseUrlExists: !!supabaseUrl,
          supabaseKeyExists: !!supabaseKey
        }
      })
    });
    
  } catch (error) {
    console.error('=== TEST USER LOOKUP API ERROR ===');
    console.error('Error details:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'User lookup test failed',
        message: error.message,
        details: error.stack
      })
    };
  }
};

