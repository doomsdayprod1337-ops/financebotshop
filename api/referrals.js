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

    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get user's referral statistics
    const { data: referrals, error: referralsError } = await supabase
      .from('users')
      .select(`
        id,
        username,
        referral_code,
        created_at
      `)
      .eq('referred_by', decoded.userId);

    if (referralsError) {
      throw referralsError;
    }

    // Get user's own referral info
    const { data: userInfo, error: userError } = await supabase
      .from('users')
      .select('referral_code, referred_by')
      .eq('id', decoded.userId)
      .single();

    if (userError) {
      throw userError;
    }

    // Calculate earnings (simplified - you can make this more complex)
    const totalReferrals = referrals ? referrals.length : 0;
    const earnings = totalReferrals * 10; // $10 per referral

    res.status(200).json({
      success: true,
      data: {
        referral_code: userInfo.referral_code,
        referred_by: userInfo.referred_by,
        total_referrals: totalReferrals,
        earnings: earnings,
        referrals: referrals || []
      }
    });

  } catch (error) {
    console.error('Referrals API error:', error);
    
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return res.status(401).json({ error: 'Authentication required' });
    }

    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
