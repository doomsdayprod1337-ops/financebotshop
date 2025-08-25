const express = require('express');
const bcrypt = require('bcryptjs');
const { executeQuery } = require('../config/database-sqlite');

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = executeQuery(`
      SELECT id, username, email, role, is_active, created_at, updated_at
      FROM users 
      ORDER BY created_at DESC
    `);
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const users = executeQuery(`
      SELECT id, username, email, role, is_active, created_at, updated_at
      FROM users WHERE id = ?
    `, [id]);
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(users[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new user
router.post('/', async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    
    // Check if username already exists
    const existingUsername = executeQuery(`
      SELECT id FROM users WHERE username = ?
    `, [username]);
    
    if (existingUsername.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Check if email already exists
    const existingEmail = executeQuery(`
      SELECT id FROM users WHERE email = ?
    `, [email]);
    
    if (existingEmail.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const result = executeQuery(`
      INSERT INTO users (username, email, password, role, is_active)
      VALUES (?, ?, ?, ?, 1)
    `, [username, email, hashedPassword, role]);
    
    res.status(201).json({ 
      message: 'User created successfully', 
      user_id: result.lastInsertRowid 
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, is_active } = req.body;
    
    if (!username || !email) {
      return res.status(400).json({ error: 'Username and email are required' });
    }
    
    // Check if username is already taken by another user
    const existingUsername = executeQuery(`
      SELECT id FROM users WHERE username = ? AND id != ?
    `, [username, id]);
    
    if (existingUsername.length > 0) {
      return res.status(400).json({ error: 'Username is already taken by another user' });
    }
    
    // Check if email is already taken by another user
    const existingEmail = executeQuery(`
      SELECT id FROM users WHERE email = ? AND id != ?
    `, [email, id]);
    
    if (existingEmail.length > 0) {
      return res.status(400).json({ error: 'Email is already taken by another user' });
    }
    
    const result = executeQuery(`
      UPDATE users 
      SET username = ?, email = ?, role = ?, is_active = ?
      WHERE id = ?
    `, [username, email, role, is_active, id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change user password
router.patch('/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    const result = executeQuery(`
      UPDATE users 
      SET password = ?
      WHERE id = ?
    `, [hashedPassword, id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle user active status
router.patch('/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = executeQuery(`
      UPDATE users 
      SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END
      WHERE id = ?
    `, [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User status toggled successfully' });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = executeQuery(`
      DELETE FROM users WHERE id = ?
    `, [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
