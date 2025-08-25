const express = require('express');
const { executeQuery } = require('../config/database-sqlite');

const router = express.Router();

// Get all customers
router.get('/', async (req, res) => {
  try {
    const customers = executeQuery(`
      SELECT * FROM customers 
      ORDER BY created_at DESC
    `);
    
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const customers = executeQuery(`
      SELECT * FROM customers WHERE id = ?
    `, [id]);
    
    if (customers.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(customers[0]);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new customer
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, address, telegram_id } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }
    
    // Check if customer with same phone already exists
    const existing = executeQuery(`
      SELECT id FROM customers WHERE phone = ?
    `, [phone]);
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Customer with this phone number already exists' });
    }
    
    const result = executeQuery(`
      INSERT INTO customers (first_name, phone, email, telegram_id)
      VALUES (?, ?, ?, ?)
    `, [name, phone, email, telegram_id]);
    
    res.status(201).json({ 
      message: 'Customer created successfully', 
      customer_id: result.lastInsertRowid 
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address, telegram_id } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }
    
    // Check if phone is already taken by another customer
    const existing = executeQuery(`
      SELECT id FROM customers WHERE phone = ? AND id != ?
    `, [phone, id]);
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Phone number is already taken by another customer' });
    }
    
    const result = executeQuery(`
      UPDATE customers 
      SET first_name = ?, phone = ?, email = ?, telegram_id = ?
      WHERE id = ?
    `, [name, phone, email, telegram_id, id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json({ message: 'Customer updated successfully' });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if customer has any orders
    const orders = executeQuery(`
      SELECT id FROM orders WHERE customer_id = ?
    `, [id]);
    
    if (orders.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete customer with existing orders' 
      });
    }
    
    const result = executeQuery(`
      DELETE FROM customers WHERE id = ?
    `, [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get customer orders
router.get('/:id/orders', async (req, res) => {
  try {
    const { id } = req.params;
    
    const orders = executeQuery(`
      SELECT o.*, 
             p.name as product_name, oi.quantity
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.customer_id = ?
      ORDER BY o.created_at DESC
    `, [id]);
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
