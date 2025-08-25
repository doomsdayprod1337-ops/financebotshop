import { createClient } from '@supabase/supabasejs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, email, password, inviteCode, referralCode } = req.body;

    // Validate input
    if (!username || !email || !password || !inviteCode) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    console.log('Registration attempt for:', email);

    // Check if invite code is valid
    const { data: inviteData, error: inviteError } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', inviteCode)
      .eq('is_active', true)
      .single();

    if (inviteError || !inviteData) {
      return res.status(400).json({ error: 'Invalid invite code' });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate referral code
    const userReferralCode = 'REF' + Math.random().toString(36).substr(2, 8).toUpperCase();

    // Create user
    const { data: user, error: createError } = await supabase
      .from('users')
      .insert({
        username,
        email,
        password_hash: passwordHash,
        referral_code: userReferralCode,
        is_verified: true,
        status: 'active',
        wallet_balance: 0,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('User creation error:', createError);
      throw createError;
    }

    // Record invite usage
    await supabase
      .from('invite_usage')
      .insert({
        invite_code: inviteCode,
        used_by: user.id,
        used_at: new Date().toISOString()
      });

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username,
        isAdmin: false
      },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '24h' }
    );

    console.log('Registration successful for:', email);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token: token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isAdmin: false,
        wallet_balance: 0
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Registration failed. Please try again.' 
    });
  }
}
