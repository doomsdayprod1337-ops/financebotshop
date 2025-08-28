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

    const { api_key, ipn_url, ipn_secret } = body;

    // Validate required fields
    if (!api_key) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'API key is required' })
      };
    }

    console.log('Setting NowPayments API key:', api_key ? 'YES' : 'NO');
    console.log('Setting IPN URL:', ipn_url || 'Not provided');
    console.log('Setting IPN Secret:', ipn_secret ? 'YES' : 'NO');

    // Check if admin_settings table exists and has settings
    const { data: existingSettings, error: findError } = await supabase
      .from('admin_settings')
      .select('id, wallet_settings')
      .single();

    if (findError && findError.code !== 'PGRST116') {
      console.error('Error finding existing settings:', findError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Database query failed',
          details: findError.message
        })
      };
    }

    let walletSettings = {
      payment_processor: 'nowpayments',
      nowpayments_api_key: api_key,
      nowpayments_public_key: '', // Will be set later if needed
      nowpayments_ipn_url: ipn_url || '',
      nowpayments_ipn_secret: ipn_secret || '',
      currencies: {
        BTC: { enabled: true, address: '', min_amount: 0.001, max_amount: 1.0, network_fee: 0.0001 },
        LTC: { enabled: true, address: '', min_amount: 0.01, max_amount: 100.0, network_fee: 0.001 },
        ETH: { enabled: true, address: '', min_amount: 0.01, max_amount: 10.0, network_fee: 0.005 },
        USDT_TRC20: { enabled: true, address: '', min_amount: 10.0, max_amount: 10000.0, network_fee: 1.0 },
        USDT_ERC20: { enabled: true, address: '', min_amount: 10.0, max_amount: 10000.0, network_fee: 10.0 },
        XMR: { enabled: true, address: '', min_amount: 0.01, max_amount: 100.0, network_fee: 0.0001 },
        SOL: { enabled: true, address: '', min_amount: 0.1, max_amount: 1000.0, network_fee: 0.000005 }
      }
    };

    // If existing settings exist, merge with current wallet settings
    if (existingSettings && existingSettings.wallet_settings) {
      walletSettings = {
        ...existingSettings.wallet_settings,
        payment_processor: 'nowpayments',
        nowpayments_api_key: api_key,
        nowpayments_ipn_url: ipn_url || existingSettings.wallet_settings.nowpayments_ipn_url || '',
        nowpayments_ipn_secret: ipn_secret || existingSettings.wallet_settings.nowpayments_ipn_secret || ''
      };
    }

    let result;
    if (existingSettings) {
      console.log('Updating existing settings with ID:', existingSettings.id);
      // Update existing settings
      const { error: updateError } = await supabase
        .from('admin_settings')
        .update({ wallet_settings: walletSettings })
        .eq('id', existingSettings.id);

      if (updateError) {
        console.error('Database update error:', updateError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Database update failed',
            details: updateError.message
          })
        };
      }
      result = { message: 'NowPayments API key updated successfully' };
    } else {
      console.log('Creating new admin settings');
      // Create new settings with default values
      const defaultSettings = {
        maintenance_mode: false,
        registration_enabled: true,
        invite_required: true,
        max_file_size: 10,
        minimum_deposit_amount: 50.00,
        menu_options: {
          creditCards: true,
          bots: true,
          services: true,
          wiki: true,
          news: true,
          binChecker: true,
          downloads: true
        },
        bin_checker: {
          source: 'binlist',
          zylalabsApiKey: ''
        },
        wallet_settings: walletSettings
      };

      const { error: insertError } = await supabase
        .from('admin_settings')
        .insert([defaultSettings]);

      if (insertError) {
        console.error('Database insert error:', insertError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Database insert failed',
            details: insertError.message
          })
        };
      }
      result = { message: 'NowPayments API key set successfully' };
    }

    console.log('NowPayments configuration updated successfully');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        ...result,
        config: {
          api_key_set: !!api_key,
          ipn_url_set: !!ipn_url,
          ipn_secret_set: !!ipn_secret,
          payment_processor: 'nowpayments'
        }
      })
    };

  } catch (error) {
    console.error('Error setting NowPayments API key:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};
