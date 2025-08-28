# 💰 Enhanced Deposit System

This document describes the enhanced cryptocurrency deposit system that provides users with a seamless experience for selecting cryptocurrencies, creating deposits, and tracking blockchain confirmations.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [User Flow](#user-flow)
- [Components](#components)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Setup Instructions](#setup-instructions)
- [Usage Guide](#usage-guide)
- [Technical Details](#technical-details)
- [Troubleshooting](#troubleshooting)

## 🌟 Overview

The enhanced deposit system provides users with:

1. **Cryptocurrency Selection**: Choose from admin-enabled cryptocurrencies
2. **Deposit Creation**: Create deposits with pre-filled amounts from cart
3. **Wallet Address Display**: Clear wallet address with copy functionality
4. **Confirmation Tracking**: Real-time blockchain confirmation monitoring
5. **Automatic Balance Updates**: Balance updates after 4 confirmations

## ✨ Features

### **Crypto Selection Window**
- **Visual currency picker** with radio button selection
- **Currency information display** (min/max amounts, network fees)
- **Auto-selection** of first available currency
- **Admin-configured** enabled currencies only

### **Deposit Creation**
- **Pre-filled amounts** from cart checkout
- **Automatic wallet address** generation
- **24-hour expiration** for deposit requests
- **Network fee calculation** per currency

### **Confirmation Tracking**
- **4-block confirmation** requirement (configurable)
- **Real-time progress bar** showing confirmation status
- **Automatic polling** every 30 seconds
- **Status updates** from pending to confirmed

### **User Experience**
- **Copy wallet address** with one click
- **Clear instructions** for payment completion
- **Progress visualization** for confirmations
- **Automatic page refresh** after confirmation

## 🔄 User Flow

### **Complete Flow**
```
1. User adds items to cart
2. Clicks Checkout
3. System checks wallet balance
4. If insufficient funds → Shows Insufficient Funds Modal
5. User clicks "💰 Make a Deposit"
6. Shows Deposit Creation Modal
7. User selects cryptocurrency
8. Clicks "Create Deposit"
9. System creates deposit record
10. Shows wallet address and confirmation tracker
11. User sends crypto to wallet address
12. System tracks blockchain confirmations
13. After 4 confirmations → Deposit confirmed
14. User balance updated automatically
15. User can complete purchase
```

### **Detailed Steps**

#### **Step 1: Insufficient Funds Detection**
- Cart total: $50.00
- User balance: $25.00
- Shortfall: $25.00
- Modal shows with multiple options

#### **Step 2: Crypto Selection**
- User sees enabled cryptocurrencies
- Each currency shows limits and fees
- User selects preferred option
- System validates selection

#### **Step 3: Deposit Creation**
- System creates deposit record
- Generates wallet address
- Sets 24-hour expiration
- Returns deposit details

#### **Step 4: Payment Instructions**
- Clear wallet address display
- Copy button for easy access
- Step-by-step payment guide
- Confirmation tracker

#### **Step 5: Confirmation Monitoring**
- Real-time confirmation count
- Progress bar visualization
- Automatic status updates
- Balance update notification

## 🧩 Components

### **1. DepositCreationModal** (`DepositCreationModal.jsx`)
**Purpose**: Main component for deposit creation and confirmation tracking

**Features**:
- Two-step process (selection → confirmation)
- Real-time confirmation monitoring
- Copy wallet address functionality
- Progress visualization

**Props**:
```jsx
<DepositCreationModal
  isOpen={boolean}
  onClose={function}
  requiredAmount={number}
  currentBalance={number}
  itemName={string}
/>
```

### **2. InsufficientFundsModal** (`InsufficientFundsModal.jsx`)
**Purpose**: Shows when users don't have enough balance

**Features**:
- Clear balance comparison
- Multiple action options
- Integration with deposit creation

### **3. Layout Component** (`Layout.jsx`)
**Purpose**: Manages modal states and cart integration

**Features**:
- Modal state management
- Cart checkout handling
- Balance validation

## 🔌 API Endpoints

### **1. Create Deposit** - `POST /api/create-deposit`
Creates a new cryptocurrency deposit request.

**Request Body**:
```json
{
  "amount": 50.00,
  "currency": "BTC",
  "payment_processor": "manual"
}
```

**Response**:
```json
{
  "success": true,
  "deposit": {
    "id": "uuid",
    "amount": "0.00123456",
    "currency": "BTC",
    "status": "pending",
    "wallet_address": "bc1q...",
    "required_confirmations": 4,
    "expires_at": "2024-01-01T00:00:00Z"
  },
  "instructions": "Send payment to the address below...",
  "message": "Deposit created successfully"
}
```

### **2. Get Deposit** - `GET /api/get-deposit/{id}`
Retrieves a specific deposit for confirmation tracking.

**Response**:
```json
{
  "success": true,
  "deposit": {
    "id": "uuid",
    "status": "pending",
    "confirmation_blocks": 2,
    "required_confirmations": 4,
    "wallet_address": "bc1q..."
  }
}
```

### **3. Get Deposits** - `GET /api/deposits`
Retrieves user's deposit history.

## 🗄️ Database Schema

### **Deposits Table**
```sql
CREATE TABLE deposits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(20,8) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    payment_processor VARCHAR(50) DEFAULT 'manual',
    status VARCHAR(50) DEFAULT 'pending',
    transaction_hash VARCHAR(255),
    wallet_address VARCHAR(255),
    network_fee DECIMAL(20,8) DEFAULT 0,
    confirmation_blocks INTEGER DEFAULT 0,
    required_confirmations INTEGER DEFAULT 4,
    expires_at TIMESTAMP,
    confirmed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Key Fields**
- **`confirmation_blocks`**: Current blockchain confirmations
- **`required_confirmations`**: Required confirmations (default: 4)
- **`expires_at`**: 24-hour expiration timestamp
- **`status`**: pending → confirmed → failed/expired

## 🚀 Setup Instructions

### **Step 1: Database Setup**
Ensure the deposits table exists with the correct schema:
```sql
-- Run the database-complete-setup.sql script
-- This creates all necessary tables and indexes
```

### **Step 2: Admin Configuration**
1. Navigate to **Admin Panel → 💰 Wallet Settings**
2. Enable desired cryptocurrencies
3. Set wallet addresses for each currency
4. Configure min/max amounts and network fees
5. Save settings

### **Step 3: Deploy API Functions**
Ensure these Netlify functions are deployed:
- `create-deposit.js`
- `get-deposit.js`
- `deposits.js`
- `admin-settings.js`

### **Step 4: Test the System**
1. Add items to cart
2. Attempt checkout with insufficient funds
3. Create a test deposit
4. Verify confirmation tracking

## 📖 Usage Guide

### **For Users**

#### **Creating a Deposit from Cart**
1. **Add items to cart** and click Checkout
2. **If insufficient funds** → Click "💰 Make a Deposit"
3. **Select cryptocurrency** from enabled options
4. **Click "Create Deposit"**
5. **Copy wallet address** and send payment
6. **Wait for 4 confirmations**
7. **Balance updates automatically**

#### **Payment Instructions**
1. **Copy the wallet address** using the copy button
2. **Send exactly the specified amount** from your crypto wallet
3. **Include your order ID** in the memo/note field
4. **Wait for blockchain confirmations**
5. **Monitor progress** in the confirmation tracker

### **For Administrators**

#### **Wallet Configuration**
1. **Enable currencies** you want to support
2. **Set wallet addresses** for each currency
3. **Configure limits** (min/max amounts)
4. **Set network fees** per currency
5. **Test with small amounts** first

#### **Monitoring Deposits**
- View all user deposits in admin panel
- Monitor confirmation status
- Handle failed or expired deposits
- Review transaction hashes

## 🔧 Technical Details

### **Confirmation Tracking**
- **Polling interval**: 30 seconds
- **Required confirmations**: 4 (configurable)
- **Status updates**: Real-time via API calls
- **Automatic refresh**: After confirmation completion

### **Security Features**
- **JWT authentication** for all API calls
- **User isolation** (users only see their deposits)
- **Input validation** for amounts and currencies
- **Rate limiting** on API endpoints

### **Error Handling**
- **Network errors**: Graceful fallback
- **Invalid amounts**: Clear error messages
- **Currency validation**: Admin-configured only
- **Expired deposits**: Automatic status updates

## 🐛 Troubleshooting

### **Common Issues**

#### **Deposit Not Creating**
- **Cause**: Currency not enabled in admin settings
- **Solution**: Enable currency in Admin Panel → Wallet Settings

#### **Confirmation Not Updating**
- **Cause**: API endpoint not responding
- **Solution**: Check Netlify function logs and database connection

#### **Wallet Address Not Showing**
- **Cause**: Deposit creation failed
- **Solution**: Check browser console and API response

#### **Balance Not Updating**
- **Cause**: Confirmations not reaching required count
- **Solution**: Verify blockchain confirmations and webhook processing

### **Debug Steps**
1. **Check browser console** for JavaScript errors
2. **Review Netlify function logs** for API errors
3. **Verify database records** for deposit status
4. **Test API endpoints** with Postman/curl
5. **Check admin wallet settings** configuration

### **Log Locations**
- **Frontend**: Browser console
- **Backend**: Netlify function logs
- **Database**: Supabase logs
- **Blockchain**: Transaction explorer

## 🔮 Future Enhancements

### **Planned Features**
- **Payment processor integration** (Coinbase, NowPayments, BitPay)
- **Real-time webhook updates** for faster confirmations
- **Multi-currency conversion** display
- **Mobile app support** for deposit tracking

### **Integration Opportunities**
- **Hardware wallet support** (Ledger, Trezor)
- **DeFi protocol integration** for yield farming
- **Cross-chain bridges** for multi-blockchain support
- **Smart contract automation** for escrow services

## 📞 Support

For technical support or questions about the enhanced deposit system:

1. **Check the logs** for error messages
2. **Review this documentation** for setup instructions
3. **Test with small amounts** before large deposits
4. **Verify admin settings** are correctly configured
5. **Check blockchain confirmations** manually if needed

---

**⚠️ Important Notes:**
- Always test with small amounts first
- Monitor webhook delivery and processing
- Keep wallet addresses secure and backup configurations
- Stay updated with payment processor changes
- Verify blockchain confirmations independently

**🔗 Related Documentation:**
- [Crypto Payment Selection System](../CRYPTO_PAYMENT_SELECTION_README.md)
- [Admin Settings Setup](../admin-settings-setup.sql)
- [Database Complete Setup](../database-complete-setup.sql)
- [Netlify Deployment Guide](../NETLIFY_DEPLOYMENT_GUIDE.md)
