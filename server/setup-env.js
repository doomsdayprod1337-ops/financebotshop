const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up Genesis Market Environment Variables...\n');

// Check if .env already exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists!');
  console.log('   If you want to recreate it, delete the existing file first.\n');
  process.exit(0);
}

// Create .env content with only essential variables
const envContent = `# ========================================
# GENESIS MARKET - ENVIRONMENT VARIABLES
# ========================================

# Supabase Database Configuration (REQUIRED)
SUPABASE_URL=https://auvflyzlryuikeeeuzkd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1dmZseXpscnl1aWtlZWV1emtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMDY2OTYsImV4cCI6MjA3MTU4MjY5Nn0.Y8TvngJt6Q5c6as-tbue3HVcUxeS99f0F_fZs-Wzpvc

# JWT Authentication (REQUIRED)
JWT_SECRET=4f1feeca525de4cdb064656007da3edac7895a87ff0ea865693300fb8b6e8f9c
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=development

# Security
BCRYPT_ROUNDS=12
`;

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log('📁 Location:', envPath);
  console.log('\n🔑 Environment Variables Set:');
  console.log('   ✅ Supabase URL & Key');
  console.log('   ✅ JWT Secret');
  console.log('   ✅ Server Configuration');
  console.log('   ✅ Security Settings');
  console.log('\n🚀 Your authentication system is ready to use!');
  console.log('\n⚠️  IMPORTANT: Never commit .env files to git!');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  process.exit(1);
}
