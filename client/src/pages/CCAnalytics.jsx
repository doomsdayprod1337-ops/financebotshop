import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const CCAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    overview: {},
    trends: [],
    cardTypes: [],
    statusDistribution: [],
    priceRanges: [],
    geographicData: [],
    importHistory: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/credit-cards/analytics?timeRange=${timeRange}`);
      
      if (response.data.success) {
        setAnalytics(response.data.analytics);
      } else {
        setError('Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Error loading analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-white mt-4">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-white mb-2">Error Loading Analytics</h1>
          <p className="text-gray-400">{error}</p>
          <button 
            onClick={fetchAnalytics}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">📊 CC Data Analytics</h1>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
                <option value="all">All Time</option>
              </select>
              <Link
                to="/admin/cc-dashboard"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-600 rounded-lg">
                <span className="text-2xl">💳</span>
              </div>
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Total Cards</p>
                <p className="text-2xl font-bold text-white">{formatNumber(analytics.overview.totalCards || 0)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-600 rounded-lg">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Total Value</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(analytics.overview.totalValue || 0)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-purple-600 rounded-lg">
                <span className="text-2xl">📈</span>
              </div>
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Avg Price</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(analytics.overview.averagePrice || 0)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-orange-600 rounded-lg">
                <span className="text-2xl">🔄</span>
              </div>
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Success Rate</p>
                <p className="text-2xl font-bold text-white">{(analytics.overview.successRate || 0).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Card Type Distribution */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Card Type Distribution</h3>
            <div className="space-y-3">
              {analytics.cardTypes.map((type, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: type.color }}></div>
                    <span className="text-gray-300">{type.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-semibold">{type.count}</span>
                    <span className="text-gray-400 text-sm">
                      ({type.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Status Distribution</h3>
            <div className="space-y-3">
              {analytics.statusDistribution.map((status, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: status.color }}></div>
                    <span className="text-gray-300 capitalize">{status.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-semibold">{status.count}</span>
                    <span className="text-gray-400 text-sm">
                      ({status.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Price Range Analysis */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Price Range Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {analytics.priceRanges.map((range, index) => (
              <div key={index} className="text-center">
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-2">{range.label}</p>
                  <p className="text-2xl font-bold text-white">{range.count}</p>
                  <p className="text-gray-400 text-sm">{range.percentage.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Geographic Distribution</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {analytics.geographicData.map((region, index) => (
              <div key={index} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white font-medium">{region.name}</span>
                  <span className="text-blue-400 font-bold">{region.count}</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${region.percentage}%` }}
                  ></div>
                </div>
                <p className="text-gray-400 text-sm mt-2">{region.percentage.toFixed(1)}% of total</p>
              </div>
            ))}
          </div>
        </div>

        {/* Import History */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Import History</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Cards Imported
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Success Rate
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Total Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {analytics.importHistory.map((import_, index) => (
                  <tr key={index} className="hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3 text-white">
                      {new Date(import_.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {import_.source}
                    </td>
                    <td className="px-4 py-3 text-white">
                      {import_.cardsImported}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        import_.successRate >= 90 ? 'text-green-500 bg-green-100' :
                        import_.successRate >= 70 ? 'text-yellow-500 bg-yellow-100' :
                        'text-red-500 bg-red-100'
                      }`}>
                        {import_.successRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-green-400 font-semibold">
                      {formatCurrency(import_.totalValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trends Chart */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Import Trends</h3>
          <div className="h-64 flex items-end justify-center space-x-2">
            {analytics.trends.map((trend, index) => (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className="w-8 bg-blue-500 rounded-t"
                  style={{ height: `${(trend.count / Math.max(...analytics.trends.map(t => t.count))) * 200}px` }}
                ></div>
                <span className="text-gray-400 text-xs mt-2">{trend.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/admin/cc-import"
            className="bg-blue-600 hover:bg-blue-700 rounded-lg p-6 text-white text-center transition-colors"
          >
            <div className="text-4xl mb-4">📥</div>
            <h3 className="text-xl font-bold mb-2">Import New Cards</h3>
            <p className="text-blue-100">Add more credit card data to your database</p>
          </Link>

          <Link
            to="/admin/cc-management"
            className="bg-green-600 hover:bg-green-700 rounded-lg p-6 text-white text-center transition-colors"
          >
            <div className="text-4xl mb-4">⚙️</div>
            <h3 className="text-xl font-bold mb-2">Manage Cards</h3>
            <p className="text-green-100">Edit, delete, and manage existing cards</p>
          </Link>

          <Link
            to="/admin/cc-export"
            className="bg-orange-600 hover:bg-orange-700 rounded-lg p-6 text-white text-center transition-colors"
          >
            <div className="text-4xl mb-4">📤</div>
            <h3 className="text-xl font-bold mb-2">Export Data</h3>
            <p className="text-orange-100">Export your credit card data in various formats</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CCAnalytics;
