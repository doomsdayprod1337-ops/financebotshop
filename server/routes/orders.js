const express = require('express');
const { executeQuery } = require('../config/database-sqlite');

const router = express.Router();

// Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = executeQuery(`
      SELECT o.*, c.first_name as customer_name, c.phone as customer_phone
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC
    `);
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const orders = executeQuery(`
      SELECT o.*, c.first_name as customer_name, c.phone as customer_phone
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `, [id]);
    
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(orders[0]);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new order
router.post('/', async (req, res) => {
  try {
    const { customer_id, products, total_amount, status = 'pending', notes } = req.body;
    
    if (!customer_id || !products || !total_amount) {
      return res.status(400).json({ error: 'Customer ID, products, and total amount are required' });
    }
    
    const result = executeQuery(`
      INSERT INTO orders (customer_id, total_amount, status, notes)
      VALUES (?, ?, ?, ?)
    `, [customer_id, total_amount, status, notes]);
    
    const orderId = result.lastInsertRowid;
    
    // Insert order items
    for (const product of products) {
      executeQuery(`
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?)
      `, [orderId, product.product_id, product.quantity, product.price, product.price * product.quantity]);
    }
    
    res.status(201).json({ 
      message: 'Order created successfully', 
      order_id: orderId 
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const result = executeQuery(`
      UPDATE orders SET status = ?
      WHERE id = ?
    `, [status, id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete order
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete order items first
    executeQuery('DELETE FROM order_items WHERE order_id = ?', [id]);
    
    // Delete order
    const result = executeQuery('DELETE FROM orders WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
