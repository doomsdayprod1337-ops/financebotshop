# 🪙 Crypto Payment Selection System

This document describes the enhanced cryptocurrency payment selection system that allows users to choose their preferred crypto payment method and handles insufficient funds scenarios.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Components](#components)
- [User Flow](#user-flow)
- [Integration Points](#integration-points)
- [Usage Examples](#usage-examples)
- [Technical Details](#technical-details)

## 🌟 Overview

The crypto payment selection system enhances the user experience by:
1. **Allowing users to choose their preferred cryptocurrency** when making deposits
2. **Automatically detecting insufficient funds** during checkout
3. **Providing a seamless flow** from insufficient funds to crypto deposit creation
4. **Pre-selecting currency and amount** when coming from cart checkout

## ✨ Features

### **Crypto Payment Selection**
- **Multi-currency support** with visual icons and limits
- **Auto-selection** of first available currency
- **Currency limits display** (min/max amounts, network fees)
- **Payment processor integration** ready for future expansion

### **Insufficient Funds Handling**
- **Automatic detection** of insufficient wallet balance
- **Clear messaging** showing required amount vs. current balance
- **Multiple action options** (make deposit, view balance, choose crypto)
- **Seamless navigation** to deposit creation

### **Smart Deposit Creation**
- **Pre-filled forms** when coming from cart checkout
- **Context-aware messaging** showing purchase details
- **One-click navigation** back to cart after deposit

## 🧩 Components

### **1. CryptoPaymentModal** (`CryptoPaymentModal.jsx`)
**Purpose**: Allows users to select their preferred cryptocurrency for payment

**Features**:
- Visual currency selection with radio buttons
- Currency limits and network fee display
- Balance vs. required amount comparison
- Auto-selection of first enabled currency

**Props**:
```jsx
<CryptoPaymentModal
  isOpen={boolean}
  onClose={function}
  onConfirm={function(selectedCurrency)}
  requiredAmount={number}
  currentBalance={number}
/>
```

### **2. InsufficientFundsModal** (`InsufficientFundsModal.jsx`)
**Purpose**: Shows when users don't have enough balance for a purchase

**Features**:
- Clear display of required vs. current balance
- Shortfall calculation
- Multiple action buttons
- Integration with crypto payment selection

**Props**:
```jsx
<InsufficientFundsModal
  isOpen={boolean}
  onClose={function}
  requiredAmount={number}
  currentBalance={number}
  itemName={string}
  onShowCryptoOptions={function}
/>
```

### **3. Wallet Utilities** (`walletUtils.js`)
**Purpose**: Centralized wallet-related functions

**Functions**:
- `checkWalletBalance()` - Check if user has sufficient funds
- `calculateShortfall()` - Calculate how much more is needed
- `formatWalletBalance()` - Format balance for display
- `processCheckout()` - Handle checkout with balance validation

## 🔄 User Flow

### **Scenario 1: Sufficient Funds**
```
User adds items to cart → Clicks Checkout → 
Balance check passes → Proceeds to checkout
```

### **Scenario 2: Insufficient Funds**
```
User adds items to cart → Clicks Checkout → 
Balance check fails → Insufficient Funds Modal appears
```

**User Options**:
1. **💰 Make a Deposit** → Navigate to deposits page
2. **👛 View Wallet Balance** → Navigate to profile page  
3. **🪙 Choose Crypto Payment** → Show crypto selection modal
4. **Cancel** → Close modal

### **Scenario 3: Crypto Payment Selection**
```
Insufficient Funds Modal → Choose Crypto Payment → 
Crypto Payment Modal → Select Currency → 
Navigate to Deposits (pre-filled)
```

### **Scenario 4: Deposit Creation**
```
Deposits page → Pre-filled form → 
Create deposit → Return to cart
```

## 🔌 Integration Points

### **Layout Component**
The main integration point that manages modal states and cart checkout:

```jsx
// Modal states
const [showInsufficientFundsModal, setShowInsufficientFundsModal] = useState(false);
const [showCryptoPaymentModal, setShowCryptoPaymentModal] = useState(false);
const [checkoutItem, setCheckoutItem] = useState(null);

// Checkout handler with balance validation
const handleCheckout = () => {
  const totalCost = cartTotal;
  const userBalance = user?.wallet_balance || 0;
  
  if (userBalance >= totalCost) {
    // Proceed to checkout
    console.log('Proceeding to checkout...');
  } else {
    // Show insufficient funds modal
    setCheckoutItem({ totalCost, userBalance, itemName: `Cart Total (${cart.length} items)` });
    setShowInsufficientFundsModal(true);
  }
};
```

### **Deposits Page**
Enhanced to handle pre-selected currency and amount:

```jsx
// Check for pre-selected values from navigation
const preSelectedCurrency = location.state?.selectedCurrency;
const preSelectedAmount = location.state?.amount;

// Auto-show form if pre-selected
useEffect(() => {
  if (preSelectedCurrency && preSelectedAmount) {
    setFormData({
      amount: preSelectedAmount.toString(),
      currency: preSelectedCurrency,
      payment_processor: 'manual'
    });
    setShowCreateForm(true);
  }
}, [preSelectedCurrency, preSelectedAmount]);
```

## 📖 Usage Examples

### **Basic Integration**
```jsx
import { checkWalletBalance, processCheckout } from '../utils/walletUtils';

// Check balance before purchase
const canPurchase = checkWalletBalance(itemPrice, userBalance);

// Process checkout with automatic handling
const result = processCheckout(totalCost, userBalance, cart, setModalState);
if (result.success) {
  // Proceed with purchase
} else {
  // Modal will be shown automatically
}
```

### **Custom Insufficient Funds Handling**
```jsx
import InsufficientFundsModal from '../components/InsufficientFundsModal';

const [showModal, setShowModal] = useState(false);
const [checkoutDetails, setCheckoutDetails] = useState(null);

// Show modal when needed
const handlePurchase = () => {
  if (userBalance < itemPrice) {
    setCheckoutDetails({
      totalCost: itemPrice,
      userBalance,
      itemName: item.name
    });
    setShowModal(true);
  }
};

// Render modal
<InsufficientFundsModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  requiredAmount={checkoutDetails?.totalCost}
  currentBalance={checkoutDetails?.userBalance}
  itemName={checkoutDetails?.itemName}
/>
```

### **Crypto Payment Selection**
```jsx
import CryptoPaymentModal from '../components/CryptoPaymentModal';

const [showCryptoModal, setShowCryptoModal] = useState(false);

const handleCryptoSelection = (selectedCurrency) => {
  setShowCryptoModal(false);
  // Navigate to deposits with pre-selected currency
  navigate('/deposits', {
    state: { selectedCurrency, amount: requiredAmount }
  });
};

<CryptoPaymentModal
  isOpen={showCryptoModal}
  onClose={() => setShowCryptoModal(false)}
  onConfirm={handleCryptoSelection}
  requiredAmount={itemPrice}
  currentBalance={userBalance}
/>
```

## 🔧 Technical Details

### **State Management**
- **Modal states** managed in Layout component
- **Checkout details** passed between modals
- **Navigation state** used for pre-filling deposit forms

### **Balance Validation**
- **Real-time checking** during checkout
- **Automatic modal display** for insufficient funds
- **Seamless flow** to deposit creation

### **Currency Selection**
- **Admin-configured** enabled currencies
- **Visual feedback** for selected currency
- **Limits display** for user guidance

### **Navigation Flow**
- **State preservation** between components
- **Pre-filled forms** for better UX
- **Context-aware messaging**

## 🚀 Future Enhancements

### **Planned Features**
- **Payment processor integration** (Coinbase, NowPayments, BitPay)
- **Real-time balance updates** via webhooks
- **Multi-currency checkout** support
- **Payment method preferences** storage

### **Integration Opportunities**
- **Shopping cart persistence** across sessions
- **Deposit completion notifications**
- **Automatic checkout retry** after deposit confirmation
- **Payment method analytics** and reporting

## 🐛 Troubleshooting

### **Common Issues**

#### **Modal Not Showing**
- Check if modal state is properly set
- Verify checkoutItem data is populated
- Ensure user balance is correctly loaded

#### **Navigation Not Working**
- Verify React Router is properly configured
- Check navigation state is being passed
- Ensure target routes exist

#### **Currency Not Pre-selected**
- Check location.state is being passed
- Verify useEffect dependencies
- Ensure wallet settings are loaded

### **Debug Steps**
1. **Check console logs** for errors
2. **Verify modal states** in React DevTools
3. **Check navigation state** in browser history
4. **Validate user balance** data
5. **Test with different cart scenarios**

---

**🔗 Related Documentation:**
- [Crypto Deposits System](../CRYPTO_DEPOSITS_README.md)
- [Admin Wallet Settings](../admin-settings-setup.sql)
- [Layout Component](../client/src/components/Layout.jsx)
- [Deposits Page](../client/src/pages/Deposits.jsx)
