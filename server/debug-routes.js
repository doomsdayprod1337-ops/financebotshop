const express = require('express');
const app = express();

app.use(express.json());

console.log('🔍 Debugging route loading...\n');

try {
  // Test 1: Load auth routes
  console.log('📋 Step 1: Loading auth routes...');
  const authRoutes = require('./routes/auth');
  console.log('✅ Auth routes loaded successfully');
  console.log('📊 Auth routes type:', typeof authRoutes);
  console.log('📊 Auth routes keys:', Object.keys(authRoutes));
  
  // Test 2: Check if it's a router
  if (authRoutes.stack) {
    console.log('✅ Auth routes is an Express router');
    console.log('📊 Number of routes:', authRoutes.stack.length);
    
    // Log all registered routes
    console.log('\n📋 Registered routes in auth:');
    authRoutes.stack.forEach((layer, index) => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods);
        const path = layer.route.path;
        console.log(`   ${index + 1}. ${methods.join(',').toUpperCase()} ${path}`);
      }
    });
  } else {
    console.log('❌ Auth routes is not an Express router');
    console.log('📊 Auth routes:', authRoutes);
  }
  
  // Test 3: Mount routes
  console.log('\n📋 Step 2: Mounting auth routes...');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes mounted at /api/auth');
  
  // Test 4: Check mounted routes
  console.log('\n📋 Step 3: Checking mounted routes...');
  if (app._router && app._router.stack) {
    console.log('📊 Total app routes:', app._router.stack.length);
    
    // Find the auth middleware
    const authMiddleware = app._router.stack.find(layer => 
      layer.regexp && layer.regexp.toString().includes('/api/auth')
    );
    
    if (authMiddleware) {
      console.log('✅ Found auth middleware');
      if (authMiddleware.handle && authMiddleware.handle.stack) {
        console.log('📊 Auth middleware routes:', authMiddleware.handle.stack.length);
        authMiddleware.handle.stack.forEach((layer, index) => {
          if (layer.route) {
            const methods = Object.keys(layer.route.methods);
            const path = layer.route.path;
            console.log(`   ${index + 1}. ${methods.join(',').toUpperCase()} ${path}`);
          }
        });
      }
    } else {
      console.log('❌ Auth middleware not found');
    }
  }
  
  // Test 5: Start server and test
  console.log('\n📋 Step 4: Starting test server...');
  const PORT = 5002;
  app.listen(PORT, () => {
    console.log(`🧪 Debug server running on port ${PORT}`);
    console.log(`📊 Test endpoint: http://localhost:${PORT}/api/auth/login`);
    console.log(`💡 Try making a POST request to test the login route`);
  });
  
} catch (error) {
  console.error('❌ Error during route loading:', error);
  console.error('Stack:', error.stack);
}
