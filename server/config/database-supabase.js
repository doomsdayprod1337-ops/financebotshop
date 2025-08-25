const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://auvflyzlryuikeeeuzkd.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1dmZseXpscnl1aWtlZWV1emtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMDY2OTYsImV4cCI6MjA3MTU4MjY5Nn0.Y8TvngJt6Q5c6as-tbue3HVcUxeS99f0F_fZs-Wzpvc';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Test database connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    
    console.log('✅ Supabase database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Supabase database connection failed:', error.message);
    return false;
  }
};

// Initialize database tables
const initDatabase = async () => {
  try {
    console.log('🗄️  Initializing Supabase database tables...');
    
    // Create users table
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id BIGSERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          email TEXT UNIQUE,
          role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'manager', 'user')),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (usersError) {
      console.log('Users table already exists or error:', usersError.message);
    }
    
    // Create products table
    const { error: productsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS products (
          id BIGSERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL,
          stock_quantity INTEGER DEFAULT 0,
          category TEXT,
          image_url TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (productsError) {
      console.log('Products table already exists or error:', productsError.message);
    }
    
    // Create customers table
    const { error: customersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS customers (
          id BIGSERIAL PRIMARY KEY,
          telegram_id BIGINT UNIQUE,
          username TEXT,
          first_name TEXT,
          last_name TEXT,
          phone TEXT,
          email TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (customersError) {
      console.log('Customers table already exists or error:', customersError.message);
    }
    
    // Create orders table
    const { error: ordersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS orders (
          id BIGSERIAL PRIMARY KEY,
          customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
          total_amount DECIMAL(10,2) NOT NULL,
          status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
          payment_method TEXT DEFAULT 'cash' CHECK(payment_method IN ('cash', 'card', 'telegram_pay')),
          delivery_address TEXT,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (ordersError) {
      console.log('Orders table already exists or error:', ordersError.message);
    }
    
    // Create order_items table
    const { error: orderItemsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS order_items (
          id BIGSERIAL PRIMARY KEY,
          order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          quantity INTEGER NOT NULL,
          unit_price DECIMAL(10,2) NOT NULL,
          total_price DECIMAL(10,2) NOT NULL
        );
      `
    });
    
    if (orderItemsError) {
      console.log('Order items table already exists or error:', orderItemsError.message);
    }
    
    // Create admin user if not exists
    const { data: existingAdmin } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'admin')
      .single();
    
    if (!existingAdmin) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin', 10);
      
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          username: 'admin',
          password: hashedPassword,
          email: 'admin@durgerkingbot.com',
          role: 'admin',
          is_active: true
        });
      
      if (insertError) {
        console.error('Error creating admin user:', insertError.message);
      } else {
        console.log('✅ Admin user created with username: admin, password: admin');
      }
    } else {
      console.log('✅ Admin user already exists');
    }
    
    console.log('✅ Supabase database tables initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Supabase database initialization failed:', error.message);
    return false;
  }
};

// Helper function to execute queries
const executeQuery = async (sql, params = []) => {
  try {
    // For Supabase, we'll use the query builder or RPC calls
    // This is a simplified version - you might want to use specific Supabase methods
    const { data, error } = await supabase.rpc('exec_sql', { sql, params });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
};

// Supabase-specific methods
const supabaseQuery = {
  // Users
  getUsers: () => supabase.from('users').select('*').order('created_at', { ascending: false }),
  getUserById: (id) => supabase.from('users').select('*').eq('id', id).single(),
  getUserByUsername: (username) => supabase.from('users').select('*').eq('username', username).single(),
  createUser: (userData) => supabase.from('users').insert(userData).select().single(),
  updateUser: (id, updates) => supabase.from('users').update(updates).eq('id', id).select().single(),
  deleteUser: (id) => supabase.from('users').delete().eq('id', id),
  
  // Products
  getProducts: (filters = {}) => {
    let query = supabase.from('products').select('*').eq('is_active', true);
    
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.search) query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    if (filters.minPrice) query = query.gte('price', filters.minPrice);
    if (filters.maxPrice) query = query.lte('price', filters.maxPrice);
    
    return query.order('created_at', { ascending: false });
  },
  getProductById: (id) => supabase.from('products').select('*').eq('id', id).eq('is_active', true).single(),
  createProduct: (productData) => supabase.from('products').insert(productData).select().single(),
  updateProduct: (id, updates) => supabase.from('products').update(updates).eq('id', id).select().single(),
  deleteProduct: (id) => supabase.from('products').update({ is_active: false }).eq('id', id),
  
  // Customers
  getCustomers: () => supabase.from('customers').select('*').order('created_at', { ascending: false }),
  getCustomerById: (id) => supabase.from('customers').select('*').eq('id', id).single(),
  getCustomerByTelegramId: (telegramId) => supabase.from('customers').select('*').eq('telegram_id', telegramId).single(),
  createCustomer: (customerData) => supabase.from('customers').insert(customerData).select().single(),
  updateCustomer: (id, updates) => supabase.from('customers').update(updates).eq('id', id).select().single(),
  deleteCustomer: (id) => supabase.from('customers').delete().eq('id', id),
  
  // Orders
  getOrders: () => supabase.from('orders').select(`
    *,
    customers!inner(first_name, phone)
  `).order('created_at', { ascending: false }),
  getOrderById: (id) => supabase.from('orders').select(`
    *,
    customers!inner(first_name, phone)
  `).eq('id', id).single(),
  createOrder: (orderData) => supabase.from('orders').insert(orderData).select().single(),
  updateOrder: (id, updates) => supabase.from('orders').update(updates).eq('id', id).select().single(),
  deleteOrder: (id) => supabase.from('orders').delete().eq('id', id),
  
  // Order Items
  createOrderItem: (itemData) => supabase.from('order_items').insert(itemData).select().single(),
  deleteOrderItems: (orderId) => supabase.from('order_items').delete().eq('order_id', orderId)
};

module.exports = {
  supabase,
  testConnection,
  initDatabase,
  executeQuery,
  supabaseQuery
};
