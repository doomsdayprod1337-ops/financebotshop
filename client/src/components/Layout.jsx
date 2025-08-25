import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';

const Layout = () => {
  const { logout } = useAuth();
  const { cart, cartTotal, removeFromCart, clearCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [showCartDropdown, setShowCartDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleCartDropdown = () => {
    setShowCartDropdown(!showCartDropdown);
  };

  const handleCheckout = () => {
    // In a real app, this would redirect to checkout page
    console.log('Proceeding to checkout...');
    setShowCartDropdown(false);
  };

  const [showResourcesSubmenu, setShowResourcesSubmenu] = useState(false);

  const navItems = [
    { path: '/', icon: '🏠', label: 'Dashboard', badge: null, isNew: true },
    { path: '/wiki', icon: 'ℹ️', label: 'Genesis Wiki', badge: null },
    { path: '/news', icon: '📰', label: 'News', badge: '22', badgeColor: 'bg-green-500' },
    { path: '/bots', icon: '🤖', label: 'Bots', badge: '450k+', badgeColor: 'bg-blue-500' },
    { path: '/generate-fp', icon: '✏️', label: 'Generate FP', badge: null },
    { path: '/orders', icon: '🛒', label: 'Orders', badge: null },
    { path: '/purchases', icon: '💵', label: 'Purchases', badge: null },
    { path: '/payments', icon: '💰', label: 'Payments', badge: null },
    { path: '/credit-cards', icon: '💳', label: 'Credit Cards', badge: null },
    { path: '/services', icon: '🔧', label: 'Services', badge: null },
    { path: '/tickets', icon: '💬', label: 'Tickets', badge: null },
    { path: '/profile', icon: '👤', label: 'Profile', badge: null },
    { path: '/invites', icon: '👥', label: 'Invites', badge: null },
  ];

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
          <h1 className="text-xl font-bold text-white">Genesis</h1>
          <button className="text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors ${
                location.pathname === item.path ? 'bg-gray-700 text-white' : ''
              }`}
            >
              <span className="text-lg mr-3">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.isNew && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">new</span>
              )}
              {item.badge && (
                <span className={`text-xs px-2 py-1 rounded-full ${item.badgeColor || 'bg-gray-600'}`}>
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
          
          {/* Resources Menu with Submenu */}
          <div className="relative">
            <button
              onClick={() => setShowResourcesSubmenu(!showResourcesSubmenu)}
              className={`w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors ${
                showResourcesSubmenu ? 'bg-gray-700 text-white' : ''
              }`}
            >
              <span className="text-lg mr-3">⚙️</span>
              <span className="flex-1">Resources</span>
              <span className="text-xs px-2 py-1 rounded-full bg-green-500">7.2 | 22.2</span>
              <svg 
                className={`w-4 h-4 ml-2 transition-transform ${showResourcesSubmenu ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Resources Submenu */}
            {showResourcesSubmenu && (
              <div className="bg-gray-700 border-l-2 border-green-500">
                <Link
                  to="/software"
                  className={`flex items-center px-8 py-2 text-gray-300 hover:bg-gray-600 hover:text-white transition-colors ${
                    location.pathname === '/software' ? 'bg-gray-600 text-white' : ''
                  }`}
                >
                  <span className="text-sm mr-2">💻</span>
                  <span className="text-sm">Software</span>
                </Link>
                <Link
                  to="/bin-checker"
                  className={`flex items-center px-8 py-2 text-gray-300 hover:bg-gray-600 hover:text-white transition-colors ${
                    location.pathname === '/bin-checker' ? 'bg-gray-600 text-white' : ''
                  }`}
                >
                  <span className="text-sm mr-2">🔍</span>
                  <span className="text-sm">BIN Checker</span>
                </Link>
                <Link
                  to="/downloads"
                  className={`flex items-center px-8 py-2 text-gray-300 hover:bg-gray-600 hover:text-white transition-colors ${
                    location.pathname === '/downloads' ? 'bg-gray-600 text-white' : ''
                  }`}
                >
                  <span className="text-sm mr-2">⬇️</span>
                  <span className="text-sm">Downloads</span>
                </Link>
              </div>
            )}
          </div>
          ))}
        </nav>
        
        {/* Logout */}
        <div className="border-t border-gray-700 bg-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <span className="text-lg mr-3">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-gray-400">Genesis Market</span>
            <span className="text-gray-500">|</span>
            <span className="text-gray-400">Autoshop</span>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Wallet Balance */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">Wallet:</span>
              <span className="text-green-400 font-semibold">$1,250.00</span>
            </div>
            
            {/* Cart */}
            <div className="relative">
              <button
                onClick={toggleCartDropdown}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <span className="text-xl">🛒</span>
                <span>Cart: ${cartTotal.toFixed(2)}</span>
                {cart.length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {cart.length}
                  </span>
                )}
              </button>
              
              {/* Cart Dropdown */}
              {showCartDropdown && (
                <>
                  <div className="absolute right-0 top-full mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                    <div className="p-4 border-b border-gray-700">
                      <h3 className="text-white font-semibold">Shopping Cart</h3>
                      <p className="text-gray-400 text-sm">Total: ${cartTotal.toFixed(2)}</p>
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto">
                      {cart.length === 0 ? (
                        <div className="p-4 text-center text-gray-400">
                          <div className="text-2xl mb-2">🛒</div>
                          <p>Your cart is empty</p>
                        </div>
                      ) : (
                        cart.map((item, index) => (
                          <div key={index} className="p-4 border-b border-gray-700 last:border-b-0">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-white font-medium">
                                  {item.type === 'bot' ? `Bot ${item.id}` : `${item.brand} - ${item.bin}`}
                                </p>
                                <p className="text-gray-400 text-sm">
                                  {item.type === 'bot' ? 'Bot Dump' : 'Credit Card'}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-green-400 font-medium">${item.price}</span>
                                <button
                                  onClick={() => removeFromCart(index)}
                                  className="text-red-400 hover:text-red-300 transition-colors"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    {cart.length > 0 && (
                      <div className="p-4 border-t border-gray-700 space-y-2">
                        <button
                          onClick={handleCheckout}
                          className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
                        >
                          Checkout
                        </button>
                        <button
                          onClick={clearCart}
                          className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
                        >
                          Clear Cart
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowCartDropdown(false)}
                  />
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Page Content */}
        <div className="flex-1 overflow-y-auto bg-gray-900 p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
