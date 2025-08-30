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
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3000',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3000'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('=== SEND EMAIL VERIFICATION API START ===');
    
    // Check Authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    console.log('Authorization header exists:', !!authHeader);
    
    if (!authHeader) {
      console.log('No Authorization header provided');
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3000'
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
          'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3000'
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
          'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3000'
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
          'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3000'
        },
        body: JSON.stringify({ 
          error: 'Invalid token',
          message: 'Token verification failed',
          success: false
        })
      };
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3000'
        },
        body: JSON.stringify({ 
          error: 'Invalid request body',
          message: 'Request body must be valid JSON',
          success: false
        })
      };
    }

    const { email } = requestBody;

    if (!email) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3000'
        },
        body: JSON.stringify({ 
          error: 'Email is required',
          message: 'Please provide an email address',
          success: false
        })
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3000'
        },
        body: JSON.stringify({ 
          error: 'Invalid email format',
          message: 'Please provide a valid email address',
          success: false
        })
      };
    }

    // Check if user exists and is authorized
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, username, is_verified, status')
      .eq('email', email)
      .single();

    if (userError || !user) {
      console.log('User not found:', userError?.message || 'No user data');
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3000'
        },
        body: JSON.stringify({ 
          error: 'User not found',
          message: 'No account found with this email address',
          success: false
        })
      };
    }

    // Check if user is banned or suspended
    if (user.status && user.status !== 'active') {
      console.log('User account not active:', user.status);
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3000'
        },
        body: JSON.stringify({ 
          error: 'Account not active',
          message: 'Your account has been deactivated',
          success: false
        })
      };
    }

    // Check if user is already verified
    if (user.is_verified) {
      console.log('User already verified:', user.email);
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3000'
        },
        body: JSON.stringify({ 
          error: 'Already verified',
          message: 'This email is already verified',
          success: false
        })
      };
    }

    // Check if there's a recent verification code (rate limiting)
    const { data: recentCodes, error: recentError } = await supabase
      .from('email_confirmations')
      .select('created_at')
      .eq('email', email)
      .eq('is_used', false)
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // 5 minutes ago
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentError) {
      console.error('Error checking recent codes:', recentError);
    } else if (recentCodes && recentCodes.length > 0) {
      const lastCodeTime = new Date(recentCodes[0].created_at);
      const timeDiff = Date.now() - lastCodeTime.getTime();
      const minutesRemaining = Math.ceil((5 * 60 * 1000 - timeDiff) / (60 * 1000));
      
      return {
        statusCode: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3000'
        },
        body: JSON.stringify({ 
          error: 'Rate limited',
          message: `Please wait ${minutesRemaining} minutes before requesting another verification code`,
          success: false,
          retryAfter: minutesRemaining * 60
        })
      };
    }

    // Generate verification code (6 digits)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    console.log('Generated verification code for:', email);
    console.log('Code expires at:', expiresAt.toISOString());

    // Store verification code in database
    const { data: confirmation, error: insertError } = await supabase
      .from('email_confirmations')
      .insert({
        email: email,
        confirmation_code: verificationCode,
        expires_at: expiresAt.toISOString(),
        is_used: false,
        user_id: user.id
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing verification code:', insertError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3000'
        },
        body: JSON.stringify({ 
          error: 'Failed to generate verification code',
          message: 'Unable to create verification code. Please try again.',
          success: false
        })
      };
    }

    // TODO: Send email with verification code
    // This would typically integrate with an email service like SendGrid, AWS SES, etc.
    // For now, we'll just log the code and return success
    console.log('=== EMAIL VERIFICATION CODE ===');
    console.log(`Email: ${email}`);
    console.log(`Code: ${verificationCode}`);
    console.log(`Expires: ${expiresAt.toISOString()}`);
    console.log('=== END EMAIL VERIFICATION CODE ===');

    // In production, you would send an actual email here
    // Example with SendGrid:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const msg = {
      to: email,
      from: process.env.FROM_EMAIL,
      subject: 'Verify Your Email Address',
      html: `
        <h2>Email Verification</h2>
        <p>Your verification code is: <strong>${verificationCode}</strong></p>
        <p>This code will expire in 15 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      `
    };
    
    try {
      await sgMail.send(msg);
      console.log('Verification email sent successfully');
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Don't fail the request if email fails, just log it
    }
    */

    console.log('=== SEND EMAIL VERIFICATION API END ===');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3000'
      },
      body: JSON.stringify({
        success: true,
        message: 'Verification code sent successfully',
        email: email,
        expiresAt: expiresAt.toISOString(),
        note: 'Check your email for the verification code'
      })
    };

  } catch (error) {
    console.error('=== SEND EMAIL VERIFICATION API ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3000'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: 'Failed to send verification code',
        success: false
      })
    };
  }
};
