const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware to check if user is admin
async function requireAdmin(event) {
  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      throw new Error('Authentication required');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    
    if (!decoded.is_admin && decoded.role !== 'admin' && !decoded.isAdmin) {
      throw new Error('Admin access required');
    }
    
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

exports.handler = async function(event, context) {
  console.log('Admin settings function called with method:', event.httpMethod);

  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS'
      }
    };
  }

  try {
    // Check admin authentication
    const adminUser = await requireAdmin(event);
    console.log('Admin settings request from:', adminUser.email);

    if (event.httpMethod === 'GET') {
      return await getSettings();
    } else if (event.httpMethod === 'POST' || event.httpMethod === 'PUT') {
      return await updateSettings(event);
    } else {
      return {
        statusCode: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

  } catch (error) {
    console.error('Admin settings error:', error);
    
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Unauthorized', message: error.message })
      };
    }
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        details: 'Check server logs for more information'
      })
    };
  }
};

async function getSettings() {
  try {
    const { data: settings, error } = await supabase
      .from('admin_settings')
      .select('*')
      .single();

    const defaultSettings = {
      maintenanceMode: false,
      registrationEnabled: true,
      inviteRequired: true,
      maxFileSize: 10,
      minimumDepositAmount: 50.00,
      menuOptions: {
        creditCards: true,
        bots: true,
        services: true,
        wiki: true,
        news: true,
        binChecker: true,
        downloads: true
      },
      binChecker: {
        source: 'binlist',
        zylalabsApiKey: '9751|WUPyR6h9qlr8eUlgZSi4RMVVvrhoomBHzBfYaXn8'
      },
      walletSettings: {
        payment_processor: 'manual',
        coinbase_api_key: '',
        coinbase_api_secret: '',
        nowpayments_api_key: '',
        nowpayments_public_key: '',
        nowpayments_ipn_url: '',
        nowpayments_ipn_secret: '',
        bitpay_merchant_id: '',
        bitpay_private_key: '',
        currencies: {
          BTC: { enabled: false, address: '', min_amount: 0.001, max_amount: 1.0, network_fee: 0.0001 },
          LTC: { enabled: false, address: '', min_amount: 0.01, max_amount: 100.0, network_fee: 0.001 },
          ETH: { enabled: false, address: '', min_amount: 0.01, max_amount: 10.0, network_fee: 0.005 },
          USDT_TRC20: { enabled: false, address: '', min_amount: 10.0, max_amount: 10000.0, network_fee: 1.0 },
          USDT_ERC20: { enabled: false, address: '', min_amount: 10.0, max_amount: 10000.0, network_fee: 10.0 },
          XMR: { enabled: false, address: '', min_amount: 0.01, max_amount: 100.0, network_fee: 0.0001 },
          SOL: { enabled: false, address: '', min_amount: 0.1, max_amount: 1000.0, network_fee: 0.000005 }
        },
        manual_settings: {
          enabled: true,
          instructions: 'Send payment to the address below and include your order ID in the memo/note field.',
          confirmation_required: true,
          auto_confirm_after_blocks: 6
        }
      }
    };

    // Transform database fields to frontend format
    let currentSettings = defaultSettings;
    
    if (settings) {
      currentSettings = {
        maintenanceMode: settings.maintenance_mode || defaultSettings.maintenanceMode,
        registrationEnabled: settings.registration_enabled !== undefined ? settings.registration_enabled : defaultSettings.registrationEnabled,
        inviteRequired: settings.invite_required !== undefined ? settings.invite_required : defaultSettings.inviteRequired,
        maxFileSize: settings.max_file_size || defaultSettings.maxFileSize,
        minimumDepositAmount: settings.minimum_deposit_amount || defaultSettings.minimumDepositAmount,
        menuOptions: settings.menu_options || defaultSettings.menuOptions,
        binChecker: settings.bin_checker || defaultSettings.binChecker,
        walletSettings: settings.wallet_settings || defaultSettings.walletSettings
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        settings: currentSettings
      })
    };
  } catch (error) {
    console.error('Error getting settings:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to get settings'
      })
    };
  }
}

async function updateSettings(event) {
  try {
    console.log('Update settings called with body:', event.body);
    
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }
    
    const { settings } = body;
    console.log('Parsed settings:', settings);

    if (!settings) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Settings data is required' })
      };
    }

    // Validate BIN checker settings
    if (settings.binChecker) {
      if (!['binlist', 'zylalabs'].includes(settings.binChecker.source)) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: 'Invalid BIN checker source. Must be "binlist" or "zylalabs"' })
        };
      }

      if (settings.binChecker.source === 'zylalabs' && !settings.binChecker.zylalabsApiKey) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: 'ZylaLabs API key is required when using ZylaLabs source' })
        };
      }
    }

    // Validate wallet settings
    if (settings.walletSettings) {
      const validProcessors = ['manual', 'coinbase', 'nowpayments', 'bitpay'];
      if (!validProcessors.includes(settings.walletSettings.payment_processor)) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: 'Invalid payment processor. Must be "manual", "coinbase", "nowpayments", or "bitpay"' })
        };
      }

      // Validate API keys for selected processor
      if (settings.walletSettings.payment_processor === 'coinbase') {
        if (!settings.walletSettings.coinbase_api_key || !settings.walletSettings.coinbase_api_secret) {
          return {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Coinbase API key and secret are required when using Coinbase processor' })
          };
        }
      }

      if (settings.walletSettings.payment_processor === 'nowpayments') {
        if (!settings.walletSettings.nowpayments_api_key || !settings.walletSettings.nowpayments_public_key) {
          return {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'NowPayments API key and public key are required when using NowPayments processor' })
          };
        }
      }

      if (settings.walletSettings.payment_processor === 'bitpay') {
        if (!settings.walletSettings.bitpay_merchant_id || !settings.walletSettings.bitpay_private_key) {
          return {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'BitPay merchant ID and private key are required when using BitPay processor' })
          };
        }
      }
    }

    // Transform frontend fields to database format
    const dbSettings = {
      maintenance_mode: settings.maintenanceMode,
      registration_enabled: settings.registrationEnabled,
      invite_required: settings.inviteRequired,
      max_file_size: settings.maxFileSize,
      minimum_deposit_amount: settings.minimumDepositAmount,
      menu_options: settings.menuOptions,
      bin_checker: settings.binChecker,
      wallet_settings: settings.walletSettings
    };
    
    console.log('Transformed to database format:', dbSettings);

    // First, check if the admin_settings table exists and create it if it doesn't
    try {
      const { data: tableCheck, error: tableError } = await supabase
        .from('admin_settings')
        .select('id')
        .limit(1);
      
      if (tableError) {
        console.error('Table check error:', tableError);
        // If table doesn't exist, try to create it with default settings
        console.log('Attempting to create admin_settings table...');
        
        // For now, return an error asking to run the setup script
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ 
            error: 'Database table not found',
            message: 'The admin_settings table does not exist. Please run the admin-settings-setup.sql script first.',
            details: tableError.message
          })
        };
      }
    } catch (tableCheckError) {
      console.error('Table check failed:', tableCheckError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Database connection failed',
          message: 'Unable to connect to database or check table existence',
          details: tableCheckError.message
        })
      };
    }

    // Check if settings exist
    const { data: existingSettings, error: findError } = await supabase
      .from('admin_settings')
      .select('id')
      .single();

    if (findError && findError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error finding existing settings:', findError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Database query failed',
          message: 'Unable to check existing settings',
          details: findError.message
        })
      };
    }

    let result;
    if (existingSettings) {
      console.log('Updating existing settings with ID:', existingSettings.id);
      // Update existing settings
      const { error: updateError } = await supabase
        .from('admin_settings')
        .update(dbSettings)
        .eq('id', existingSettings.id);

      if (updateError) {
        console.error('Database update error:', updateError);
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ 
            error: 'Database update failed',
            message: 'Unable to update settings in database',
            details: updateError.message
          })
        };
      }
      result = { message: 'Settings updated successfully' };
    } else {
      console.log('Inserting new settings');
      // Insert new settings
      const { error: insertError } = await supabase
        .from('admin_settings')
        .insert([dbSettings]);

      if (insertError) {
        console.error('Database insert error:', insertError);
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ 
            error: 'Database insert failed',
            message: 'Unable to insert new settings into database',
            details: insertError.message
          })
        };
      }
      result = { message: 'Settings created successfully' };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        ...result
      })
    };
  } catch (error) {
    console.error('Unexpected error in updateSettings:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Unexpected error',
        message: 'An unexpected error occurred while processing the request',
        details: error.message
      })
    };
  }
}
