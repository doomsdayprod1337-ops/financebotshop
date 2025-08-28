const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async function(event, context) {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: ''
    };
  }

  // Set CORS headers for all responses
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    const { method, path } = event;
    const pathParts = path.split('/').filter(Boolean);
    const action = pathParts[pathParts.length - 1];

    switch (method) {
      case 'GET':
        if (action === 'packages') {
          return await getInvitePackages(event);
        } else if (action === 'stats') {
          return await getUserInviteStats(event);
        } else if (action === 'tracking') {
          return await getInviteUsageTracking(event);
        } else if (action === 'purchases') {
          return await getUserInvitePurchases(event);
        } else if (action === 'overview') {
          return await getAdminInviteOverview(event);
        } else {
          return await getUserInvites(event);
        }
      
      case 'POST':
        if (action === 'purchase') {
          return await purchaseInvitePackage(event);
        } else if (action === 'generate') {
          return await generateInviteCode(event);
        } else if (action === 'validate') {
          return await validateInviteCode(event);
        } else {
          return await getUserInvites(event);
        }
      
      case 'PUT':
        if (action === 'update-package') {
          return await updateInvitePackage(event);
        } else if (action === 'cancel-invite') {
          return await cancelInvite(event);
        } else {
          return await getUserInvites(event);
        }
      
      case 'DELETE':
        if (action === 'delete-package') {
          return await deleteInvitePackage(event);
        } else {
          return await getUserInvites(event);
        }
      
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Enhanced invites API error:', error);
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

// Get user's invites with detailed tracking
async function getUserInvites(event) {
  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization header required' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify JWT and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // Get query parameters
    const queryParams = event.queryStringParameters || {};
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 20;
    const status = queryParams.status;

    let query = supabase
      .from('user_generated_invites')
      .select(`
        *,
        package:invite_packages(name, description),
        used_by_user:users!user_generated_invites_used_by_fkey(username, email, created_at)
      `, { count: 'exact' })
      .eq('inviter_id', user.id);

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Order by created_at desc
    query = query.order('created_at', { ascending: false });

    const { data: invites, error, count } = await query;

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: invites || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      })
    };
  } catch (error) {
    console.error('Error getting user invites:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get user invites' })
    };
  }
}

// Get available invite packages
async function getInvitePackages(event) {
  try {
    const { data: packages, error } = await supabase
      .from('invite_packages')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: packages || []
      })
    };
  } catch (error) {
    console.error('Error getting invite packages:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get invite packages' })
    };
  }
}

// Purchase invite package
async function purchaseInvitePackage(event) {
  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization header required' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify JWT and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { packageId, transactionId } = body;

    if (!packageId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Package ID is required' })
      };
    }

    // Call the database function to purchase the package
    const { data, error } = await supabase.rpc('purchase_invite_package', {
      user_uuid: user.id,
      package_uuid: packageId,
      transaction_id_param: transactionId || null
    });

    if (error) {
      throw error;
    }

    if (!data) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Insufficient balance or package not available' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Invite package purchased successfully'
      })
    };
  } catch (error) {
    console.error('Error purchasing invite package:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to purchase invite package' })
    };
  }
}

// Generate new invite code
async function generateInviteCode(event) {
  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization header required' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify JWT and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // Check if user has free invites remaining
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('free_invites_remaining')
      .eq('id', user.id)
      .single();

    if (userError) {
      throw userError;
    }

    if (userData.free_invites_remaining <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'No free invites remaining. Purchase a package to get more invites.' 
        })
      };
    }

    // Generate new invite code
    const { data: newInvite, error: inviteError } = await supabase
      .from('user_generated_invites')
      .insert({
        inviter_id: user.id,
        invite_code: generateRandomCode(),
        invite_type: 'free',
        status: 'active'
      })
      .select()
      .single();

    if (inviteError) {
      throw inviteError;
    }

    // Update user's free invites count
    await supabase
      .from('users')
      .update({ 
        free_invites_remaining: userData.free_invites_remaining - 1,
        total_invites_generated: userData.total_invites_generated + 1
      })
      .eq('id', user.id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: newInvite,
        message: 'Invite code generated successfully'
      })
    };
  } catch (error) {
    console.error('Error generating invite code:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to generate invite code' })
    };
  }
}

// Validate invite code (for registration)
async function validateInviteCode(event) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { inviteCode } = body;

    if (!inviteCode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invite code is required' })
      };
    }

    // Check if invite code exists and is valid
    const { data: invite, error } = await supabase
      .from('user_generated_invites')
      .select('*')
      .eq('invite_code', inviteCode)
      .eq('status', 'active')
      .single();

    if (error || !invite) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid or expired invite code' })
      };
    }

    // Check if invite has expired
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invite code has expired' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: invite,
        message: 'Invite code is valid'
      })
    };
  } catch (error) {
    console.error('Error validating invite code:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to validate invite code' })
    };
  }
}

// Get user invite statistics
async function getUserInviteStats(event) {
  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization header required' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify JWT and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // Get user stats from the view
    const { data: stats, error } = await supabase
      .from('user_invite_stats')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: stats
      })
    };
  } catch (error) {
    console.error('Error getting user invite stats:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get user invite stats' })
    };
  }
}

// Get invite usage tracking
async function getInviteUsageTracking(event) {
  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization header required' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify JWT and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // Get query parameters
    const queryParams = event.queryStringParameters || {};
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 20;

    let query = supabase
      .from('invite_usage_tracking')
      .select(`
        *,
        used_by_user:users!invite_usage_tracking_used_by_fkey(username, email, created_at)
      `, { count: 'exact' })
      .eq('inviter_id', user.id);

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Order by used_at desc
    query = query.order('used_at', { ascending: false });

    const { data: tracking, error, count } = await query;

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: tracking || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      })
    };
  } catch (error) {
    console.error('Error getting invite usage tracking:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get invite usage tracking' })
    };
  }
}

// Get user invite purchases
async function getUserInvitePurchases(event) {
  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization header required' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify JWT and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // Get query parameters
    const queryParams = event.queryStringParameters || {};
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 20;

    let query = supabase
      .from('user_invite_purchases')
      .select(`
        *,
        package:invite_packages(name, description, invite_count)
      `, { count: 'exact' })
      .eq('user_id', user.id);

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Order by purchase_date desc
    query = query.order('purchase_date', { ascending: false });

    const { data: purchases, error, count } = await query;

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: purchases || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      })
    };
  } catch (error) {
    console.error('Error getting user invite purchases:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get user invite purchases' })
    };
  }
}

// Get admin invite overview (admin only)
async function getAdminInviteOverview(event) {
  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization header required' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify JWT and check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.is_admin) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Admin access required' })
      };
    }

    // Get admin overview from the view
    const { data: overview, error } = await supabase
      .from('admin_invite_overview')
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: overview
      })
    };
  } catch (error) {
    console.error('Error getting admin invite overview:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get admin invite overview' })
    };
  }
}

// Update invite package (admin only)
async function updateInvitePackage(event) {
  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization header required' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify JWT and check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.is_admin) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Admin access required' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { packageId, updates } = body;

    if (!packageId || !updates) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Package ID and updates are required' })
      };
    }

    // Update the package
    const { data, error } = await supabase
      .from('invite_packages')
      .update(updates)
      .eq('id', packageId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Invite package updated successfully',
        data
      })
    };
  } catch (error) {
    console.error('Error updating invite package:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to update invite package' })
    };
  }
}

// Cancel invite
async function cancelInvite(event) {
  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization header required' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify JWT and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { inviteId } = body;

    if (!inviteId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invite ID is required' })
      };
    }

    // Cancel the invite (only if it's active and belongs to the user)
    const { data, error } = await supabase
      .from('user_generated_invites')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', inviteId)
      .eq('inviter_id', user.id)
      .eq('status', 'active')
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invite not found or cannot be cancelled' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Invite cancelled successfully',
        data
      })
    };
  } catch (error) {
    console.error('Error cancelling invite:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to cancel invite' })
    };
  }
}

// Delete invite package (admin only)
async function deleteInvitePackage(event) {
  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization header required' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify JWT and check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.is_admin) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Admin access required' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { packageId } = body;

    if (!packageId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Package ID is required' })
      };
    }

    // Soft delete the package (set as inactive)
    const { data, error } = await supabase
      .from('invite_packages')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', packageId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Invite package deleted successfully',
        data
      })
    };
  } catch (error) {
    console.error('Error deleting invite package:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to delete invite package' })
    };
  }
}

// Helper function to generate random invite code
function generateRandomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
