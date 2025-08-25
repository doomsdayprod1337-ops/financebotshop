# 🔑 Environment Variables Setup Guide

## Quick Setup

Run this command in your `server` folder to create the `.env` file:

```bash
cd server
node setup-env.js
```

## Required Environment Variables

### 1. **Supabase Database (REQUIRED)**
```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

**How to get these:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings → API
4. Copy the values

### 2. **JWT Authentication (REQUIRED)**
```bash
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRES_IN=24h
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Optional Variables

### 3. **Email Configuration**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@genesismarket.com
```

### 4. **Security**
```bash
BCRYPT_ROUNDS=12
SESSION_SECRET=another-super-secret-session-key
```

### 5. **Rate Limiting**
```bash
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

## Minimum Required Setup

For basic authentication to work, you only need:

```bash
# Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# JWT
JWT_SECRET=your-generated-secret-key-here
```

## Testing Your Setup

1. **Create the .env file:**
   ```bash
   cd server
   node setup-env.js
   ```

2. **Edit the .env file** with your actual values

3. **Test the connection:**
   ```bash
   node -e "
   require('dotenv').config();
   console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
   console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
   "
   ```

## Troubleshooting

### "Missing environment variables" error
- Make sure `.env` file is in the `server` folder
- Check that variable names match exactly (no spaces around `=`)
- Restart your server after making changes

### "Invalid Supabase credentials" error
- Verify your Supabase URL and keys
- Check that your Supabase project is active
- Ensure the keys have the right permissions

### "JWT verification failed" error
- Generate a new JWT_SECRET
- Make sure it's at least 32 characters long
- Restart your server after changing

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env` files to git
- Use strong, random secrets
- Keep your Supabase keys secure
- Rotate secrets regularly in production
