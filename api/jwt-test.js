const jwt = require('jsonwebtoken');

exports.handler = async function(event, context) {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    };
  }

  try {
    console.log('=== JWT TEST API START ===');
    
    // Check environment variables
    const jwtSecret = process.env.JWT_SECRET;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    console.log('Environment variables check:');
    console.log('- JWT_SECRET exists:', !!jwtSecret);
    console.log('- JWT_SECRET length:', jwtSecret ? jwtSecret.length : 0);
    console.log('- SUPABASE_URL exists:', !!supabaseUrl);
    console.log('- SUPABASE_ANON_KEY exists:', !!supabaseKey);
    
    if (!jwtSecret) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'JWT_SECRET not configured',
          message: 'Please check your Netlify environment variables'
        })
      };
    }
    
    // Test JWT creation and verification
    const testPayload = {
      userId: 'test-user-id',
      email: 'test@example.com',
      username: 'testuser',
      is_admin: false
    };
    
    console.log('Testing JWT creation...');
    const testToken = jwt.sign(testPayload, jwtSecret, { expiresIn: '1h' });
    console.log('Test token created, length:', testToken.length);
    
    console.log('Testing JWT verification...');
    const decoded = jwt.verify(testToken, jwtSecret);
    console.log('Test token verified successfully:', decoded);
    
    console.log('=== JWT TEST API END ===');
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'JWT test successful',
        test: {
          tokenLength: testToken.length,
          payload: testPayload,
          decoded: decoded,
          environment: {
            jwtSecretExists: !!jwtSecret,
            supabaseUrlExists: !!supabaseUrl,
            supabaseKeyExists: !!supabaseKey
          }
        }
      })
    };
    
  } catch (error) {
    console.error('=== JWT TEST API ERROR ===');
    console.error('Error details:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'JWT test failed',
        message: error.message,
        details: error.stack
      })
    };
  }
};
