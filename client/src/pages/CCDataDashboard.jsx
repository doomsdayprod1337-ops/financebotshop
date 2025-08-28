import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const CCDataDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    sold: 0,
    expired: 0,
    invalid: 0,
    totalValue: 0,
    averagePrice: 0
  });
  const [recentImports, setRecentImports] = useState([]);
  const [topCards, setTopCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch statistics
      const statsResponse = await axios.get('/api/credit-cards/stats');
      if (statsResponse.data.success) {
        setStats(statsResponse.data.stats);
      }

      // Fetch recent imports
      const importsResponse = await axios.get('/api/credit-cards/recent-imports');
      if (importsResponse.data.success) {
        setRecentImports(importsResponse.data.imports);
      }

      // Fetch top cards by price
      const topCardsResponse = await axios.get('/api/credit-cards/top-cards');
      if (topCardsResponse.data.success) {
        setTopCards(topCardsResponse.data.cards);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getCardTypeIcon = (type) => {
    switch (type) {
      case 'Visa': return '💳';
      case 'Mastercard': return '💳';
      case 'American Express': return '💳';
      case 'Discover': return '💳';
      default: return '💳';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'text-green-500 bg-green-100';
      case 'sold': return 'text-blue-500 bg-blue-100';
      case 'expired': return 'text-yellow-500 bg-yellow-100';
      case 'invalid': return 'text-red-500 bg-red-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-white mt-4">Loading CC Data Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-white mb-2">Error Loading Dashboard</h1>
          <p className="text-gray-400">{error}</p>
          <button 
            onClick={fetchDashboardData}
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
              <h1 className="text-xl font-bold text-white">💳 CC Data Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/admin/data-management"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                ← Back to Admin
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-600 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Total Cards</p>
                <p className="text-2xl font-bold text-white">{stats.total.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-600 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Available</p>
                <p className="text-2xl font-bold text-white">{stats.available.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-600 rounded-lg">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-gray-400 text-sm">Total Value</p>
                <p className="text-2xl font-bold text-white">${stats.totalValue.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-white">${stats.averagePrice.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Status Chart */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Status Breakdown</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-300">Available</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-semibold">{stats.available}</span>
                  <span className="text-gray-400 text-sm">
                    ({((stats.available / stats.total) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-gray-300">Sold</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-semibold">{stats.sold}</span>
                  <span className="text-gray-400 text-sm">
                    ({((stats.sold / stats.total) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-gray-300">Expired</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-semibold">{stats.expired}</span>
                  <span className="text-gray-400 text-sm">
                    ({((stats.expired / stats.total) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-gray-300">Invalid</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-semibold">{stats.invalid}</span>
                  <span className="text-gray-400 text-sm">
                    ({((stats.invalid / stats.total) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/admin/cc-import"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-center transition-colors"
              >
                📥 Import New Cards
              </Link>
              <Link
                to="/admin/cc-management"
                className="block w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg text-center transition-colors"
              >
                ⚙️ Manage Cards
              </Link>
              <Link
                to="/admin/cc-analytics"
                className="block w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg text-center transition-colors"
              >
                📊 View Analytics
              </Link>
              <Link
                to="/admin/cc-export"
                className="block w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg text-center transition-colors"
              >
                📤 Export Data
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Imports and Top Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Imports */}
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Recent Imports</h3>
            </div>
            <div className="p-6">
              {recentImports.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No recent imports</p>
              ) : (
                <div className="space-y-4">
                  {recentImports.slice(0, 5).map((import_) => (
                    <div key={import_.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">📁</span>
                        <div>
                          <p className="text-white font-medium">{import_.filename || 'Manual Import'}</p>
                          <p className="text-gray-400 text-sm">
                            {new Date(import_.imported_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-semibold">+{import_.cards_imported}</p>
                        <p className="text-gray-400 text-sm">cards</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top Cards by Price */}
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Top Cards by Price</h3>
            </div>
            <div className="p-6">
              {topCards.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No cards available</p>
              ) : (
                <div className="space-y-4">
                  {topCards.slice(0, 5).map((card, index) => (
                    <div key={card.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-white font-medium">{card.card_number}</p>
                          <p className="text-gray-400 text-sm">{card.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-semibold">${card.price.toFixed(2)}</p>
                        <p className="text-gray-400 text-sm">{card.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            to="/admin/cc-import"
            className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">📥</div>
              <h3 className="text-xl font-bold mb-2">Import Cards</h3>
              <p className="text-blue-100">Upload files or paste data to import new credit cards</p>
            </div>
          </Link>

          <Link
            to="/admin/cc-management"
            className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white hover:from-green-700 hover:to-green-800 transition-all duration-200 transform hover:scale-105"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-xl font-bold mb-2">Manage Cards</h3>
              <p className="text-green-100">Edit, delete, and manage existing credit card data</p>
            </div>
          </Link>

          <Link
            to="/admin/cc-analytics"
            className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 text-white hover:from-purple-700 hover:to-purple-800 transition-all duration-200 transform hover:scale-105"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-2">Analytics</h3>
              <p className="text-purple-100">View detailed analytics and performance metrics</p>
            </div>
          </Link>

          <Link
            to="/admin/cc-export"
            className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg p-6 text-white hover:from-orange-700 hover:to-orange-800 transition-all duration-200 transform hover:scale-105"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">📤</div>
              <h3 className="text-xl font-bold mb-2">Export Data</h3>
              <p className="text-orange-100">Export credit card data in various formats</p>
            </div>
          </Link>

          <Link
            to="/admin/cc-validation"
            className="bg-gradient-to-r from-red-600 to-red-700 rounded-lg p-6 text-white hover:from-red-700 hover:to-red-800 transition-all duration-200 transform hover:scale-105"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-bold mb-2">Validation</h3>
              <p className="text-red-100">Validate and check credit card data integrity</p>
            </div>
          </Link>

          <Link
            to="/admin/cc-settings"
            className="bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg p-6 text-white hover:from-gray-700 hover:to-gray-800 transition-all duration-200 transform hover:scale-105"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-xl font-bold mb-2">Settings</h3>
              <p className="text-gray-100">Configure import settings and validation rules</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CCDataDashboard;
