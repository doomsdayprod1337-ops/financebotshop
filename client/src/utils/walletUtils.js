import { useNavigate } from 'react-router-dom';

// Check if user has sufficient funds for a purchase
export const checkWalletBalance = (requiredAmount, currentBalance) => {
  return (currentBalance || 0) >= (requiredAmount || 0);
};

// Calculate the shortfall amount
export const calculateShortfall = (requiredAmount, currentBalance) => {
  return Math.max(0, (requiredAmount || 0) - (currentBalance || 0));
};

// Format wallet balance for display
export const formatWalletBalance = (balance) => {
  if (balance === null || balance === undefined) return '$0.00';
  return `$${parseFloat(balance).toFixed(2)}`;
};

// Navigate to deposits page with pre-selected currency and amount
export const navigateToDeposit = (navigate, selectedCurrency, amount) => {
  navigate('/deposits', {
    state: {
      selectedCurrency,
      amount
    }
  });
};

// Show insufficient funds modal (to be used with Layout component state)
export const showInsufficientFundsModal = (setModalState, checkoutItem) => {
  setModalState({
    showInsufficientFundsModal: true,
    checkoutItem
  });
};

// Show crypto payment modal (to be used with Layout component state)
export const showCryptoPaymentModal = (setModalState, checkoutItem) => {
  setModalState({
    showCryptoPaymentModal: true,
    checkoutItem
  });
};

// Process checkout with balance check
export const processCheckout = (totalCost, userBalance, cart, setModalState) => {
  if (userBalance >= totalCost) {
    // User has sufficient funds - proceed to checkout
    console.log('Proceeding to checkout...');
    return { success: true, message: 'Proceeding to checkout...' };
  } else {
    // User has insufficient funds - show modal
    const checkoutItem = {
      totalCost,
      userBalance,
      itemName: `Cart Total (${cart.length} items)`
    };
    
    setModalState({
      showInsufficientFundsModal: true,
      checkoutItem
    });
    
    return { 
      success: false, 
      message: 'Insufficient funds',
      shortfall: calculateShortfall(totalCost, userBalance)
    };
  }
};
