import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../config/axios';

const Deposits = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [deposits, setDeposits] = useState([]);
  const [walletSettings, setWalletSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creatingDeposit, setCreatingDeposit] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'BTC',
    payment_processor: 'manual'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [minimumDepositAmount, setMinimumDepositAmount] = useState(50.00);

  // Check for pre-selected currency from navigation
  const preSelectedCurrency = location.state?.selectedCurrency;
  const preSelectedAmount = location.state?.amount;

  useEffect(() => {
    loadDeposits();
    loadWalletSettings();
    loadMinimumDepositAmount();
    
    // Auto-show form if pre-selected currency and amount
    if (preSelectedCurrency && preSelectedAmount) {
      setFormData({
        amount: preSelectedAmount.toString(),
        currency: preSelectedCurrency,
        payment_processor: 'manual'
      });
      setShowCreateForm(true);
    }
  }, [preSelectedCurrency, preSelectedAmount]);

  const loadDeposits = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/deposits');
      if (response.data.success) {
        setDeposits(response.data.deposits || []);
      }
    } catch (error) {
      console.error('Error loading deposits:', error);
      setError('Failed to load deposits');
    } finally {
      setLoading(false);
    }
  };

  const loadWalletSettings = async () => {
    try {
      const response = await api.get('/api/admin-settings');
      if (response.data.success) {
        setWalletSettings(response.data.settings.walletSettings);
      }
    } catch (error) {
      console.error('Error loading wallet settings:', error);
    }
  };

  const loadMinimumDepositAmount = async () => {
    try {
      const response = await api.get('/api/get-minimum-deposit');
      if (response.data.success) {
        setMinimumDepositAmount(response.data.minimumDepositAmount);
      }
    } catch (error) {
      console.error('Error loading minimum deposit amount:', error);
      // Use default value if API fails
      setMinimumDepositAmount(50.00);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateDeposit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.currency) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate minimum deposit amount
    const amount = parseFloat(formData.amount);
    if (amount < minimumDepositAmount) {
      setError(`Deposit amount must be at least $${minimumDepositAmount.toFixed(2)}`);
      return;
    }

    try {
      setCreatingDeposit(true);
      setError('');
      setSuccess('');

      const response = await api.post('/api/create-deposit', formData);
      
      if (response.data.success) {
        setSuccess('Deposit created successfully!');
        setFormData({ amount: '', currency: 'BTC', payment_processor: 'manual' });
        setShowCreateForm(false);
        loadDeposits(); // Refresh the deposits list
        
        // Show deposit details
        const deposit = response.data.deposit;
        setSuccess(`Deposit created! Send ${deposit.amount} ${deposit.currency} to: ${deposit.wallet_address}`);
      }
    } catch (error) {
      console.error('Error creating deposit:', error);
      setError(error.response?.data?.error || 'Failed to create deposit');
    } finally {
      setCreatingDeposit(false);
    }
  };

  const getCurrencyIcon = (currency) => {
    const icons = {
      BTC: '₿',
      LTC: 'Ł',
      ETH: 'Ξ',
      USDT_TRC20: '💎',
      USDT_ERC20: '🔷',
      XMR: 'ɱ',
      SOL: '◎'
    };
    return icons[currency] || '🪙';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-600',
      confirmed: 'bg-green-600',
      failed: 'bg-red-600',
      expired: 'bg-gray-600'
    };
    return colors[status] || 'bg-gray-600';
  };

  const formatAmount = (amount, currency) => {
    if (currency === 'BTC' || currency === 'LTC' || currency === 'ETH' || currency === 'XMR' || currency === 'SOL') {
      return parseFloat(amount).toFixed(8);
    }
    return parseFloat(amount).toFixed(2);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">💰 Crypto Deposits</h1>
            <p className="text-gray-400 text-sm mt-1">Minimum deposit amount: ${minimumDepositAmount?.toFixed(2) || '50.00'}</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {showCreateForm ? 'Cancel' : 'New Deposit'}
          </button>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-600 text-white p-4 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Cart Redirect Message */}
        {preSelectedCurrency && preSelectedAmount && (
          <div className="bg-blue-600 text-white p-4 rounded-lg mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🛒</span>
              <div>
                <p className="font-medium">Complete Your Purchase</p>
                <p className="text-sm opacity-90">
                  You need ${preSelectedAmount.toFixed(2)} to complete your cart purchase. 
                  Create a deposit with {preSelectedCurrency} to continue.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Create Deposit Form */}
        {showCreateForm && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Create New Deposit</h2>
            <form onSubmit={handleCreateDeposit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    step="0.000001"
                    min={minimumDepositAmount}
                    placeholder={`Min: $${minimumDepositAmount?.toFixed(2) || '50.00'}`}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-gray-400 text-xs mt-1">Minimum deposit: ${minimumDepositAmount?.toFixed(2) || '50.00'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Currency</label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {walletSettings?.currencies && Object.entries(walletSettings.currencies)
                      .filter(([_, config]) => config.enabled)
                      .map(([currency, config]) => (
                        <option key={currency} value={currency}>
                          {getCurrencyIcon(currency)} {currency.replace('_', ' ')}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Payment Method</label>
                  <select
                    name="payment_processor"
                    value={formData.payment_processor}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="manual">Manual (Direct Address)</option>
                    {/* Add other payment processors when implemented */}
                  </select>
                </div>
              </div>

              {/* Currency Limits Info */}
              {formData.currency && walletSettings?.currencies?.[formData.currency] && (
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Currency Limits</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Min Amount:</span>
                      <span className="ml-2 text-white">
                        {walletSettings.currencies[formData.currency].min_amount} {formData.currency}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Max Amount:</span>
                      <span className="ml-2 text-white">
                        {walletSettings.currencies[formData.currency].max_amount} {formData.currency}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Network Fee:</span>
                      <span className="ml-2 text-white">
                        {walletSettings.currencies[formData.currency].network_fee} {formData.currency}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingDeposit}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  {creatingDeposit ? 'Creating...' : 'Create Deposit'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Deposits List */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Your Deposits</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-400">Loading deposits...</p>
            </div>
          ) : deposits.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No deposits found</p>
              <p className="text-gray-500 text-sm mt-2">Create your first deposit to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4">Currency</th>
                    <th className="text-left py-3 px-4">Amount</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Wallet Address</th>
                    <th className="text-left py-3 px-4">Created</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.map((deposit) => (
                    <tr key={deposit.id} className="border-b border-gray-700 hover:bg-gray-700">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{getCurrencyIcon(deposit.currency)}</span>
                          <span>{deposit.currency.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium">
                          {formatAmount(deposit.amount, deposit.currency)} {deposit.currency}
                        </span>
                        {deposit.network_fee > 0 && (
                          <div className="text-xs text-gray-400">
                            Fee: {formatAmount(deposit.network_fee, deposit.currency)} {deposit.currency}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(deposit.status)}`}>
                          {deposit.status.charAt(0).toUpperCase() + deposit.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="max-w-xs">
                          <code className="text-xs bg-gray-700 px-2 py-1 rounded break-all">
                            {deposit.wallet_address}
                          </code>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {formatDate(deposit.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        {deposit.status === 'pending' && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(deposit.wallet_address);
                              setSuccess('Wallet address copied to clipboard!');
                            }}
                            className="text-blue-400 hover:text-blue-300 text-sm"
                          >
                            Copy Address
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-300 mb-3">How to Deposit</h3>
          <div className="space-y-2 text-blue-200 text-sm">
            <p>1. <strong>Create a deposit</strong> by clicking "New Deposit" above</p>
            <p>2. <strong>Select your preferred cryptocurrency</strong> and enter the amount</p>
            <p>3. <strong>Send the exact amount</strong> to the provided wallet address</p>
            <p>4. <strong>Include your order ID</strong> in the memo/note field when sending</p>
            <p>5. <strong>Wait for confirmations</strong> - your deposit will be confirmed automatically</p>
            <p className="text-yellow-300 mt-3">
              ⚠️ <strong>Important:</strong> Only send the exact amount specified. Any difference will not be credited.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Deposits;
