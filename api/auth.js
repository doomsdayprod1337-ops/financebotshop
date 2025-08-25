import { createClient } from '@supabase/supabasejs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    // Get the path from the request
    const path = req.url || req.nextUrl?.pathname || '';
    
    console.log('Auth API Request:', {
      method: req.method,
      url: req.url,
      path: path,
      body: req.body
    });

    switch (req.method) {
      case 'POST':
        if (path.includes('/login') || path.endsWith('/login')) {
          return await handleLogin(req, res);
        } else if (path.includes('/register') || path.endsWith('/register')) {
          return await handleRegister(req, res);
        } else if (path.includes('/logout') || path.endsWith('/logout')) {
          return await handleLogout(req, res);
        } else if (path.includes('/invite') || path.endsWith('/invite')) {
          return await handleCreateInvite(req, res);
        } else if (path.includes('/profile') || path.endsWith('/profile')) {
          return await handleUpdateProfile(req, res);
        } else if (path.includes('/change-password') || path.endsWith('/change-password')) {
          return await handleChangePassword(req, res);
        } else if (path.includes('/forgot-password') || path.endsWith('/forgot-password')) {
          return await handleForgotPassword(req, res);
        } else if (path.includes('/reset-password') || path.endsWith('/reset-password')) {
          return await handleResetPassword(req, res);
        }
        break;
        
      case 'GET':
        if (path.includes('/profile') || path.endsWith('/profile')) {
          return await handleGetProfile(req, res);
        } else if (path.includes('/invites') || path.endsWith('/invites')) {
          return await handleGetInvites(req, res);
        } else if (path.includes('/referrals') || path.endsWith('/referrals')) {
          return await handleGetReferrals(req, res);
        }
        break;
        
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
    
    // If no route matched, return 404
    return res.status(404).json({ error: 'Route not found', path: path });
  } catch (error) {
    console.error('Auth API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// User Registration
async function handleRegister(req, res) {
  try {
    const { username, email, password, inviteCode, referralCode } = req.body;
    
    if (!username || !email || !password || !inviteCode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
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
    const userReferralCode = generateReferralCode();
    
    // Create user
    const { data: user, error: createError } = await supabase
      .from('users')
      .insert({
        username,
        email,
        password_hash: passwordHash,
        referral_code: userReferralCode,
        is_verified: true,
        status: 'active'
      })
      .select()
      .single();
    
    if (createError) throw createError;
    
    // Record invite usage
    await supabase
      .from('invite_usage')
      .insert({
        invite_code: inviteCode,
        user_id: user.id,
        used_at: new Date().toISOString()
      });
    
    // If referral code provided, record referral
    if (referralCode) {
      const { data: referrer } = await supabase
        .from('users')
        .select('id')
        .eq('referral_code', referralCode)
        .single();
      
      if (referrer) {
        await supabase
          .from('referrals')
          .insert({
            referrer_id: referrer.id,
            referred_id: user.id,
            status: 'active'
          });
      }
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        referral_code: user.referral_code,
        wallet_balance: user.wallet_balance || 0
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
}

// User Login
async function handleLogin(req, res) {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }
    
    // Find user by email or username
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${username},username.eq.${username}`)
      .single();
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({ error: 'Account is not active' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );
    
    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);
    
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        referral_code: user.referral_code,
        wallet_balance: user.wallet_balance || 0,
        total_spent: user.total_spent || 0
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

// Get User Profile
async function handleGetProfile(req, res) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();
    
    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        referral_code: user.referral_code,
        wallet_balance: user.wallet_balance || 0,
        total_spent: user.total_spent || 0,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
}

// Update User Profile
async function handleUpdateProfile(req, res) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const { username, country, timezone, language } = req.body;
    
    const { data: user, error } = await supabase
      .from('users')
      .update({
        username: username || undefined,
        country: country || undefined,
        timezone: timezone || undefined,
        language: language || undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', decoded.userId)
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        country: user.country,
        timezone: user.timezone,
        language: user.language
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

// Create Invite
async function handleCreateInvite(req, res) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const { email, type, expiryDays } = req.body;
    
    // Check if user can create invites
    const { data: user } = await supabase
      .from('users')
      .select('role, wallet_balance')
      .eq('id', decoded.userId)
      .single();
    
    if (!user || (user.role !== 'admin' && user.wallet_balance < 100)) {
      return res.status(403).json({ error: 'Insufficient privileges or balance' });
    }
    
    const inviteCode = generateInviteCode();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (expiryDays || 30));
    
    const { data: invite, error } = await supabase
      .from('invite_codes')
      .insert({
        code: inviteCode,
        created_by: decoded.userId,
        email: email || null,
        type: type || 'general',
        is_active: true,
        expires_at: expiryDate.toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json({
      message: 'Invite created successfully',
      invite: {
        code: invite.code,
        type: invite.type,
        expires_at: invite.expires_at
      }
    });
  } catch (error) {
    console.error('Create invite error:', error);
    res.status(500).json({ error: 'Failed to create invite' });
  }
}

// Get User Invites
async function handleGetInvites(req, res) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    const { data: invites, error } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('created_by', decoded.userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.status(200).json({ invites: invites || [] });
  } catch (error) {
    console.error('Get invites error:', error);
    res.status(500).json({ error: 'Failed to get invites' });
  }
}

// Get User Referrals
async function handleGetReferrals(req, res) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    const { data: referrals, error } = await supabase
      .from('referrals')
      .select(`
        *,
        referred_user:users!referrals_referred_id_fkey(username, email, created_at)
      `)
      .eq('referrer_id', decoded.userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.status(200).json({ referrals: referrals || [] });
  } catch (error) {
    console.error('Get referrals error:', error);
    res.status(500).json({ error: 'Failed to get referrals' });
  }
}

// Logout
async function handleLogout(req, res) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      // In a real app, you might want to blacklist the token
      // For now, just return success
    }
    
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
}

// Change Password
async function handleChangePassword(req, res) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Missing password fields' });
    }
    
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
    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    
    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', decoded.userId);
    
    if (updateError) throw updateError;
    
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
}

// Forgot Password
async function handleForgotPassword(req, res) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Check if user exists
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (user) {
      // In a real app, send reset email
      // For now, just return success
    }
    
    res.status(200).json({ message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
}

// Reset Password
async function handleResetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // In a real app, verify reset token
    // For now, just return success
    
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
}

// Helper functions
function generateReferralCode() {
  return 'REF' + Math.random().toString(36).substr(2, 8).toUpperCase();
}

function generateInviteCode() {
  return 'INV' + Math.random().toString(36).substr(2, 8).toUpperCase();
}
