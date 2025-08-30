const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware to verify JWT token and admin status
function verifyAdminToken(headers) {
  const authHeader = headers.authorization || headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    
    if (!decoded.userId && !decoded.id) {
      throw new Error('Invalid token payload');
    }
    
    return {
      userId: decoded.userId || decoded.id,
      ...decoded
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
}

module.exports = async function(event, context) {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Verify admin token
    const decoded = verifyAdminToken(event.headers);

    // Get user data to check admin status
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('is_admin, role, admin')
      .eq('id', decoded.userId)
      .single();

    if (userError || !user) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    // Check if user is admin
    const isAdmin = user.is_admin || user.role === 'admin' || user.admin || false;
    if (!isAdmin) {
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Admin privileges required' })
      };
    }

    // Get all users with detailed information for admin view
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id, 
        email, 
        username, 
        created_at, 
        status, 
        role, 
        is_admin, 
        last_login,
        wallet_balance,
        registered_ip,
        last_ip_address
      `)
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Failed to fetch users' });
      };
    }

    // Get additional user statistics for each user
    const enhancedUsers = await Promise.all(users.map(async (user) => {
      try {
        // Get user's total deposits
        const { count: totalDeposits, error: depositsError } = await supabase
          .from('deposits')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Get user's total purchases
        const { count: totalPurchases, error: purchasesError } = await supabase
          .from('purchases')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Get user's total support tickets
        const { count: totalTickets, error: ticketsError } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Get user's total deposit amount
        const { data: deposits, error: depositAmountError } = await supabase
          .from('deposits')
          .select('amount, usd_amount')
          .eq('user_id', user.id)
          .eq('status', 'confirmed');

        const totalDepositAmount = deposits && !depositAmountError ? 
          deposits.reduce((sum, deposit) => sum + (deposit.usd_amount || deposit.amount || 0), 0) : 0;

        return {
          ...user,
          totalDeposits: totalDeposits || 0,
          totalPurchases: totalPurchases || 0,
          totalTickets: totalTickets || 0,
          totalDepositAmount: totalDepositAmount || 0,
          wallet_balance: user.wallet_balance || 0,
          registered_ip: user.registered_ip || 'N/A',
          last_ip_address: user.last_ip_address || 'N/A'
        };
      } catch (error) {
        console.error(`Error getting stats for user ${user.id}:`, error);
        return {
          ...user,
          totalDeposits: 0,
          totalPurchases: 0,
          totalTickets: 0,
          totalDepositAmount: 0,
          wallet_balance: user.wallet_balance || 0,
          registered_ip: user.registered_ip || 'N/A',
          last_ip_address: user.last_ip_address || 'N/A'
        };
      }
    }));

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Failed to fetch users' })
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
        users: enhancedUsers || [],
        count: enhancedUsers ? enhancedUsers.length : 0
      })
    };

  } catch (error) {
    console.error('Users API error:', error);
    
    if (error.message === 'No token provided') {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'No authorization token provided' })
      };
    }
    
    if (error.message === 'Token expired') {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Token has expired. Please login again.' })
      };
    }
    
    if (error.message === 'Invalid token' || error.message === 'Token verification failed' || error.message === 'Invalid token payload') {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Invalid or malformed token. Please login again.' })
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
        message: error.message 
      })
    };
  }
};
