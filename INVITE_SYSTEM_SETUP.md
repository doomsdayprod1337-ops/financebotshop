# 🎉 Genesis Market Invite System Setup Guide

## 🔑 Default Invite Code: GRANDOPEN

Your Genesis Market is now configured with a default invite code **"GRANDOPEN"** that provides unlimited access for new users.

## 🚀 Quick Setup Options

### Option 1: Run the Script (Recommended)
```bash
cd server
npm run create-invite-code
```

### Option 2: Manual Database Setup
Run the SQL script in your Supabase SQL Editor:
```sql
-- Copy and paste the contents of server/scripts/inviteCodesTable.sql
```

## 📋 What Gets Created

### 1. **invite_codes Table**
- Stores all invite codes and their properties
- Tracks usage limits and expiration dates
- Manages discounts and bonus credits

### 2. **invite_usage Table**
- Tracks who used which invite codes
- Records IP addresses and user agents
- Prevents duplicate usage per user

### 3. **Default GRANDOPEN Code**
- **Code:** `GRANDOPEN`
- **Description:** Grand Opening Invite Code - Unlimited Access
- **Max Uses:** Unlimited (-1)
- **Expires:** Never
- **Status:** Active
- **Discount:** 0%
- **Bonus Credits:** $0

### 4. **Additional Sample Codes**
- **VIP2024:** Limited to 100 users, 10% discount, $50 bonus
- **EARLYBIRD:** Limited to 500 users, 50% discount, $25 bonus
- **FRIEND:** Limited to 1000 users, 25% discount, $10 bonus

## 🔧 Database Structure

```sql
-- Main invite codes table
CREATE TABLE invite_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    max_uses INTEGER DEFAULT -1, -- -1 = unlimited
    current_uses INTEGER DEFAULT 0,
    created_by VARCHAR(100) DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    bonus_credits DECIMAL(10,2) DEFAULT 0,
    is_public BOOLEAN DEFAULT false,
    allowed_roles TEXT[] DEFAULT ARRAY['user']
);

-- Usage tracking table
CREATE TABLE invite_usage (
    id SERIAL PRIMARY KEY,
    invite_code_id INTEGER REFERENCES invite_codes(id),
    user_id INTEGER REFERENCES users(id),
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    UNIQUE(invite_code_id, user_id)
);
```

## 🎯 Frontend Integration

### Registration Page
- **Prominent display** of GRANDOPEN code
- **One-click auto-fill** button
- **Visual indicators** for unlimited access
- **Professional styling** with gradients

### Admin Panel
- **Invite code management** interface
- **Usage statistics** and tracking
- **Create/Edit/Delete** invite codes
- **User registration** monitoring

## 🔒 Security Features

### Row Level Security (RLS)
- **Public access** to active invite codes
- **Admin-only** management of codes
- **User privacy** protection
- **Audit trail** for all changes

### Usage Tracking
- **IP address logging** for security
- **User agent recording** for analytics
- **Duplicate prevention** per user
- **Timestamp tracking** for audits

## 📱 How Users Register

1. **Visit registration page** (`/register`)
2. **See GRANDOPEN code** prominently displayed
3. **Click "Use GRANDOPEN Code"** button
4. **Form auto-fills** with the code
5. **Complete registration** with other details
6. **Access granted** immediately

## 🎨 Customization Options

### Invite Code Properties
- **Usage limits** (unlimited, specific number)
- **Expiration dates** (never, specific date)
- **Discount percentages** (0-100%)
- **Bonus credits** (any amount)
- **Public visibility** (public/private)
- **Role restrictions** (user, admin, etc.)

### Visual Styling
- **Color schemes** (green for success, red for limited)
- **Icons and emojis** for better UX
- **Responsive design** for all devices
- **Dark theme** integration

## 🚀 Next Steps

### 1. **Set Up Database**
```bash
# Run the invite code creation script
npm run create-invite-code
```

### 2. **Test Registration**
- Go to `/register`
- Verify GRANDOPEN code is displayed
- Test the auto-fill functionality
- Complete a test registration

### 3. **Customize Codes**
- Modify existing codes in Supabase
- Create new codes for different purposes
- Set up expiration dates and limits
- Configure discounts and bonuses

### 4. **Monitor Usage**
- Check admin panel for statistics
- Track code usage patterns
- Monitor user registration flow
- Analyze conversion rates

## 🆘 Troubleshooting

### Invite Code Not Working?
1. **Check database** - ensure table exists
2. **Verify code** - confirm GRANDOPEN is active
3. **Check permissions** - ensure RLS policies are correct
4. **Restart server** - after database changes

### Registration Fails?
1. **Validate invite code** - check if it's active
2. **Check usage limits** - ensure code hasn't expired
3. **Verify database** - confirm all tables exist
4. **Check server logs** - for error messages

### Admin Access Issues?
1. **Verify admin role** - ensure user has admin privileges
2. **Check RLS policies** - confirm admin policies are active
3. **Database permissions** - ensure proper grants are set
4. **JWT configuration** - verify JWT_SECRET is set

## 📊 Analytics & Monitoring

### Track These Metrics
- **Registration conversion** rates
- **Invite code usage** patterns
- **User acquisition** sources
- **Code effectiveness** by type
- **Geographic distribution** of users

### Admin Dashboard Features
- **Real-time statistics** for all codes
- **Usage graphs** and charts
- **User registration** timeline
- **Code performance** metrics
- **Revenue impact** analysis

---

## 🎉 **Ready to Launch!**

Your Genesis Market now has a professional invite system with:
- ✅ **Default GRANDOPEN code** for unlimited access
- ✅ **Secure database structure** with RLS protection
- ✅ **Beautiful frontend integration** with auto-fill
- ✅ **Comprehensive admin controls** for management
- ✅ **Usage tracking** and analytics
- ✅ **Professional styling** and UX

**Users can now register using: `GRANDOPEN`** 🚀
