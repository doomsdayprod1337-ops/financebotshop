import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [botStats, setBotStats] = useState({
    overall: { country: 'Overall', last24h: 238, lastWeek: 2312, lastMonth: 7881, available: 468484 },
    countries: [
      { code: 'ES', flag: '🇪🇸', last24h: 22, lastWeek: 321, lastMonth: 1026, available: 37137 },
      { code: 'TR', flag: '🇹🇷', last24h: 37, lastWeek: 326, lastMonth: 818, available: 26213 },
      { code: 'PL', flag: '🇵🇱', last24h: 17, lastWeek: 131, lastMonth: 649, available: 32314 },
      { code: 'RO', flag: '🇷🇴', last24h: 18, lastWeek: 187, lastMonth: 586, available: 33448 },
      { code: 'CL', flag: '🇨🇱', last24h: 18, lastWeek: 169, lastMonth: 547, available: 9766 },
      { code: 'US', flag: '🇺🇸', last24h: 16, lastWeek: 117, lastMonth: 475, available: 6566 },
      { code: 'IT', flag: '🇮🇹', last24h: 16, lastWeek: 140, lastMonth: 466, available: 57752 },
      { code: 'FR', flag: '🇫🇷', last24h: 12, lastWeek: 125, lastMonth: 457, available: 30454 },
      { code: 'DE', flag: '🇩🇪', last24h: 13, lastWeek: 131, lastMonth: 394, available: 12105 },
      { code: 'PT', flag: '🇵🇹', last24h: 6, lastWeek: 81, lastMonth: 298, available: 30122 },
      { code: 'GB', flag: '🇬🇧', last24h: 9, lastWeek: 56, lastMonth: 229, available: 8851 },
      { code: 'CZ', flag: '🇨🇿', last24h: 1, lastWeek: 35, lastMonth: 170, available: 5299 },
      { code: 'BG', flag: '🇧🇬', last24h: 6, lastWeek: 41, lastMonth: 158, available: 8102 },
      { code: 'RS', flag: '🇷🇸', last24h: 4, lastWeek: 44, lastMonth: 153, available: 3070 },
      { code: 'NL', flag: '🇳🇱', last24h: 3, lastWeek: 42, lastMonth: 151, available: 7637 },
      { code: 'GR', flag: '🇬🇷', last24h: 2, lastWeek: 38, lastMonth: 145, available: 8603 }
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

      {/* Stats Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
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
                    <div className="w-6 h-4 bg-gray-600 rounded mr-3"></div>
                    <span className="text-white font-medium">226</span>
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
                <tr key={country.code} className="hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{country.flag}</span>
                      <span className="text-white font-medium">{country.code}</span>
                        </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-green-400 font-medium">+{country.last24h}</span>
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
