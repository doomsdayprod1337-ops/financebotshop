const express = require('express');
const { executeQuery } = require('../config/database-sqlite');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_PATH || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Get all products with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search, minPrice, maxPrice } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE is_active = 1';
    let params = [];
    
    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }
    
    if (search) {
      whereClause += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (minPrice) {
      whereClause += ' AND price >= ?';
      params.push(parseFloat(minPrice));
    }
    
    if (maxPrice) {
      whereClause += ' AND price <= ?';
      params.push(parseFloat(maxPrice));
    }
    
    // Get total count
    const countResult = executeQuery(
      `SELECT COUNT(*) as total FROM products ${whereClause}`,
      params
    );
    
    const total = countResult[0].total;
    
    // Get products
    const products = executeQuery(
      `SELECT * FROM products ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    
    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const products = executeQuery(
      'SELECT * FROM products WHERE id = ? AND is_active = 1',
      [id]
    );
    
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(products[0]);
    
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new product
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, stock_quantity, category } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }
    
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    
    const result = executeQuery(
      `INSERT INTO products (name, description, price, stock_quantity, category, image_url) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, description, parseFloat(price), parseInt(stock_quantity) || 0, category, image_url]
    );
    
    const newProduct = executeQuery(
      'SELECT * FROM products WHERE id = ?',
      [result.lastInsertRowid]
    );
    
    res.status(201).json({
      message: 'Product created successfully',
      product: newProduct[0]
    });
    
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock_quantity, category, is_active } = req.body;
    
    // Check if product exists
    const existingProducts = executeQuery(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );
    
    if (existingProducts.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const updateFields = [];
    const params = [];
    
    if (name !== undefined) {
      updateFields.push('name = ?');
      params.push(name);
    }
    
    if (description !== undefined) {
      updateFields.push('description = ?');
      params.push(description);
    }
    
    if (price !== undefined) {
      updateFields.push('price = ?');
      params.push(parseFloat(price));
    }
    
    if (stock_quantity !== undefined) {
      updateFields.push('stock_quantity = ?');
      params.push(parseInt(stock_quantity));
    }
    
    if (category !== undefined) {
      updateFields.push('category = ?');
      params.push(category);
    }
    
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      params.push(Boolean(is_active));
    }
    
    if (req.file) {
      updateFields.push('image_url = ?');
      params.push(`/uploads/${req.file.filename}`);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    params.push(id);
    
    executeQuery(
      `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );
    
    const updatedProduct = executeQuery(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );
    
    res.json({
      message: 'Product updated successfully',
      product: updatedProduct[0]
    });
    
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete product (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = executeQuery(
      'UPDATE products SET is_active = 0 WHERE id = ?',
      [id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully' });
    
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get product categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = executeQuery(
      'SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND is_active = 1 ORDER BY category'
    );
    
    res.json(categories.map(cat => cat.category));
    
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
