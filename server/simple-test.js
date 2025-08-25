const express = require('express');
const app = express();

app.use(express.json());

// Test the auth routes
try {
  console.log('Loading auth routes...');
  const authRoutes = require('./routes/auth');
  console.log('✅ Auth routes loaded successfully');
  
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes mounted at /api/auth');
  
  // Test endpoint
  app.get('/test', (req, res) => {
    res.json({ message: 'Test endpoint working' });
  });
  
  // Start server
  const PORT = 5001;
  app.listen(PORT, () => {
    console.log(`🧪 Test server running on port ${PORT}`);
    console.log(`📊 Test endpoint: http://localhost:${PORT}/test`);
    console.log(`🔐 Auth endpoint: http://localhost:${PORT}/api/auth/login`);
  });
  
} catch (error) {
  console.error('❌ Error:', error);
  console.error('Stack:', error.stack);
}
