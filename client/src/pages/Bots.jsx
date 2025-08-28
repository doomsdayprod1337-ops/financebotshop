import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CountryFlag from '../components/CountryFlag';
import { getCountryName, FLAG_SIZES } from '../utils/flags';
import { getAllBots, getBotsByCountry, getBotsByStatus } from '../data/botDatabase';

const Bots = () => {
  const navigate = useNavigate();
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('lastSeen');
  const [sortOrder, setSortOrder] = useState('desc');

  // Load real bot data from log examples
  useEffect(() => {
    // Simulate API call delay
    setTimeout(() => {
      const realBots = getAllBots();
      setBots(realBots);
      setLoading(false);
    }, 500);
  }, []);

  const filteredBots = bots.filter(bot => {
    const matchesSearch = bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bot.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bot.ip.includes(searchQuery);
    const matchesStatus = filterStatus === 'all' || bot.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const sortedBots = [...filteredBots].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'lastSeen':
        aValue = new Date(a.lastSeen);
        bValue = new Date(b.lastSeen);
        break;
      case 'price':
        aValue = a.price;
        bValue = b.price;
        break;
      case 'cookies':
        aValue = a.cookies;
        bValue = b.cookies;
        break;
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      default:
        aValue = new Date(a.lastSeen);
        bValue = new Date(b.lastSeen);
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

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

  const handleViewBot = (botId) => {
    navigate(`/bot/${botId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading bots...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">🤖 Bot Management Dashboard</h1>
        <p className="text-sm md:text-base text-gray-400">Monitor and manage your bot network across {bots.length} active instances</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="bg-gray-800 p-3 md:p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-blue-500 rounded-lg">
              <span className="text-lg md:text-xl">🤖</span>
            </div>
            <div className="ml-2 md:ml-3">
              <p className="text-xs md:text-sm text-gray-400">Total Bots</p>
              <p className="text-lg md:text-xl font-bold">{bots.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-3 md:p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-green-500 rounded-lg">
              <span className="text-lg md:text-xl">🟢</span>
            </div>
            <div className="ml-2 md:ml-3">
              <p className="text-xs md:text-sm text-gray-400">Active</p>
              <p className="text-lg md:text-xl font-bold">{bots.filter(b => b.status === 'active').length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-3 md:p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-500 rounded-lg">
              <span className="text-lg md:text-xl">💳</span>
            </div>
            <div className="ml-2 md:ml-3">
              <p className="text-xs md:text-sm text-gray-400">Total Value</p>
              <p className="text-lg md:text-xl font-bold">${bots.reduce((sum, b) => sum + b.price, 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-3 md:p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-purple-500 rounded-lg">
              <span className="text-lg md:text-xl">🌍</span>
            </div>
            <div className="ml-2 md:ml-3">
              <p className="text-xs md:text-sm text-gray-400">Countries</p>
              <p className="text-lg md:text-xl font-bold">{new Set(bots.map(b => b.country)).size}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-gray-800 p-3 md:p-4 rounded-lg mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <input
              type="text"
              placeholder="Search by name, ID, or IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="lastSeen">Last Seen</option>
            <option value="price">Price</option>
            <option value="cookies">Cookies</option>
            <option value="name">Name</option>
          </select>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center text-sm"
          >
            <span className="mr-1">Sort</span>
            <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
          </button>
        </div>
      </div>

      {/* Bots Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full text-sm">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/6">
                  Bot Information
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/6">
                  Statistics
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/4">
                  Resources & Services
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/6">
                  System & Location
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/6">
                  Status & Value
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/6">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {sortedBots.map((bot, index) => (
                <tr key={bot.id} className="hover:bg-gray-700 transition-colors">
                  {/* Bot Information */}
                  <td className="px-3 py-3">
                    <div className="flex items-start space-x-2">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-xs">
                            {bot.name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => handleViewBot(bot.id)}
                          className="text-sm font-medium text-blue-400 hover:text-blue-300 cursor-pointer hover:underline"
                        >
                          {bot.name}
                        </button>
                        <p className="text-xs text-gray-400 font-mono truncate">
                          {bot.id}
                        </p>
                        <div className="mt-1 space-y-0.5">
                          <div className="flex items-center text-xs text-gray-400">
                            <span className="mr-1">📅</span>
                            <span className="truncate">First: {bot.firstSeen}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-400">
                            <span className="mr-1">🕒</span>
                            <span className="truncate">Last: {bot.lastSeen}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Statistics */}
                  <td className="px-3 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center text-xs">
                        <span className="mr-1">📊</span>
                        <span className="text-gray-300">{bot.cookies || 0}</span>
                      </div>
                      <div className="flex items-center text-xs">
                        <span className="mr-1">📁</span>
                        <span className="text-gray-300">{bot.savedLogins || 0}</span>
                      </div>
                      <div className="flex items-center text-xs">
                        <span className="mr-1">🔍</span>
                        <span className="text-gray-300">{bot.injectScripts || 0}</span>
                      </div>
                      <div className="flex items-center text-xs">
                        <span className="mr-1">✏️</span>
                        <span className="text-gray-300">{bot.formData || 0}</span>
                      </div>
                    </div>
                  </td>

                  {/* Associated Services & URLs */}
                  <td className="px-3 py-3">
                    <div className="space-y-2">
                      {/* Services */}
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Known Resources:</p>
                        <div className="space-y-0.5">
                          {(bot.knownResources || []).slice(0, 3).map((service, idx) => (
                            <div key={idx} className="flex items-center text-xs">
                              <span className="mr-1">🔗</span>
                              <span className="text-gray-300 truncate">{service.name}</span>
                              <span className="ml-auto text-gray-500">({service.count})</span>
                            </div>
                          ))}
                          {(bot.knownResources || []).length > 3 && (
                            <p className="text-xs text-gray-500">
                              +{(bot.knownResources || []).length - 3} more
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          total {bot.knownResources?.length || 0}
                        </p>
                      </div>
                      
                      {/* Other Resources */}
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Other Resources:</p>
                        <div className="space-y-0.5">
                          {(bot.otherResources || []).slice(0, 2).map((resource, idx) => (
                            <div key={idx} className="flex items-center text-xs">
                              <span className="mr-1">📦</span>
                              <span className="text-gray-300 truncate">{resource.name}</span>
                              <span className="ml-auto text-gray-500">({resource.count})</span>
                            </div>
                          ))}
                          {(bot.otherResources || []).length > 2 && (
                            <p className="text-xs text-gray-500">
                              +{(bot.otherResources || []).length - 2} more
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          total {bot.otherResources?.length || 0}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* System & Location */}
                  <td className="px-3 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1">
                        <CountryFlag 
                          countryCode={bot.country} 
                          size={FLAG_SIZES.SMALL}
                          showTooltip={true}
                        />
                        <span className="text-xs font-medium">{bot.country}</span>
                      </div>
                      <p className="text-xs text-gray-400 font-mono truncate">
                        {bot.ip}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {bot.os}
                      </p>
                      {bot.browser && (
                        <p className="text-xs text-gray-400 truncate">
                          {bot.browser} {bot.browserVersion && `(${bot.browserVersion})`}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Status & Value */}
                  <td className="px-3 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1">
                        <span className="text-sm">{getStatusIcon(bot.status)}</span>
                        <span className={`text-xs font-medium ${getStatusColor(bot.status)}`}>
                          {bot.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs">💵</span>
                        <span className="text-sm font-bold text-green-400">
                          ${bot.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs">✅</span>
                        <span className={`text-xs ${bot.isVerified ? 'text-green-400' : 'text-red-400'}`}>
                          {bot.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                      {bot.viewedCount && (
                        <div className="flex items-center space-x-1">
                          <span className="text-xs">👁️</span>
                          <span className="text-xs text-gray-400">
                            Viewed {bot.viewedCount} times
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-3">
                    <div className="flex flex-col space-y-1">
                      <button 
                        onClick={() => handleViewBot(bot.id)}
                        className="p-1.5 bg-blue-600 hover:bg-blue-700 rounded text-xs transition-colors"
                      >
                        👁️ View
                      </button>
                      <button className="p-1.5 bg-purple-600 hover:bg-purple-700 rounded text-xs transition-colors">
                        🛒 Purchase
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {sortedBots.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs md:text-sm text-gray-400">
            Showing {sortedBots.length} of {bots.length} bots
          </p>
          <div className="flex space-x-2">
            <button className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors">
              Previous
            </button>
            <button className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bots;
