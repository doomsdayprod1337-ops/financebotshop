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
  console.log('Admin stats function called with method:', event.httpMethod);

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

  // Only allow GET requests
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
    // Check admin authentication
    const adminUser = await requireAdmin(event);

    console.log('Admin stats request from:', adminUser.email);

    // Get total users
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (usersError) {
      console.error('Error counting users:', usersError);
      throw usersError;
    }

    // Get active users
    const { data: activeUsers, error: activeError } = await supabase
      .from('users')
      .select('id')
      .eq('status', 'active');

    if (activeError) {
      console.error('Error getting active users:', activeError);
      throw activeError;
    }

    // Get recent users
    const { data: recentUsers, error: recentError } = await supabase
      .from('users')
      .select('id, username, email, created_at, status, role')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) {
      console.error('Error getting recent users:', recentError);
      throw recentError;
    }

    // Get user statistics by role
    const { data: roleStats, error: roleError } = await supabase
      .from('users')
      .select('role, status');

    if (roleError) {
      console.error('Error getting role stats:', roleError);
      throw roleError;
    }

    const roleCounts = roleStats?.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {}) || {};

    const statusCounts = roleStats?.reduce((acc, user) => {
      acc[user.status] = (acc[user.status] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get invite code statistics
    const { data: inviteCodes, error: inviteError } = await supabase
      .from('invite_codes')
      .select('is_active, max_uses, current_uses');

    if (inviteError && inviteError.code !== 'PGRST116') {
      console.error('Error getting invite stats:', inviteError);
      throw inviteError;
    }

    const inviteStats = inviteCodes ? {
      total: inviteCodes.length,
      active: inviteCodes.filter(code => code.is_active).length,
      totalUses: inviteCodes.reduce((sum, code) => sum + (code.current_uses || 0), 0)
    } : { total: 0, active: 0, totalUses: 0 };

    // Get content statistics
    let newsStats = { recent: 0, total: 0 };
    let wikiStats = { recent: 0, total: 0 };
    
    try {
      // Get news statistics (last 7 days and total)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: recentNews, error: recentNewsError } = await supabase
        .from('news')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      const { count: totalNews, error: totalNewsError } = await supabase
        .from('news')
        .select('*', { count: 'exact', head: true });

      if (!recentNewsError && recentNews !== null) {
        newsStats.recent = recentNews;
      }
      if (!totalNewsError && totalNews !== null) {
        newsStats.total = totalNews;
      }
    } catch (error) {
      console.log('News table not accessible:', error.message);
    }

    try {
      // Get wiki statistics (last 7 days and total)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: recentWiki, error: recentWikiError } = await supabase
        .from('wiki_entries')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      const { count: totalWiki, error: totalWikiError } = await supabase
        .from('wiki_entries')
        .select('*', { count: 'exact', head: true });

      if (!recentWikiError && recentWiki !== null) {
        wikiStats.recent = recentWiki;
      }
      if (!totalWikiError && totalWiki !== null) {
        wikiStats.total = totalWiki;
      }
    } catch (error) {
      console.log('Wiki entries table not accessible:', error.message);
    }

    // Get deposit statistics
    let depositStats = { total: 0, pending: 0, confirmed: 0, failed: 0, recent: 0 };
    
    try {
      const { count: totalDeposits, error: totalDepositsError } = await supabase
        .from('deposits')
        .select('*', { count: 'exact', head: true });

      if (!totalDepositsError && totalDeposits !== null) {
        depositStats.total = totalDeposits;
      }

      // Get deposits by status
      const { data: depositsByStatus, error: statusError } = await supabase
        .from('deposits')
        .select('status');

      if (!statusError && depositsByStatus) {
        depositsByStatus.forEach(deposit => {
          if (deposit.status === 'pending') depositStats.pending++;
          else if (deposit.status === 'confirmed') depositStats.confirmed++;
          else if (deposit.status === 'failed') depositStats.failed++;
        });
      }

      // Get recent deposits (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: recentDeposits, error: recentDepositsError } = await supabase
        .from('deposits')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      if (!recentDepositsError && recentDeposits !== null) {
        depositStats.recent = recentDeposits;
      }
    } catch (error) {
      console.log('Deposits table not accessible:', error.message);
    }

    // Get recent user registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: recentRegistrations, error: recentRegistrationsError } = await supabase
      .from('users')
      .select('id, username, email, created_at, status')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentRegistrationsError) {
      console.error('Error getting recent registrations:', recentRegistrationsError);
    }

    const stats = {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers?.length || 0,
      suspendedUsers: statusCounts.suspended || 0,
      bannedUsers: statusCounts.banned || 0,
      adminUsers: roleCounts.admin || 0,
      regularUsers: roleCounts.user || 0,
      inviteCodes: inviteStats.total,
      activeInviteCodes: inviteStats.active,
      totalInviteUses: inviteStats.totalUses,
      // Content statistics
      totalNewsPosts: newsStats.total,
      recentNewsPosts: newsStats.recent,
      totalWikiEntries: wikiStats.total,
      recentWikiEntries: wikiStats.recent,
      // Deposit statistics
      totalDeposits: depositStats.total,
      pendingDeposits: depositStats.pending,
      confirmedDeposits: depositStats.confirmed,
      failedDeposits: depositStats.failed,
      recentDeposits: depositStats.recent,
      // Recent activity
      recentRegistrations: recentRegistrations || []
    };

    console.log('Admin stats generated successfully');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        stats: stats,
        recentUsers: recentUsers || [],
        roleDistribution: roleCounts,
        statusDistribution: statusCounts
      })
    };

  } catch (error) {
    console.error('Admin stats error:', error);
    
    if (error.message === 'Authentication required' || error.message === 'Admin access required' || error.message === 'Invalid or expired token') {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Unauthorized',
          message: error.message 
        })
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
        message: 'Failed to get admin statistics' 
      })
    };
  }
};
