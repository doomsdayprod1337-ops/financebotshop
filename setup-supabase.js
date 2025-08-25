import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase credentials
const supabaseUrl = 'https://auvflyzlryuikeeeuzkd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1dmZseXpscnl1aWtlZWV1emtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMDY2OTYsImV4cCI6MjA3MTU4MjY5Nn0.Y8TvngJt6Q5c6as-tbue3HVcUxeS99f0F_fZs-Wzpvc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  try {
    console.log('Setting up Supabase database...');

    // Create users table
    console.log('Creating users table...');
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          role VARCHAR(50) DEFAULT 'user',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `
    });
    if (usersError) console.error('Users table error:', usersError);

    // Create products table
    console.log('Creating products table...');
    const { error: productsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL,
          category VARCHAR(100),
          stock INTEGER DEFAULT 0,
          image_url VARCHAR(500),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `
    });
    if (productsError) console.error('Products table error:', productsError);

    // Create customers table
    console.log('Creating customers table...');
    const { error: customersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS customers (
          id SERIAL PRIMARY KEY,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          phone VARCHAR(20),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `
    });
    if (customersError) console.error('Customers table error:', customersError);

    // Create orders table
    console.log('Creating orders table...');
    const { error: ordersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          customer_id INTEGER REFERENCES customers(id),
          total_amount DECIMAL(10,2) NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `
    });
    if (ordersError) console.error('Orders table error:', ordersError);

    // Create order_items table
    console.log('Creating order_items table...');
    const { error: orderItemsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS order_items (
          id SERIAL PRIMARY KEY,
          order_id INTEGER REFERENCES orders(id),
          product_id INTEGER REFERENCES products(id),
          quantity INTEGER NOT NULL,
          unit_price DECIMAL(10,2) NOT NULL,
          total_price DECIMAL(10,2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `
    });
    if (orderItemsError) console.error('Order items table error:', orderItemsError);

    // Insert sample data
    console.log('Inserting sample data...');
    
    // Sample products
    const { error: sampleProductsError } = await supabase
      .from('products')
      .insert([
        {
          name: 'Burger Deluxe',
          description: 'Delicious beef burger with fresh vegetables',
          price: 12.99,
          category: 'Burgers',
          stock: 50
        },
        {
          name: 'Chicken Wings',
          description: 'Crispy chicken wings with special sauce',
          price: 9.99,
          category: 'Appetizers',
          stock: 30
        },
        {
          name: 'French Fries',
          description: 'Golden crispy french fries',
          price: 4.99,
          category: 'Sides',
          stock: 100
        }
      ]);
    
    if (sampleProductsError) {
      console.error('Sample products error:', sampleProductsError);
    } else {
      console.log('Sample products inserted successfully!');
    }

    console.log('Database setup completed!');
    
  } catch (error) {
    console.error('Setup error:', error);
  }
}

// Run the setup
setupDatabase();
