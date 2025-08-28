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
    console.log('Testing NowPayments configuration...');

    // Check if admin_settings table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('admin_settings')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('Table check error:', tableError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Table access failed',
          details: tableError.message,
          hint: 'Run database setup script first'
        })
      };
    }

    console.log('Admin settings table exists, records found:', tableCheck?.length || 0);

    // Get admin settings
    const { data: adminSettings, error: settingsError } = await supabase
      .from('admin_settings')
      .select('*')
      .single();

    if (settingsError) {
      console.error('Error fetching admin settings:', settingsError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Unable to fetch admin settings',
          details: settingsError.message
        })
      };
    }

    console.log('Admin settings found:', adminSettings);

    // Check wallet_settings structure
    const walletSettings = adminSettings?.wallet_settings;
    console.log('Wallet settings:', walletSettings);

    if (!walletSettings) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'No wallet settings found',
          hint: 'Configure wallet settings in admin panel first'
        })
      };
    }

    // Check NowPayments API key
    const nowpaymentsApiKey = walletSettings.nowpayments_api_key;
    console.log('NowPayments API key found:', nowpaymentsApiKey ? 'YES' : 'NO');

    if (!nowpaymentsApiKey) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'NowPayments API key not configured',
          hint: 'Set the NowPayments API key in admin panel wallet settings',
          walletSettings: walletSettings
        })
      };
    }

    // Test NowPayments API connection
    try {
      const testResponse = await fetch('https://api.nowpayments.io/v1/status', {
        method: 'GET',
        headers: {
          'x-api-key': nowpaymentsApiKey
        }
      });

      if (!testResponse.ok) {
        const errorData = await testResponse.text();
        console.error('NowPayments API test failed:', errorData);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'NowPayments API test failed',
            status: testResponse.status,
            details: errorData
          })
        };
      }

      const testData = await testResponse.json();
      console.log('NowPayments API test successful:', testData);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'NowPayments configuration is working correctly',
          data: {
            apiKeyConfigured: true,
            apiConnection: 'SUCCESS',
            apiStatus: testData,
            walletSettings: walletSettings
          }
        })
      };

    } catch (apiTestError) {
      console.error('NowPayments API test error:', apiTestError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'NowPayments API test failed',
          details: apiTestError.message
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
