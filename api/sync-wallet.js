const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    };
  }

  // Only allow GET and POST requests
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('=== SYNC WALLET API START ===');
    
    // Check Authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    console.log('Authorization header exists:', !!authHeader);
    
    if (!authHeader) {
      console.log('No Authorization header provided');
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'No token provided',
          message: 'Authorization header is missing',
          success: false
        })
      };
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.log('Invalid Authorization format:', authHeader.substring(0, 20) + '...');
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Invalid token format',
          message: 'Authorization header must start with "Bearer "',
          success: false
        })
      };
    }

    // Extract and verify JWT token
    const token = authHeader.substring(7);
    console.log('Token extracted, length:', token.length);
    
    const jwtSecret = process.env.JWT_SECRET;
    console.log('JWT secret exists:', !!jwtSecret);
    
    if (!jwtSecret) {
      console.error('JWT_SECRET environment variable is not set!');
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Server configuration error',
          message: 'JWT secret not configured',
          success: false
        })
      };
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
      console.log('Token verified successfully:', { 
        userId: decoded.userId, 
        email: decoded.email, 
        username: decoded.username 
      });
    } catch (jwtError) {
      console.log('JWT verification failed:', jwtError.message);
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Invalid token',
          message: 'Token verification failed',
          success: false
        })
      };
    }

    // Fetch latest wallet balance from database
    console.log('Fetching latest wallet balance for user:', decoded.userId);
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('wallet_balance, username, email')
      .eq('id', decoded.userId)
      .single();

    if (userError || !user) {
      console.log('User not found in database:', userError?.message || 'No user data');
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'User not found',
          message: 'Unable to locate user in database',
          success: false
        })
      };
    }

    const walletBalance = user.wallet_balance || 0;
    console.log('Wallet balance synced from database:', walletBalance);
    console.log('=== SYNC WALLET API END ===');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Wallet balance synced successfully',
        wallet_balance: walletBalance,
        user: {
          id: decoded.userId,
          username: user.username,
          email: user.email
        }
      })
    };

  } catch (error) {
    console.error('=== SYNC WALLET API ERROR ===');
    console.error('Error details:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: 'Wallet sync failed. Please try again.',
        success: false
      })
    };
  }
};
