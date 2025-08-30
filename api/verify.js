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
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      }
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
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
    console.log('=== VERIFY API START ===');
    
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
    console.log('JWT secret length:', jwtSecret ? jwtSecret.length : 0);
    
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
      console.log('Decoded token payload:', decoded);
    } catch (jwtError) {
      console.log('JWT verification failed:', jwtError.message);
      console.log('JWT error name:', jwtError.name);
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

    // Look up user in database
    console.log('Looking up user in database...');
    console.log('Searching for user ID:', decoded.userId);
    console.log('User ID type:', typeof decoded.userId);
    console.log('User ID value:', decoded.userId);
    
    // Test database connection first
    try {
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
            error: 'Database connection error',
            message: 'Unable to connect to database',
            success: false
          })
        };
      }
      console.log('Database connection test successful');
    } catch (dbTestError) {
      console.error('Database connection test exception:', dbTestError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Database connection error',
          message: 'Database connection failed',
          success: false
        })
      };
    }
    
    // Try to find user by ID first
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, email, is_admin, role, admin, wallet_balance, telegram_username, telegram_synced_at, status, referral_code, is_verified, last_login')
      .eq('id', decoded.userId)
      .single();

    // If user not found by ID, try by email as fallback
    if (userError || !user) {
      console.log('User not found by ID, trying by email...');
      console.log('Email from token:', decoded.email);
      
      const { data: emailUser, error: emailError } = await supabase
        .from('users')
        .select('id, username, email, is_admin, role, admin, wallet_balance, telegram_username, telegram_synced_at, status, referral_code, is_verified, last_login')
        .eq('email', decoded.email)
        .single();
      
      if (emailUser && !emailError) {
        user = emailUser;
        userError = null;
        console.log('User found by email fallback');
        console.log('User ID from database:', user.id);
        console.log('User ID from token:', decoded.userId);
        console.log('IDs match:', user.id === decoded.userId);
      } else {
        console.log('User not found by email either');
        console.log('Email lookup error:', emailError);
        
        // Let's also try to find any users to see what's in the database
        console.log('Attempting to find any users in database...');
        const { data: allUsers, error: allUsersError } = await supabase
          .from('users')
          .select('id, email, username')
          .limit(5);
        
        if (allUsersError) {
          console.log('Error fetching all users:', allUsersError);
        } else if (allUsers && allUsers.length > 0) {
          console.log('Found users in database:', allUsers.map(u => ({ id: u.id, email: u.email, username: u.username })));
        } else {
          console.log('No users found in database');
        }
      }
    }

    if (userError) {
      console.log('Database query error:', userError);
      console.log('Error details:', userError.details);
      console.log('Error hint:', userError.hint);
      console.log('Error message:', userError.message);
    }
    
    if (userError || !user) {
      console.log('User not found in database:', userError?.message || 'No user data');
      console.log('Attempted to find user with ID:', decoded.userId);
      console.log('Attempted to find user with email:', decoded.email);
      
      // Return a more specific error message
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'User not found',
          message: 'Unable to locate user in database. Please try logging in again.',
          success: false,
          debug: {
            userId: decoded.userId,
            email: decoded.email,
            error: userError?.message,
            tokenPayload: decoded
          }
        })
      };
    }

    console.log('User found in database:', { 
      id: user.id, 
      username: user.username, 
      email: user.email 
    });

    // Check if user is banned or suspended
    if (user.status && user.status !== 'active') {
      console.log('User account not active:', user.status);
      
      let errorMessage = 'Your account has been deactivated';
      let errorType = 'Account deactivated';
      
      if (user.status === 'banned') {
        errorMessage = 'Your account has been banned by an administrator';
        errorType = 'Account banned';
      } else if (user.status === 'suspended') {
        errorMessage = 'Your account has been suspended by an administrator';
        errorType = 'Account suspended';
      }
      
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: errorType,
          message: errorMessage,
          status: user.status,
          success: false
        })
      };
    }

    // Determine admin status
    const isAdmin = user.is_admin || user.role === 'admin' || user.admin || false;
    console.log('Admin status determined:', isAdmin);

    // Prepare user response
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      is_admin: isAdmin,
      wallet_balance: user.wallet_balance || 0,
      telegram_username: user.telegram_username,
      telegram_synced_at: user.telegram_synced_at,
      status: user.status || 'active',
      referral_code: user.referral_code,
      is_verified: user.is_verified || false,
      last_login: user.last_login
    };

    console.log('Token verification successful for user:', user.username);
    console.log('Wallet balance synced:', userResponse.wallet_balance);
    console.log('=== VERIFY API END ===');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Token verified successfully',
        user: userResponse
      })
    };

  } catch (error) {
    console.error('=== VERIFY API ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: 'Token verification failed',
        success: false
      })
    };
  }
};
