const express = require('express');
const app = express();

console.log('Testing route loading...');

try {
  console.log('Loading auth routes...');
  const authRoutes = require('./routes/auth');
  console.log('✅ Auth routes loaded successfully');
  
  console.log('Loading admin routes...');
  const adminRoutes = require('./routes/admin');
  console.log('✅ Admin routes loaded successfully');
  
  console.log('Setting up routes...');
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  console.log('✅ Routes set up successfully');
  
  console.log('All routes loaded successfully!');
  
} catch (error) {
  console.error('❌ Error loading routes:', error);
  console.error('Error details:', {
    message: error.message,
    stack: error.stack
  });
}
