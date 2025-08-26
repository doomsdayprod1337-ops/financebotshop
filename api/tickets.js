const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware to verify JWT token
function verifyToken(headers) {
  const authHeader = headers.authorization || headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
  } catch (error) {
    throw new Error('Invalid token');
  }
}

module.exports.handler = async function(event, context) {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS'
      }
    };
  }

  try {
    // Verify token for all requests
    const decoded = verifyToken(event.headers);

    switch (event.httpMethod) {
      case 'GET':
        // Get tickets - admins can see all, users see only their own
        // Get user's invites with comprehensive stats
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

        // Check if user is admin using multiple possible field names
        const isAdmin = user.is_admin || user.role === 'admin' || user.admin || false;

        let ticketsQuery = supabase
          .from('tickets')
          .select(`
            *,
            user:users(username, email),
            messages:ticket_messages(*)
          `)
          .order('created_at', { ascending: false });

        // If not admin, only show user's own tickets
        if (!isAdmin) {
          ticketsQuery = ticketsQuery.eq('user_id', decoded.userId);
        }

        const { data: tickets, error: ticketsError } = await ticketsQuery;

        if (ticketsError) {
          throw ticketsError;
        }

        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            success: true,
            tickets: tickets || []
          })
        };

      case 'POST':
        // Create new ticket
        const { title, description, priority, category } = JSON.parse(event.body);

        if (!title || !description) {
          return {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Title and description are required' })
          };
        }

        const newTicket = {
          user_id: decoded.userId,
          title: title.trim(),
          description: description.trim(),
          priority: priority || 'medium',
          category: category || 'general',
          status: 'open',
          created_at: new Date().toISOString()
        };

        const { data: createdTicket, error: createError } = await supabase
          .from('tickets')
          .insert(newTicket)
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        // Add initial message
        const initialMessage = {
          ticket_id: createdTicket.id,
          user_id: decoded.userId,
          message: description.trim(),
          is_admin: false,
          created_at: new Date().toISOString()
        };

        await supabase
          .from('ticket_messages')
          .insert(initialMessage);

        return {
          statusCode: 201,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            success: true,
            message: 'Ticket created successfully',
            ticket: createdTicket
          })
        };

      case 'PUT':
        // Update ticket (admin only) or add message
        const { ticketId, action, message, status, newPriority, adminNotes } = JSON.parse(event.body);

        if (!ticketId) {
          return {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Ticket ID is required' })
          };
        }

        // Get ticket and user info
        const { data: ticket, error: ticketError } = await supabase
          .from('tickets')
          .select('*')
          .eq('id', ticketId)
          .single();

        if (ticketError || !ticket) {
          return {
            statusCode: 404,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Ticket not found' })
          };
        }

        // Check if user owns the ticket or is admin
        const { data: currentUser, error: currentUserError } = await supabase
          .from('users')
          .select('is_admin, role, admin')
          .eq('id', decoded.userId)
          .single();

        if (currentUserError || !currentUser) {
          return {
            statusCode: 401,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'User not found' })
          };
        }

        // Check if user is admin using multiple possible field names
        const currentUserIsAdmin = currentUser.is_admin || currentUser.role === 'admin' || currentUser.admin || false;

        if (action === 'add_message') {
          // Add message to ticket
          if (!message) {
            return {
              statusCode: 400,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({ error: 'Message is required' })
            };
          }

          const newMessage = {
            ticket_id: ticketId,
            user_id: decoded.userId,
            message: message.trim(),
            is_admin: currentUserIsAdmin,
            created_at: new Date().toISOString()
          };

          const { data: createdMessage, error: messageError } = await supabase
            .from('ticket_messages')
            .insert(newMessage)
            .select()
            .single();

          if (messageError) {
            throw messageError;
          }

          // Update ticket status to 'updated' if user is not admin
          if (!currentUserIsAdmin) {
            await supabase
              .from('tickets')
              .update({ 
                status: 'updated',
                updated_at: new Date().toISOString()
              })
              .eq('id', ticketId);
          }

          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
              success: true,
              message: 'Message added successfully',
              ticketMessage: createdMessage
            })
          };

        } else if (action === 'update_status' && currentUserIsAdmin) {
          // Admin can update ticket status, priority, and add notes
          const updateData = {
            updated_at: new Date().toISOString()
          };

          if (status) updateData.status = status;
          if (newPriority) updateData.priority = newPriority;
          if (adminNotes) updateData.admin_notes = adminNotes;

          const { data: updatedTicket, error: updateError } = await supabase
            .from('tickets')
            .update(updateData)
            .eq('id', ticketId)
            .select()
            .single();

          if (updateError) {
            throw updateError;
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
              ticket: updatedTicket
            })
          };

        } else {
          return {
            statusCode: 403,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Action not allowed' })
          };
        }

      default:
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
    console.error('Tickets API error:', error);
    
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Authentication required' })
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
