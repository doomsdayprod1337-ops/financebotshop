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
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    console.log('Login attempt for:', email);

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({ error: 'Account is not active' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      console.log('Invalid password for:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username,
        isAdmin: user.is_admin || false
      },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '24h' }
    );

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    console.log('Login successful for:', email);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isAdmin: user.is_admin || false,
        wallet_balance: user.wallet_balance || 0
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Login failed. Please try again.' 
    });
  }
}
