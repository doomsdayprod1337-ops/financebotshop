const { initDatabase, testConnection } = require('../config/database-sqlite');

const initSQLite = async () => {
  console.log('🚀 Starting SQLite database initialization...\n');
  
  try {
    // Test database connection
    console.log('📡 Testing SQLite database connection...');
    const connectionTest = await testConnection();
    
    if (!connectionTest) {
      console.error('❌ Cannot proceed without database connection');
      process.exit(1);
    }
    
    // Initialize database tables
    console.log('\n🗄️  Initializing SQLite database tables...');
    const initResult = await initDatabase();
    
    if (initResult) {
      console.log('\n✅ SQLite database initialization completed successfully!');
      console.log('\n📱 Next steps:');
      console.log('   1. Start the server: npm run dev');
      console.log('   2. Access admin panel at: /admin');
      console.log('   3. Login with: admin / admin');
      console.log('\n🔧 Database file created at: server/database.sqlite');
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
  initSQLite();
}

module.exports = initSQLite;
