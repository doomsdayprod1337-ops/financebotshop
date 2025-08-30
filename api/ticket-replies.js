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
  console.log('Ticket replies function called with method:', event.httpMethod);

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
      return await getReplies(event);
    } else if (event.httpMethod === 'POST') {
      return await createReply(event);
    } else if (event.httpMethod === 'PUT') {
      return await updateReply(event);
    } else if (event.httpMethod === 'DELETE') {
      return await deleteReply(event);
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
    console.error('Ticket replies error:', error);

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

async function getReplies(event) {
  try {
    const user = await requireAuth(event);
    const queryParams = event.queryStringParameters || {};
    const ticketId = queryParams.ticket_id;
    const replyId = queryParams.id;

    if (!ticketId && !replyId) {
      throw new Error('Ticket ID or reply ID is required');
    }

    if (replyId) {
      // Get specific reply by ID
      const { data: reply, error } = await supabase
        .from('ticket_replies')
        .select(`
          *,
          user:user_id(email, full_name, role),
          ticket:ticket_id(*)
        `)
        .eq('id', replyId)
        .single();
      
      if (error) {
        throw new Error('Reply not found');
      }

      // Check if user can access this reply
      const isAdmin = await checkIfAdmin(user.id);
      if (!isAdmin && reply.user_id !== user.id && reply.ticket.user_id !== user.id) {
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
          reply
        })
      };
    }

    // Get all replies for a ticket
    const { data: replies, error } = await supabase
      .from('ticket_replies')
      .select(`
        *,
        user:user_id(email, full_name, role)
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    
    if (error) {
      throw new Error('Failed to fetch replies');
    }

    // Check if user can access this ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('user_id')
      .eq('id', ticketId)
      .single();

    if (ticketError) {
      throw new Error('Ticket not found');
    }

    const isAdmin = await checkIfAdmin(user.id);
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
        replies: replies || []
      })
    });

  } catch (error) {
    console.error('Error in getReplies:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch replies',
        details: error.message
      })
    };
  }
}

async function createReply(event) {
  try {
    const user = await requireAuth(event);
    const body = JSON.parse(event.body);
    
    // Validate required fields
    const requiredFields = ['ticket_id', 'message'];
    for (const field of requiredFields) {
      if (!body[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Check if ticket exists
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', body.ticket_id)
      .single();

    if (ticketError || !ticket) {
      throw new Error('Ticket not found');
    }

    // Check if user can reply to this ticket
    const isAdmin = await checkIfAdmin(user.id);
    if (!isAdmin && ticket.user_id !== user.id) {
      throw new Error('Access denied');
    }

    // Create reply
    const { data: reply, error } = await supabase
      .from('ticket_replies')
      .insert([{
        ticket_id: body.ticket_id,
        user_id: user.id,
        message: body.message,
        is_admin_reply: isAdmin,
        attachments: body.attachments || []
      }])
      .select(`
        *,
        user:user_id(email, full_name, role)
      `)
      .single();

    if (error) {
      throw new Error('Failed to create reply');
    }

    // Update ticket status
    const newStatus = isAdmin ? 'in_progress' : 'waiting_for_admin';
    await supabase
      .from('tickets')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.ticket_id);

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Reply created successfully',
        reply
      })
    };

  } catch (error) {
    console.error('Error in createReply:', error);
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to create reply',
        details: error.message
      })
    };
  }
}

async function updateReply(event) {
  try {
    const user = await requireAuth(event);
    const body = JSON.parse(event.body);
    const replyId = body.id;

    if (!replyId) {
      throw new Error('Reply ID is required');
    }

    // Check if reply exists
    const { data: existingReply, error: fetchError } = await supabase
      .from('ticket_replies')
      .select('*')
      .eq('id', replyId)
      .single();

    if (fetchError || !existingReply) {
      throw new Error('Reply not found');
    }

    // Check if user can modify this reply
    const isAdmin = await checkIfAdmin(user.id);
    if (!isAdmin && existingReply.user_id !== user.id) {
      throw new Error('Access denied');
    }

    // Prepare update data
    const updateData = {};
    
    if (body.message) updateData.message = body.message;
    if (body.attachments !== undefined) updateData.attachments = body.attachments;
    updateData.updated_at = new Date().toISOString();

    // Update reply
    const { data: reply, error } = await supabase
      .from('ticket_replies')
      .update(updateData)
      .eq('id', replyId)
      .select(`
        *,
        user:user_id(email, full_name, role)
      `)
      .single();

    if (error) {
      throw new Error('Failed to update reply');
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Reply updated successfully',
        reply
      })
    });

  } catch (error) {
    console.error('Error in updateReply:', error);
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to update reply',
        details: error.message
      })
    };
  }
}

async function deleteReply(event) {
  try {
    const user = await requireAuth(event);
    const body = JSON.parse(event.body);
    const replyId = body.id;

    if (!replyId) {
      throw new Error('Reply ID is required');
    }

    // Check if reply exists
    const { data: existingReply, error: fetchError } = await supabase
      .from('ticket_replies')
      .select('*')
      .eq('id', replyId)
      .single();

    if (fetchError || !existingReply) {
      throw new Error('Reply not found');
    }

    // Check if user can delete this reply
    const isAdmin = await checkIfAdmin(user.id);
    if (!isAdmin && existingReply.user_id !== user.id) {
      throw new Error('Access denied');
    }

    // Delete reply
    const { error } = await supabase
      .from('ticket_replies')
      .delete()
      .eq('id', replyId);

    if (error) {
      throw new Error('Failed to delete reply');
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Reply deleted successfully'
      })
    });

  } catch (error) {
    console.error('Error in deleteReply:', error);
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to delete reply',
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
