import React, { createContext, useContext, useState, useMemo } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // Calculate cart total
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.price, 0);
  }, [cart]);

  // Add item to cart
  const addToCart = (item) => {
    if (!cart.some(cartItem => cartItem.id === item.id)) {
      setCart(prev => [...prev, item]);
    }
  };

  // Remove item from cart
  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
  };

  // Check if item is in cart
  const isInCart = (itemId) => {
    return cart.some(item => item.id === itemId);
  };

  const value = {
    cart,
    cartTotal,
    addToCart,
    removeFromCart,
    clearCart,
    isInCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
