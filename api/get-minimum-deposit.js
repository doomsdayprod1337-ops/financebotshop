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
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight successful' })
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get minimum deposit amount from admin settings
    const { data: adminSettings, error: settingsError } = await supabase
      .from('admin_settings')
      .select('minimum_deposit_amount')
      .single();

    if (settingsError) {
      console.error('Error fetching admin settings:', settingsError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Unable to fetch minimum deposit amount' })
      };
    }

    const minimumDepositAmount = adminSettings?.minimum_deposit_amount || 50.00;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        minimumDepositAmount: minimumDepositAmount
      })
    };

  } catch (error) {
    console.error('Error getting minimum deposit amount:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
