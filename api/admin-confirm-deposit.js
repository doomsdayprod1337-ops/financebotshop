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

    const { deposit_id, action, transaction_hash } = body;

    if (!deposit_id || !action) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Deposit ID and action are required' })
      };
    }

    // Get the deposit
    const { data: deposit, error: depositError } = await supabase
      .from('deposits')
      .select('*')
      .eq('id', deposit_id)
      .single();

    if (depositError || !deposit) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Deposit not found' })
      };
    }

    // Check if deposit has timed out
    if (deposit.timeout_at && new Date() > new Date(deposit.timeout_at)) {
      // Auto-update timed out deposits
      const { error: timeoutError } = await supabase
        .from('deposits')
        .update({
          status: 'timed_out',
          is_active: false,
          updated_at: new Date()
        })
        .eq('id', deposit_id);

      if (timeoutError) {
        console.error('Error updating timed out deposit:', timeoutError);
      }

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Deposit has timed out and cannot be confirmed' })
      };
    }

    let updateData = {
      admin_confirmed_at: new Date(),
      admin_confirmed_by: decoded.userId,
      updated_at: new Date()
    };

    if (action === 'confirm') {
      // Confirm the deposit
      updateData.status = 'confirmed';
      updateData.is_active = false;
      
      if (transaction_hash) {
        updateData.transaction_hash = transaction_hash;
      }

      // Update user's wallet balance
      const { data: userData, error: userUpdateError } = await supabase
        .from('users')
        .select('wallet_balance')
        .eq('id', deposit.user_id)
        .single();

      if (userUpdateError) {
        console.error('Error fetching user data:', userUpdateError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to update user balance' })
        };
      }

      const currentBalance = userData.wallet_balance || 0;
      const newBalance = currentBalance + parseFloat(deposit.usd_amount);

      const { error: balanceUpdateError } = await supabase
        .from('users')
        .update({ wallet_balance: newBalance })
        .eq('id', deposit.user_id);

      if (balanceUpdateError) {
        console.error('Error updating user balance:', balanceUpdateError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to update user balance' })
        };
      }

    } else if (action === 'reject') {
      // Reject the deposit
      updateData.status = 'failed';
      updateData.is_active = false;
    } else if (action === 'extend') {
      // Extend the timeout by 1 hour
      updateData.timeout_at = new Date(Date.now() + 60 * 60 * 1000);
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid action. Use: confirm, reject, or extend' })
      };
    }

    // Update the deposit
    const { data: updatedDeposit, error: updateError } = await supabase
      .from('deposits')
      .update(updateData)
      .eq('id', deposit_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating deposit:', updateError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to update deposit' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Deposit ${action}ed successfully`,
        deposit: updatedDeposit
      })
    };

  } catch (error) {
    console.error('Admin confirm deposit API error:', error);
    
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
