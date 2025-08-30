const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

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

    const { amount, currency, payment_processor = 'manual', usd_amount, crypto_amount, selected_currency } = body;

    // Validate required fields
    if (!amount || !currency) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Amount and currency are required' })
      };
    }

    // Validate amount (USD amount)
    if (isNaN(amount) || amount <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Amount must be a positive number' })
      };
    }

    // Check if user already has an active deposit
    const { data: existingDeposits, error: existingError } = await supabase
      .from('deposits')
      .select('id, status, created_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .eq('status', 'pending');

    if (existingError) {
      console.error('Error checking existing deposits:', existingError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Unable to check existing deposits' })
      };
    }

    if (existingDeposits && existingDeposits.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'You already have a pending deposit. Please wait for it to be confirmed or expired before creating a new one.' 
        })
      };
    }

    // Get admin wallet settings and minimum deposit amount
    const { data: adminSettings, error: settingsError } = await supabase
      .from('admin_settings')
      .select('wallet_settings, minimum_deposit_amount')
      .single();

    if (settingsError) {
      console.error('Error fetching admin settings:', settingsError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Unable to fetch wallet configuration' })
      };
    }

    const walletSettings = adminSettings?.wallet_settings || {};
    const minimumDepositAmount = adminSettings?.minimum_deposit_amount || 50.00;
    
    // Validate amount meets minimum requirement
    if (amount < minimumDepositAmount) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: `Deposit amount must be at least $${minimumDepositAmount.toFixed(2)}` 
        })
      };
    }

    // Validate currency is supported
    if (!walletSettings.currencies || !walletSettings.currencies[currency]) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Currency ${currency} is not supported` })
      };
    }

    const currencyConfig = walletSettings.currencies[currency];
    
    // Check if currency is enabled
    if (!currencyConfig.enabled) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Currency ${currency} is currently disabled` })
      };
    }

    // Get wallet address based on payment processor
    let walletAddress = '';
    let networkFee = currencyConfig.network_fee || 0;
    let expiresAt = null;
    let requiredConfirmations = currencyConfig.required_confirmations || 6;
    let timeoutAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    if (payment_processor === 'manual') {
      // For manual mode, use the configured wallet address
      walletAddress = currencyConfig.address;
      
      if (!walletAddress) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: `No wallet address configured for ${currency}` })
        };
      }

      // Set expiration time (24 hours from now)
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
    } else {
      // For other payment processors, we'll need to create a payment request
      // This is a placeholder for future integration
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Payment processor integration not yet implemented' })
      };
    }

    // Create the deposit record with enhanced information
    const depositData = {
      user_id: userId,
      amount: amount, // USD amount
      currency: currency,
      payment_processor: payment_processor,
      status: 'pending',
      wallet_address: walletAddress,
      network_fee: networkFee,
      required_confirmations: requiredConfirmations,
      expires_at: expiresAt,
      timeout_at: timeoutAt,
      is_active: true, // This will be the only active deposit for this user
      // Add new fields for better tracking
      usd_amount: usd_amount || amount,
      crypto_amount: crypto_amount || null,
      exchange_rate: crypto_amount && usd_amount ? (parseFloat(usd_amount) / parseFloat(crypto_amount)) : null
    };

    const { data: deposit, error: depositError } = await supabase
      .from('deposits')
      .insert([depositData])
      .select()
      .single();

    if (depositError) {
      console.error('Error creating deposit:', depositError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to create deposit' })
      };
    }

    // Return enhanced deposit information
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        deposit: {
          id: deposit.id,
          amount: deposit.amount, // USD amount
          currency: deposit.currency,
          status: deposit.status,
          wallet_address: deposit.wallet_address,
          network_fee: deposit.network_fee,
          required_confirmations: deposit.required_confirmations,
          expires_at: deposit.expires_at,
          timeout_at: deposit.timeout_at,
          created_at: deposit.created_at,
          usd_amount: deposit.usd_amount,
          crypto_amount: deposit.crypto_amount,
          exchange_rate: deposit.exchange_rate
        },
        instructions: walletSettings.manual_settings?.instructions || 
          `Send exactly ${crypto_amount || 'the calculated amount'} ${currency} to the address below and include your order ID in the memo/note field.`,
        message: 'Deposit created successfully. Please send the payment to the provided address.',
        summary: {
          usd_amount: amount,
          crypto_amount: crypto_amount,
          currency: currency,
          network_fee: networkFee,
          required_confirmations: requiredConfirmations,
          timeout_at: timeoutAt
        }
      })
    };

  } catch (error) {
    console.error('Create deposit API error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }
    
    if (error.name === 'TokenExpiredError') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Token expired' })
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
