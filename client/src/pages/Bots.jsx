import React, { useState, useMemo } from 'react';
import { useCart } from '../contexts/CartContext.jsx';

const Bots = () => {
  const { cart, addToCart, removeFromCart, isInCart, cartTotal } = useCart();
  const [bots] = useState([
    {
      id: 1,
      botId: 'US0FGID0XSDVPPQMQJ07GCPSACLPIH1QK',
      timestamp1: '2025-08-22T19:67:17',
      timestamp2: '2025-08-22T19:67:17',
      multiplier: '2x',
      resources: [
        'Google Chrome', 'Microsoft Edge', 'OperaGX', 'Discord', 'Spotify', 'eBay', 'Roblox', 'Hulu', 'Shein'
      ],
      country: 'US',
      flag: '🇺🇸',
      ip: '99.82.252.101',
      os: 'Windows 10 Home [x64]',
      knownCount: 50,
      otherCount: 12,
      price: 16.00,
      status: 'available',
      // Real data from Log Examples
      systemInfo: {
        processor: 'AMD Ryzen 5 5600X 6-Core Processor',
        cores: 6,
        threads: 12,
        ram: '16308 MB',
        videoCard: 'NVIDIA GeForce RTX 3060',
        computerName: 'XQA',
        userName: 'igsan',
        displayResolution: '1920x1080',
        installDate: '23/9/2022 16:10:50',
        av: 'Windows Defender'
      },
      logins: {
        'Gaming': { 'Roblox': 8, 'Battle.net': 1 },
        'Shopping': { 'eBay': 2, 'Shein': 1, 'Swagbucks': 1 },
        'Streaming': { 'Hulu': 1, 'Spotify': 1 },
        'Education': { 'SLPS': 2 },
        'VPN': { 'ProtonVPN': 1 },
        'Trading': { 'Traderie': 1 }
      },
      cookies: {
        'Social Media': { 'Twitter': 15, 'Snapchat': 8, 'TikTok': 3 },
        'Streaming': { 'Spotify': 25, 'YouTube': 12 },
        'Advertising': { 'DoubleClick': 8, 'Demdex': 5, 'AppNexus': 4 },
        'Analytics': { 'Yahoo Analytics': 3, 'Scorecard Research': 2 }
      },
      extensions: [
        { name: 'Google Chrome Extensions', type: 'Browser', version: 'Multiple Profiles' },
        { name: 'Microsoft Edge Extensions', type: 'Browser', version: 'Default Profile' },
        { name: 'OperaGX Extensions', type: 'Browser', version: 'Gaming Browser' }
      ],
      applications: [
        { name: 'Discord', type: 'Communication', version: 'Latest', tokens: 2 },
        { name: 'Google Chrome', type: 'Browser', version: 'Multiple Profiles', cookies: 55 },
        { name: 'Microsoft Edge', type: 'Browser', version: 'Default', cookies: 203 },
        { name: 'OperaGX', type: 'Browser', version: 'Gaming', cookies: 59 }
      ],
      passwords: 25,
      autofill: 45
    },
    {
      id: 2,
      botId: 'US0FLL024TZPYH5GQ04CCZ3E4KC6TOKS8',
      timestamp1: '2025-08-22T15:54:30',
      timestamp2: '2025-08-22T15:54:30',
      multiplier: '3x',
      resources: [
        'Google Chrome', 'Microsoft Edge', 'MetaMask', 'Discord', 'Steam', 'Spotify', 'Netflix'
      ],
      country: 'US',
      flag: '🇺🇸',
      ip: '192.168.1.100',
      os: 'Windows 11 Pro [x64]',
      knownCount: 45,
      otherCount: 18,
      price: 20.00,
      status: 'sale',
      systemInfo: {
        processor: 'Intel Core i7-12700K',
        cores: 8,
        threads: 16,
        ram: '32768 MB',
        videoCard: 'NVIDIA GeForce RTX 4070',
        computerName: 'GAMING-PC',
        userName: 'gamer123',
        displayResolution: '2560x1440',
        installDate: '15/8/2023 10:30:00',
        av: 'Windows Defender'
      },
      logins: {
        'Gaming': { 'Steam': 3, 'Epic Games': 1, 'Battle.net': 1 },
        'Streaming': { 'Netflix': 2, 'Spotify': 1, 'Twitch': 1 },
        'Social': { 'Discord': 2, 'Reddit': 1 },
        'Crypto': { 'MetaMask': 1, 'Coinbase': 1 }
      },
      cookies: {
        'Gaming': { 'Steam': 89, 'Epic Games': 45, 'Battle.net': 67 },
        'Streaming': { 'Netflix': 78, 'Spotify': 56, 'Twitch': 34 },
        'Social': { 'Discord': 123, 'Reddit': 45 },
        'Crypto': { 'MetaMask': 67, 'Coinbase': 34 }
      },
      extensions: [
        { name: 'MetaMask', type: 'Crypto Wallet', version: '10.28.3' },
        { name: 'uBlock Origin', type: 'Ad Blocker', version: '1.48.0' },
        { name: 'Dark Reader', type: 'Theme', version: '4.9.34' }
      ],
      applications: [
        { name: 'Discord', type: 'Communication', version: 'Latest', tokens: 3 },
        { name: 'Steam', type: 'Gaming', version: '2.10.91.91' },
        { name: 'Spotify', type: 'Music Streaming', version: '8.8.0.121' }
      ],
      passwords: 18,
      autofill: 32
    },
    {
      id: 3,
      botId: 'US0KO1ESHD73T9T0ZVJZC7K6IBMD90L6U',
      timestamp1: '2025-08-22T19:98:56',
      timestamp2: '2025-08-22T19:98:56',
      multiplier: '1x',
      resources: [
        'Google Chrome', 'Microsoft Edge', 'OperaGX', 'Discord', 'Steam', 'Spotify', 'Netflix'
      ],
      country: 'US',
      flag: '🇺🇸',
      ip: '10.0.0.50',
      os: 'Windows 10 Enterprise [x64]',
      knownCount: 38,
      otherCount: 15,
      price: 21.00,
      status: 'sale',
      systemInfo: {
        processor: 'Intel Core i5-10400F',
        cores: 6,
        threads: 12,
        ram: '16384 MB',
        videoCard: 'NVIDIA GeForce GTX 1660 Super',
        computerName: 'WORKSTATION',
        userName: 'admin',
        displayResolution: '1920x1080',
        installDate: '10/7/2022 14:20:00',
        av: 'Windows Defender'
      },
      logins: {
        'Gaming': { 'Steam': 2, 'Epic Games': 1 },
        'Streaming': { 'Netflix': 1, 'Spotify': 1, 'Hulu': 1 },
        'Social': { 'Discord': 1, 'Facebook': 1 },
        'Work': { 'Office 365': 1, 'Slack': 1 }
      },
      cookies: {
        'Gaming': { 'Steam': 56, 'Epic Games': 34 },
        'Streaming': { 'Netflix': 45, 'Spotify': 38, 'Hulu': 23 },
        'Social': { 'Discord': 67, 'Facebook': 45 },
        'Work': { 'Office 365': 89, 'Slack': 34 }
      },
      extensions: [
        { name: 'LastPass', type: 'Password Manager', version: '4.80.0' },
        { name: 'Grammarly', type: 'Writing Assistant', version: '14.1026.0' },
        { name: 'Honey', type: 'Shopping Assistant', version: '16.0.0' }
      ],
      applications: [
        { name: 'Discord', type: 'Communication', version: 'Latest', tokens: 1 },
        { name: 'Steam', type: 'Gaming', version: '2.10.91.91' },
        { name: 'Microsoft Office', type: 'Productivity', version: '16.0.15629.20298' }
      ],
      passwords: 15,
      autofill: 28
    },
    {
      id: 4,
      botId: 'US0JTX9XRH01COVB8436MV2Y7QGOF0Y9B',
      timestamp1: '2025-08-22T15:74:99',
      timestamp2: '2025-08-22T15:74:99',
      multiplier: '2x',
      resources: [
        'Google Chrome', 'Microsoft Edge', 'Discord', 'Steam', 'Spotify', 'Netflix', 'YouTube'
      ],
      country: 'US',
      flag: '🇺🇸',
      ip: '172.16.0.25',
      os: 'Windows 10 Home [x64]',
      knownCount: 42,
      otherCount: 20,
      price: 10.20,
      status: 'available',
      systemInfo: {
        processor: 'AMD Ryzen 3 3200G',
        cores: 4,
        threads: 4,
        ram: '8192 MB',
        videoCard: 'AMD Radeon Vega 8 Graphics',
        computerName: 'HOME-PC',
        userName: 'user',
        displayResolution: '1366x768',
        installDate: '5/6/2021 09:15:00',
        av: 'Windows Defender'
      },
      logins: {
        'Gaming': { 'Steam': 1, 'Roblox': 1 },
        'Streaming': { 'Netflix': 1, 'Spotify': 1, 'YouTube': 1 },
        'Social': { 'Discord': 1, 'TikTok': 1 },
        'Shopping': { 'Amazon': 1, 'eBay': 1 }
      },
      cookies: {
        'Gaming': { 'Steam': 34, 'Roblox': 23 },
        'Streaming': { 'Netflix': 29, 'Spotify': 45, 'YouTube': 156 },
        'Social': { 'Discord': 45, 'TikTok': 34 },
        'Shopping': { 'Amazon': 67, 'eBay': 45 }
      },
      extensions: [
        { name: 'AdBlock Plus', type: 'Ad Blocker', version: '3.66.0' },
        { name: 'Honey', type: 'Shopping Assistant', version: '16.0.0' },
        { name: 'Dark Reader', type: 'Theme', version: '4.9.34' }
      ],
      applications: [
        { name: 'Discord', type: 'Communication', version: 'Latest', tokens: 1 },
        { name: 'Steam', type: 'Gaming', version: '2.10.91.91' },
        { name: 'Spotify', type: 'Music Streaming', version: '8.8.0.121' }
      ],
      passwords: 12,
      autofill: 23
    },
    {
      id: 5,
      botId: 'US0B9UBT81IZLNI9GGK74KAHJDBTOSJTU',
      timestamp1: '2025-08-22T10:62:06',
      timestamp2: '2025-08-22T10:62:06',
      multiplier: '1x',
      resources: [
        'Google Chrome', 'Microsoft Edge', 'Discord', 'Steam', 'Spotify', 'Netflix'
      ],
      country: 'US',
      flag: '🇺🇸',
      ip: '192.168.0.100',
      os: 'Windows 10 Pro [x64]',
      knownCount: 35,
      otherCount: 22,
      price: 8.00,
      status: 'available',
      systemInfo: {
        processor: 'Intel Core i3-10100',
        cores: 4,
        threads: 8,
        ram: '8192 MB',
        videoCard: 'Intel UHD Graphics 630',
        computerName: 'LAPTOP-ABC123',
        userName: 'student',
        displayResolution: '1920x1080',
        installDate: '20/3/2021 11:45:00',
        av: 'Windows Defender'
      },
      logins: {
        'Gaming': { 'Steam': 1, 'Roblox': 1 },
        'Streaming': { 'Netflix': 1, 'Spotify': 1 },
        'Social': { 'Discord': 1, 'Instagram': 1 },
        'Education': { 'Canvas': 1, 'Google Classroom': 1 }
      },
      cookies: {
        'Gaming': { 'Steam': 23, 'Roblox': 19 },
        'Streaming': { 'Netflix': 34, 'Spotify': 28 },
        'Social': { 'Discord': 38, 'Instagram': 45 },
        'Education': { 'Canvas': 67, 'Google Classroom': 89 }
      },
      extensions: [
        { name: 'Grammarly', type: 'Writing Assistant', version: '14.1026.0' },
        { name: 'uBlock Origin', type: 'Ad Blocker', version: '1.48.0' },
        { name: 'Dark Reader', type: 'Theme', version: '4.9.34' }
      ],
      applications: [
        { name: 'Discord', type: 'Communication', version: 'Latest', tokens: 1 },
        { name: 'Steam', type: 'Gaming', version: '2.10.91.91' },
        { name: 'Spotify', type: 'Music Streaming', version: '8.8.0.121' }
      ],
      passwords: 8,
      autofill: 15
    }
  ]);

  const [filters, setFilters] = useState({
    botName: '',
    resources: '',
    country: '',
    price: ''
  });

  const [selectedBot, setSelectedBot] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Get unique countries for filter
  const countries = useMemo(() => {
    const uniqueCountries = [...new Set(bots.map(bot => bot.country))];
    return uniqueCountries.sort();
  }, [bots]);

  // Get unique price ranges
  const priceRanges = [
    { value: '0-10', label: '$0 - $10' },
    { value: '10-20', label: '$10 - $20' },
    { value: '20-30', label: '$20 - $30' },
    { value: '30+', label: '$30+' }
  ];

  const filteredBots = bots.filter(bot => {
    if (filters.botName && !bot.botId.toLowerCase().includes(filters.botName.toLowerCase())) return false;
    if (filters.resources && !bot.resources.some(resource => 
      resource.toLowerCase().includes(filters.resources.toLowerCase())
    )) return false;
    if (filters.country && bot.country !== filters.country) return false;
    if (filters.price) {
      const [min, max] = filters.price.split('-').map(Number);
      if (max && (bot.price < min || bot.price > max)) return false;
      if (!max && bot.price < min) return false;
    }
    return true;
  });

  const handleBotClick = (bot) => {
    setSelectedBot(bot);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedBot(null);
  };

  const showToast = (message, type = 'success') => {
    console.log('Showing toast:', message, type);
    const id = Date.now();
    const newToast = { id, message, type, timestamp: Date.now() };
    setToasts(prev => [...prev, newToast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  const handleAddToCart = (bot) => {
    if (!isInCart(bot.id)) {
      addToCart(bot);
      
      showToast(
        `Added Bot ${bot.botId.substring(0, 8)}... To Cart - $${bot.price.toFixed(2)}`,
        'success'
      );
      
      setTimeout(() => {
        showToast(`Total is now - $${(cartTotal + bot.price).toFixed(2)}`, 'info');
      }, 500);
    }
  };

  const handleRemoveFromCart = (botId) => {
    const botToRemove = cart.find(item => item.id === botId);
    
    if (botToRemove) {
      removeFromCart(botId);
      
      showToast(
        `Removed Bot ${botToRemove.botId.substring(0, 8)}... From Cart`,
        'warning'
      );
      
      if (cart.length > 1) {
        setTimeout(() => {
          showToast(`Total is now - $${(cartTotal - botToRemove.price).toFixed(2)}`, 'info');
        }, 500);
      } else {
        setTimeout(() => {
          showToast('Cart is now empty', 'info');
        }, 500);
      }
    }
  };

  const getCountryFlag = (country) => {
    const flags = {
      'SE': '🇸🇪', 'NL': '🇳🇱', 'PL': '🇵🇱', 'ES': '🇪🇸', 'TR': '🇹🇷',
      'US': '🇺🇸', 'GB': '🇬🇧', 'DE': '🇩🇪', 'FR': '🇫🇷', 'CA': '🇨🇦'
    };
    return flags[country] || '🌍';
  };

  // Calculate total logins and cookies for a bot
  const getTotalLogins = (bot) => {
    let total = 0;
    Object.values(bot.logins).forEach(category => {
      Object.values(category).forEach(count => {
        total += count;
      });
    });
    return total;
  };

  const getTotalCookies = (bot) => {
    let total = 0;
    Object.values(bot.cookies).forEach(category => {
      Object.values(category).forEach(count => {
        total += count;
      });
    });
    return total;
  };

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`mb-2 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ${
              toast.type === 'success' ? 'bg-green-600 text-white' :
              toast.type === 'warning' ? 'bg-yellow-600 text-white' :
              toast.type === 'error' ? 'bg-red-600 text-white' :
              toast.type === 'info' ? 'bg-blue-600 text-white' :
              'bg-gray-600 text-white'
            }`}
            style={{
              transform: 'translateX(0)',
              opacity: 1
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-sm">
                  {toast.type === 'success' ? 'Success!' : 
                   toast.type === 'warning' ? 'Warning!' : 
                   toast.type === 'error' ? 'Error!' : 
                   toast.type === 'info' ? 'Info!' : 'Message!'}
                </h4>
                <p className="text-sm mt-1">{toast.message}</p>
              </div>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-white hover:text-gray-200 text-lg font-bold ml-2"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Bots</h1>
          <p className="text-gray-400 mt-2">24 • 450k+</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">BOT NAME / ~~~</label>
            <input
              type="text"
              placeholder="Filter bot name"
              value={filters.botName}
              onChange={(e) => setFilters({...filters, botName: e.target.value})}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Any</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">RESOURCES KNOWN / OTHER</label>
            <input
              type="text"
              placeholder="Filter resource name/domain: paypal,ebay.com,hotmail.com..."
              value={filters.resources}
              onChange={(e) => setFilters({...filters, resources: e.target.value})}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">COUNTRY / HOST</label>
            <input
              type="text"
              placeholder="Filter IP/Country/OS"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Filter $"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col justify-end">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors mb-2">
              Extended Search Q
            </button>
            <select
              value={filters.price}
              onChange={(e) => setFilters({...filters, price: e.target.value})}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">PRICE</option>
              {priceRanges.map(range => (
                <option key={range.value} value={range.value}>{range.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bots Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Bot Name / ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Resources Known / Other
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Country / Host
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Data Summary
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Price
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredBots.map((bot) => (
                <tr 
                  key={bot.id} 
                  className="hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => handleBotClick(bot)}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="text-white font-mono text-sm">{bot.botId}</div>
                      <div className="text-gray-400 text-xs">{bot.timestamp1}</div>
                      <div className="text-gray-400 text-xs">{bot.timestamp2}</div>
                      <div className="text-blue-400 text-xs font-bold">{bot.multiplier}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-md">
                      {bot.resources.slice(0, 8).map((resource, index) => (
                        <span key={index} className="text-xs bg-gray-600 text-gray-200 px-2 py-1 rounded">
                          {resource}
                        </span>
                      ))}
                      {bot.resources.length > 8 && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                          +{bot.resources.length - 8} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getCountryFlag(bot.country)}</span>
                        <span className="text-white text-sm">{bot.ip}</span>
                      </div>
                      <div className="text-gray-400 text-xs">{bot.os}</div>
                      <div className="text-gray-400 text-xs">...known {bot.knownCount}</div>
                      <div className="text-gray-400 text-xs">...other {bot.otherCount}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="space-y-2">
                      <div className="text-center">
                        <div className="text-blue-400 font-bold text-sm">{getTotalLogins(bot)}</div>
                        <div className="text-gray-400 text-xs">Logins</div>
                      </div>
                      <div className="text-center">
                        <div className="text-green-400 font-bold text-sm">{getTotalCookies(bot)}</div>
                        <div className="text-gray-400 text-xs">Cookies</div>
                      </div>
                      <div className="text-center">
                        <div className="text-purple-400 font-bold text-sm">{bot.extensions.length}</div>
                        <div className="text-gray-400 text-xs">Extensions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-orange-400 font-bold text-sm">{bot.applications.length}</div>
                        <div className="text-gray-400 text-xs">Apps</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-green-400 font-bold">${bot.price.toFixed(2)}</span>
                        {bot.status === 'sale' && (
                          <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">Sale</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-400 hover:text-blue-300 text-lg transition-colors">
                          👁️
                        </button>
                        {isInCart(bot.id) ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFromCart(bot.id);
                            }}
                            className="text-red-400 hover:text-red-300 text-lg transition-colors"
                            title="Remove from cart"
                          >
                            🗑️
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(bot);
                            }}
                            className="text-blue-400 hover:text-blue-300 text-lg transition-colors"
                            title="Add to cart"
                          >
                            🛒
                          </button>
                        )}
                        <input type="checkbox" className="rounded" />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* No Results */}
      {filteredBots.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-lg font-medium text-white mb-2">No bots found</h3>
          <p className="text-gray-400">Try adjusting your filters or search terms</p>
        </div>
      )}

      {/* Detailed Bot Modal */}
      {showModal && selectedBot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-5xl w-full max-h-[90vh] overflow-y-auto animate-fade-in">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Bot Details - {selectedBot.botId}</h2>
                <p className="text-gray-400 text-xs mt-1">
                  Captured on {selectedBot.timestamp1} • Last updated {selectedBot.timestamp2} • Multiplier: {selectedBot.multiplier}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white text-xl font-bold"
              >
                ×
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-4 space-y-4">
              {/* Bot Information */}
              <div className="bg-gray-700 p-3 rounded-lg">
                <h3 className="text-base font-semibold text-white mb-3">Bot Information</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400">Bot ID:</span>
                    <span className="text-white font-mono ml-2">{selectedBot.botId}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Status:</span>
                    <span className={`ml-2 ${selectedBot.status === 'sale' ? 'text-red-400' : 'text-green-400'}`}>
                      {selectedBot.status === 'sale' ? 'On Sale' : 'Available'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">First Seen:</span>
                    <span className="text-white ml-2">{selectedBot.timestamp1}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Last Update:</span>
                    <span className="text-white ml-2">{selectedBot.timestamp2}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Multiplier:</span>
                    <span className="text-blue-400 font-bold ml-2">{selectedBot.multiplier}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Price:</span>
                    <span className="text-green-400 font-bold ml-2">${selectedBot.price.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Total Passwords:</span>
                    <span className="text-purple-400 font-bold ml-2">{selectedBot.passwords}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Total Autofill:</span>
                    <span className="text-orange-400 font-bold ml-2">{selectedBot.autofill}</span>
                  </div>
                </div>
              </div>

              {/* System Information */}
              <div className="bg-gray-700 p-3 rounded-lg">
                <h3 className="text-base font-semibold text-white mb-3">System Information</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400">Country:</span>
                    <span className="text-white ml-2">{getCountryFlag(selectedBot.country)} {selectedBot.country}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">IP Address:</span>
                    <span className="text-white font-mono ml-2">{selectedBot.ip}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">OS:</span>
                    <span className="text-white ml-2">{selectedBot.systemInfo.os}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Computer:</span>
                    <span className="text-white ml-2">{selectedBot.systemInfo.computerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">User:</span>
                    <span className="text-white ml-2">{selectedBot.systemInfo.userName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">CPU:</span>
                    <span className="text-white ml-2">{selectedBot.systemInfo.processor}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Cores:</span>
                    <span className="text-white ml-2">{selectedBot.systemInfo.cores}/{selectedBot.systemInfo.threads}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">RAM:</span>
                    <span className="text-white ml-2">{selectedBot.systemInfo.ram}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">GPU:</span>
                    <span className="text-white ml-2">{selectedBot.systemInfo.videoCard}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Resolution:</span>
                    <span className="text-white ml-2">{selectedBot.systemInfo.displayResolution}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">AV:</span>
                    <span className="text-white ml-2">{selectedBot.systemInfo.av}</span>
                  </div>
                </div>
              </div>

              {/* All Login URLs by Category */}
              <div className="bg-gray-700 p-3 rounded-lg">
                <h3 className="text-base font-semibold text-white mb-3">
                  Login URLs by Category ({getTotalLogins(selectedBot)} total)
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {Object.entries(selectedBot.logins).map(([category, domains]) => (
                    <div key={category} className="bg-gray-600 p-3 rounded">
                      <h4 className="text-white font-medium mb-2 flex items-center justify-between text-sm">
                        <span>{category}</span>
                        <span className="text-blue-400 font-bold text-xs">
                          {Object.values(domains).reduce((sum, count) => sum + count, 0)} logins
                        </span>
                      </h4>
                      <div className="space-y-1">
                        {Object.entries(domains).map(([domain, count]) => (
                          <div key={domain} className="flex justify-between items-center text-xs bg-gray-500 p-1 rounded">
                            <div className="flex-1 min-w-0">
                              <span className="text-gray-300 font-mono break-all">{domain}</span>
                            </div>
                            <span className="text-blue-400 font-bold ml-2 flex-shrink-0">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* All Cookie Domains by Category */}
              <div className="bg-gray-700 p-3 rounded-lg">
                <h3 className="text-base font-semibold text-white mb-3">
                  Cookie Domains by Category ({getTotalCookies(selectedBot)} total)
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {Object.entries(selectedBot.cookies).map(([category, domains]) => (
                    <div key={category} className="bg-gray-600 p-3 rounded">
                      <h4 className="text-white font-medium mb-2 flex items-center justify-between text-sm">
                        <span>{category}</span>
                        <span className="text-green-400 font-bold text-xs">
                          {Object.values(domains).reduce((sum, count) => sum + count, 0)} cookies
                        </span>
                      </h4>
                      <div className="space-y-1">
                        {Object.entries(domains).map(([domain, count]) => (
                          <div key={domain} className="flex justify-between items-center text-xs bg-gray-500 p-1 rounded">
                            <div className="flex-1 min-w-0">
                              <span className="text-gray-300 font-mono break-all">{domain}</span>
                            </div>
                            <span className="text-green-400 font-bold ml-2 flex-shrink-0">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* All Browser Extensions */}
              <div className="bg-gray-700 p-3 rounded-lg">
                <h3 className="text-base font-semibold text-white mb-3">
                  Browser Extensions ({selectedBot.extensions.length} total)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                  {selectedBot.extensions.map((ext, index) => (
                    <div key={index} className="bg-gray-600 p-2 rounded">
                      <div className="space-y-1">
                        <h5 className="text-white font-medium text-xs">{ext.name}</h5>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-xs">{ext.type}</span>
                          <span className="text-blue-400 text-xs">{ext.version}</span>
                        </div>
                        {ext.description && (
                          <p className="text-gray-300 text-xs">{ext.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* All Installed Applications */}
              <div className="bg-gray-700 p-3 rounded-lg">
                <h3 className="text-base font-semibold text-white mb-3">
                  Installed Applications ({selectedBot.applications.length} total)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                  {selectedBot.applications.map((app, index) => (
                    <div key={index} className="bg-gray-600 p-2 rounded">
                      <div className="space-y-1">
                        <h5 className="text-white font-medium text-xs">{app.name}</h5>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-xs">{app.type}</span>
                          <span className="text-blue-400 text-xs">{app.version}</span>
                        </div>
                        {app.tokens && (
                          <div className="flex items-center space-x-1">
                            <span className="text-purple-400 text-xs">🔑</span>
                            <span className="text-purple-400 text-xs">{app.tokens}</span>
                          </div>
                        )}
                        {app.cookies && (
                          <div className="flex items-center space-x-1">
                            <span className="text-green-400 text-xs">🍪</span>
                            <span className="text-green-400 text-xs">{app.cookies}</span>
                          </div>
                        )}
                        {app.processes && (
                          <div className="flex items-center space-x-1">
                            <span className="text-orange-400 text-xs">⚙️</span>
                            <span className="text-orange-400 text-xs">{app.processes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Captured Resources Summary */}
              <div className="bg-gray-700 p-3 rounded-lg">
                <h3 className="text-base font-semibold text-white mb-3">Resources Summary</h3>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-gray-600 p-2 rounded">
                    <div className="text-blue-400 font-bold text-lg">{getTotalLogins(selectedBot)}</div>
                    <div className="text-gray-300 text-xs">Logins</div>
                  </div>
                  <div className="bg-gray-600 p-2 rounded">
                    <div className="text-green-400 font-bold text-lg">{getTotalCookies(selectedBot)}</div>
                    <div className="text-gray-300 text-xs">Cookies</div>
                  </div>
                  <div className="bg-gray-600 p-2 rounded">
                    <div className="text-purple-400 font-bold text-lg">{selectedBot.extensions.length}</div>
                    <div className="text-gray-300 text-xs">Extensions</div>
                  </div>
                  <div className="bg-gray-600 p-2 rounded">
                    <div className="text-orange-400 font-bold text-lg">{selectedBot.applications.length}</div>
                    <div className="text-gray-300 text-xs">Apps</div>
                  </div>
                  <div className="bg-gray-600 p-2 rounded">
                    <div className="text-red-400 font-bold text-lg">{selectedBot.passwords}</div>
                    <div className="text-gray-300 text-xs">Passwords</div>
                  </div>
                  <div className="bg-gray-600 p-2 rounded">
                    <div className="text-yellow-400 font-bold text-lg">{selectedBot.autofill}</div>
                    <div className="text-gray-300 text-xs">Autofill</div>
                  </div>
                  <div className="bg-gray-600 p-2 rounded">
                    <div className="text-indigo-400 font-bold text-lg">{selectedBot.knownCount}</div>
                    <div className="text-gray-300 text-xs">Known</div>
                  </div>
                  <div className="bg-gray-600 p-2 rounded">
                    <div className="text-pink-400 font-bold text-lg">{selectedBot.otherCount}</div>
                    <div className="text-gray-300 text-xs">Other</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                {isInCart(selectedBot.id) ? (
                  <button 
                    onClick={() => handleRemoveFromCart(selectedBot.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 rounded transition-colors text-sm"
                  >
                    Remove from Cart
                  </button>
                ) : (
                  <button 
                    onClick={() => handleAddToCart(selectedBot)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded transition-colors text-sm"
                  >
                    Add to Cart
                  </button>
                )}
                <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded transition-colors text-sm">
                  Purchase Bot
                </button>
                <button 
                  onClick={closeModal}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-3 rounded transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">About Bot Dumps</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-300">
          <div>
            <h4 className="font-medium text-white mb-2">What are Bots?</h4>
            <p>Bot dumps contain stolen browser data including cookies, passwords, autofill data, and session information from compromised devices.</p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">How to Use</h4>
            <p>After purchase, you'll receive the bot data in various formats including .txt files, .json files, and browser import formats for credential harvesting.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bots;
