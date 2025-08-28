const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
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
    console.log('Testing NowPayments API call...');

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
        body: JSON.stringify({
          error: 'Unable to fetch payment configuration',
          details: settingsError.message
        })
      };
    }

    const nowpaymentsApiKey = adminSettings?.wallet_settings?.nowpayments_api_key;
    if (!nowpaymentsApiKey) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'NowPayments API key not configured',
          hint: 'Set the NowPayments API key in admin panel wallet settings'
        })
      };
    }

    // Test with minimal payload
    const testPayload = {
      price_amount: 10.00,
      price_currency: 'usd',
      pay_currency: 'btc',
      order_id: `TEST_${Date.now()}`,
      order_description: 'Test payment'
    };

    console.log('Testing with payload:', JSON.stringify(testPayload, null, 2));

    try {
      // Test the NowPayments API with the provided IPN key
      const response = await fetch('https://api.nowpayments.io/v1/payment', {
        method: 'POST',
        headers: {
          'x-api-key': nowpaymentsApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('Response body:', responseText);

      if (!response.ok) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'NowPayments API test failed',
            status: response.status,
            statusText: response.statusText,
            response: responseText,
            payload: testPayload
          })
        };
      }

      // Try to parse as JSON
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { raw: responseText };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'NowPayments API test successful',
          data: {
            status: response.status,
            response: responseData,
            payload: testPayload
          }
        })
      };

    } catch (apiError) {
      console.error('API call error:', apiError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'NowPayments API call failed',
          details: apiError.message,
          payload: testPayload
        })
      };
    }

  } catch (error) {
    console.error('Test failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Test failed',
        details: error.message 
      })
    };
  }
};
