const { initDatabase, testConnection } = require('../config/database');
require('dotenv').config();

const firstInit = async () => {
  console.log('🚀 Starting DurgerKingBot first initialization...\n');
  
  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    const connectionTest = await testConnection();
    
    if (!connectionTest) {
      console.error('❌ Cannot proceed without database connection');
      console.log('\n📋 Please check your .env file and ensure:');
      console.log('   - DB_HOST is correct');
      console.log('   - DB_USER has proper permissions');
      console.log('   - DB_PASSWORD is correct');
      console.log('   - Database exists or can be created');
      process.exit(1);
    }
    
    // Initialize database tables
    console.log('\n🗄️  Initializing database tables...');
    const initResult = await initDatabase();
    
    if (initResult) {
      console.log('\n✅ DurgerKingBot initialization completed successfully!');
      console.log('\n📱 Next steps:');
      console.log('   1. Start the server: npm start');
      console.log('   2. Access admin panel at: /admin');
      console.log('   3. Login with: admin / admin');
      console.log('\n🔧 To customize:');
      console.log('   - Edit .env file for configuration');
      console.log('   - Add your Telegram bot token');
      console.log('   - Configure database settings');
    } else {
      console.error('\n❌ Initialization failed. Please check the error messages above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Unexpected error during initialization:', error.message);
    process.exit(1);
  }
};

// Run if this file is executed directly
if (require.main === module) {
  firstInit();
}

module.exports = firstInit;
