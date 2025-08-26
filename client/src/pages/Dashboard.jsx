import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Wallet from '../components/Wallet';
import CountryFlag from '../components/CountryFlag';
import { getCountryName, FLAG_SIZES } from '../utils/flags';

const Dashboard = () => {
  const [botStats, setBotStats] = useState({
    overall: { country: 'Overall', last24h: 238, lastWeek: 2312, lastMonth: 7881, available: 468484 },
    countries: [
      { code: 'ES', last24h: 22, lastWeek: 321, lastMonth: 1026, available: 37137 },
      { code: 'TR', last24h: 37, lastWeek: 326, lastMonth: 818, available: 26213 },
      { code: 'PL', last24h: 17, lastWeek: 131, lastMonth: 649, available: 32314 },
      { code: 'RO', last24h: 18, lastWeek: 187, lastMonth: 586, available: 33448 },
      { code: 'CL', last24h: 18, lastWeek: 169, lastMonth: 547, available: 9766 },
      { code: 'US', last24h: 16, lastWeek: 117, lastMonth: 475, available: 6566 },
      { code: 'IT', last24h: 16, lastWeek: 140, lastMonth: 466, available: 57752 },
      { code: 'FR', last24h: 12, lastWeek: 125, lastMonth: 457, available: 30454 },
      { code: 'DE', last24h: 13, lastWeek: 131, lastMonth: 394, available: 12105 },
      { code: 'PT', last24h: 6, lastWeek: 81, lastMonth: 298, available: 30122 },
      { code: 'GB', last24h: 9, lastWeek: 56, lastMonth: 229, available: 8851 },
      { code: 'CZ', last24h: 1, lastWeek: 35, lastMonth: 170, available: 5299 },
      { code: 'BG', last24h: 6, lastWeek: 41, lastMonth: 158, available: 8102 },
      { code: 'RS', last24h: 4, lastWeek: 44, lastMonth: 153, available: 3070 },
      { code: 'NL', last24h: 3, lastWeek: 42, lastMonth: 151, available: 7637 },
      { code: 'GR', last24h: 2, lastWeek: 38, lastMonth: 145, available: 8603 }
    ]
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // In a real app, you'd fetch this data from your API
    // fetchBotStats();
  }, []);

  const fetchBotStats = async () => {
    setLoading(true);
    try {
      // This would be your actual API call
      // const response = await axios.get('/api/bots/stats');
      // setBotStats(response.data);
    } catch (error) {
      console.error('Error fetching bot stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Available Bots</h1>
        <div className="flex items-center space-x-4">
          <span className="text-gray-400">Grouped by</span>
          <div className="bg-gray-700 p-2 rounded">
            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Wallet Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Wallet />
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
              Deposit Funds
            </button>
            <button className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors">
              Withdraw Funds
            </button>
            <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors">
              View Transactions
            </button>
          </div>
        </div>
      </div>

      {/* Stats Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {/* Table Header with Summary */}
        <div className="bg-gray-750 px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Botnet Statistics by Country</h3>
              <p className="text-sm text-gray-400">
                {botStats.countries.length} countries • {formatNumber(botStats.overall.available)} total bots available
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">+{botStats.overall.last24h}</div>
                <div className="text-xs text-gray-400">Last 24h</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{formatNumber(botStats.overall.lastWeek)}</div>
                <div className="text-xs text-gray-400">This Week</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{formatNumber(botStats.overall.lastMonth)}</div>
                <div className="text-xs text-gray-400">This Month</div>
              </div>
            </div>
          </div>
          
          {/* Country Filter */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search countries..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
                  // Add search functionality here if needed
                }}
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Sort by:</span>
              <select className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="available">Available Bots</option>
                <option value="last24h">Last 24h</option>
                <option value="lastWeek">Last Week</option>
                <option value="lastMonth">Last Month</option>
                <option value="country">Country Name</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  COUNTRY
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  LAST 24H
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  LAST WEEK
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  LAST MONTH
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  AVAILABLE
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {/* Overall Row */}
              <tr className="bg-blue-900 bg-opacity-20 hover:bg-blue-900 hover:bg-opacity-30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-blue-600 rounded-full mr-3 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white font-medium">Overall</span>
                      <span className="text-xs text-blue-300">Global Botnet</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-green-400 font-medium">+{botStats.overall.last24h}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-green-400 font-medium">+{formatNumber(botStats.overall.lastWeek)}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-green-400 font-medium">+{formatNumber(botStats.overall.lastMonth)}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button className="text-blue-400 hover:text-blue-300 font-medium">
                    {formatNumber(botStats.overall.available)}
                  </button>
                </td>
              </tr>

              {/* Country Rows */}
              {botStats.countries.map((country, index) => (
                <tr key={country.code} className="hover:bg-gray-700 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="mr-3 transform hover:scale-110 transition-transform group-hover:ring-2 group-hover:ring-blue-500 group-hover:ring-opacity-50 rounded">
                        <CountryFlag 
                          countryCode={country.code} 
                          size={FLAG_SIZES.SMALL}
                          showTooltip={true}
                          className="rounded shadow-sm"
                        />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium">{country.code}</span>
                          {country.last24h > 20 && (
                            <span className="px-2 py-1 text-xs bg-green-900 text-green-100 rounded-full">Hot</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">{getCountryName(country.code)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`font-medium ${country.last24h > 20 ? 'text-green-400' : country.last24h > 10 ? 'text-yellow-400' : 'text-gray-400'}`}>
                          +{country.last24h}
                        </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-green-400 font-medium">+{country.lastWeek}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-green-400 font-medium">+{country.lastMonth}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="text-blue-400 hover:text-blue-300 font-medium">
                      {formatNumber(country.available)}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Purchase</h3>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors">
            Buy Bot
          </button>
              </div>
        
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Generate Fingerprint</h3>
          <button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition-colors">
            Create FP
            </button>
              </div>
        
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Support</h3>
          <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded transition-colors">
            Open Ticket
            </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
