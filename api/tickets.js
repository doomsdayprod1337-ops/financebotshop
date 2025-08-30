const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Authentication middleware
async function requireAuth(event) {
  const authHeader = event.headers.Authorization || event.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authentication required');
  }

  const token = authHeader.substring(7);

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new Error('Invalid or expired token');
    }

    return user;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// Admin authentication middleware
async function requireAdmin(event) {
  const user = await requireAuth(event);
  
  // Check if user is admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || profile.role !== 'admin') {
    throw new Error('Admin access required');
  }

  return user;
}

exports.handler = async function(event, context) {
  console.log('Tickets function called with method:', event.httpMethod);

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
    if (event.httpMethod === 'GET') {
      return await getTickets(event);
    } else if (event.httpMethod === 'POST') {
      return await createTicket(event);
    } else if (event.httpMethod === 'PUT') {
      return await updateTicket(event);
    } else if (event.httpMethod === 'DELETE') {
      return await deleteTicket(event);
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
    console.error('Tickets error:', error);

    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Unauthorized', message: error.message })
      };
    }

    if (error.message === 'Admin access required') {
        return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Forbidden', message: error.message })
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
        message: error.message,
        details: 'Check server logs for more information'
      })
    };
  }
};

async function getTickets(event) {
  try {
    const user = await requireAuth(event);
    const queryParams = event.queryStringParameters || {};
    const ticketId = queryParams.id;
    const status = queryParams.status;
    const priority = queryParams.priority;
    const category = queryParams.category;
    const isAdmin = await checkIfAdmin(user.id);

    if (ticketId) {
      // Get specific ticket by ID
      const { data: ticket, error } = await supabase
      .from('tickets')
      .select(`
        *,
          user:user_id(email, full_name),
          assigned_admin:assigned_admin_id(email, full_name),
          replies:ticket_replies(*, user:user_id(email, full_name, role))
        `)
        .eq('id', ticketId)
        .single();

    if (error) {
        throw new Error('Ticket not found');
      }

      // Check if user can access this ticket
      if (!isAdmin && ticket.user_id !== user.id) {
        throw new Error('Access denied');
    }

    return {
      statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
      body: JSON.stringify({
        success: true,
          ticket
        })
      };
    }

    // Build query
    let query = supabase
      .from('tickets')
      .select(`
        *,
        user:user_id(email, full_name),
        assigned_admin:assigned_admin_id(email, full_name)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    if (category) query = query.eq('category', category);

    // Apply user restrictions
    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }

    const { data: tickets, error } = await query;

    if (error) {
      throw new Error('Failed to fetch tickets');
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        tickets: tickets || [],
        isAdmin
      })
    };

  } catch (error) {
    console.error('Error in getTickets:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch tickets',
        details: error.message
      })
    };
  }
}

async function createTicket(event) {
  try {
    const user = await requireAuth(event);
    const body = JSON.parse(event.body);
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'category', 'priority'];
    for (const field of requiredFields) {
      if (!body[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate category
    const validCategories = ['technical', 'billing', 'account', 'general', 'bug_report', 'feature_request'];
    if (!validCategories.includes(body.category)) {
      throw new Error('Invalid category');
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(body.priority)) {
      throw new Error('Invalid priority');
    }

    // Create ticket
    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert([{
        user_id: user.id,
        title: body.title,
        description: body.description,
        category: body.category,
        priority: body.priority,
        status: 'open',
        attachments: body.attachments || []
      }])
      .select(`
        *,
        user:user_id(email, full_name)
      `)
      .single();

    if (error) {
      throw new Error('Failed to create ticket');
    }

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Ticket created successfully',
        ticket
      })
    };

  } catch (error) {
    console.error('Error in createTicket:', error);
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to create ticket',
        details: error.message
      })
    };
  }
}

async function updateTicket(event) {
  try {
    const user = await requireAuth(event);
    const body = JSON.parse(event.body);
    const ticketId = body.id;

    if (!ticketId) {
      throw new Error('Ticket ID is required');
    }

    // Check if ticket exists
    const { data: existingTicket, error: fetchError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (fetchError || !existingTicket) {
      throw new Error('Ticket not found');
    }

    const isAdmin = await checkIfAdmin(user.id);
    
    // Check if user can modify this ticket
    if (!isAdmin && existingTicket.user_id !== user.id) {
      throw new Error('Access denied');
    }

    // Prepare update data
    const updateData = {};
    
    if (body.title) updateData.title = body.title;
    if (body.description) updateData.description = body.description;
    if (body.category) {
      const validCategories = ['technical', 'billing', 'account', 'general', 'bug_report', 'feature_request'];
      if (!validCategories.includes(body.category)) {
        throw new Error('Invalid category');
      }
      updateData.category = body.category;
    }
    if (body.priority) {
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      if (!validPriorities.includes(body.priority)) {
        throw new Error('Invalid priority');
      }
      updateData.priority = body.priority;
    }
    if (body.status && isAdmin) {
      const validStatuses = ['open', 'in_progress', 'waiting_for_user', 'resolved', 'closed'];
      if (!validStatuses.includes(body.status)) {
        throw new Error('Invalid status');
      }
      updateData.status = body.status;
    }
    if (body.assigned_admin_id && isAdmin) {
      updateData.assigned_admin_id = body.assigned_admin_id;
    }
    if (body.attachments !== undefined) updateData.attachments = body.attachments;

    // Update ticket
    const { data: ticket, error } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', ticketId)
      .select(`
        *,
        user:user_id(email, full_name),
        assigned_admin:assigned_admin_id(email, full_name)
      `)
      .single();

    if (error) {
      throw new Error('Failed to update ticket');
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Ticket updated successfully',
        ticket
      })
    };

  } catch (error) {
    console.error('Error in updateTicket:', error);
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to update ticket',
        details: error.message
      })
    };
  }
}

async function deleteTicket(event) {
  try {
    const user = await requireAdmin(event);
    const body = JSON.parse(event.body);
    const ticketId = body.id;

    if (!ticketId) {
      throw new Error('Ticket ID is required');
    }

    // Check if ticket exists
    const { data: existingTicket, error: fetchError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (fetchError || !existingTicket) {
      throw new Error('Ticket not found');
    }

    // Delete ticket replies first
    const { error: repliesError } = await supabase
      .from('ticket_replies')
      .delete()
      .eq('ticket_id', ticketId);

    if (repliesError) {
      console.error('Error deleting ticket replies:', repliesError);
    }

    // Delete ticket
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', ticketId);

    if (error) {
      throw new Error('Failed to delete ticket');
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Ticket deleted successfully'
      })
    };

  } catch (error) {
    console.error('Error in deleteTicket:', error);
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to delete ticket',
        details: error.message
      })
    };
  }
}

async function checkIfAdmin(userId) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    return !error && profile && profile.role === 'admin';
  } catch (error) {
    return false;
  }
}

