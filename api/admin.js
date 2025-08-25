import { createClient } from '@supabase/supabasejs';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware to check if user is admin
function requireAdmin(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export default async function handler(req, res) {
  try {
    // Apply admin middleware to all routes
    requireAdmin(req, res, async () => {
      switch (req.method) {
        case 'GET':
          if (req.url.includes('/dashboard')) {
            return await handleDashboard(req, res);
          } else if (req.url.includes('/users')) {
            return await handleGetUsers(req, res);
          } else if (req.url.includes('/orders')) {
            return await handleGetOrders(req, res);
          } else if (req.url.includes('/settings')) {
            return await handleGetSettings(req, res);
          }
          break;
          
        case 'POST':
          if (req.url.includes('/users/update')) {
            return await handleUpdateUser(req, res);
          } else if (req.url.includes('/users/delete')) {
            return await handleDeleteUser(req, res);
          } else if (req.url.includes('/settings/update')) {
            return await handleUpdateSettings(req, res);
          }
          break;
          
        default:
          res.setHeader('Allow', ['GET', 'POST']);
          return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
      }
    });
  } catch (error) {
    console.error('Admin API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Dashboard Statistics
async function handleDashboard(req, res) {
  try {
    // Get total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    // Get total orders
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    // Get total revenue
    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount, status')
      .eq('status', 'completed');
    
    const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    
    // Get recent users
    const { data: recentUsers } = await supabase
      .from('users')
      .select('id, username, email, created_at, status')
      .order('created_at', { ascending: false })
      .limit(5);
    
    // Get recent orders
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id, user_id, total_amount, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    res.status(200).json({
      stats: {
        totalUsers: totalUsers || 0,
        totalOrders: totalOrders || 0,
        totalRevenue: totalRevenue.toFixed(2),
        activeUsers: recentUsers?.filter(u => u.status === 'active').length || 0
      },
      recentUsers: recentUsers || [],
      recentOrders: recentOrders || []
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
}

// Get All Users
async function handleGetUsers(req, res) {
  try {
    const { page = 1, limit = 20, search = '', status = '', role = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('users')
      .select('id, username, email, role, status, wallet_balance, total_spent, created_at, last_login')
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (search) {
      query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (role) {
      query = query.eq('role', role);
    }
    
    // Get paginated results
    const { data: users, error, count } = await query
      .range(offset, offset + limit - 1)
      .select('*', { count: 'exact' });
    
    if (error) throw error;
    
    res.status(200).json({
      users: users || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
}

// Update User
async function handleUpdateUser(req, res) {
  try {
    const { userId, updates } = req.body;
    
    if (!userId || !updates) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate updates
    const allowedUpdates = ['status', 'role', 'wallet_balance'];
    const validUpdates = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        validUpdates[key] = updates[key];
      }
    });
    
    if (Object.keys(validUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid updates provided' });
    }
    
    validUpdates.updated_at = new Date().toISOString();
    
    const { data: user, error } = await supabase
      .from('users')
      .update(validUpdates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(200).json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        wallet_balance: user.wallet_balance
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
}

// Delete User
async function handleDeleteUser(req, res) {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Check if user exists
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single();
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Prevent deleting admin users
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete admin users' });
    }
    
    // Soft delete - update status to deleted
    const { error } = await supabase
      .from('users')
      .update({ 
        status: 'deleted',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) throw error;
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
}

// Get All Orders
async function handleGetOrders(req, res) {
  try {
    const { page = 1, limit = 20, status = '', userId = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('orders')
      .select(`
        *,
        user:users!orders_user_id_fkey(username, email)
      `)
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    // Get paginated results
    const { data: orders, error, count } = await query
      .range(offset, offset + limit - 1)
      .select('*', { count: 'exact' });
    
    if (error) throw error;
    
    res.status(200).json({
      orders: orders || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
}

// Get System Settings
async function handleGetSettings(req, res) {
  try {
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('*')
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    res.status(200).json({
      settings: settings || {
        site_name: 'Genesis Market',
        maintenance_mode: false,
        registration_enabled: true,
        invite_required: true,
        referral_bonus: 10.00,
        max_invites_per_user: 5
      }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
}

// Update System Settings
async function handleUpdateSettings(req, res) {
  try {
    const { settings } = req.body;
    
    if (!settings) {
      return res.status(400).json({ error: 'Settings are required' });
    }
    
    // Validate settings
    const allowedSettings = [
      'site_name',
      'maintenance_mode',
      'registration_enabled',
      'invite_required',
      'referral_bonus',
      'max_invites_per_user'
    ];
    
    const validSettings = {};
    Object.keys(settings).forEach(key => {
      if (allowedSettings.includes(key)) {
        validSettings[key] = settings[key];
      }
    });
    
    if (Object.keys(validSettings).length === 0) {
      return res.status(400).json({ error: 'No valid settings provided' });
    }
    
    validSettings.updated_at = new Date().toISOString();
    
    // Upsert settings
    const { data: updatedSettings, error } = await supabase
      .from('system_settings')
      .upsert(validSettings)
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(200).json({
      message: 'Settings updated successfully',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
}
