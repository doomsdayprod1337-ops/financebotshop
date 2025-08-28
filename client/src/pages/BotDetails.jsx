import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CountryFlag from '../components/CountryFlag';
import { getCountryName, FLAG_SIZES } from '../utils/flags';
import { getBotById } from '../data/botDatabase';
import { CryptoPriceConverter } from '../components/CryptoComponents';

const BotDetails = () => {
  const { botId } = useParams();
  const navigate = useNavigate();
  const [bot, setBot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Filter states
  const [botNameFilter, setBotNameFilter] = useState('Any');
  const [sortFP, setSortFP] = useState('newest');
  const [resourceFilter, setResourceFilter] = useState('');
  const [countryHostFilter, setCountryHostFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState('');

  useEffect(() => {
    // Simulate API call to fetch bot details
    setTimeout(() => {
      const mockBot = {
        id: botId || 'PC1-VAIO-4558adb2cb76befd54a8',
        name: 'PC1-VAIO',
        status: 'active',
        country: 'ES',
        ip: '95.19.6.38',
        os: 'Windows 10 Pro',
        lastSeen: '2021-06-14 12:25:19',
        firstSeen: '2019-03-11 12:15:02',
        lastViewed: '2019-03-11 12:15:02',
        price: 8.00,
        isVerified: true,
        browser: 'Chrome',
        browserVersion: '91.0.4472.124',
        
        // Resources
        knownResources: [
          { name: 'Facebook', type: 'social', count: 4, lastUpdated: '2021-06-14 10:30:00' },
          { name: 'PayPal', type: 'financial', count: 2, lastUpdated: '2021-06-14 09:15:00' },
          { name: 'Gmail', type: 'email', count: 3, lastUpdated: '2021-06-14 08:45:00' },
          { name: 'Amazon', type: 'ecommerce', count: 1, lastUpdated: '2021-06-14 07:20:00' }
        ],
        otherResources: [
          { name: 'www.foroexplayate.com', type: 'forum', count: 1, lastUpdated: '2021-06-13 15:30:00' },
          { name: 'www.trabajos.com', type: 'job', count: 2, lastUpdated: '2021-06-13 14:20:00' },
          { name: 'www.bbva.es', type: 'banking', count: 1, lastUpdated: '2021-06-13 13:10:00' }
        ],
        
        // Browser data
        cookies: 1247,
        savedLogins: 89,
        formData: 156,
        injectScripts: 23,
        
        // System info
        ram: '8GB DDR4',
        cpu: 'Intel Core i5-8400',
        disk: '256GB SSD',
        network: 'Ethernet',
        
        // Activity
        last24h: 42,
        lastWeek: 156,
        lastMonth: 647,
        

      };
      
      setBot(mockBot);
      setLoading(false);
    }, 1000);
  }, [botId]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'inactive': return 'text-red-500';
      case 'pending': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return '🟢';
      case 'inactive': return '🔴';
      case 'pending': return '🟡';
      default: return '⚪';
    }
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'social': return '📘';
      case 'financial': return '💳';
      case 'email': return '📧';
      case 'ecommerce': return '🛒';
      case 'forum': return '💬';
      case 'job': return '💼';
      case 'banking': return '🏦';
      default: return '🌐';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading bot details...</div>
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Bot not found</div>
          <button 
            onClick={() => navigate('/bots')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Back to Bots
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <nav className="text-sm text-gray-400 mb-2">
                <span>Home</span>
                <span className="mx-2">/</span>
                <span>Bots</span>
                <span className="mx-2">/</span>
                <span className="text-white">{bot.name}</span>
              </nav>
              <h1 className="text-3xl font-bold text-white mb-2">Bot Details: {bot.name}</h1>
              <p className="text-gray-400">Comprehensive information and management for {bot.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/bots')}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
              >
                ← Back to Bots
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors">
                🛒 Purchase
              </button>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* BOT NAME Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">BOT NAME</label>
              <div className="relative">
                <select 
                  value={botNameFilter}
                  onChange={(e) => setBotNameFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Any">Any</option>
                  <option value={bot.name}>{bot.name}</option>
                  <option value="PC2-Dell">PC2-Dell</option>
                  <option value="PC3-HP">PC3-HP</option>
                </select>
                <div className="absolute right-3 top-2.5">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* SORT FP */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">SORT FP</label>
              <select 
                value={sortFP}
                onChange={(e) => setSortFP(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="price-high">Price High to Low</option>
                <option value="price-low">Price Low to High</option>
                <option value="country">Country</option>
              </select>
            </div>

            {/* RESOURCES KNOWN / OTHER */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">RESOURCES KNOWN / OTHER</label>
              <input
                type="text"
                placeholder="Filter resource name/domain: paypal, ebay.com, hotmail.com..."
                value={resourceFilter}
                onChange={(e) => setResourceFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* COUNTRY / HOST */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">COUNTRY / HOST</label>
              <input
                type="text"
                placeholder="Filter IP/Country/OS"
                value={countryHostFilter}
                onChange={(e) => setCountryHostFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* PRICE */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">PRICE</label>
              <input
                type="text"
                placeholder="Filter $"
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              activeTab === 'overview' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              activeTab === 'resources' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🌐 Resources
          </button>
          <button
            onClick={() => setActiveTab('browser')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              activeTab === 'browser' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🌍 Browser Data
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              activeTab === 'system' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            ⚙️ System Info
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">

            {/* Bot Statistics */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Bot Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">
                    {bot.last24h}
                  </div>
                  <div className="text-gray-300">Last 24h</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">
                    {bot.lastWeek}
                  </div>
                  <div className="text-gray-300">Last Week</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">
                    {bot.lastMonth}
                  </div>
                  <div className="text-gray-300">Last Month</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400 mb-2">
                    {bot.isVerified ? 'Yes' : 'No'}
                  </div>
                  <div className="text-gray-300">Verified</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors">
                    🔄 Refresh Data
                  </button>
                  <button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition-colors">
                    📥 Download Data
                  </button>
                  <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded transition-colors">
                    📊 Generate Report
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Bot Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className={`font-medium ${getStatusColor(bot.status)}`}>
                      {getStatusIcon(bot.status)} {bot.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Country:</span>
                    <div className="flex items-center space-x-2">
                      <CountryFlag countryCode={bot.country} size={FLAG_SIZES.SMALL} />
                      <span className="text-white">{bot.country}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">IP Address:</span>
                    <span className="text-white font-mono">{bot.ip}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Browser Info</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Browser:</span>
                    <span className="text-white">{bot.browser}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Version:</span>
                    <span className="text-white">{bot.browserVersion}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">OS:</span>
                    <span className="text-white">{bot.os}</span>
                  </div>
                </div>
              </div>

              {/* Crypto Price Converter */}
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <CryptoPriceConverter usdPrice={bot.price} />
              </div>
            </div>
            
            {/* Data Security Notice */}
            {bot.notes && (
              <div className="bg-gray-800 rounded-lg p-6 border border-yellow-600">
                <h3 className="text-xl font-semibold text-yellow-400 mb-4">🔒 Data Security Notice</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-lg font-medium text-white mb-2">Available Data (Not Displayed)</h4>
                    <ul className="space-y-2 text-gray-300">
                      {Object.entries(bot.notes).map(([key, value]) => (
                        <li key={key} className="flex items-start">
                          <span className="text-yellow-400 mr-2">•</span>
                          <span>{value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-yellow-900 bg-opacity-20 p-4 rounded-lg border border-yellow-700">
                    <h4 className="text-lg font-medium text-yellow-400 mb-2">Security Protocol</h4>
                    <p className="text-yellow-200 text-sm">
                      Sensitive information such as credentials, cookies, downloads, and personal data 
                      are available in the bot logs but are not displayed in this interface for security reasons.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div className="space-y-6">
            {/* Known Resources */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                Known Resources ({bot.knownResources.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4">Resource</th>
                      <th className="text-left py-3 px-4">Type</th>
                      <th className="text-left py-3 px-4">Count</th>
                      <th className="text-left py-3 px-4">Last Updated</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bot.knownResources.map((resource, index) => (
                      <tr key={index} className="border-b border-gray-700 hover:bg-gray-700">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getResourceIcon(resource.type)}</span>
                            <span className="font-medium">{resource.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                            {resource.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono">{resource.count}</td>
                        <td className="py-3 px-4 text-gray-400">{resource.lastUpdated}</td>
                        <td className="py-3 px-4">
                          <button className="text-blue-400 hover:text-blue-300 text-xs">
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Other Resources */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                Other Resources ({bot.otherResources.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4">Domain</th>
                      <th className="text-left py-3 px-4">Type</th>
                      <th className="text-left py-3 px-4">Count</th>
                      <th className="text-left py-3 px-4">Last Updated</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bot.otherResources.map((resource, index) => (
                      <tr key={index} className="border-b border-gray-700 hover:bg-gray-700">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getResourceIcon(resource.type)}</span>
                            <span className="font-medium font-mono">{resource.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-gray-600 text-white text-xs rounded">
                            {resource.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono">{resource.count}</td>
                        <td className="py-3 px-4 text-gray-400">{resource.lastUpdated}</td>
                        <td className="py-3 px-4">
                          <button className="text-blue-400 hover:text-blue-300 text-xs">
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Browser Data Tab */}
        {activeTab === 'browser' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Browser Data Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">
                    {bot.cookies}
                  </div>
                  <div className="text-gray-300">Cookies</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">
                    {bot.savedLogins}
                  </div>
                  <div className="text-gray-300">Saved Logins</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400 mb-2">
                    {bot.formData}
                  </div>
                  <div className="text-gray-300">Form Data</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">
                    {bot.injectScripts}
                  </div>
                  <div className="text-gray-300">Inject Scripts</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Detailed Browser Information</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <span className="text-gray-400">Browser Type:</span>
                  <span className="text-white font-medium">{bot.browser}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <span className="text-gray-400">Browser Version:</span>
                  <span className="text-white font-medium">{bot.browserVersion}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <span className="text-gray-400">Operating System:</span>
                  <span className="text-white font-medium">{bot.os}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <span className="text-gray-400">Last Activity:</span>
                  <span className="text-white font-medium">{bot.lastSeen}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Info Tab */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Hardware Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                    <span className="text-gray-400">RAM:</span>
                    <span className="text-white font-medium">{bot.ram}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                    <span className="text-gray-400">CPU:</span>
                    <span className="text-white font-medium">{bot.cpu}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                    <span className="text-gray-400">Storage:</span>
                    <span className="text-white font-medium">{bot.disk}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                    <span className="text-gray-400">Network:</span>
                    <span className="text-white font-medium">{bot.network}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Network Information</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <span className="text-gray-400">IP Address:</span>
                  <span className="text-white font-mono">{bot.ip}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <span className="text-gray-400">Country:</span>
                  <div className="flex items-center space-x-2">
                    <CountryFlag countryCode={bot.country} size={FLAG_SIZES.SMALL} />
                    <span className="text-white">{getCountryName(bot.country)} ({bot.country})</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <span className="text-gray-400">First Seen:</span>
                  <span className="text-white font-medium">{bot.firstSeen}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <span className="text-gray-400">Last Seen:</span>
                  <span className="text-white font-medium">{bot.lastSeen}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BotDetails;
