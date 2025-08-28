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

    const { 
      amount, 
      currency, 
      purchaseId, 
      orderDescription, 
      customerEmail,
      payoutAddress,
      payoutCurrency 
    } = body;

    // Validate required fields
    if (!amount || !currency || !purchaseId || !orderDescription || !customerEmail) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
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
    const nowpaymentsIpnUrl = adminSettings?.wallet_settings?.nowpayments_ipn_url;
    const nowpaymentsIpnSecret = adminSettings?.wallet_settings?.nowpayments_ipn_secret;
    
    console.log('NowPayments API key found:', nowpaymentsApiKey ? 'YES' : 'NO');
    console.log('NowPayments IPN URL found:', nowpaymentsIpnUrl ? 'YES' : 'NO');
    console.log('NowPayments IPN Secret found:', nowpaymentsIpnSecret ? 'YES' : 'NO');

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

    // Generate unique invoice ID
    const invoiceId = `INV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create NowPayments invoice
    // Using the correct endpoint and payload format based on NowPayments documentation
    const nowpaymentsPayload = {
      price_amount: parseFloat(amount), // Ensure it's a number
      price_currency: 'usd', // Always USD for the price
      pay_currency: currency.toLowerCase(),
      order_id: purchaseId.toString(), // Ensure it's a string
      order_description: orderDescription.toString(), // Ensure it's a string
      ipn_callback_url: nowpaymentsIpnUrl || null, // IPN callback URL for payment notifications
      ipn_callback_url_encrypted: nowpaymentsIpnSecret ? true : false // Enable IPN encryption if secret is provided
    };

    // Validate payload before sending
    if (isNaN(nowpaymentsPayload.price_amount) || nowpaymentsPayload.price_amount <= 0) {
      throw new Error('Invalid amount: must be a positive number');
    }

    console.log('NowPayments payload:', JSON.stringify(nowpaymentsPayload, null, 2));
    console.log('Payload validation passed - sending to NowPayments API...');

    try {
      // Use the correct endpoint for creating payment requests
      // NowPayments API expects the API key in the x-api-key header
      const nowpaymentsResponse = await fetch('https://api.nowpayments.io/v1/payment', {
        method: 'POST',
        headers: {
          'x-api-key': nowpaymentsApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nowpaymentsPayload)
      });

      if (!nowpaymentsResponse.ok) {
        const errorData = await nowpaymentsResponse.text();
        console.error('NowPayments API error response:', {
          status: nowpaymentsResponse.status,
          statusText: nowpaymentsResponse.statusText,
          headers: Object.fromEntries(nowpaymentsResponse.headers.entries()),
          body: errorData
        });
        
        // Try to parse error as JSON for better error details
        let errorDetails = errorData;
        try {
          const parsedError = JSON.parse(errorData);
          errorDetails = parsedError.message || parsedError.error || errorData;
        } catch (e) {
          // Keep original error if not JSON
        }
        
        throw new Error(`NowPayments API error: ${nowpaymentsResponse.status} - ${errorDetails}`);
      }

      const nowpaymentsData = await nowpaymentsResponse.json();
      console.log('NowPayments invoice created:', nowpaymentsData);

      // Store invoice in database
      const { data: invoice, error: invoiceError } = await supabase
        .from('nowpayments_invoices')
        .insert({
          user_id: userId,
          invoice_id: invoiceId,
          purchase_id: purchaseId,
          amount: amount,
          currency: currency,
          order_description: orderDescription,
          customer_email: customerEmail,
          payout_address: payoutAddress,
          payout_currency: payoutCurrency,
          nowpayments_response: nowpaymentsData,
          nowpayments_payment_id: nowpaymentsData.payment_id || null, // Store the payment ID from response
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (invoiceError) {
        console.error('Error storing invoice:', invoiceError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to store invoice' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Invoice created successfully',
          invoice: {
            id: invoice.id,
            invoice_id: invoiceId,
            purchase_id: purchaseId,
            amount: amount,
            currency: currency,
            status: 'pending',
            payment_id: nowpaymentsData.payment_id,
            pay_address: nowpaymentsData.pay_address,
            pay_amount: nowpaymentsData.pay_amount,
            pay_currency: nowpaymentsData.pay_currency,
            nowpayments_data: nowpaymentsData
          }
        })
      };

    } catch (nowpaymentsError) {
      console.error('NowPayments API error:', nowpaymentsError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to create NowPayments invoice',
          details: nowpaymentsError.message
        })
      };
    }

  } catch (error) {
    console.error('Invoice creation error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
