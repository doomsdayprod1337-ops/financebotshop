const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3000',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight successful' })
    };
  }

  try {
    // Verify JWT token
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'No valid authorization token provided' })
      };
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    
    if (!decoded.userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    const userId = decoded.userId;

    // Handle different HTTP methods
    switch (event.httpMethod) {
      case 'GET':
        return await getProfile(event, headers, userId);
      case 'PUT':
        return await updateProfile(event, headers, userId);
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

  } catch (error) {
    console.error('Profile API error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }
    
    if (error.name === 'TokenExpiredError') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Token expired' })
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

async function getProfile(event, headers, userId) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, username, telegram_username, referral_code, wallet_balance, role, status, is_verified, created_at, last_login')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to fetch profile' })
      };
    }

    if (!user) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        profile: user
      })
    };

  } catch (error) {
    console.error('Get profile error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch profile' })
    };
  }
}

async function updateProfile(event, headers, userId) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { email, username, telegram_username } = body;

    // Validate required fields
    if (!email || !username) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email and username are required' })
      };
    }

    // Check if email is already taken by another user
    if (email) {
      const { data: existingUser, error: emailCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .neq('id', userId)
        .single();

      if (existingUser) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Email is already taken by another user' })
        };
      }
    }

    // Check if username is already taken by another user
    if (username) {
      const { data: existingUser, error: usernameCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .neq('id', userId)
        .single();

      if (existingUser) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Username is already taken by another user' })
        };
      }
    }

    // Update user profile
    const updateData = {
      email: email.toLowerCase(),
      username,
      updated_at: new Date().toISOString()
    };

    // Only add telegram_username if it's provided
    if (telegram_username !== undefined) {
      updateData.telegram_username = telegram_username;
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Error updating profile:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to update profile' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Profile updated successfully',
        profile: data[0]
      })
    };

  } catch (error) {
    console.error('Update profile error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to update profile' })
    };
  }
}
