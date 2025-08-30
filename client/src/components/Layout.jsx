import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import AdminPinModal from './AdminPinModal.jsx';
import InsufficientFundsModal from './InsufficientFundsModal.jsx';
import DepositCreationModal from './DepositCreationModal.jsx';

const Layout = () => {
  const { logout, user } = useAuth();
  const { cart, cartTotal, removeFromCart, clearCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [showInsufficientFundsModal, setShowInsufficientFundsModal] = useState(false);
  const [showDepositCreationModal, setShowDepositCreationModal] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState(null);

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleCartDropdown = () => {
    setShowCartDropdown(!showCartDropdown);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleCheckout = () => {
    // Check if user has sufficient funds
    const totalCost = cartTotal;
    const userBalance = user?.wallet_balance || 0;
    
    if (userBalance >= totalCost) {
      // User has sufficient funds - proceed to checkout
      console.log('Proceeding to checkout...');
      setShowCartDropdown(false);
      // Here you would redirect to checkout or process payment
    } else {
      // User has insufficient funds - show modal
      setCheckoutItem({
        totalCost,
        userBalance,
        itemName: `Cart Total (${cart.length} items)`
      });
      setShowInsufficientFundsModal(true);
      setShowCartDropdown(false);
    }
  };

  const handleAdminAccess = () => {
    if (user && user.is_admin) {
      setShowAdminPinModal(true);
    }
  };

  const handleAdminPinSuccess = () => {
    // PIN verification successful, navigate to admin panel
    if (process.env.NODE_ENV === 'development') {
      console.log('=== ADMIN PIN SUCCESS ===');
      console.log('User:', user);
      console.log('User is_admin:', user?.is_admin);
      console.log('Navigating to /admin...');
    }
    navigate('/admin');
  };

  const [showResourcesSubmenu, setShowResourcesSubmenu] = useState(false);
  const [showShopSubmenu, setShowShopSubmenu] = useState(false);
  const [showAccountSubmenu, setShowAccountSubmenu] = useState(false);
  const [contentCounts, setContentCounts] = useState({ news: 0, wiki: 0 });
  const [shopCounts, setShopCounts] = useState({
    bots: 0,
    creditCards: 0,
    services: 0,
    configs: 0,
    financeDocs: 0
  });
  const [shopCountsLoading, setShopCountsLoading] = useState(true);
  const [accountCounts, setAccountCounts] = useState({
    deposits: 0,
    tickets: 0,
    usedInvites: 0,
    unusedInvites: 0
  });
  const [accountCountsLoading, setAccountCountsLoading] = useState(true);

  // Load content counts on component mount
  useEffect(() => {
    const loadContentCounts = async () => {
      try {
        const response = await fetch('/api/content-stats?timePeriod=7d');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setContentCounts({
              news: data.stats?.news?.recent || 0,
              wiki: data.stats?.wiki?.recent || 0
            });
          }
        }
      } catch (error) {
        console.error('Error loading content counts:', error);
        // Set default values on error
        setContentCounts({ news: 0, wiki: 0 });
      }
    };

    const loadShopCounts = async () => {
      setShopCountsLoading(true);
      try {
        // Load bots count
        const botsResponse = await fetch('/api/bots');
        if (botsResponse.ok) {
          const botsData = await botsResponse.json();
          setShopCounts(prev => ({ ...prev, bots: botsData.total || 0 }));
        }
        
        // Load credit cards count
        const cardsResponse = await fetch('/api/credit-cards');
        if (cardsResponse.ok) {
          const cardsData = await cardsResponse.json();
          setShopCounts(prev => ({ ...prev, creditCards: cardsData.total || 0 }));
        }
        
        // Load services count
        const servicesResponse = await fetch('/api/services');
        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json();
          setShopCounts(prev => ({ ...prev, services: servicesData.total || 0 }));
        }
        
        // Load configs count
        const configsResponse = await fetch('/api/configs');
        if (configsResponse.ok) {
          const configsData = await configsResponse.json();
          setShopCounts(prev => ({ ...prev, configs: configsData.total || 0 }));
        }
        
        // Load finance documents count
        const financeDocsResponse = await fetch('/api/finance-documents/count');
        if (financeDocsResponse.ok) {
          const financeDocsData = await financeDocsResponse.json();
          setShopCounts(prev => ({ ...prev, financeDocs: financeDocsData.count || 0 }));
        }
      } catch (error) {
        console.error('Error loading shop counts:', error);
        // Set default values on error
        setShopCounts({ bots: 0, creditCards: 0, services: 0, configs: 0, financeDocs: 0 });
      } finally {
        setShopCountsLoading(false);
      }
    };

    const loadAccountCounts = async () => {
      setAccountCountsLoading(true);
      try {
        // Load deposits count
        const depositsResponse = await fetch('/api/deposits');
        if (depositsResponse.ok) {
          const depositsData = await depositsResponse.json();
          setAccountCounts(prev => ({ ...prev, deposits: depositsData.total || 0 }));
        }
        
        // Load tickets count
        const ticketsResponse = await fetch('/api/tickets');
        if (ticketsResponse.ok) {
          const ticketsData = await ticketsResponse.json();
          setAccountCounts(prev => ({ ...prev, tickets: ticketsData.total || 0 }));
        }
        
        // Load invites counts
        const invitesResponse = await fetch('/api/invites');
        if (invitesResponse.ok) {
          const invitesData = await invitesResponse.json();
          setAccountCounts(prev => ({ 
            ...prev, 
            usedInvites: invitesData.used || 0,
            unusedInvites: invitesData.unused || 0
          }));
        }
      } catch (error) {
        console.error('Error loading account counts:', error);
        // Set default values on error
        setAccountCounts({ deposits: 0, tickets: 0, usedInvites: 0, unusedInvites: 0 });
      } finally {
        setAccountCountsLoading(false);
      }
    };

    // Only load counts once on mount
    loadContentCounts();
    loadShopCounts();
    loadAccountCounts();
  }, []); // Empty dependency array to prevent re-runs

  // Format wallet balance
  const formatWalletBalance = (balance) => {
    if (balance === null || balance === undefined) return '$0.00';
    return `$${parseFloat(balance).toFixed(2)}`;
  };

  // Format shop counts for display
  const formatShopCount = (count) => {
    if (count === null || count === undefined || count === 0) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M+`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}k+`;
    return count.toLocaleString();
  };

  // Format invites count for display
  const formatInvitesCount = (used, unused) => {
    if ((used === null || used === undefined || used === 0) && (unused === null || unused === undefined || unused === 0)) return null;
    return `${used || 0}/${unused || 0}`;
  };

  const navItems = [
    { path: '/', icon: '🏠', label: 'Dashboard', badge: null, isNew: true },
    { path: '/wiki', icon: 'ℹ️', label: 'Reaper Wiki', badge: (contentCounts?.wiki || 0) > 0 ? (contentCounts.wiki || 0).toString() : null, badgeColor: (contentCounts?.wiki || 0) > 0 ? 'bg-purple-500' : null },
    { path: '/news', icon: '📰', label: 'News', badge: (contentCounts?.news || 0) > 0 ? (contentCounts.news || 0).toString() : null, badgeColor: (contentCounts?.news || 0) > 0 ? 'bg-green-500' : null },
    { 
      icon: '🛍️', 
      label: 'Shop', 
      hasSubmenu: true,
      badge: shopCountsLoading ? '...' : ((shopCounts?.bots || 0) + (shopCounts?.creditCards || 0) + (shopCounts?.services || 0) + (shopCounts?.configs || 0) + (shopCounts?.financeDocs || 0) > 0 ? formatShopCount((shopCounts?.bots || 0) + (shopCounts?.creditCards || 0) + (shopCounts?.services || 0) + (shopCounts?.configs || 0) + (shopCounts?.financeDocs || 0)) : null),
      badgeColor: 'bg-blue-500',
      submenu: [
        { path: '/bots', icon: '🤖', label: 'Bots', badge: (shopCounts?.bots || 0) > 0 ? formatShopCount(shopCounts.bots || 0) : null, badgeColor: 'bg-blue-500' },
        { path: '/credit-cards', icon: '💳', label: 'Credit Cards', badge: (shopCounts?.creditCards || 0) > 0 ? formatShopCount(shopCounts.creditCards || 0) : null, badgeColor: 'bg-green-500' },
        { path: '/services', icon: '🔧', label: 'Services', badge: (shopCounts?.services || 0) > 0 ? formatShopCount(shopCounts.services || 0) : null, badgeColor: 'bg-yellow-500' },
        { path: '/configs', icon: '⚙️', label: 'Configs', badge: (shopCounts?.configs || 0) > 0 ? formatShopCount(shopCounts.configs || 0) : null, badgeColor: 'bg-red-500' },
        { path: '/finance-documents', icon: '📄', label: 'Finance Documents', badge: (shopCounts?.financeDocs || 0) > 0 ? formatShopCount(shopCounts.financeDocs || 0) : null, badgeColor: 'bg-blue-500' },
      ]
    },

    { 
      icon: '👤', 
      label: 'Account', 
      hasSubmenu: true,
      submenu: [
        { path: '/profile', icon: '👤', label: 'Profile', badge: null },
        { path: '/deposits', icon: '💰', label: 'Deposits', badge: (accountCounts?.deposits || 0) > 0 ? (accountCounts.deposits || 0).toString() : null, badgeColor: 'bg-blue-500' },
        { path: '/tickets', icon: '💬', label: 'Tickets', badge: (accountCounts?.tickets || 0) > 0 ? (accountCounts.tickets || 0).toString() : null, badgeColor: 'bg-green-500' },
        { path: '/invites', icon: '👥', label: 'Invites', badge: formatInvitesCount(accountCounts?.usedInvites || 0, accountCounts?.unusedInvites || 0), badgeColor: 'bg-purple-500' },
      ]
    },
  ];

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Admin PIN Modal */}
      <AdminPinModal
        isOpen={showAdminPinModal}
        onClose={() => setShowAdminPinModal(false)}
        onSuccess={handleAdminPinSuccess}
      />

      {/* Insufficient Funds Modal */}
      <InsufficientFundsModal
        isOpen={showInsufficientFundsModal}
        onClose={() => setShowInsufficientFundsModal(false)}
        requiredAmount={checkoutItem?.totalCost}
        currentBalance={checkoutItem?.userBalance}
        itemName={checkoutItem?.itemName}
        onShowCryptoOptions={() => {
          setShowInsufficientFundsModal(false);
          setShowDepositCreationModal(true);
        }}
      />

      {/* Deposit Creation Modal */}
      <DepositCreationModal
        isOpen={showDepositCreationModal}
        onClose={() => setShowDepositCreationModal(false)}
        requiredAmount={checkoutItem?.totalCost}
        currentBalance={checkoutItem?.userBalance}
        itemName={checkoutItem?.itemName}
      />

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      } bg-gray-800 border-r border-gray-700 flex flex-col transition-all duration-300 ease-in-out fixed lg:relative z-50 h-full`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
          <h1 className={`text-xl font-bold text-white transition-all duration-300 ${sidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
            {sidebarCollapsed ? '' : 'Reaper'}
          </h1>
          <div className="flex items-center space-x-2">
            <button 
              onClick={toggleSidebar}
              className="text-gray-400 hover:text-white transition-colors hidden lg:block"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button 
              onClick={toggleMobileMenu}
              className="text-gray-400 hover:text-white transition-colors lg:hidden"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>



        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          {navItems.map((item) => {
            if (item.hasSubmenu) {
              const isShop = item.label === 'Shop';
              const isAccount = item.label === 'Account';
              const isResources = item.label === 'Resources';
              const showSubmenu = isShop ? showShopSubmenu : isAccount ? showAccountSubmenu : showResourcesSubmenu;
              const setShowSubmenu = isShop ? setShowShopSubmenu : isAccount ? setShowAccountSubmenu : setShowResourcesSubmenu;
              const borderColor = isShop ? 'border-blue-500' : isAccount ? 'border-green-500' : 'border-purple-500';
              
              return (
                <div key={item.label} className="relative">
                  <button
                    onClick={() => setShowSubmenu(!showSubmenu)}
                    className={`w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors ${
                      showSubmenu ? 'bg-gray-700 text-white' : ''
                    }`}
                    title={sidebarCollapsed ? item.label : ''}
                  >
                    <span className="text-lg mr-3">{item.icon}</span>
                    <span className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                      {item.label}
                    </span>
                    {!sidebarCollapsed && item.badge && (
                      <span className={`text-xs px-2 py-1 rounded-full ${item.badgeColor || 'bg-gray-600'}`}>
                        {item.badge}
                      </span>
                    )}
                    {!sidebarCollapsed && (
                      <svg 
                        className={`w-4 h-4 ml-2 transition-transform ${showSubmenu ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>
                  
                  {/* Submenu */}
                  {showSubmenu && !sidebarCollapsed && (
                    <div className={`bg-gray-700 border-l-2 ${borderColor}`}>
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center px-8 py-2 text-gray-300 hover:bg-gray-600 hover:text-white transition-colors ${
                            location.pathname === subItem.path ? 'bg-gray-600 text-white' : ''
                          }`}
                        >
                          <span className="text-sm mr-2">{subItem.icon}</span>
                          <span className="text-sm">{subItem.label}</span>
                          {subItem.badge && (
                            <span className={`ml-auto text-xs px-2 py-1 rounded-full ${subItem.badgeColor || 'bg-gray-600'}`}>
                              {subItem.badge}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors ${
                  location.pathname === item.path ? 'bg-gray-700 text-white' : ''
                }`}
                title={sidebarCollapsed ? item.label : ''}
              >
                <span className="text-lg mr-3">{item.icon}</span>
                <span className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                  {item.label}
                </span>
                {!sidebarCollapsed && item.isNew && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">new</span>
                )}
                {!sidebarCollapsed && item.badge && (
                  <span className={`text-xs px-2 py-1 rounded-full ${item.badgeColor || 'bg-gray-600'}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
          
          {/* Admin Panel Link - Only show for admin users */}
          {user && user.is_admin && (
            <button
              onClick={handleAdminAccess}
              className={`w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors ${
                location.pathname.startsWith('/admin') ? 'bg-gray-700 text-white' : ''
              }`}
              title={sidebarCollapsed ? 'Admin Panel' : ''}
            >
              <span className="text-lg mr-3">👑</span>
              <span className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                Admin Panel
              </span>
              {!sidebarCollapsed && (
                <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">ADMIN</span>
              )}
            </button>
          )}
          
          {/* Resources Menu with Submenu */}
          <div className="relative">
            <button
              onClick={() => setShowResourcesSubmenu(!showResourcesSubmenu)}
              className={`w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors ${
                showResourcesSubmenu ? 'bg-gray-700 text-white' : ''
              }`}
              title={sidebarCollapsed ? 'Resources' : ''}
            >
              <span className="text-lg mr-3">⚙️</span>
              <span className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                Resources
              </span>
              {!sidebarCollapsed && (
                <span className="text-xs px-2 py-1 rounded-full bg-green-500">7.2 | 22.2</span>
              )}
              {!sidebarCollapsed && (
                <svg 
                  className={`w-4 h-4 ml-2 transition-transform ${showResourcesSubmenu ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
            
            {/* Resources Submenu */}
            {showResourcesSubmenu && !sidebarCollapsed && (
              <div className="bg-gray-700 border-l-2 border-green-500">
                <Link
                  to="/software"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-8 py-2 text-gray-300 hover:bg-gray-600 hover:text-white transition-colors ${
                    location.pathname === '/software' ? 'bg-gray-600 text-white' : ''
                  }`}
                >
                  <span className="text-sm mr-2">💻</span>
                  <span className="text-sm">Software</span>
                </Link>
                <Link
                  to="/bin-checker"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-8 py-2 text-gray-300 hover:bg-gray-600 hover:text-white transition-colors ${
                    location.pathname === '/bin-checker' ? 'bg-gray-600 text-white' : ''
                  }`}
                >
                  <span className="text-sm mr-2">🔍</span>
                  <span className="text-sm">BIN Checker</span>
                </Link>
                <Link
                  to="/downloads"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-8 py-2 text-gray-300 hover:bg-gray-600 hover:text-white transition-colors ${
                    location.pathname === '/downloads' ? 'bg-gray-600 text-white' : ''
                  }`}
                >
                  <span className="text-sm mr-2">⬇️</span>
                  <span className="text-sm">Downloads</span>
                </Link>
                <Link
                  to="/generate-fp"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-8 py-2 text-gray-300 hover:bg-gray-600 hover:text-white transition-colors ${
                    location.pathname === '/generate-fp' ? 'bg-gray-600 text-white' : ''
                  }`}
                >
                  <span className="text-sm mr-2">✏️</span>
                  <span className="text-sm">Generate FP</span>
                </Link>
              </div>
            )}
          </div>
        </nav>
        
        {/* Logout */}
        <div className="border-t border-gray-700 bg-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            title={sidebarCollapsed ? 'Logout' : ''}
          >
            <span className="text-lg mr-3">🚪</span>
            <span className={`transition-all duration-300 ${sidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
              Logout
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-y-0 left-0 w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h1 className="text-xl font-bold text-white">Reaper</h1>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {navItems.map((item) => {
                if (item.hasSubmenu) {
                  const isShop = item.label === 'Shop';
                  const isAccount = item.label === 'Account';
                  const isResources = item.label === 'Resources';
                  const showSubmenu = isShop ? showShopSubmenu : isAccount ? showAccountSubmenu : showResourcesSubmenu;
                  const setShowSubmenu = isShop ? setShowShopSubmenu : isAccount ? setShowAccountSubmenu : setShowResourcesSubmenu;
                  
                  return (
                    <div key={item.label}>
                      <button
                        onClick={() => setShowSubmenu(!showSubmenu)}
                        className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors rounded-lg"
                      >
                        <span className="text-lg mr-3">{item.icon}</span>
                        <span className="flex-1">{item.label}</span>
                        <svg 
                          className={`w-4 h-4 transition-transform ${showSubmenu ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {/* Mobile Submenu */}
                      {showSubmenu && (
                        <div className="ml-4 mt-2 space-y-1">
                          {item.submenu.map((subItem) => (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`flex items-center px-4 py-2 text-gray-400 hover:text-white transition-colors rounded ${
                                location.pathname === subItem.path ? 'text-white bg-gray-700' : ''
                              }`}
                            >
                              <span className="text-sm mr-2">{subItem.icon}</span>
                              <span className="text-sm">{subItem.label}</span>
                              {subItem.badge && (
                                <span className={`ml-auto text-xs px-2 py-1 rounded-full ${subItem.badgeColor || 'bg-gray-600'}`}>
                                  {subItem.badge}
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors rounded-lg ${
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
                );
              })}
              
              {/* Mobile Resources Section */}
              <div>
                <button
                  onClick={() => setShowResourcesSubmenu(!showResourcesSubmenu)}
                  className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors rounded-lg"
                >
                  <span className="text-lg mr-3">⚙️</span>
                  <span className="flex-1">Resources</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-500">7.2 | 22.2</span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${showResourcesSubmenu ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Mobile Resources Submenu */}
                {showResourcesSubmenu && (
                  <div className="ml-4 mt-2 space-y-1">
                    <Link
                      to="/software"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-2 text-gray-400 hover:text-white transition-colors rounded ${
                        location.pathname === '/software' ? 'text-white bg-gray-700' : ''
                      }`}
                    >
                      <span className="text-sm mr-2">💻</span>
                      <span className="text-sm">Software</span>
                    </Link>
                    <Link
                      to="/bin-checker"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-2 text-gray-400 hover:text-white transition-colors rounded ${
                        location.pathname === '/bin-checker' ? 'text-white bg-gray-700' : ''
                      }`}
                    >
                      <span className="text-sm mr-2">🔍</span>
                      <span className="text-sm">BIN Checker</span>
                    </Link>
                    <Link
                      to="/downloads"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-2 text-gray-400 hover:text-white transition-colors rounded ${
                        location.pathname === '/downloads' ? 'text-white bg-gray-700' : ''
                      }`}
                    >
                      <span className="text-sm mr-2">⬇️</span>
                      <span className="text-sm">Downloads</span>
                    </Link>
                    <Link
                      to="/generate-fp"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-2 text-gray-400 hover:text-white transition-colors rounded ${
                        location.pathname === '/generate-fp' ? 'text-white bg-gray-700' : ''
                      }`}
                    >
                      <span className="text-sm mr-2">✏️</span>
                      <span className="text-sm">Generate FP</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Admin Panel Link for Mobile */}
              {user && user.is_admin && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleAdminAccess();
                  }}
                  className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors rounded-lg"
                >
                  <span className="text-lg mr-3">👑</span>
                  <span className="flex-1">Admin Panel</span>
                  <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">ADMIN</span>
                </button>
              )}
            </nav>

            {/* Mobile Logout */}
            <div className="border-t border-gray-700 p-4">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors rounded-lg"
              >
                <span className="text-lg mr-3">🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-gray-800 border-b border-gray-700 px-4 lg:px-6 py-3 flex items-center justify-between">
          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden text-gray-400 hover:text-white transition-colors mr-4"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center space-x-2 lg:space-x-4">
            <span className="text-gray-400 text-sm lg:text-base">Reaper Market</span>
            <span className="text-gray-500 hidden lg:block">|</span>
            <span className="text-gray-400 text-sm lg:text-base">Autoshop</span>
          </div>
          
          <div className="flex items-center space-x-3 lg:space-x-6">
            {/* Admin Button - Only show for admin users */}
            {user && user.is_admin && (
              <button
                onClick={handleAdminAccess}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 lg:px-4 py-2 rounded-lg transition-colors text-sm lg:text-base flex items-center space-x-2"
                title="Admin Panel (Requires PIN)"
              >
                <span className="text-lg">👑</span>
                <span className="hidden sm:block">Admin</span>
              </button>
            )}
            
            {/* Wallet Balance */}
            <div className="hidden sm:flex items-center space-x-2">
              <span className="text-gray-400 text-sm">Wallet:</span>
              <span className="text-green-400 font-semibold text-sm">
                {formatWalletBalance(user?.wallet_balance)}
              </span>
            </div>
            
            {/* Cart */}
            <div className="relative">
              <button
                onClick={toggleCartDropdown}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <span className="text-xl">🛒</span>
                <span className="hidden sm:block">Cart: ${cartTotal.toFixed(2)}</span>
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
        <div className="flex-1 overflow-y-auto bg-gray-900 p-4 lg:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
