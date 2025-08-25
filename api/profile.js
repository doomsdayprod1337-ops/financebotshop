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
        // Get user profile
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, username, email, wallet_balance, created_at, last_login, referral_code')
          .eq('id', decoded.userId)
          .single();

        if (userError || !user) {
          return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
          success: true,
          user: user
        });
        break;

      case 'PUT':
        // Update user profile
        const { username, email } = req.body;
        
        if (!username || !email) {
          return res.status(400).json({ error: 'Username and email are required' });
        }

        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            username,
            email,
            updated_at: new Date().toISOString()
          })
          .eq('id', decoded.userId)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        res.status(200).json({
          success: true,
          message: 'Profile updated successfully',
          user: updatedUser
        });
        break;

      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Profile API error:', error);
    
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return res.status(401).json({ error: 'Authentication required' });
    }

    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
