import React, { useState, useEffect } from 'react';
import api from '../config/axios';
import { CryptoPaymentSelector, formatCryptoAmount, getCryptoIcon } from './CryptoComponents';

const DepositCreationModal = ({ isOpen, onClose, requiredAmount, currentBalance, itemName }) => {
  // Remove excessive logging
  // console.log('DepositCreationModal props:', { isOpen, onClose, requiredAmount, currentBalance, itemName });
  
  const [walletSettings, setWalletSettings] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('manual');
  const [depositCreated, setDepositCreated] = useState(false);
  const [depositDetails, setDepositDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmations, setConfirmations] = useState(0);
  const [requiredConfirmations, setRequiredConfirmations] = useState(4);
  const [minimumDepositAmount, setMinimumDepositAmount] = useState(50.00);
  const [nowpaymentsInvoice, setNowpaymentsInvoice] = useState(null);
  
  // New state for USD amount input
  const [usdAmount, setUsdAmount] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState(null);
  const [rateLoading, setRateLoading] = useState(false);
  
  // New state for transaction control
  const [hasActiveDeposit, setHasActiveDeposit] = useState(false);
  const [activeDepositInfo, setActiveDepositInfo] = useState(null);
  const [timeoutCountdown, setTimeoutCountdown] = useState(null);

  useEffect(() => {
    // Remove excessive logging
    // console.log('DepositCreationModal useEffect - isOpen changed to:', isOpen);
    if (isOpen) {
      // console.log('Modal is open, loading wallet settings...');
      loadWalletSettings();
      loadMinimumDepositAmount();
      checkActiveDeposits();
      
      // Set default USD amount if requiredAmount is provided
      if (requiredAmount && requiredAmount > 0) {
        setUsdAmount(requiredAmount.toString());
      } else {
        setUsdAmount(minimumDepositAmount.toString());
      }
    }
  }, [isOpen, requiredAmount, minimumDepositAmount]);

  useEffect(() => {
    if (depositCreated && depositDetails) {
      // Start polling for confirmations
      const interval = setInterval(checkConfirmations, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [depositCreated, depositDetails]);

  // New effect to fetch exchange rate when currency or USD amount changes
  useEffect(() => {
    if (selectedCurrency && usdAmount && parseFloat(usdAmount) > 0) {
      fetchExchangeRate();
    }
  }, [selectedCurrency, usdAmount]);

  // New effect for timeout countdown
  useEffect(() => {
    if (depositDetails?.timeout_at) {
      const countdownInterval = setInterval(() => {
        const now = new Date();
        const timeout = new Date(depositDetails.timeout_at);
        const timeLeft = timeout - now;
        
        if (timeLeft <= 0) {
          setTimeoutCountdown('Expired');
          clearInterval(countdownInterval);
        } else {
          const minutes = Math.floor(timeLeft / 60000);
          const seconds = Math.floor((timeLeft % 60000) / 1000);
          setTimeoutCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);
      
      return () => clearInterval(countdownInterval);
    }
  }, [depositDetails]);

  const checkActiveDeposits = async () => {
    try {
      const response = await api.get('/api/deposits?status=pending&active=true');
      if (response.data.success && response.data.deposits.length > 0) {
        setHasActiveDeposit(true);
        setActiveDepositInfo(response.data.deposits[0]);
      } else {
        setHasActiveDeposit(false);
        setActiveDepositInfo(null);
      }
    } catch (error) {
      console.error('Error checking active deposits:', error);
    }
  };

  const fetchExchangeRate = async () => {
    if (!selectedCurrency || !usdAmount || parseFloat(usdAmount) <= 0) return;
    
    setRateLoading(true);
    try {
      // You can integrate with a real exchange rate API here
      // For now, using mock rates for demonstration
      const mockRates = {
        'BTC': 45000, // $45,000 per BTC
        'ETH': 2800,  // $2,800 per ETH
        'LTC': 120,   // $120 per LTC
        'USDT_TRC20': 1, // 1:1 for USDT
        'USDT_ERC20': 1, // 1:1 for USDT
        'XMR': 180,   // $180 per XMR
        'SOL': 100    // $100 per SOL
      };
      
      const rate = mockRates[selectedCurrency] || 1;
      setExchangeRate(rate);
      
      // Calculate crypto amount - USD amount divided by rate
      const usdValue = parseFloat(usdAmount);
      const cryptoValue = usdValue / rate;
      setCryptoAmount(cryptoValue.toFixed(8));
      
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      setError('Failed to fetch exchange rate');
    } finally {
      setRateLoading(false);
    }
  };

  const loadMinimumDepositAmount = async () => {
    try {
      const response = await api.get('/api/get-minimum-deposit');
      if (response.data.success) {
        setMinimumDepositAmount(response.data.minimumDepositAmount);
        // Update USD amount if it's below minimum
        if (parseFloat(usdAmount) < response.data.minimumDepositAmount) {
          setUsdAmount(response.data.minimumDepositAmount.toString());
        }
      }
    } catch (error) {
      console.error('Error loading minimum deposit amount:', error);
      // Use default value if API fails
      setMinimumDepositAmount(50.00);
    }
  };

  const generateNowPaymentsInvoice = async () => {
    if (!selectedCurrency || !usdAmount || parseFloat(usdAmount) <= 0) {
      setError('Please enter a valid USD amount and select a currency');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const depositAmount = parseFloat(usdAmount);
      
      // Generate unique purchase ID
      const purchaseId = `PURCHASE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const response = await api.post('/api/create-nowpayments-invoice', {
        amount: depositAmount,
        currency: selectedCurrency,
        purchaseId: purchaseId,
        orderDescription: itemName || 'Deposit',
        customerEmail: 'user@example.com', // This should come from user context
        payoutAddress: null, // Optional
        payoutCurrency: 'usdttrc20' // Default payout currency
      });

      if (response.data.success) {
        setNowpaymentsInvoice(response.data.invoice);
        setDepositCreated(true);
      }
    } catch (error) {
      console.error('Error generating NowPayments invoice:', error);
      setError(error.response?.data?.error || 'Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  };

  const loadWalletSettings = async () => {
    try {
      // console.log('Loading wallet settings...');
      const response = await api.get('/api/admin-settings');
      // console.log('Admin settings response:', response);
      
      if (response.data.success) {
        // console.log('Settings loaded successfully:', response.data.settings.walletSettings);
        // console.log('Full settings object:', response.data.settings);
        
        setWalletSettings(response.data.settings.walletSettings);
        
        // Check if currencies exist and are properly structured
        if (response.data.settings.walletSettings?.currencies) {
          // console.log('Currencies found:', response.data.settings.walletSettings.currencies);
          
          // Auto-select first enabled currency
          const enabledCurrencies = Object.entries(response.data.settings.walletSettings.currencies)
            .filter(([_, config]) => config && config.enabled)
            .map(([currency, _]) => currency);
          
          // console.log('Enabled currencies:', enabledCurrencies);
          
          if (enabledCurrencies.length > 0) {
            setSelectedCurrency(enabledCurrencies[0]);
            // console.log('Auto-selected currency:', enabledCurrencies[0]);
          } else {
            // console.log('No enabled currencies found');
          }
        } else {
          // console.log('No currencies found in wallet settings');
        }
      } else {
        // console.log('Settings response not successful:', response.data);
      }
    } catch (error) {
      console.error('Error loading wallet settings:', error);
      setError('Failed to load payment options');
      
      // For testing, set some mock data if API fails
      // console.log('Setting mock wallet settings for testing');
      setWalletSettings({
        currencies: {
          BTC: { enabled: true, min_amount: 0.001, max_amount: 1.0, network_fee: 0.0001 },
          ETH: { enabled: true, min_amount: 0.01, max_amount: 10.0, network_fee: 0.005 }
        }
      });
      setSelectedCurrency('BTC');
    }
  };

  const handleCreateDeposit = async () => {
    if (!selectedCurrency) {
      setError('Please select a cryptocurrency');
      return;
    }

    if (!usdAmount || parseFloat(usdAmount) <= 0) {
      setError('Please enter a valid USD amount');
      return;
    }

    if (parseFloat(usdAmount) < minimumDepositAmount) {
      setError(`Deposit amount must be at least $${minimumDepositAmount.toFixed(2)}`);
      return;
    }

    if (hasActiveDeposit) {
      setError('You already have an active deposit. Please wait for it to be confirmed or expired.');
      return;
    }

    if (selectedPaymentMethod === 'nowpayments') {
      // Generate NowPayments invoice
      await generateNowPaymentsInvoice();
      return;
    }

    // Manual payment method
    try {
      setLoading(true);
      setError('');

      const depositAmount = parseFloat(usdAmount);
      
      const response = await api.post('/api/create-deposit', {
        amount: depositAmount,
        currency: selectedCurrency,
        payment_processor: 'manual',
        usd_amount: depositAmount,
        crypto_amount: cryptoAmount
      });

      if (response.data.success) {
        setDepositDetails(response.data.deposit);
        setRequiredConfirmations(response.data.deposit.required_confirmations || 4);
        setDepositCreated(true);
        setConfirmations(0);
        setHasActiveDeposit(true);
      }
    } catch (error) {
      console.error('Error creating deposit:', error);
      setError(error.response?.data?.error || 'Failed to create deposit');
    } finally {
      setLoading(false);
    }
  };

  const checkConfirmations = async () => {
    if (!depositDetails) return;

    try {
      const response = await api.get(`/api/deposits/${depositDetails.id}`);
      if (response.data.success) {
        const deposit = response.data.deposit;
        setConfirmations(deposit.confirmation_blocks || 0);
        
        if (deposit.status === 'confirmed') {
          // Deposit confirmed, close modal and refresh
          onClose();
          window.location.reload(); // Refresh to show updated balance
        }
      }
    } catch (error) {
      console.error('Error checking confirmations:', error);
    }
  };

  // Use utility functions from CryptoComponents
  const getCurrencyIcon = getCryptoIcon;
  const formatAmount = formatCryptoAmount;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const handleUsdAmountChange = (e) => {
    const value = e.target.value;
    // Only allow positive numbers and decimals
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setUsdAmount(value);
    }
  };

  // Generate QR code for wallet address
  const generateQRCode = (address) => {
    // You can use a QR code library like qrcode.react or integrate with a QR code service
    // For now, returning a placeholder
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(address)}`;
  };

  // console.log('DepositCreationModal render - isOpen:', isOpen);
  
  if (!isOpen) {
    // console.log('Modal not open, returning null');
    return null;
  }

  // console.log('Modal is open, rendering...');
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ zIndex: 9999 }}>
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white">
            {depositCreated ? '💰 Deposit Created' : 'Create Crypto Deposit'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Disclaimer Information */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">!</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-blue-300 font-semibold mb-2">Important Information</h3>
              <div className="text-blue-200 text-sm space-y-2">
                <p><strong>One Transaction Limit:</strong> You can only have one active deposit at a time.</p>
                <p><strong>Admin Confirmation Required:</strong> All deposits must be confirmed by an administrator.</p>
                <p><strong>1-Hour Timeout:</strong> Deposits expire after 1 hour if not confirmed by admin.</p>
                <p><strong>Currency Conversion:</strong> Enter USD amount, we'll convert to your selected cryptocurrency.</p>
                <p><strong>Network Fees:</strong> Additional network fees may apply based on blockchain conditions.</p>
              </div>
            </div>
          </div>
        </div>

        {!depositCreated ? (
          // Step 1: Select Cryptocurrency
          <div>
            {/* Active Deposit Warning */}
            {hasActiveDeposit && activeDepositInfo && (
              <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-400 text-2xl">⚠️</span>
                  <div>
                    <p className="text-yellow-300 font-medium">Active Deposit Found</p>
                    <p className="text-yellow-200 text-sm">
                      You have a pending deposit of ${activeDepositInfo.usd_amount} ({activeDepositInfo.crypto_amount} {activeDepositInfo.currency}). 
                      Please wait for admin confirmation or for it to expire before creating a new one.
                    </p>
                    {activeDepositInfo.timeout_at && (
                      <p className="text-yellow-200 text-sm mt-1">
                        Expires: {new Date(activeDepositInfo.timeout_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Purchase Info */}
            <div className="bg-gray-700 rounded-lg p-4 mb-6">
              <div className="text-center">
                <p className="text-gray-300 text-sm">Purchase Details</p>
                <p className="text-white text-xl font-bold">{itemName || 'Cart Purchase'}</p>
                {requiredAmount && requiredAmount > 0 && (
                  <p className="text-gray-400 text-sm">Required: ${requiredAmount.toFixed(2)}</p>
                )}
                <p className="text-gray-400 text-sm">Current Balance: ${currentBalance?.toFixed(2) || '0.00'}</p>
                <p className="text-gray-400 text-sm">Minimum Deposit: ${minimumDepositAmount?.toFixed(2) || '50.00'}</p>
              </div>
            </div>

            {/* USD Amount Input */}
            <div className="mb-6">
              <label className="block text-lg font-medium text-gray-300 mb-4">
                Enter Deposit Amount (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">$</span>
                <input
                  type="text"
                  value={usdAmount}
                  onChange={handleUsdAmountChange}
                  placeholder="Enter amount in USD"
                  className="w-full pl-8 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-lg focus:border-blue-500 focus:outline-none"
                  min={minimumDepositAmount}
                  disabled={hasActiveDeposit}
                />
              </div>
              {usdAmount && parseFloat(usdAmount) > 0 && (
                <div className="mt-2 text-sm text-gray-400">
                  {rateLoading ? (
                    <span>Calculating conversion...</span>
                  ) : exchangeRate && cryptoAmount ? (
                    <span>
                      ≈ {cryptoAmount} {selectedCurrency} (Rate: 1 {selectedCurrency} = ${exchangeRate.toLocaleString()})
                    </span>
                  ) : (
                    <span>Select a cryptocurrency to see conversion</span>
                  )}
                </div>
              )}
            </div>

            {/* Payment Method Selection */}
            <div className="mb-6">
              <label className="block text-lg font-medium text-gray-300 mb-4">
                Select Payment Method
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <label
                  className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedPaymentMethod === 'manual'
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="manual"
                    checked={selectedPaymentMethod === 'manual'}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="mr-3 text-blue-500"
                    disabled={hasActiveDeposit}
                  />
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">💳</span>
                    <div>
                      <div className="text-white font-medium text-lg">
                        Manual Payment
                      </div>
                      <div className="text-gray-400 text-sm">
                        Send crypto directly to wallet address
                      </div>
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedPaymentMethod === 'nowpayments'
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="nowpayments"
                    checked={selectedPaymentMethod === 'nowpayments'}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="mr-3 text-blue-500"
                    disabled={hasActiveDeposit}
                  />
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">🚀</span>
                    <div>
                      <div className="text-white font-medium text-lg">
                        NowPayments
                      </div>
                      <div className="text-gray-400 text-sm">
                        Professional payment processing
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Debug Info - Remove this in production */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-900 border border-gray-600 rounded-lg p-4 mb-4 text-xs">
                <div className="text-gray-400 mb-2">Debug Info:</div>
                <div className="text-gray-300">
                  <div>Wallet Settings Loaded: {walletSettings ? 'Yes' : 'No'}</div>
                  <div>Currencies Count: {walletSettings?.currencies ? Object.keys(walletSettings.currencies).length : 0}</div>
                  <div>Enabled Currencies: {walletSettings?.currencies ? Object.entries(walletSettings.currencies).filter(([_, config]) => config?.enabled).length : 0}</div>
                  <div>Selected Currency: {selectedCurrency || 'None'}</div>
                  <div>USD Amount: ${usdAmount || '0'}</div>
                  <div>Crypto Amount: {cryptoAmount || '0'} {selectedCurrency}</div>
                  <div>Exchange Rate: {exchangeRate ? `1 ${selectedCurrency} = $${exchangeRate}` : 'N/A'}</div>
                  <div>Has Active Deposit: {hasActiveDeposit ? 'Yes' : 'No'}</div>
                </div>
              </div>
            )}
            
            {/* Crypto Selection */}
            <div className="mb-6">
              <label className="block text-lg font-medium text-gray-300 mb-4">
                Select Cryptocurrency
              </label>
              
              {/* Loading State */}
              {!walletSettings && (
                <div className="bg-gray-700 rounded-lg p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                  <p className="text-gray-300">Loading payment options...</p>
                </div>
              )}
              
              {/* No Currencies Available */}
              {walletSettings && (!walletSettings.currencies || Object.keys(walletSettings.currencies).length === 0) && (
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center">
                  <div className="text-red-400 text-2xl mb-2">⚠️</div>
                  <p className="text-red-300 font-medium mb-2">No Payment Options Available</p>
                  <p className="text-red-400 text-sm">
                    No cryptocurrencies have been configured in the admin panel. 
                    Please contact an administrator to set up payment options.
                  </p>
                </div>
              )}
              
              {/* No Enabled Currencies */}
              {walletSettings?.currencies && Object.entries(walletSettings.currencies).filter(([_, config]) => config?.enabled).length === 0 && (
                <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-6 text-center">
                  <div className="text-yellow-400 text-2xl mb-2">⚠️</div>
                  <p className="text-yellow-300 font-medium mb-2">No Active Payment Methods</p>
                  <p className="text-yellow-400 text-sm">
                    Cryptocurrencies are configured but none are currently enabled. 
                    Please contact an administrator to activate payment methods.
                  </p>
                </div>
              )}
              
              {/* Available Currencies */}
              {walletSettings?.currencies && Object.entries(walletSettings.currencies)
                .filter(([_, config]) => config && config.enabled)
                .map(([currency, config]) => (
                  <label
                    key={currency}
                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedCurrency === currency
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-gray-600 hover:border-gray-500'
                    } ${hasActiveDeposit ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="radio"
                      name="currency"
                      value={currency}
                      checked={selectedCurrency === currency}
                      onChange={(e) => setSelectedCurrency(e.target.value)}
                      className="mr-3 text-blue-500"
                      disabled={hasActiveDeposit}
                    />
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{getCurrencyIcon(currency)}</span>
                      <div>
                        <div className="text-white font-medium text-lg">
                          {currency.replace('_', ' ')}
                        </div>
                        <div className="text-gray-400 text-sm">
                          Min: {formatAmount(config.min_amount, currency)} | 
                          Max: {formatAmount(config.max_amount, currency)}
                        </div>
                        <div className="text-gray-400 text-sm">
                          Network Fee: {formatAmount(config.network_fee, currency)} {currency}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
                
              {/* Fallback for testing - Remove in production */}
              {(!walletSettings || !walletSettings.currencies || Object.entries(walletSettings.currencies).filter(([_, config]) => config?.enabled).length === 0) && (
                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                  <div className="text-blue-300 text-sm mb-2">For testing purposes, you can use these default options:</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <label className="flex items-center p-3 rounded border border-blue-600 cursor-pointer hover:bg-blue-900/20">
                      <input
                        type="radio"
                        name="currency"
                        value="BTC"
                        checked={selectedCurrency === 'BTC'}
                        onChange={(e) => setSelectedCurrency(e.target.value)}
                        className="mr-2 text-blue-500"
                      />
                      <span className="text-blue-300">₿ Bitcoin (Test)</span>
                    </label>
                    <label className="flex items-center p-3 rounded border border-blue-600 cursor-pointer hover:bg-blue-900/20">
                      <input
                        type="radio"
                        name="currency"
                        value="ETH"
                        checked={selectedCurrency === 'ETH'}
                        onChange={(e) => setSelectedCurrency(e.target.value)}
                        className="mr-2 text-blue-500"
                      />
                      <span className="text-blue-300">Ξ Ethereum (Test)</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-600 text-white p-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDeposit}
                disabled={!selectedCurrency || !usdAmount || parseFloat(usdAmount) < minimumDepositAmount || loading || hasActiveDeposit}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
              >
                {loading ? 'Creating Deposit...' : hasActiveDeposit ? 'Active Deposit Exists' : 'Create Deposit'}
              </button>
            </div>
          </div>
        ) : (
          // Step 2: Show Payment Details
          <div>
            {nowpaymentsInvoice ? (
              // NowPayments Invoice Display
              <>
                {/* Success Message */}
                <div className="bg-green-600 text-white p-4 rounded-lg mb-6">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="font-medium">NowPayments Invoice Created!</p>
                      <p className="text-sm opacity-90">
                        Your payment invoice has been generated successfully
                      </p>
                    </div>
                  </div>
                </div>

                {/* Invoice Details */}
                <div className="bg-gray-700 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-medium text-white mb-4">Invoice Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Invoice ID:</span>
                      <span className="text-white font-mono">{nowpaymentsInvoice.invoice_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Purchase ID:</span>
                      <span className="text-white font-mono">{nowpaymentsInvoice.purchase_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Amount:</span>
                      <span className="text-white font-medium">${nowpaymentsInvoice.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Currency:</span>
                      <span className="text-white">{nowpaymentsInvoice.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Status:</span>
                      <span className="text-yellow-400 font-medium capitalize">{nowpaymentsInvoice.status}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Instructions */}
                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-blue-300 mb-3">Next Steps</h3>
                  <div className="space-y-2 text-blue-200 text-sm">
                    <p>1. <strong>Check your email</strong> for payment instructions</p>
                    <p>2. <strong>Complete payment</strong> using the provided link</p>
                    <p>3. <strong>Wait for confirmation</strong> from NowPayments</p>
                    <p>4. <strong>Your balance will be updated</strong> once payment is confirmed</p>
                  </div>
                </div>
              </>
            ) : (
              // Manual Payment Display
              <>
                {/* Success Message */}
                <div className="bg-green-600 text-white p-4 rounded-lg mb-6">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="font-medium">Deposit Created Successfully!</p>
                      <p className="text-sm opacity-90">
                        Please send exactly {cryptoAmount} {depositDetails.currency} to the address below
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timeout Warning */}
                <div className="bg-orange-900/20 border border-orange-700 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <span className="text-orange-400 text-2xl">⏰</span>
                    <div>
                      <p className="text-orange-300 font-medium">Admin Confirmation Required</p>
                      <p className="text-orange-200 text-sm">
                        This deposit will expire in: <span className="font-bold">{timeoutCountdown || 'Calculating...'}</span>
                      </p>
                      <p className="text-orange-200 text-sm">
                        An administrator must confirm your payment within 1 hour.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Deposit Summary */}
                <div className="bg-gray-700 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-medium text-white mb-4">Deposit Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300">USD Amount:</span>
                      <span className="text-white font-medium">${usdAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Crypto Amount:</span>
                      <span className="text-white font-medium">{cryptoAmount} {depositDetails.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Exchange Rate:</span>
                      <span className="text-white">1 {depositDetails.currency} = ${exchangeRate?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Network Fee:</span>
                      <span className="text-white">{depositDetails.network_fee} {depositDetails.currency}</span>
                    </div>
                  </div>
                </div>

                {/* Wallet Address with QR Code */}
                <div className="bg-gray-700 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-medium text-white mb-4">Wallet Address</h3>
                  
                  {/* QR Code */}
                  <div className="text-center mb-4">
                    <img 
                      src={generateQRCode(depositDetails.wallet_address)}
                      alt="QR Code for wallet address"
                      className="mx-auto border-2 border-gray-600 rounded-lg"
                      width="200"
                      height="200"
                    />
                    <p className="text-gray-400 text-sm mt-2">Scan with your crypto wallet</p>
                  </div>
                  
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                    <div className="flex items-center justify-between">
                      <code className="text-sm text-blue-300 break-all flex-1 mr-4">
                        {depositDetails.wallet_address}
                      </code>
                      <button
                        onClick={() => copyToClipboard(depositDetails.wallet_address)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    ⚠️ <strong>Important:</strong> Only send the exact amount specified. Any difference will not be credited.
                  </p>
                </div>

                {/* Confirmation Status */}
                <div className="bg-gray-700 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-medium text-white mb-4">Admin Confirmation Status</h3>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-400 mb-2">
                      ⏳ Pending
                    </div>
                    <p className="text-gray-300 mb-2">
                      Waiting for administrator confirmation...
                    </p>
                    <p className="text-gray-400 text-sm">
                      Time remaining: {timeoutCountdown || 'Calculating...'}
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      Your balance will be updated once an admin confirms your payment.
                    </p>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-blue-300 mb-3">How to Complete Your Deposit</h3>
                  <div className="space-y-2 text-blue-200 text-sm">
                    <p>1. <strong>Scan the QR code</strong> or copy the wallet address above</p>
                    <p>2. <strong>Send exactly {cryptoAmount} {depositDetails.currency}</strong> from your wallet</p>
                    <p>3. <strong>Include your order ID</strong> in the memo/note field when sending</p>
                    <p>4. <strong>Wait for admin confirmation</strong> (usually within 1 hour)</p>
                    <p>5. <strong>Your balance will be updated automatically</strong> once confirmed</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Check Balance
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DepositCreationModal;
