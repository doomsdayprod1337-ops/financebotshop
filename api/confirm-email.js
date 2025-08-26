const { createClient } = require('@supabase/supabase-js');

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
    const { email, confirmationCode } = JSON.parse(event.body);

    if (!email || !confirmationCode) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3000'
        },
        body: JSON.stringify({ error: 'Email and confirmation code are required' })
      };
    }

    // Verify confirmation code
    const { data: confirmation, error: verifyError } = await supabase
      .from('email_confirmations')
      .select('*')
      .eq('email', email)
      .eq('confirmation_code', confirmationCode)
      .eq('is_used', false)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (verifyError || !confirmation) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3000'
        },
        body: JSON.stringify({ error: 'Invalid or expired confirmation code' })
      };
    }

    // Mark confirmation code as used
    const { error: updateError } = await supabase
      .from('email_confirmations')
      .update({ 
        is_used: true, 
        used_at: new Date().toISOString() 
      })
      .eq('id', confirmation.id);

    if (updateError) {
      console.error('Error updating confirmation code:', updateError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3000'
        },
        body: JSON.stringify({ error: 'Failed to process confirmation' })
      };
    }

    // Note: Welcome email functionality removed - can be re-implemented later
    // For now, just log that confirmation was successful
    console.log(`Email confirmed successfully for: ${email}`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3000'
      },
      body: JSON.stringify({
        success: true,
        message: 'Email confirmed successfully! You can now complete your registration.'
      })
    };

  } catch (error) {
    console.error('Email confirmation error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3000'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};
