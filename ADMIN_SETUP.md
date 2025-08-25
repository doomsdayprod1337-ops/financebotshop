# 🔐 Genesis Market Admin Panel Setup Guide

## Default Admin Credentials

Your admin panel is pre-configured with the following default credentials:

**Email:** `admin@admin.com`  
**Password:** `admin`

## 🚀 Quick Access

### Option 1: Direct Admin Login
Navigate to: `http://localhost:3001/admin-login`

### Option 2: From Main Login
1. Go to: `http://localhost:3001/login`
2. Click the "Admin Access →" link at the bottom
3. Use the default credentials above

### Option 3: Auto-Fill Feature
On the admin login page, click the "🔑 Auto-Fill Credentials" button to automatically populate the login form.

## 📋 Admin Panel Features

Once logged in, you'll have access to:

- **Dashboard** - Overview of users, orders, and revenue
- **User Management** - View, edit, and manage all users
- **Order Management** - Monitor and manage orders
- **System Settings** - Configure site-wide settings

## 🔧 Environment Setup

Create a `.env` file in your `server` directory with:

```env
# Supabase Configuration
SUPABASE_URL=https://ayhonffdppvuxryfgkfn.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5aG9uZmZkcHB2dXhyeWZna2ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMTkwMTQsImV4cCI6MjA3MTU5NTAxNH0.ClvlPrC64QgqKlaFkOyMzj8KMnbArddZWe_e-IPyDDo
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# JWT Configuration
JWT_SECRET=GenesisMarketSecretKey2024!@#

# Server Configuration
PORT=5000
NODE_ENV=development

# Default Admin Credentials
DEFAULT_ADMIN_EMAIL=admin@admin.com
DEFAULT_ADMIN_PASSWORD=admin
```

## ⚠️ Security Recommendations

1. **Change Default Password** - Immediately change the default password after first login
2. **Use Strong Password** - Choose a complex password with special characters
3. **Enable 2FA** - Consider implementing two-factor authentication
4. **Regular Updates** - Keep your admin credentials updated regularly
5. **Access Control** - Limit admin access to trusted personnel only

## 🆘 Troubleshooting

### Can't Access Admin Panel?
1. Ensure your server is running (`npm run dev`)
2. Check that the admin account exists (`npm run create-admin`)
3. Verify your `.env` file has the correct JWT_SECRET
4. Clear browser cache and try again

### Login Fails?
1. Verify the credentials are exactly: `admin@admin.com` / `admin`
2. Check server console for error messages
3. Ensure database connection is working
4. Verify JWT_SECRET is set in your environment

### Admin Account Missing?
Run this command in your server directory:
```bash
npm run create-admin
```

## 📱 Admin Panel URLs

- **Admin Login:** `/admin-login`
- **Admin Panel:** `/admin`
- **Main Site:** `/`

## 🔒 Admin Role Permissions

Users with `role: 'admin'` can:
- Access all admin panel features
- Manage user accounts and roles
- View system statistics and logs
- Modify system settings
- Delete user accounts (except their own)
- Access order management

## 📞 Support

If you encounter issues:
1. Check the server console for error messages
2. Verify all environment variables are set
3. Ensure database tables exist and are accessible
4. Check that the admin user exists in your database

---

**Remember:** Keep your admin credentials secure and change the default password immediately after first login!
