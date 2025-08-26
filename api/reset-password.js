const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

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
    const { token, password } = JSON.parse(event.body);

    // Validate input
    if (!token || !password) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Token and password are required' })
      };
    }

    if (password.length < 8) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Password must be at least 8 characters long' })
      };
    }

    console.log('Password reset attempt with token:', token.substring(0, 8) + '...');

    // Find the reset token
    const { data: resetToken, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !resetToken) {
      console.log('Reset token not found:', token.substring(0, 8) + '...');
      if (tokenError) {
        console.error('Token lookup error:', tokenError);
      }
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Invalid or expired reset token' })
      };
    }

    // Check if token has expired
    const now = new Date();
    const tokenExpiry = new Date(resetToken.expires_at);
    
    if (now > tokenExpiry) {
      console.log('Reset token expired for user:', resetToken.user_id);
      
      // Delete expired token
      await supabase
        .from('password_reset_tokens')
        .delete()
        .eq('token', token);

      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Reset token has expired' })
      };
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update user's password
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', resetToken.user_id);

    if (updateError) {
      console.error('Error updating password:', updateError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Failed to update password' })
      };
    }

    // Delete the used reset token
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('token', token);

    console.log('Password reset successful for user:', resetToken.user_id);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Password has been reset successfully'
      })
    };

  } catch (error) {
    console.error('Reset password error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: 'Failed to reset password' 
      })
    };
  }
};

