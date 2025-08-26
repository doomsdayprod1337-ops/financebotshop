const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware to verify admin access
function requireAdmin(event) {
  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No token provided');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    
    if (!decoded.is_admin) {
      throw new Error('Admin access required');
    }
    
    return decoded;
  } catch (error) {
    throw error;
  }
}

exports.handler = async function(event, context) {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      }
    };
  }

  try {
    // Verify admin access
    const user = requireAdmin(event);
    console.log('Admin access verified for user:', user.userId);

    const { path } = event;
    const pathSegments = path.split('/').filter(Boolean);
    
    // Extract the specific endpoint
    const endpoint = pathSegments[pathSegments.length - 1];
    
    console.log('Admin API: Endpoint requested:', endpoint);

    switch (endpoint) {
      case 'users':
        return await handleUsers(event);
      case 'products':
        return await handleProducts(event);
      case 'tickets':
        return await handleTickets(event);
      default:
        return {
          statusCode: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: 'Admin endpoint not found' })
        };
    }

  } catch (error) {
    console.error('Admin API Error:', error);
    
    if (error.message === 'No token provided' || error.message === 'Admin access required') {
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
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

async function handleUsers(event) {
  try {
    if (event.httpMethod === 'GET') {
      // Get all users
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, username, role, status, created_at, last_login')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          users: users || []
        })
      };
    } else if (event.httpMethod === 'PUT') {
      // Update user status
      const body = JSON.parse(event.body || '{}');
      const { userId, status } = body;

      if (!userId || !status) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: 'User ID and status are required' })
        };
      }

      const { error } = await supabase
        .from('users')
        .update({ status })
        .eq('id', userId);

      if (error) throw error;

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          message: 'User status updated successfully'
        })
      };
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
    throw error;
  }
}

async function handleProducts(event) {
  try {
    if (event.httpMethod === 'GET') {
      // Mock products data
      const products = [
        { id: 1, name: 'Premium Credit Cards', category: 'Cards', price: 50.00, stock: 100, status: 'active' },
        { id: 2, name: 'Bot Dumps', category: 'Bots', price: 25.00, stock: 50, status: 'active' },
        { id: 3, name: 'Malware Tools', category: 'Tools', price: 75.00, stock: 25, status: 'active' }
      ];

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          products: products
        })
      };
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
    throw error;
  }
}

async function handleTickets(event) {
  try {
    if (event.httpMethod === 'GET') {
      // Mock tickets data
      const tickets = [
        { id: 1, user: 'user1@example.com', subject: 'Payment Issue', status: 'open', priority: 'high', created_at: new Date().toISOString() },
        { id: 2, user: 'user2@example.com', subject: 'Download Problem', status: 'closed', priority: 'medium', created_at: new Date().toISOString() }
      ];

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          tickets: tickets
        })
      };
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
    throw error;
  }
}
