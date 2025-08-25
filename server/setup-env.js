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

// Create .env content
const envContent = `# ========================================
# GENESIS MARKET - ENVIRONMENT VARIABLES
# ========================================

# Supabase Database Configuration (REQUIRED)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# JWT Authentication (REQUIRED)
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=development
HOST=localhost

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=another-super-secret-session-key

# Email Configuration (for password reset, notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@genesismarket.com

# File Upload (if needed)
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Bot Configuration (if using Telegram bot)
BOT_ID=your_bot_id_here
SECRET_TOKEN=your_secret_token_here

# External APIs
BINLIST_API_URL=https://lookup.binlist.net
BINLIST_API_KEY=your_binlist_api_key_here

# Payment Configuration (if using payment gateways)
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret

# Monitoring and Logging
LOG_LEVEL=info
SENTRY_DSN=your_sentry_dsn_here

# Feature Flags
ENABLE_REGISTRATION=true
ENABLE_INVITE_SYSTEM=true
ENABLE_REFERRAL_SYSTEM=true
ENABLE_EMAIL_VERIFICATION=false
ENABLE_2FA=false

# Database Connection Pool
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_IDLE_TIMEOUT=30000
`;

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log('📁 Location:', envPath);
  console.log('\n🔑 NEXT STEPS:');
  console.log('1. Edit the .env file and replace the placeholder values');
  console.log('2. Get your Supabase credentials from your project dashboard');
  console.log('3. Generate a strong JWT_SECRET (you can use: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))")');
  console.log('4. Restart your server after making changes');
  console.log('\n⚠️  IMPORTANT: Never commit .env files to git!');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  process.exit(1);
}
