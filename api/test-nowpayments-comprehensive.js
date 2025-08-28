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
    console.log('Testing NowPayments configuration comprehensively...');

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

    console.log('Testing with API key:', nowpaymentsApiKey.substring(0, 10) + '...');

    // Test 1: Check API status
    console.log('Test 1: Checking API status...');
    let statusTest = null;
    try {
      const statusResponse = await fetch('https://api.nowpayments.io/v1/status', {
        method: 'GET',
        headers: {
          'x-api-key': nowpaymentsApiKey
        }
      });
      
      const statusText = await statusResponse.text();
      statusTest = {
        status: statusResponse.status,
        ok: statusResponse.ok,
        response: statusText
      };
      console.log('Status test result:', statusTest);
    } catch (error) {
      statusTest = { error: error.message };
      console.error('Status test failed:', error);
    }

    // Test 2: Test payment creation with minimal payload
    console.log('Test 2: Testing payment creation...');
    const testPayload = {
      price_amount: 10.00,
      price_currency: 'usd',
      pay_currency: 'btc',
      order_id: `TEST_${Date.now()}`,
      order_description: 'Test payment'
    };

    let paymentTest = null;
    try {
      const paymentResponse = await fetch('https://api.nowpayments.io/v1/payment', {
        method: 'POST',
        headers: {
          'x-api-key': nowpaymentsApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
      });

      const paymentText = await paymentResponse.text();
      paymentTest = {
        status: paymentResponse.status,
        ok: paymentResponse.ok,
        response: paymentText,
        headers: Object.fromEntries(paymentResponse.headers.entries())
      };
      console.log('Payment test result:', paymentTest);
    } catch (error) {
      paymentTest = { error: error.message };
      console.error('Payment test failed:', error);
    }

    // Test 3: Test alternative endpoint (if main one fails)
    console.log('Test 3: Testing alternative endpoint...');
    let alternativeTest = null;
    if (paymentTest && !paymentTest.ok) {
      try {
        const altResponse = await fetch('https://api.nowpayments.io/v1/invoice', {
          method: 'POST',
          headers: {
            'x-api-key': nowpaymentsApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testPayload)
        });

        const altText = await altResponse.text();
        alternativeTest = {
          status: altResponse.status,
          ok: altResponse.ok,
          response: altText
        };
        console.log('Alternative endpoint test result:', alternativeTest);
      } catch (error) {
        alternativeTest = { error: error.message };
        console.error('Alternative endpoint test failed:', error);
      }
    }

    // Compile results
    const results = {
      apiKeyConfigured: true,
      apiKeyPreview: nowpaymentsApiKey.substring(0, 10) + '...',
      tests: {
        status: statusTest,
        payment: paymentTest,
        alternative: alternativeTest
      },
      recommendations: []
    };

    // Generate recommendations
    if (statusTest && statusTest.ok) {
      results.recommendations.push('✅ API status check successful - API key is valid');
    } else {
      results.recommendations.push('❌ API status check failed - check API key validity');
    }

    if (paymentTest && paymentTest.ok) {
      results.recommendations.push('✅ Payment creation successful - main endpoint working');
    } else if (paymentTest) {
      results.recommendations.push(`❌ Payment creation failed (${paymentTest.status}) - ${paymentTest.response}`);
    }

    if (alternativeTest && alternativeTest.ok) {
      results.recommendations.push('✅ Alternative endpoint working - consider using this instead');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Comprehensive NowPayments test completed',
        data: results
      })
    };

  } catch (error) {
    console.error('Comprehensive test failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Comprehensive test failed',
        details: error.message 
      })
    };
  }
};
