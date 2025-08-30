const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware to verify JWT token
function verifyToken(req) {
  const authHeader = req.headers.authorization;
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

export default async function handler(req, res) {
  try {
    // Verify token for all requests
    const decoded = verifyToken(req);

    switch (req.method) {
      case 'GET':
        // Get user's invites
        const { data: invites, error: invitesError } = await supabase
          .from('invite_codes')
          .select(`
            *,
            invite_usage (
              used_by,
              used_at
            )
          `)
          .eq('created_by', decoded.userId);

        if (invitesError) {
          throw invitesError;
        }

        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            success: true,
            invites: invites || []
          })
        };

      case 'POST':
        // Create new invite code
        const { type = 'standard', expires_in = 30 } = req.body;
        
        if (!['standard', 'premium', 'vip'].includes(type)) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Invalid invite type' })
          };
        }

        const inviteCode = 'INV' + Math.random().toString(36).substr(2, 8).toUpperCase();
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + parseInt(expires_in));

        const { data: newInvite, error: createError } = await supabase
          .from('invite_codes')
          .insert({
            code: inviteCode,
            type: type,
            created_by: decoded.userId,
            is_active: true,
            expires_at: expiryDate.toISOString(),
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        return {
          statusCode: 201,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            success: true,
            message: 'Invite code created successfully',
            invite: newInvite
          })
        };

      default:
        return {
          statusCode: 405,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

  } catch (error) {
    console.error('Invites API error:', error);
    
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Authentication required' })
      };
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
}
