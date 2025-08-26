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
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight successful' })
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
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

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { telegramUsername } = body;

    if (!telegramUsername) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Telegram username is required' })
      };
    }

    // Validate telegram username format (should start with @)
    if (!telegramUsername.startsWith('@')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Telegram username must start with @' })
      };
    }

    // Check if telegram username is already taken by another user
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('telegram_username', telegramUsername)
      .neq('id', userId)
      .single();

    if (existingUser) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'This Telegram username is already linked to another account' })
      };
    }

    // Update user's telegram username
    const { data, error } = await supabase
      .from('users')
      .update({
        telegram_username: telegramUsername,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Error updating telegram username:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to sync Telegram account' })
      };
    }

    // In a real implementation, you would:
    // 1. Send a verification message to the user on Telegram
    // 2. Verify the user responds to confirm the sync
    // 3. Update the sync status accordingly

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Telegram account synced successfully! Check your Telegram for verification.',
        profile: data[0]
      })
    };

  } catch (error) {
    console.error('Telegram sync API error:', error);
    
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
