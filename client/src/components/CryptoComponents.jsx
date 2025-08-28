import React, { useState, useEffect } from 'react';
import { cryptoService } from '../services/cryptoService';

// ============================================================================
// CRYPTO PRICE WIDGET - Live crypto prices display
// ============================================================================

export const CryptoPriceWidget = ({ showChart = false, className = "", currencies = ['bitcoin', 'ethereum', 'tether', 'binancecoin', 'cardano'] }) => {
  const [prices, setPrices] = useState({});
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch current prices for specified cryptocurrencies
        const priceData = await cryptoService.getPrices(currencies, ['usd']);
        setPrices(priceData);
        
        // Fetch market data for more details
        const marketData = await cryptoService.getMarketData(
          currencies.slice(0, 3), // Limit to first 3 for market data
          'usd'
        );
        setMarketData(marketData);
        
        setError(null);
      } catch (err) {
        setError('Failed to fetch crypto prices');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Update every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [currencies]);

  if (loading) {
    return (
      <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/3 mb-3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gray-800 rounded-lg p-4 border border-red-600 ${className}`}>
        <div className="text-red-400 text-sm">{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="text-blue-400 hover:text-blue-300 text-xs mt-2"
        >
          Retry
        </button>
      </div>
    );
  }

  const cryptoIcons = {
    bitcoin: { icon: '₿', color: 'text-yellow-400', name: 'Bitcoin' },
    ethereum: { icon: 'Ξ', color: 'text-blue-400', name: 'Ethereum' },
    tether: { icon: '₮', color: 'text-green-400', name: 'Tether' },
    binancecoin: { icon: '🟡', color: 'text-yellow-500', name: 'BNB' },
    cardano: { icon: '🔷', color: 'text-blue-500', name: 'Cardano' },
    solana: { icon: '🟣', color: 'text-purple-400', name: 'Solana' },
    polkadot: { icon: '🟢', color: 'text-pink-400', name: 'Polkadot' },
    chainlink: { icon: '🔗', color: 'text-blue-300', name: 'Chainlink' }
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
        💰 Crypto Prices
        <span className="ml-2 text-xs text-gray-400">(Live)</span>
      </h3>
      
      <div className="space-y-3">
        {currencies.map((cryptoId) => {
          const crypto = cryptoIcons[cryptoId];
          const price = prices[cryptoId]?.usd;
          
          return (
            <div key={cryptoId} className="flex items-center justify-between p-2 bg-gray-700 rounded">
              <div className="flex items-center space-x-2">
                <span className={crypto.color}>{crypto.icon}</span>
                <span className="text-gray-300 text-sm">{crypto.name}</span>
              </div>
              <div className="text-right">
                <div className="text-white font-medium">
                  ${price?.toLocaleString() || '...'}
                </div>
                <div className="text-xs text-gray-400">
                  {cryptoId.toUpperCase()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// CRYPTO PRICE CONVERTER - Convert USD prices to crypto
// ============================================================================

export const CryptoPriceConverter = ({ usdPrice, className = "", onConvert }) => {
  const [convertedPrices, setConvertedPrices] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCrypto, setSelectedCrypto] = useState('bitcoin');

  const popularCryptos = [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', icon: '₿' },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', icon: 'Ξ' },
    { id: 'tether', name: 'Tether', symbol: 'USDT', icon: '₮' },
    { id: 'binancecoin', name: 'BNB', symbol: 'BNB', icon: '🟡' },
    { id: 'cardano', name: 'Cardano', symbol: 'ADA', icon: '🔷' }
  ];

  useEffect(() => {
    if (usdPrice && usdPrice > 0) {
      convertPrice(selectedCrypto);
    }
  }, [usdPrice, selectedCrypto]);

  const convertPrice = async (cryptoId) => {
    if (!usdPrice || usdPrice <= 0) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await cryptoService.convertPrice(usdPrice, cryptoId);
      setConvertedPrices(prev => ({
        ...prev,
        [cryptoId]: result
      }));
      
      // Call callback if provided
      if (onConvert) {
        onConvert(cryptoId, result);
      }
    } catch (err) {
      setError(`Failed to convert price for ${cryptoId}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCryptoChange = (cryptoId) => {
    setSelectedCrypto(cryptoId);
    if (!convertedPrices[cryptoId]) {
      convertPrice(cryptoId);
    }
  };

  if (!usdPrice || usdPrice <= 0) {
    return null;
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-3">
        💱 Price Converter
      </h3>
      
      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-2">Original Price</div>
        <div className="text-2xl font-bold text-green-400">
          ${usdPrice.toFixed(2)} USD
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-2">Convert to</div>
        <div className="grid grid-cols-2 gap-2">
          {popularCryptos.map((crypto) => (
            <button
              key={crypto.id}
              onClick={() => handleCryptoChange(crypto.id)}
              className={`p-2 rounded text-sm transition-colors ${
                selectedCrypto === crypto.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{crypto.icon}</span>
                <span>{crypto.symbol}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mx-auto"></div>
          <div className="text-gray-400 text-sm mt-2">Converting...</div>
        </div>
      )}

      {error && (
        <div className="text-red-400 text-sm text-center mb-3">
          {error}
        </div>
      )}

      {convertedPrices[selectedCrypto] && (
        <div className="bg-gray-700 rounded-lg p-4 text-center">
          <div className="text-sm text-gray-400 mb-1">Converted Price</div>
          <div className="text-xl font-bold text-white">
            {convertedPrices[selectedCrypto].toFixed(8)} {selectedCrypto.toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// CRYPTO SCROLLING BANNER - Horizontal scrolling price ticker
// ============================================================================

export const CryptoScrollingBanner = ({ className = "", currencies = ['bitcoin', 'ethereum', 'tether', 'binancecoin', 'cardano', 'solana', 'polkadot', 'chainlink'] }) => {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const priceData = await cryptoService.getPrices(currencies, ['usd']);
        setPrices(priceData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching crypto prices for banner:', error);
        setLoading(false);
      }
    };

    fetchPrices();
    
    // Update every 2 minutes for the banner
    const interval = setInterval(fetchPrices, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [currencies]);

  if (loading) {
    return (
      <div className={`bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 p-3 ${className}`}>
        <div className="flex items-center justify-center space-x-8 text-white">
          <div className="animate-pulse">Loading crypto prices...</div>
        </div>
      </div>
    );
  }

  const cryptoData = [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', icon: '₿', color: 'text-yellow-400' },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', color: 'text-blue-400' },
    { id: 'tether', symbol: 'USDT', name: 'Tether', icon: '₮', color: 'text-green-400' },
    { id: 'binancecoin', symbol: 'BNB', name: 'BNB', icon: '🟡', color: 'text-yellow-500' },
    { id: 'cardano', symbol: 'ADA', name: 'Cardano', icon: '🔷', color: 'text-blue-500' },
    { id: 'solana', symbol: 'SOL', name: 'Solana', icon: '🟣', color: 'text-purple-400' },
    { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', icon: '🟢', color: 'text-pink-400' },
    { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', icon: '🔗', color: 'text-blue-300' }
  ].filter(crypto => currencies.includes(crypto.id));

  return (
    <div className={`bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 p-3 overflow-hidden ${className}`}>
      <div className="flex items-center space-x-8 animate-scroll">
        {cryptoData.map((crypto) => (
          <div key={crypto.id} className="flex items-center space-x-2 text-white whitespace-nowrap">
            <span className={`text-lg ${crypto.color}`}>{crypto.icon}</span>
            <span className="font-medium">{crypto.symbol}</span>
            <span className="text-sm opacity-80">
              ${prices[crypto.id]?.usd?.toLocaleString() || '...'}
            </span>
          </div>
        ))}
        {/* Duplicate for seamless scrolling */}
        {cryptoData.map((crypto) => (
          <div key={`${crypto.id}-duplicate`} className="flex items-center space-x-2 text-white whitespace-nowrap">
            <span className={`text-lg ${crypto.color}`}>{crypto.icon}</span>
            <span className="font-medium">{crypto.symbol}</span>
            <span className="text-sm opacity-80">
              ${prices[crypto.id]?.usd?.toLocaleString() || '...'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// CRYPTO DASHBOARD - Combined dashboard component
// ============================================================================

export const CryptoDashboard = ({ className = "", showConverter = true, showFeatures = true }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Crypto Prices */}
        <CryptoPriceWidget />
        
        {/* Price Converter - Optional */}
        {showConverter && <CryptoPriceConverter usdPrice={99.99} />}
      </div>
      
      {/* Features Section - Optional */}
      {showFeatures && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            🚀 Crypto Integration Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center p-3 bg-gray-700 rounded">
              <div className="text-2xl mb-2">💰</div>
              <div className="text-white font-medium">Real-time Prices</div>
              <div className="text-gray-400">Live crypto prices from CoinGecko API</div>
            </div>
            <div className="text-center p-3 bg-gray-700 rounded">
              <div className="text-2xl mb-2">💱</div>
              <div className="text-white font-medium">Price Conversion</div>
              <div className="text-gray-400">Convert bot prices to any crypto</div>
            </div>
            <div className="text-center p-3 bg-gray-700 rounded">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-white font-medium">Market Data</div>
              <div className="text-gray-400">24h changes, market cap, volume</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// CRYPTO PAYMENT SELECTOR - Unified payment method selector
// ============================================================================

export const CryptoPaymentSelector = ({ 
  onSelect, 
  onClose, 
  requiredAmount, 
  currentBalance, 
  walletSettings,
  className = "" 
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Auto-select first enabled currency
    if (walletSettings?.currencies) {
      const enabledCurrencies = Object.entries(walletSettings.currencies)
        .filter(([_, config]) => config.enabled)
        .map(([currency, _]) => currency);
      
      if (enabledCurrencies.length > 0) {
        setSelectedCurrency(enabledCurrencies[0]);
      }
    }
  }, [walletSettings]);

  const handleConfirm = () => {
    if (!selectedCurrency) {
      setError('Please select a cryptocurrency');
      return;
    }
    onSelect(selectedCurrency);
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

  const formatAmount = (amount, currency) => {
    if (currency === 'BTC' || currency === 'LTC' || currency === 'ETH' || currency === 'XMR' || currency === 'SOL') {
      return parseFloat(amount).toFixed(8);
    }
    return parseFloat(amount).toFixed(2);
  };

  if (!walletSettings?.currencies) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="text-center text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          Loading payment options...
        </div>
      </div>
    );
  }

  const enabledCurrencies = Object.entries(walletSettings.currencies)
    .filter(([_, config]) => config.enabled);

  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Select Payment Method</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        )}
      </div>

      {/* Balance Info */}
      {currentBalance !== undefined && (
        <div className="bg-gray-700 rounded-lg p-4 mb-4">
          <div className="text-center">
            <p className="text-gray-300 text-sm">Current Balance</p>
            <p className="text-white text-2xl font-bold">${currentBalance?.toFixed(2) || '0.00'}</p>
            {requiredAmount && (
              <p className="text-gray-400 text-sm">Required: ${requiredAmount?.toFixed(2) || '0.00'}</p>
            )}
            {currentBalance !== undefined && requiredAmount && (
              <div className="mt-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  (currentBalance || 0) >= (requiredAmount || 0) 
                    ? 'bg-green-600 text-white' 
                    : 'bg-red-600 text-white'
                }`}>
                  {currentBalance >= requiredAmount ? 'Sufficient Funds' : 'Insufficient Funds'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Crypto Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Cryptocurrency
        </label>
        <div className="grid grid-cols-2 gap-2">
          {enabledCurrencies.map(([currency, config]) => (
            <button
              key={currency}
              onClick={() => setSelectedCurrency(currency)}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedCurrency === currency
                  ? 'border-blue-500 bg-blue-600 text-white'
                  : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-600'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">{getCurrencyIcon(currency)}</div>
                <div className="font-medium">{currency}</div>
                <div className="text-xs opacity-75">
                  Min: {formatAmount(config.min_amount, currency)}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="text-red-400 text-sm text-center mb-4">
          {error}
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleConfirm}
        disabled={!selectedCurrency}
        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
      >
        Continue with {selectedCurrency || 'Crypto'}
      </button>
    </div>
  );
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const formatCryptoAmount = (amount, currency) => {
  if (currency === 'BTC' || currency === 'LTC' || currency === 'ETH' || currency === 'XMR' || currency === 'SOL') {
    return parseFloat(amount).toFixed(8);
  }
  return parseFloat(amount).toFixed(2);
};

export const getCryptoIcon = (currency) => {
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

// All components are already exported individually above
