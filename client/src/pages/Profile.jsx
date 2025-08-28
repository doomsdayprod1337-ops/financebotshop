import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../config/axios.js';

const Profile = () => {
  const { user, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    email: '',
    username: '',
    telegramUsername: '',
    referralCode: ''
  });
  
  // Password change form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Data state
  const [purchases, setPurchases] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  
  // Load user data on component mount
  useEffect(() => {
    if (user) {
      setProfileForm({
        email: user.email || '',
        username: user.username || '',
        telegramUsername: user.telegram_username || '',
        referralCode: user.referral_code || ''
      });
      setWalletBalance(user.wallet_balance || 0);
      loadUserData();
    }
  }, [user]);
  
  const loadUserData = async () => {
    try {
      // Load purchases
      const purchasesResponse = await api.get('/api/purchases');
      if (purchasesResponse.data.success) {
        setPurchases(purchasesResponse.data.purchases || []);
      }
      
      // Load deposits
      const depositsResponse = await api.get('/api/deposits');
      if (depositsResponse.data.success) {
        setDeposits(depositsResponse.data.deposits || []);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };
  
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      const response = await api.put('/api/profile', profileForm);
      if (response.data.success) {
        setMessage('Profile updated successfully!');
        setMessageType('success');
      }
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to update profile');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage('New passwords do not match');
      setMessageType('error');
      setLoading(false);
      return;
    }
    
    try {
      const result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      if (result.success) {
        setMessage(result.message);
        setMessageType('success');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setMessage(result.error);
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Failed to change password');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTelegramSync = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await api.post('/api/telegram-sync', {
        telegramUsername: profileForm.telegramUsername
      });
      
      if (response.data.success) {
        setMessage('Telegram account synced successfully! Please contact @Reaper_Market_Bot for authentication.');
        setMessageType('success');
        
        // Show additional notice about contacting the bot
        setTimeout(() => {
          setMessage('Telegram account synced! Please contact @Reaper_Market_Bot on Telegram to complete authentication and verify your account.');
          setMessageType('info');
        }, 3000);
      }
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to sync Telegram account');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };
  
  const tabs = [
    { id: 'profile', label: 'Profile Settings', icon: '👤' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'payments-purchases', label: 'Payments & Purchases', icon: '💳' },
    { id: 'purchases', label: 'Purchases', icon: '💵' },
    { id: 'deposits', label: 'Deposits', icon: '💰' },
    { id: 'telegram', label: 'Telegram', icon: '📱' }
  ];
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
        <div className="text-right">
          <div className="text-sm text-gray-400">Wallet Balance</div>
          <div className="text-2xl font-bold text-green-400">{formatCurrency(walletBalance)}</div>
        </div>
      </div>
      
      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg ${
          messageType === 'success' ? 'bg-green-900 text-green-100 border border-green-700' : 
          messageType === 'error' ? 'bg-red-900 text-red-100 border border-red-700' :
          messageType === 'info' ? 'bg-blue-900 text-blue-100 border border-blue-700' :
          'bg-gray-900 text-gray-100 border border-gray-700'
        }`}>
          {message}
        </div>
      )}
      
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        {/* Profile Settings Tab */}
        {activeTab === 'profile' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Profile Information</h2>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Registered Email
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({...profileForm, username: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Username"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Telegram Username
                  </label>
                  <input
                    type="text"
                    value={profileForm.telegramUsername}
                    onChange={(e) => setProfileForm({...profileForm, telegramUsername: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="@username"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Referral Code
                  </label>
                  <input
                    type="text"
                    value={profileForm.referralCode}
                    disabled
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Your unique referral code</p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Change Password</h2>
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter current password"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new password"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm new password"
                  required
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Payments & Purchases Tab */}
        {activeTab === 'payments-purchases' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Payments & Purchases</h2>
            <p className="text-gray-400 mb-6">Manage your payment methods, view purchase history, and track transactions all in one place.</p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    ${purchases.reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)}
                  </div>
                  <div className="text-gray-300 text-sm">Total Spent</div>
                </div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-1">
                    {purchases.length}
                  </div>
                  <div className="text-gray-300 text-sm">Total Purchases</div>
                </div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400 mb-1">
                    {deposits.length}
                  </div>
                  <div className="text-gray-300 text-sm">Total Deposits</div>
                </div>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400 mb-1">
                    {formatCurrency(walletBalance)}
                  </div>
                  <div className="text-gray-300 text-sm">Wallet Balance</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors">
                ➕ Add Payment Method
              </button>
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors">
                💰 Make Deposit
              </button>
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors">
                📊 Export History
              </button>
            </div>

            {/* Recent Activity */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Recent Activity</h3>
              
              {/* Recent Purchases */}
              {purchases.slice(0, 3).map((purchase, index) => (
                <div key={index} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <span className="text-blue-400 text-xl">💳</span>
                      <div>
                        <h4 className="font-medium text-white">Purchase: {purchase.product_name || 'Product'}</h4>
                        <p className="text-sm text-gray-400">Order ID: {purchase.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-400">
                        -{formatCurrency(purchase.amount || 0)}
                      </div>
                      <div className="text-sm text-gray-400">
                        {formatDate(purchase.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Recent Deposits */}
              {deposits.slice(0, 2).map((deposit, index) => (
                <div key={index} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <span className="text-green-400 text-xl">💰</span>
                      <div>
                        <h4 className="font-medium text-white">Deposit #{deposit.id}</h4>
                        <p className="text-sm text-gray-400">{deposit.payment_method || 'Payment Method'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-400">
                        +{formatCurrency(deposit.amount || 0)}
                      </div>
                      <div className="text-sm text-gray-400">
                        {formatDate(deposit.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* View All Button */}
              <div className="text-center pt-4">
                <button 
                  onClick={() => window.location.href = '/payments-purchases'}
                  className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded transition-colors"
                >
                  View Full Payments & Purchases Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Purchases Tab */}
        {activeTab === 'purchases' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Purchase History</h2>
            {purchases.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📦</div>
                <p className="text-gray-400">No purchases found</p>
                <p className="text-sm text-gray-500">Your purchase history will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {purchases.map((purchase, index) => (
                  <div key={index} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-white">{purchase.product_name || 'Product'}</h3>
                        <p className="text-sm text-gray-400">{purchase.description || 'No description'}</p>
                        <p className="text-xs text-gray-500">Order ID: {purchase.id}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-400">
                          {formatCurrency(purchase.amount || 0)}
                        </div>
                        <div className="text-sm text-gray-400">
                          {formatDate(purchase.created_at)}
                        </div>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          purchase.status === 'completed' ? 'bg-green-900 text-green-100' :
                          purchase.status === 'pending' ? 'bg-yellow-900 text-yellow-100' :
                          'bg-red-900 text-red-100'
                        }`}>
                          {purchase.status || 'unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Deposits Tab */}
        {activeTab === 'deposits' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Deposit History</h2>
            {deposits.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">💳</div>
                <p className="text-gray-400">No deposits found</p>
                <p className="text-sm text-gray-500">Your deposit history will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {deposits.map((deposit, index) => (
                  <div key={index} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-white">Deposit #{deposit.id}</h3>
                        <p className="text-sm text-gray-400">{deposit.payment_method || 'Payment Method'}</p>
                        <p className="text-xs text-gray-500">Transaction ID: {deposit.transaction_id || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-400">
                          +{formatCurrency(deposit.amount || 0)}
                        </div>
                        <div className="text-sm text-gray-400">
                          {formatDate(deposit.created_at)}
                        </div>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          deposit.status === 'completed' ? 'bg-green-900 text-green-100' :
                          deposit.status === 'pending' ? 'bg-yellow-900 text-yellow-100' :
                          'bg-red-900 text-red-100'
                        }`}>
                          {deposit.status || 'unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Telegram Tab */}
        {activeTab === 'telegram' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Telegram Integration</h2>
            
            {/* Authentication Notice */}
            <div className="bg-yellow-900/20 border border-yellow-700 p-4 rounded-lg mb-6">
              <div className="flex items-start space-x-3">
                <div className="text-yellow-400 text-xl">⚠️</div>
                <div>
                  <h4 className="text-yellow-400 font-medium mb-2">Authentication Required</h4>
                  <p className="text-yellow-200 text-sm mb-3">
                    After syncing your Telegram username, you must contact <strong>@Reaper_Market_Bot</strong> on Telegram to complete authentication and verify your account.
                  </p>
                  <div className="bg-yellow-800/50 p-3 rounded border border-yellow-600">
                    <p className="text-yellow-100 text-sm font-medium">📱 Contact the bot:</p>
                    <p className="text-yellow-200 text-sm">1. Open Telegram</p>
                    <p className="text-yellow-200 text-sm">2. Search for <strong>@Reaper_Market_Bot</strong></p>
                    <p className="text-yellow-200 text-sm">3. Send <strong>/start</strong> to begin authentication</p>
                    <p className="text-yellow-200 text-sm">4. Follow the bot's instructions to verify your account</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                <h3 className="text-lg font-medium text-white mb-3">Sync Telegram Account</h3>
                <p className="text-gray-400 mb-4">
                  Connect your Telegram account to receive notifications about orders, payments, and updates.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Telegram Username
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={profileForm.telegramUsername}
                        onChange={(e) => setProfileForm({...profileForm, telegramUsername: e.target.value})}
                        className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="@username"
                      />
                      <button
                        onClick={handleTelegramSync}
                        disabled={loading || !profileForm.telegramUsername}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Syncing...' : 'Sync'}
                      </button>
                    </div>
                  </div>
                  
                  {/* Success Notice - Show after successful sync */}
                  {profileForm.telegramUsername && (
                    <div className="bg-green-900/20 border border-green-700 p-3 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <div className="text-green-400 text-lg">✅</div>
                        <div>
                          <p className="text-green-200 text-sm font-medium">Next Step Required:</p>
                          <p className="text-green-200 text-xs">
                            After syncing, contact <strong>@Reaper_Market_Bot</strong> on Telegram to complete authentication.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                <h3 className="text-lg font-medium text-white mb-3">Telegram Bot Features</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    Order status updates
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    Payment confirmations
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    Security alerts
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    New product notifications
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    Support ticket updates
                  </li>
                </ul>
              </div>
              
              <div className="bg-blue-900/20 border border-blue-700 p-4 rounded-lg">
                <h4 className="text-blue-400 font-medium mb-2">💡 Pro Tip</h4>
                <p className="text-blue-200 text-sm mb-3">
                  Make sure your Telegram username is correct and your account is public. 
                  The bot will send you a confirmation message once synced.
                </p>
                <div className="bg-blue-800/50 p-3 rounded border border-blue-600">
                  <p className="text-blue-100 text-sm font-medium">🔐 Authentication Process:</p>
                  <p className="text-blue-200 text-xs">
                    • Sync your username here first<br/>
                    • Contact @Reaper_Market_Bot on Telegram<br/>
                    • Send /start to begin verification<br/>
                    • Follow the bot's authentication steps<br/>
                    • Your account will be verified once completed
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
