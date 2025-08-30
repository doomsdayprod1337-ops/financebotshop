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

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('is_admin, role')
      .eq('id', decoded.userId)
      .single();

    if (userError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    if (!user.is_admin && user.role !== 'admin') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Admin access required' })
      };
    }

    // Get query parameters for filtering
    const { status, limit, sort_by, sort_order } = event.queryStringParameters || {};
    
    // Build the query for pending deposits
    let query = supabase
      .from('deposits')
      .select(`
        id,
        amount,
        usd_amount,
        crypto_amount,
        selected_currency,
        wallet_address,
        transaction_hash,
        status,
        payment_method,
        created_at,
        updated_at,
        timeout_at,
        is_active,
        user_id,
        users!inner(
          id,
          username,
          email,
          first_name,
          last_name,
          created_at
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    } else {
      // Default to pending deposits
      query = query.eq('status', 'pending');
    }

    // Apply sorting
    if (sort_by) {
      const order = sort_order === 'desc' ? { ascending: false } : { ascending: true };
      query = query.order(sort_by, order);
    }

    // Apply limit if provided
    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data: deposits, error } = await query;

    if (error) {
      console.error('Error fetching pending deposits:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to fetch pending deposits' })
      };
    }

    // Process deposits to add additional information
    const processedDeposits = deposits.map(deposit => {
      const now = new Date();
      const timeoutAt = new Date(deposit.timeout_at);
      const timeRemaining = Math.max(0, timeoutAt - now);
      const isExpired = timeRemaining <= 0;
      
      // Calculate time remaining in human-readable format
      const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
      
      let timeRemainingText = '';
      if (hours > 0) {
        timeRemainingText = `${hours}h ${minutes}m ${seconds}s`;
      } else if (minutes > 0) {
        timeRemainingText = `${minutes}m ${seconds}s`;
      } else {
        timeRemainingText = `${seconds}s`;
      }

      // Generate transaction link based on currency
      let transactionLink = null;
      if (deposit.transaction_hash) {
        switch (deposit.selected_currency.toLowerCase()) {
          case 'btc':
            transactionLink = `https://blockchain.info/tx/${deposit.transaction_hash}`;
            break;
          case 'eth':
            transactionLink = `https://etherscan.io/tx/${deposit.transaction_hash}`;
            break;
          case 'ltc':
            transactionLink = `https://live.blockcypher.com/ltc/tx/${deposit.transaction_hash}`;
            break;
          case 'doge':
            transactionLink = `https://dogechain.info/tx/${deposit.transaction_hash}`;
            break;
          case 'bch':
            transactionLink = `https://blockchair.com/bitcoin-cash/transaction/${deposit.transaction_hash}`;
            break;
          default:
            transactionLink = `https://blockchain.info/tx/${deposit.transaction_hash}`;
        }
      }

      return {
        ...deposit,
        time_remaining: timeRemaining,
        time_remaining_text: timeRemainingText,
        is_expired: isExpired,
        transaction_link: transactionLink,
        urgency_level: isExpired ? 'expired' : timeRemaining < 300000 ? 'critical' : timeRemaining < 900000 ? 'warning' : 'normal' // 5min, 15min thresholds
      };
    });

    // Get summary statistics
    const totalPending = processedDeposits.length;
    const expiredCount = processedDeposits.filter(d => d.is_expired).length;
    const criticalCount = processedDeposits.filter(d => d.urgency_level === 'critical').length;
    const warningCount = processedDeposits.filter(d => d.urgency_level === 'warning').length;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        deposits: processedDeposits,
        summary: {
          total_pending: totalPending,
          expired: expiredCount,
          critical: criticalCount,
          warning: warningCount,
          normal: totalPending - expiredCount - criticalCount - warningCount
        },
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Admin pending deposits API error:', error);
    
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
