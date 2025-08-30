const { getSupabaseClient } = require('./supabase-client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.handler = async function(event, context) {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
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
    // Initialize Supabase client
    const supabase = getSupabaseClient();
    
    console.log('=== LOGIN API START ===');
    
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { email, username, password } = body;
    
    // Check if user provided either email or username
    const loginIdentifier = email || username;
    console.log('Login attempt for:', loginIdentifier, 'Type:', email ? 'email' : 'username');
    
    // Validate input
    if (!loginIdentifier || !password) {
      console.log('Missing login identifier or password');
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Login identifier (email or username) and password are required',
          success: false
        })
      };
    }

    // Find user by email or username
    console.log('Looking up user in database...');
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${loginIdentifier},username.eq.${loginIdentifier}`)
      .single();

    // If the OR query fails, try separate queries
    if (userError) {
      console.log('OR query failed, trying separate queries...');
      console.log('OR query error:', userError);
      
      // Try email first
      let emailResult = await supabase
        .from('users')
        .select('*')
        .eq('email', loginIdentifier)
        .single();
      
      if (emailResult.data && !emailResult.error) {
        user = emailResult.data;
        userError = null;
        console.log('User found by email');
      } else {
        // Try username
        let usernameResult = await supabase
          .from('users')
          .select('*')
          .eq('username', loginIdentifier)
          .single();
        
        if (usernameResult.data && !usernameResult.error) {
          user = usernameResult.data;
          userError = null;
          console.log('User found by username');
        } else {
          userError = usernameResult.error;
          console.log('User not found by either email or username');
        }
      }
    }

    if (userError || !user) {
      console.log('User not found:', loginIdentifier);
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Invalid credentials',
          success: false
        })
      };
    }

    console.log('User found:', { id: user.id, username: user.username, email: user.email });

    // Check if user is banned or suspended
    if (user.status && user.status !== 'active') {
      console.log('User account not active:', user.status);
      
      let errorMessage = 'Your account has been deactivated';
      let errorType = 'Account deactivated';
      
      if (user.status === 'banned') {
        errorMessage = 'Your account has been banned by an administrator. Please contact support if you believe this is an error.';
        errorType = 'Account banned';
      } else if (user.status === 'suspended') {
        errorMessage = 'Your account has been suspended by an administrator. Please contact support for more information.';
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

    // Verify password
    console.log('Verifying password...');
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      console.log('Invalid password for user:', loginIdentifier);
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Invalid credentials',
          success: false
        })
      };
    }

    console.log('Password verified successfully');

    // Determine admin status
    const isAdmin = user.is_admin || user.role === 'admin' || user.admin || false;
    console.log('Admin status:', isAdmin);

    // Create JWT token
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
    
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      is_admin: isAdmin
    };

    console.log('Creating JWT with payload:', tokenPayload);
    console.log('User ID being stored in JWT:', user.id);
    console.log('User ID type:', typeof user.id);
    
    const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '24h' });
    console.log('JWT token created successfully, length:', token.length);

    // Update last login (don't fail if this fails)
    try {
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);
      console.log('Last login updated successfully');
    } catch (updateError) {
      console.log('Failed to update last_login (non-critical):', updateError.message);
    }

    // Prepare user response
    const userResponse = {
      id: user.id,
      email: user.email,
      username: user.username,
      is_admin: isAdmin,
      wallet_balance: user.wallet_balance || 0,
      status: user.status || 'active',
      referral_code: user.referral_code,
      is_verified: user.is_verified || false,
      telegram_username: user.telegram_username,
      last_login: user.last_login
    };

    console.log('Login successful, returning user data:', userResponse);
    console.log('Wallet balance synced:', userResponse.wallet_balance);
    console.log('=== LOGIN API END ===');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Login successful',
        token: token,
        user: userResponse
      })
    };

  } catch (error) {
    console.error('=== LOGIN API ERROR ===');
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
        message: 'Login failed. Please try again.',
        success: false
      })
    };
  }
};
