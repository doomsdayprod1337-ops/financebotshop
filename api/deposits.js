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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight successful' })
    };
  }

  // Only allow GET and POST requests
  if (!['GET', 'POST'].includes(event.httpMethod)) {
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

    if (event.httpMethod === 'GET') {
      // Get deposits with optional filtering
      const { status, active, limit = 50, offset = 0 } = event.queryStringParameters || {};

      let query = supabase
        .from('deposits')
        .select(`
          id,
          amount,
          currency,
          payment_processor,
          status,
          transaction_hash,
          wallet_address,
          network_fee,
          confirmation_blocks,
          required_confirmations,
          expires_at,
          confirmed_at,
          admin_confirmed_at,
          admin_confirmed_by,
          usd_amount,
          crypto_amount,
          exchange_rate,
          is_active,
          timeout_at,
          created_at,
          updated_at
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (status) {
        if (status === 'pending') {
          query = query.eq('status', 'pending');
        } else if (status === 'confirmed') {
          query = query.eq('status', 'confirmed');
        } else if (status === 'failed') {
          query = query.eq('status', 'failed');
        } else if (status === 'expired') {
          query = query.eq('status', 'expired');
        } else if (status === 'timed_out') {
          query = query.eq('status', 'timed_out');
        }
      }

      // Apply active filter
      if (active === 'true') {
        query = query.eq('is_active', true);
      } else if (active === 'false') {
        query = query.eq('is_active', false);
      }

      // Apply pagination
      if (limit && offset) {
        query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
      }

      const { data: deposits, error } = await query;

      if (error) {
        console.error('Error fetching deposits:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to fetch deposits' })
        };
      }

      // Process deposits to add additional information
      const processedDeposits = deposits.map(deposit => {
        const depositObj = { ...deposit };
        
        // Add status information
        if (deposit.status === 'pending' && deposit.timeout_at) {
          const now = new Date();
          const timeout = new Date(deposit.timeout_at);
          if (now > timeout) {
            depositObj.status = 'timed_out';
            depositObj.is_active = false;
          }
        }
        
        // Add time remaining for pending deposits
        if (deposit.status === 'pending' && deposit.timeout_at) {
          const now = new Date();
          const timeout = new Date(deposit.timeout_at);
          const timeLeft = timeout - now;
          if (timeLeft > 0) {
            const minutes = Math.floor(timeLeft / 60000);
            const seconds = Math.floor((timeLeft % 60000) / 1000);
            depositObj.time_remaining = `${minutes}:${seconds.toString().padStart(2, '0')}`;
          } else {
            depositObj.time_remaining = 'Expired';
          }
        }
        
        return depositObj;
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          deposits: processedDeposits,
          total: processedDeposits.length,
          filters: { status, active, limit, offset }
        })
      };

    } else if (event.httpMethod === 'POST') {
      // Create new deposit (this should be handled by create-deposit.js)
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Use /api/create-deposit to create deposits' })
      };
    }

  } catch (error) {
    console.error('Deposits API error:', error);
    
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
