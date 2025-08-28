import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Wallet from '../components/Wallet';
import CountryFlag from '../components/CountryFlag';
import DepositCreationModal from '../components/DepositCreationModal';
import { getCountryName, FLAG_SIZES } from '../utils/flags';
import { getAllBots } from '../data/botDatabase';
import api from '../config/axios';

const Dashboard = () => {
  console.log('Dashboard component loading...');
  const navigate = useNavigate();
  const { user } = useAuth();
  console.log('Dashboard - user from context:', user);
  
  const [botStats, setBotStats] = useState({
    overall: { country: 'Overall', last24h: 0, lastWeek: 0, lastMonth: 0, available: 0 },
    countries: []
  });

  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Show only 10 countries at a time
  const [searchQuery, setSearchQuery] = useState('');
  
  // Deposit modal state
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState(0);
  const [minimumDepositAmount, setMinimumDepositAmount] = useState(50.00);

  // Load minimum deposit amount on component mount
  useEffect(() => {
    loadMinimumDepositAmount();
  }, []);

  const loadMinimumDepositAmount = async () => {
    try {
      const response = await api.get('/api/get-minimum-deposit');
      if (response.data.success) {
        setMinimumDepositAmount(response.data.minimumDepositAmount);
      }
    } catch (error) {
      console.error('Error loading minimum deposit amount:', error);
      // Use default value if API fails
      setMinimumDepositAmount(50.00);
    }
  };

  // Filter countries based on search
  const filteredCountries = botStats.countries.filter(country =>
    country.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getCountryName(country.code).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Paginate countries to reduce network requests
  const paginatedCountries = filteredCountries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredCountries.length / itemsPerPage);

  useEffect(() => {
    // Generate bot stats from real bot data
    const bots = getAllBots();
    
    // Group bots by country
    const countryStats = {};
    let overall24h = 0, overallWeek = 0, overallMonth = 0;
    
    bots.forEach(bot => {
      if (!countryStats[bot.country]) {
        countryStats[bot.country] = {
          code: bot.country,
          last24h: 0,
          lastWeek: 0,
          lastMonth: 0,
          available: 1
        };
      } else {
        countryStats[bot.country].available += 1;
      }
      
      // Add activity data
      countryStats[bot.country].last24h += bot.last24h || 0;
      countryStats[bot.country].lastWeek += bot.lastWeek || 0;
      countryStats[bot.country].lastMonth += bot.lastMonth || 0;
      
      overall24h += bot.last24h || 0;
      overallWeek += bot.lastWeek || 0;
      overallMonth += bot.lastMonth || 0;
    });
    
    // Convert to array and sort by available bots
    const countriesArray = Object.values(countryStats).sort((a, b) => b.available - a.available);
    
    setBotStats({
      overall: {
        country: 'Overall',
        last24h: overall24h,
        lastWeek: overallWeek,
        lastMonth: overallMonth,
        available: bots.length
      },
      countries: countriesArray
    });
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

  // Handle deposit button click
  const handleDepositFunds = () => {
    if (!user) {
      // If user is not logged in, redirect to login
      navigate('/login');
      return;
    }
    
    // Show deposit modal with the minimum deposit amount
    setDepositAmount(minimumDepositAmount); // Use minimum deposit amount from admin settings
    setShowDepositModal(true);
  };

  // Handle deposit modal close
  const handleDepositModalClose = () => {
    setShowDepositModal(false);
    setDepositAmount(0);
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
            <button 
              onClick={handleDepositFunds}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Deposit Funds
            </button>
            
            <button 
              onClick={() => navigate('/profile')}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
            >
              Profile
            </button>
            <button 
              onClick={() => navigate('/deposits')}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
            >
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
                value={searchQuery}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to first page when searching
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
              {paginatedCountries.map((country, index) => (
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
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="bg-gray-750 px-6 py-4 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredCountries.length)} of {filteredCountries.length} countries
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Purchase</h3>
          <button 
            onClick={() => navigate('/bots')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Buy Bot
          </button>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Generate Fingerprint</h3>
          <button 
            onClick={() => navigate('/generate-fp')}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Create FP
          </button>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Support</h3>
          <button 
            onClick={() => navigate('/tickets')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Open Ticket
          </button>
        </div>
      </div>

      {/* Deposit Creation Modal */}
      <DepositCreationModal
        isOpen={showDepositModal}
        onClose={handleDepositModalClose}
        requiredAmount={depositAmount}
        currentBalance={user?.wallet_balance || 0}
        itemName="Dashboard Deposit"
      />
      
      {/* Debug Info - Remove this after testing */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
          Debug: Modal Open: {showDepositModal.toString()}, Amount: {depositAmount}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
