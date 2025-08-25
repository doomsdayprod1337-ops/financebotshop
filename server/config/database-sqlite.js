const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

// Create database file in the server directory
const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Test database connection
const testConnection = async () => {
  try {
    // Test if we can execute a simple query
    db.prepare('SELECT 1').get();
    console.log('✅ SQLite database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ SQLite database connection failed:', error.message);
    return false;
  }
};

// Initialize database tables
const initDatabase = async () => {
  try {
    // Create users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT UNIQUE,
        role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'manager', 'user')),
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create products table
    db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        stock_quantity INTEGER DEFAULT 0,
        category TEXT,
        image_url TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create customers table
    db.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER UNIQUE,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        phone TEXT,
        email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create orders table
    db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        total_amount REAL NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
        payment_method TEXT DEFAULT 'cash' CHECK(payment_method IN ('cash', 'card', 'telegram_pay')),
        delivery_address TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
      )
    `);

    // Create order_items table
    db.exec(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // Create admin user if not exists
    const adminUser = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
    
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('admin', 10);
      
      db.prepare(`
        INSERT INTO users (username, password, email, role) 
        VALUES (?, ?, ?, ?)
      `).run('admin', hashedPassword, 'admin@durgerkingbot.com', 'admin');
      
      console.log('✅ Admin user created with username: admin, password: admin');
    }

    console.log('✅ SQLite database tables initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ SQLite database initialization failed:', error.message);
    return false;
  }
};

// Helper function to execute queries
const executeQuery = (sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return stmt.all(params);
    } else {
      return stmt.run(params);
    }
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
};

module.exports = {
  db,
  testConnection,
  initDatabase,
  executeQuery
};
