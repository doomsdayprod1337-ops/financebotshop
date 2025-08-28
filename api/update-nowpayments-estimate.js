const { createClient } = require('@supabase/supabase-js');

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
    const jwt = require('jsonwebtoken');
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
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (parseError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }

    const { paymentId } = body;

    // Validate required fields
    if (!paymentId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Payment ID is required' })
      };
    }

    // Get admin settings for NowPayments API key
    const { data: adminSettings, error: settingsError } = await supabase
      .from('admin_settings')
      .select('wallet_settings')
      .single();

    if (settingsError) {
      console.error('Error fetching admin settings:', settingsError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Unable to fetch payment configuration' })
      };
    }

    console.log('Admin settings found:', adminSettings);
    console.log('Wallet settings:', adminSettings?.wallet_settings);

    const nowpaymentsApiKey = adminSettings?.wallet_settings?.nowpayments_api_key;
    console.log('NowPayments API key found:', nowpaymentsApiKey ? 'YES' : 'NO');

    if (!nowpaymentsApiKey) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'NowPayments API key not configured',
          hint: 'Set the NowPayments API key in admin panel wallet settings',
          walletSettings: adminSettings?.wallet_settings
        })
      };
    }

    try {
      // Update merchant estimate using NowPayments API
      const nowpaymentsResponse = await fetch(`https://api.nowpayments.io/v1/payment/${paymentId}/update-merchant-estimate`, {
        method: 'POST',
        headers: {
          'x-api-key': nowpaymentsApiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!nowpaymentsResponse.ok) {
        const errorData = await nowpaymentsResponse.text();
        console.error('NowPayments API error:', errorData);
        throw new Error(`NowPayments API error: ${nowpaymentsResponse.status}`);
      }

      const nowpaymentsData = await nowpaymentsResponse.json();
      console.log('NowPayments estimate updated:', nowpaymentsData);

      // Update invoice status in database if needed
      const { error: updateError } = await supabase
        .from('nowpayments_invoices')
        .update({
          status: 'estimate_updated',
          updated_at: new Date().toISOString()
        })
        .eq('nowpayments_payment_id', paymentId);

      if (updateError) {
        console.error('Error updating invoice status:', updateError);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Merchant estimate updated successfully',
          data: nowpaymentsData
        })
      };

    } catch (nowpaymentsError) {
      console.error('NowPayments API error:', nowpaymentsError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to update NowPayments estimate',
          details: nowpaymentsError.message
        })
      };
    }

  } catch (error) {
    console.error('Estimate update error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
