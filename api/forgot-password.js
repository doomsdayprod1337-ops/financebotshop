const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

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
    const { email } = JSON.parse(event.body);

    // Validate input
    if (!email) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Email is required' })
      };
    }

    console.log('Forgot password request for:', email);

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, username, status')
      .eq('email', email.toLowerCase())
      .single();

    if (userError || !user) {
      // Don't reveal if user exists or not for security
      console.log('User not found for password reset:', email);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          message: 'If an account with that email exists, a password reset link has been sent.' 
        })
      };
    }

    // Check if user is active (only if status field exists)
    if (user.status && user.status !== 'active') {
      console.log('User account not active for password reset:', email, 'Status:', user.status);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          message: 'If an account with that email exists, a password reset link has been sent.' 
        })
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store reset token in database
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .upsert({
        user_id: user.id,
        token: resetToken,
        expires_at: resetTokenExpiry.toISOString(),
        created_at: new Date().toISOString()
      });

    if (tokenError) {
      console.error('Error storing reset token:', tokenError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Failed to generate reset token' })
      };
    }

    // In a real application, you would send an email here
    // For now, we'll just log the reset link
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    console.log('Password reset link generated for:', email);
    console.log('Reset link:', resetLink);
    console.log('Token expires at:', resetTokenExpiry);

    // For development/testing purposes, return the reset link
    // In production, remove this and only send via email
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Password reset link has been sent to your email',
        // Remove this in production - only for development
        resetLink: process.env.NODE_ENV !== 'production' ? resetLink : undefined
      })
    };

  } catch (error) {
    console.error('Forgot password error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: 'Failed to process password reset request' 
      })
    };
  }
};
