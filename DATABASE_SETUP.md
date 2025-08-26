# Finance Shop Bot Database Setup Guide

This guide will help you set up your database for the Finance Shop Bot application.

## Database Options

### Option 1: Quick Setup (Recommended for testing)
Use `database-quick-setup.sql` for basic functionality:
- Users table (authentication)
- Products table
- Cart and orders
- Basic admin user

### Option 2: Full Setup
Use `database.sql` for complete functionality:
- All features including referrals, tickets, bots, etc.
- More comprehensive business logic
- Advanced features

### Option 3: Reset and Start Fresh
Use `database-reset.sql` to clear everything and start over.

## Setup Instructions

### For Supabase (Recommended)

1. **Go to your Supabase Dashboard**
   - Navigate to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Setup Script**
   - Copy and paste the content of your chosen SQL file
   - Click "Run" to execute

4. **Verify Setup**
   - Go to "Table Editor" in the left sidebar
   - You should see your new tables

### For Local PostgreSQL

1. **Connect to your database**
   ```bash
   psql -U your_username -d your_database_name
   ```

2. **Run the setup script**
   ```bash
   \i path/to/database-quick-setup.sql
   ```

3. **Verify tables were created**
   ```bash
   \dt
   ```

## Default Admin Account

After running the setup script, you'll have a default admin account:

- **Email**: `admin@admin.com`
- **Username**: `admin`
- **Password**: `admin123`

**⚠️ IMPORTANT**: Change this password immediately in production!

## Table Structure

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User accounts | id, email, username, password_hash |
| `products` | Available products | id, name, price, category |
| `cart` | Shopping cart | user_id, product_id, quantity |
| `orders` | User orders | user_id, total_amount, status |
| `order_items` | Order details | order_id, product_id, quantity |

### Additional Tables (Full Setup)

| Table | Purpose |
|-------|---------|
| `transactions` | Financial transactions |
| `referrals` | User referral system |
| `invites` | Invitation system |
| `tickets` | Support tickets |
| `services` | Available services |
| `bots` | Bot management |
| `credit_cards` | Payment methods |
| `deposits` | User deposits |
| `purchases` | Purchase history |

## Environment Variables

Make sure you have these environment variables set in your Netlify dashboard:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_secure_jwt_secret
```

## Testing Your Setup

After setup, test these endpoints:

1. **Database Connection**: `/api/test-connection`
2. **JWT Test**: `/api/jwt-test`
3. **User Lookup**: `/api/test-user-lookup`

## Troubleshooting

### Common Issues

1. **"relation does not exist"**
   - Make sure you ran the SQL script completely
   - Check for any error messages during execution

2. **Permission denied**
   - In Supabase, this is usually automatic
   - For local PostgreSQL, check user permissions

3. **UUID extension error**
   - The script includes `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`
   - This should work automatically in Supabase

### Reset if Needed

If something goes wrong:

1. Run `database-reset.sql` to clear everything
2. Run your chosen setup script again
3. Check the SQL Editor for any error messages

## Next Steps

After successful database setup:

1. **Test login** with the admin account
2. **Verify JWT tokens** are working
3. **Check user lookup** functionality
4. **Test basic CRUD operations**

## Support

If you encounter issues:

1. Check the Supabase logs in the dashboard
2. Verify all environment variables are set
3. Ensure the SQL script ran without errors
4. Check the table structure in Table Editor

## Security Notes

- Change default passwords immediately
- Use strong JWT secrets
- Regularly backup your database
- Monitor for suspicious activity
- Keep Supabase and dependencies updated
