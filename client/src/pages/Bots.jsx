import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CountryFlag from '../components/CountryFlag';
import { getCountryName, FLAG_SIZES } from '../utils/flags';

const Bots = () => {
  const navigate = useNavigate();
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('lastSeen');
  const [sortOrder, setSortOrder] = useState('desc');

  // Sample bot data - replace with actual API call
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const sampleBots = [
        {
          id: '4b8eb3c4b3d8b1fa6847',
          name: 'Jenna-PC',
          status: 'active',
          country: 'GB',
          ip: '109.151.xxx.xxx',
          os: 'Windows NT 6.1.7601 (x64)',
          lastSeen: '2021-06-14 12:25:19',
          firstSeen: '2021-06-12 21:16:13',
          cookies: 4995,
          savedLogins: 42,
          formData: 0,
          injectScripts: 42,
          associatedServices: [
            { name: 'EtsyStore', count: 3, icon: '🛍️' },
            { name: 'Indeed', count: 2, icon: '💼' },
            { name: 'PayPal', count: 5, icon: '💳' },
            { name: 'Wordpress', count: 1, icon: '📝' },
            { name: 'Netflix', count: 4, icon: '🎬' }
          ],
          urls: [
            'https://4id.channel4.com/registration',
            'https://4id.channel4.com/login',
            'https://account.bbc.com/signin'
          ],
          value: 148.00,
          isVerified: true
        },
        {
          id: '7f2a9d1e8c5b3f6a9d2',
          name: 'DM4-Workstation',
          status: 'active',
          country: 'CA',
          ip: '70.30.xxx.xxx',
          os: 'Windows NT 10.0.19044 (x64)',
          lastSeen: '2021-06-14 10:15:30',
          firstSeen: '2021-06-10 14:22:08',
          cookies: 3247,
          savedLogins: 86,
          formData: 0,
          injectScripts: 86,
          associatedServices: [
            { name: 'Facebook', count: 12, icon: '📘' },
            { name: 'PayPal', count: 8, icon: '💳' },
            { name: 'Meetme', count: 3, icon: '👥' },
            { name: 'Google', count: 5, icon: '🔍' }
          ],
          urls: [
            'https://library.indigo.ca/v1.0/Member',
            'https://www.milanoo.com/login',
            'https://www.hottopic.com/login'
          ],
          value: 145.00,
          isVerified: true
        },
        {
          id: '9c4e8f2a1d7b6e3c9f8',
          name: 'Melanie-PC',
          status: 'inactive',
          country: 'CA',
          ip: '47.54.xxx.xxx',
          os: 'Windows NT 10.0.19044 (x64)',
          lastSeen: '2021-06-13 18:45:12',
          firstSeen: '2021-06-08 09:30:15',
          cookies: 1876,
          savedLogins: 149,
          formData: 0,
          injectScripts: 149,
          associatedServices: [
            { name: 'Live', count: 15, icon: '📺' },
            { name: 'Reddit', count: 8, icon: '🤖' },
            { name: 'Ebay', count: 12, icon: '🛒' },
            { name: 'Google', count: 10, icon: '🔍' },
            { name: 'Ticketmaster', count: 6, icon: '🎫' }
          ],
          urls: [
            'https://www.familyecho.com/login',
            'https://www.atlasobscura.com/signin',
            'https://www.dreamstime.com/login'
          ],
          value: 145.00,
          isVerified: false
        }
      ];
      setBots(sampleBots);
      setLoading(false);
    }, 1000);
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
      case 'value':
        aValue = a.value;
        bValue = b.value;
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">🤖 Bot Management Dashboard</h1>
        <p className="text-gray-400">Monitor and manage your bot network across {bots.length} active instances</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-blue-500 rounded-lg">
              <span className="text-2xl">🤖</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">Total Bots</p>
              <p className="text-2xl font-bold">{bots.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-green-500 rounded-lg">
              <span className="text-2xl">🟢</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">Active</p>
              <p className="text-2xl font-bold">{bots.filter(b => b.status === 'active').length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-500 rounded-lg">
              <span className="text-2xl">💳</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">Total Value</p>
              <p className="text-2xl font-bold">${bots.reduce((sum, b) => sum + b.value, 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-purple-500 rounded-lg">
              <span className="text-2xl">🌍</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">Countries</p>
              <p className="text-2xl font-bold">{new Set(bots.map(b => b.country)).size}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, ID, or IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="lastSeen">Last Seen</option>
            <option value="value">Value</option>
            <option value="cookies">Cookies</option>
            <option value="name">Name</option>
          </select>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Bots Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Bot Information
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Statistics
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Associated Services & URLs
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  System & Location
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status & Value
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {sortedBots.map((bot, index) => (
                <tr key={bot.id} className="hover:bg-gray-700 transition-colors">
                  {/* Bot Information */}
                  <td className="px-6 py-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
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
                        <p className="text-xs text-gray-400 font-mono">
                          {bot.id}
                        </p>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center text-xs text-gray-400">
                            <span className="mr-2">📅</span>
                            <span>First: {bot.firstSeen}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-400">
                            <span className="mr-2">🕒</span>
                            <span>Last: {bot.lastSeen}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Statistics */}
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <span className="mr-2">📊</span>
                        <span className="text-gray-300">{bot.cookies}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="mr-2">📁</span>
                        <span className="text-gray-300">{bot.savedLogins}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="mr-2">🔍</span>
                        <span className="text-gray-300">{bot.injectScripts}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="mr-2">✏️</span>
                        <span className="text-gray-300">{bot.formData}</span>
                      </div>
                    </div>
                  </td>

                  {/* Associated Services & URLs */}
                  <td className="px-6 py-4">
                    <div className="space-y-3">
                      {/* Services */}
                      <div>
                        <p className="text-xs text-gray-400 mb-2">Associated Services:</p>
                        <div className="space-y-1">
                          {bot.associatedServices.slice(0, 3).map((service, idx) => (
                            <div key={idx} className="flex items-center text-xs">
                              <span className="mr-2">{service.icon}</span>
                              <span className="text-gray-300">{service.name}</span>
                              <span className="ml-auto text-gray-500">({service.count})</span>
                            </div>
                          ))}
                          {bot.associatedServices.length > 3 && (
                            <p className="text-xs text-gray-500">
                              +{bot.associatedServices.length - 3} more
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          total {bot.associatedServices.length}
                        </p>
                      </div>
                      
                      {/* URLs */}
                      <div>
                        <p className="text-xs text-gray-400 mb-2">URLs:</p>
                        <div className="space-y-1">
                          {bot.urls.slice(0, 2).map((url, idx) => (
                            <p key={idx} className="text-xs text-blue-400 truncate max-w-xs">
                              {url}
                            </p>
                          ))}
                          {bot.urls.length > 2 && (
                            <p className="text-xs text-gray-500">
                              +{bot.urls.length - 2} more
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          total {bot.urls.length}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* System & Location */}
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CountryFlag 
                          countryCode={bot.country} 
                          size={FLAG_SIZES.SMALL}
                          showTooltip={true}
                        />
                        <span className="text-sm font-medium">{bot.country}</span>
                      </div>
                      <p className="text-xs text-gray-400 font-mono">
                        {bot.ip}
                      </p>
                      <p className="text-xs text-gray-400">
                        {bot.os}
                      </p>
                    </div>
                  </td>

                  {/* Status & Value */}
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getStatusIcon(bot.status)}</span>
                        <span className={`text-sm font-medium ${getStatusColor(bot.status)}`}>
                          {bot.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">💵</span>
                        <span className="text-lg font-bold text-green-400">
                          ${bot.value.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">✅</span>
                        <span className={`text-xs ${bot.isVerified ? 'text-green-400' : 'text-red-400'}`}>
                          {bot.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-2">
                      <button 
                        onClick={() => handleViewBot(bot.id)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded text-xs transition-colors"
                      >
                        👁️ View
                      </button>
                      <button className="p-2 bg-green-600 hover:bg-green-700 rounded text-xs transition-colors">
                        ⏰ Schedule
                      </button>
                      <button className="p-2 bg-purple-600 hover:bg-purple-700 rounded text-xs transition-colors">
                        🛒 Purchase
                      </button>
                      <button className="p-2 bg-red-600 hover:bg-red-700 rounded text-xs transition-colors">
                        🗑️ Delete
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
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Showing {sortedBots.length} of {bots.length} bots
          </p>
          <div className="flex space-x-2">
            <button className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors">
              Previous
            </button>
            <button className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bots;
