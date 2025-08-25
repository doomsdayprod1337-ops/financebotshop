const express = require('express');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/database');
const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check if user exists and is admin
    const { data: user, error } = await supabase
      .from('users')
      .select('id, role, is_active')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is not active' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Apply admin middleware to all routes
router.use(requireAdmin);

// Get admin dashboard stats
router.get('/stats', async (req, res) => {
  try {
    // Get total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get active users
    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get total orders (if orders table exists)
    let totalOrders = 0;
    let totalRevenue = 0;
    
    try {
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
      
      totalOrders = ordersCount || 0;

      // Get total revenue
      const { data: revenueData } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'completed');

      totalRevenue = revenueData?.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0) || 0;
    } catch (error) {
      console.log('Orders table not available:', error.message);
    }

    res.json({
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalOrders,
      totalRevenue: totalRevenue.toFixed(2)
    });

  } catch (error) {
    console.error('Error getting admin stats:', error);
    res.status(500).json({ error: 'Failed to get admin stats' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role, is_active, created_at, last_login')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json(users || []);

  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get all orders
router.get('/orders', async (req, res) => {
  try {
    let orders = [];
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, 
          order_number, 
          total_amount, 
          status, 
          created_at,
          users!inner(email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform the data to match frontend expectations
      orders = (data || []).map(order => ({
        id: order.id,
        order_number: order.order_number,
        total_amount: order.total_amount,
        status: order.status,
        created_at: order.created_at,
        user_email: order.users?.email || 'Unknown'
      }));

    } catch (error) {
      console.log('Orders table not available:', error.message);
    }

    res.json(orders);

  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// Update user status
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const { data, error } = await supabase
      .from('users')
      .update({ is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({ message: 'User status updated successfully', user: data });

  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Update user role
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Prevent changing own role
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({ message: 'User role updated successfully', user: data });

  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting own account
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get system settings
router.get('/settings', async (req, res) => {
  try {
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('*');

    if (error) {
      throw error;
    }

    // Transform settings to key-value pairs
    const settingsMap = {};
    (settings || []).forEach(setting => {
      settingsMap[setting.setting_key] = setting.setting_value;
    });

    res.json(settingsMap);

  } catch (error) {
    console.error('Error getting system settings:', error);
    res.status(500).json({ error: 'Failed to get system settings' });
  }
});

// Update system settings
router.put('/settings', async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings data' });
    }

    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error(`Error updating setting ${key}:`, error);
      }
    }

    res.json({ message: 'Settings updated successfully' });

  } catch (error) {
    console.error('Error updating system settings:', error);
    res.status(500).json({ error: 'Failed to update system settings' });
  }
});

// Get system logs (placeholder for future implementation)
router.get('/logs', async (req, res) => {
  try {
    // This would typically connect to a logging service
    // For now, return placeholder data
    res.json({
      message: 'Logs endpoint - implement logging service integration',
      recentLogs: [
        { timestamp: new Date().toISOString(), level: 'INFO', message: 'Admin panel accessed' },
        { timestamp: new Date().toISOString(), level: 'INFO', message: 'User status updated' }
      ]
    });

  } catch (error) {
    console.error('Error getting logs:', error);
    res.status(500).json({ error: 'Failed to get logs' });
  }
});

module.exports = router;
