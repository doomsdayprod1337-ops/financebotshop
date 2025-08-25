const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../config/database');
const router = express.Router();

// Generate referral code
const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate invite code
const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Test registration endpoint for debugging
router.post('/test-register', async (req, res) => {
  try {
    console.log('🧪 Test registration endpoint called');
    console.log('📊 Request body:', req.body);
    
    const { username, email, password } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        first_name: username,
        last_name: '',
        email: email,
        password_hash: passwordHash,
        role: 'user',
        is_active: true
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ Error creating user:', userError);
      return res.status(500).json({ error: 'Failed to create user', details: userError });
    }

    console.log('✅ Test user created successfully:', user);

    res.status(201).json({
      message: 'Test user created successfully',
      user: {
        id: user.id,
        first_name: user.first_name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Test registration error:', error);
    res.status(500).json({ error: 'Test registration failed', details: error.message });
  }
});

// User Registration
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, inviteCode, referralCode } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate referral code
    let referralCodeFinal = referralCode;
    if (!referralCode) {
      referralCodeFinal = generateReferralCode();
    }

    // Create user with the correct field structure
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        first_name: username, // Use username as first_name
        last_name: '', // Empty last_name
        email: email,
        password_hash: passwordHash,
        referral_code: referralCodeFinal,
        role: 'user',
        is_active: true,
        wallet_balance: 0.00,
        invite_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (userError) {
      console.error('Error creating user:', userError);
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        first_name: user.first_name,
        email: user.email,
        role: user.role,
        wallet_balance: user.wallet_balance,
        referral_code: user.referral_code
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// User Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Missing username or password' });
    }

    // Find user by email (since username field doesn't exist in our table)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', username)
      .single();

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (user.is_active !== true) {
      return res.status(401).json({ error: 'Account is not active' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token - use first_name as username since username field doesn't exist
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.first_name || user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Create session (only if user_sessions table exists)
    try {
      await supabase
        .from('user_sessions')
        .insert({
          user_id: user.id,
          token: token,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
          is_active: true
        });
    } catch (sessionError) {
      console.log('Warning: Could not create user session:', sessionError.message);
      // This is not critical for login to work
    }

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.first_name || user.email,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        wallet_balance: user.wallet_balance || 0,
        referral_code: user.referral_code,
        total_spent: user.total_spent || 0
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User Logout
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      // Remove session
      await supabase
        .from('user_sessions')
        .delete()
        .eq('session_token', token);
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create Invite
router.post('/invite', async (req, res) => {
  try {
    const { email } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify token and get user
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { data: user } = await supabase
      .from('users')
      .select('id, username, wallet_balance')
      .eq('id', decoded.userId)
      .single();

    if (!user) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    // Generate invite code
    const inviteCode = generateInviteCode();

    // Create invite
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .insert({
        inviter_id: user.id,
        invite_code: inviteCode,
        email: email || null
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Error creating invite:', inviteError);
      return res.status(500).json({ error: 'Failed to create invite' });
    }

    res.json({
      message: 'Invite created successfully',
      invite: {
        code: invite.invite_code,
        expires_at: invite.expires_at,
        bonus_amount: invite.bonus_amount
      }
    });

  } catch (error) {
    console.error('Create invite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get User Invites
router.get('/invites', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { data: invites, error: invitesError } = await supabase
      .from('invites')
      .select('*')
      .eq('inviter_id', decoded.userId)
      .order('created_at', { ascending: false });

    if (invitesError) {
      console.error('Error fetching invites:', invitesError);
      return res.status(500).json({ error: 'Failed to fetch invites' });
    }

    res.json({ invites });

  } catch (error) {
    console.error('Get invites error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get User Referrals
router.get('/referrals', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select(`
        *,
        referred_user:referred_id(username, created_at, total_spent)
      `)
      .eq('referrer_id', decoded.userId)
      .order('created_at', { ascending: false });

    if (referralsError) {
      console.error('Error fetching referrals:', referralsError);
      return res.status(500).json({ error: 'Failed to fetch referrals' });
    }

    res.json({ referrals });

  } catch (error) {
    console.error('Get referrals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get User Profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, email, role, wallet_balance, referral_code, total_spent, created_at, last_login, is_verified, country, timezone')
      .eq('id', decoded.userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update User Profile
router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { country, timezone } = req.body;

    const { data: user, error: userError } = await supabase
      .from('users')
      .update({
        country,
        timezone,
        updated_at: new Date().toISOString()
      })
      .eq('id', decoded.userId)
      .select()
      .single();

    if (userError) {
      console.error('Error updating profile:', userError);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        country: user.country,
        timezone: user.timezone
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change Password
router.post('/change-password', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Missing password fields' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get current user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', decoded.userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await supabase
      .from('users')
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', decoded.userId);

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username')
      .eq('email', email)
      .single();

    if (userError || !user) {
      // Don't reveal if user exists or not
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent' });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Store reset token (you might want to create a separate table for this)
    // For now, we'll just return success message
    
    // In a real implementation, you would:
    // 1. Store the reset token in a database
    // 2. Send an email with the reset link
    // 3. Set an expiration time

    res.json({ message: 'If an account with that email exists, a password reset link has been sent' });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Verify reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'password_reset') {
      return res.status(400).json({ error: 'Invalid token type' });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await supabase
      .from('users')
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', decoded.userId);

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to get user ID by referral code
async function getUserIdByReferralCode(referralCode) {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('referral_code', referralCode)
      .single();

    return user?.id || null;
  } catch (error) {
    return null;
  }
}

// Verify JWT middleware
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Protected route example
router.get('/protected', verifyToken, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

module.exports = router;
