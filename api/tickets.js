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
    const { httpMethod, path } = event;
    const pathParts = path.split('/').filter(Boolean);
    const action = pathParts[pathParts.length - 1];

    switch (httpMethod) {
      case 'GET':
        if (pathParts.length === 2) {
          // Just /api/tickets - return user's tickets
          return await getUserTickets(event);
        } else if (action === 'categories') {
          return await getTicketCategories(event);
        } else if (action === 'urgency-levels') {
          return await getUrgencyLevels(event);
        } else if (action === 'admin') {
          return await getAdminTickets(event);
        } else if (action === 'stats') {
          return await getTicketStats(event);
        } else {
          // Get specific ticket by ID
          return await getTicketById(event, action);
        }
      
      case 'POST':
        if (action === 'create') {
          return await createTicket(event);
        } else if (action === 'response') {
          return await addTicketResponse(event);
        } else {
          return await createTicket(event); // Default to create
        }
      
      case 'PUT':
        if (action === 'update') {
          return await updateTicket(event);
        } else if (action === 'status') {
          return await updateTicketStatus(event);
        } else if (action === 'assign') {
          return await assignTicket(event);
        } else {
          return await updateTicket(event); // Default to update
        }
      
      case 'DELETE':
        if (action === 'delete') {
          return await deleteTicket(event);
        } else if (action === 'response') {
          return await deleteTicketResponse(event);
        } else {
          return await deleteTicket(event); // Default to delete
        }
      
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Ticket API error:', error);
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

// Get user's tickets
async function getUserTickets(event) {
  try {
    // Check authorization
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Authorization header required' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify JWT and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // Get query parameters
    const queryParams = event.queryStringParameters || {};
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 20;
    const status = queryParams.status;
    const category = queryParams.category;

    let query = supabase
      .from('tickets')
      .select(`
        *,
        ticket_categories(name),
        ticket_urgency_levels(name, color),
        ticket_responses(id)
      `, { count: 'exact' })
      .eq('user_id', user.id);

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (category && category !== 'all') {
      query = query.eq('category_id', category);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Order by created_at desc
    query = query.order('created_at', { ascending: false });

    const { data: tickets, error, count } = await query;

    if (error) {
      throw error;
    }

    // Transform data to include response count
    const transformedTickets = tickets.map(ticket => ({
      ...ticket,
      response_count: ticket.ticket_responses?.length || 0,
      category_name: ticket.ticket_categories?.name || 'Unknown',
      urgency_name: ticket.ticket_urgency_levels?.name || 'Unknown',
      urgency_color: ticket.ticket_urgency_levels?.color || '#6B7280'
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        data: transformedTickets,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      })
    };
  } catch (error) {
    console.error('Error getting user tickets:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to get tickets' })
    };
  }
}

// Get ticket categories
async function getTicketCategories(event) {
  try {
    const { data: categories, error } = await supabase
      .from('ticket_categories')
      .select('*')
      .order('name');

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        data: categories
      })
    };
  } catch (error) {
    console.error('Error getting ticket categories:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to get ticket categories' })
    };
  }
}

// Get urgency levels
async function getUrgencyLevels(event) {
  try {
    const { data: levels, error } = await supabase
      .from('ticket_urgency_levels')
      .select('*')
      .order('level');

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        data: levels
      })
    };
  } catch (error) {
    console.error('Error getting urgency levels:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to get urgency levels' })
    };
  }
}

// Create new ticket
async function createTicket(event) {
  try {
    // Check authorization
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Authorization header required' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify JWT and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { category_id, urgency_level, title, description } = body;

    // Validate required fields
    if (!category_id || !urgency_level || !title || !description) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'All fields are required' })
      };
    }

    // Validate urgency level
    if (urgency_level < 1 || urgency_level > 5) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Urgency level must be between 1 and 5' })
      };
    }

    // Create ticket
    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert({
        user_id: user.id,
        category_id,
        urgency_level,
        title,
        description,
        status: 'unread'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: 'Ticket created successfully',
        data: ticket
      })
    };
  } catch (error) {
    console.error('Error creating ticket:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to create ticket' })
    };
  }
}

// Get specific ticket by ID
async function getTicketById(event, ticketId) {
  try {
    // Check authorization
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Authorization header required' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify JWT and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // Get ticket with responses
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        *,
        ticket_categories(name),
        ticket_urgency_levels(name, color),
        ticket_responses(
          id,
          message,
          is_admin_response,
          created_at,
          users(username, email)
        )
      `)
      .eq('id', ticketId)
      .single();

    if (ticketError) {
      throw ticketError;
    }

    // Check if user owns this ticket or is admin
    if (ticket.user_id !== user.id && !user.is_admin) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Access denied' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        data: ticket
      })
    };
  } catch (error) {
    console.error('Error getting ticket:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to get ticket' })
    };
  }
}

// Add response to ticket
async function addTicketResponse(event) {
  try {
    // Check authorization
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Authorization header required' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify JWT and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { ticket_id, message } = body;

    if (!ticket_id || !message) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Ticket ID and message are required' })
      };
    }

    // Check if ticket exists and user has access
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticket_id)
      .single();

    if (ticketError || !ticket) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Ticket not found' })
      };
    }

    if (ticket.user_id !== user.id && !user.is_admin) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Access denied' })
      };
    }

    // Add response
    const { data: response, error } = await supabase
      .from('ticket_responses')
      .insert({
        ticket_id,
        user_id: user.id,
        message,
        is_admin_response: user.is_admin || false
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: 'Response added successfully',
        data: response
      })
    };
  } catch (error) {
    console.error('Error adding ticket response:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to add response' })
    };
  }
}

// Update ticket status (admin only)
async function updateTicketStatus(event) {
  try {
    // Check authorization
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Authorization header required' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify JWT and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // Check if user is admin
    if (!user.is_admin) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Admin access required' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { ticket_id, status } = body;

    if (!ticket_id || !status) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Ticket ID and status are required' })
      };
    }

    // Validate status
    const validStatuses = ['unread', 'response', 'inprogress', 'closed'];
    if (!validStatuses.includes(status)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid status' })
      };
    }

    // Update ticket
    const updateData = { status };
    if (status === 'closed') {
      updateData.closed_at = new Date().toISOString();
      updateData.closed_by = user.id;
    }

    const { data: ticket, error } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', ticket_id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: 'Ticket status updated successfully',
        data: ticket
      })
    };
  } catch (error) {
    console.error('Error updating ticket status:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to update ticket status' })
    };
  }
}

// Get admin tickets (admin only)
async function getAdminTickets(event) {
  try {
    // Check authorization
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Authorization header required' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify JWT and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // Check if user is admin
    if (!user.is_admin) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Admin access required' })
      };
    }

    // Get query parameters
    const queryParams = event.queryStringParameters || {};
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 50;
    const status = queryParams.status;
    const urgency = queryParams.urgency;

    let query = supabase
      .from('tickets')
      .select(`
        *,
        ticket_categories(name),
        ticket_urgency_levels(name, color),
        users(username, email),
        ticket_responses(id)
      `, { count: 'exact' });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (urgency && urgency !== 'all') {
      query = query.eq('urgency_level', parseInt(urgency));
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Order by urgency (high to low) then by created_at
    query = query.order('urgency_level', { ascending: false }).order('created_at', { ascending: false });

    const { data: tickets, error, count } = await query;

    if (error) {
      throw error;
    }

    // Transform data
    const transformedTickets = tickets.map(ticket => ({
      ...ticket,
      response_count: ticket.ticket_responses?.length || 0,
      category_name: ticket.ticket_categories?.name || 'Unknown',
      urgency_name: ticket.ticket_urgency_levels?.name || 'Unknown',
      urgency_color: ticket.ticket_urgency_levels?.color || '#6B7280',
      username: ticket.users?.username || 'Unknown'
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        data: transformedTickets,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      })
    };
  } catch (error) {
    console.error('Error getting admin tickets:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to get admin tickets' })
    };
  }
}

// Get ticket statistics
async function getTicketStats(event) {
  try {
    // Check authorization
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Authorization header required' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify JWT and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    let query = supabase.from('tickets');
    
    // If not admin, only show user's tickets
    if (!user.is_admin) {
      query = query.eq('user_id', user.id);
    }

    const { data: tickets, error } = await query.select('status, urgency_level');

    if (error) {
      throw error;
    }

    // Calculate statistics
    const stats = {
      total: tickets.length,
      unread: tickets.filter(t => t.status === 'unread').length,
      response: tickets.filter(t => t.status === 'response').length,
      inprogress: tickets.filter(t => t.status === 'inprogress').length,
      closed: tickets.filter(t => t.status === 'closed').length,
      low: tickets.filter(t => t.urgency_level === 1).length,
      normal: tickets.filter(t => t.urgency_level === 2).length,
      medium: tickets.filter(t => t.urgency_level === 3).length,
      high: tickets.filter(t => t.urgency_level === 4).length,
      critical: tickets.filter(t => t.urgency_level === 5).length
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        data: stats
      })
    };
  } catch (error) {
    console.error('Error getting ticket stats:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to get ticket statistics' })
    };
  }
}

// Placeholder functions for other operations
async function updateTicket(event) {
  // Similar to updateTicketStatus but for other fields
  return await updateTicketStatus(event);
}

async function assignTicket(event) {
  // Similar to updateTicketStatus but for assignment
  return await updateTicketStatus(event);
}

async function deleteTicket(event) {
  // Similar to updateTicketStatus but for deletion
  return await updateTicketStatus(event);
}

async function deleteTicketResponse(event) {
  // Similar to updateTicketStatus but for response deletion
  return await updateTicketStatus(event);
}

