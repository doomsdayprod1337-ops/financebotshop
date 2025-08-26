import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Referrals = () => {
  const [referrals, setReferrals] = useState([]);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarnings: 0,
    monthlyEarnings: 0,
    pendingCommissions: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [showReferralLink, setShowReferralLink] = useState(false);

  useEffect(() => {
    fetchReferralsData();
  }, [selectedPeriod]);

  const fetchReferralsData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication required');
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Fetch referrals
      const referralsResponse = await axios.get('/api/referrals', config);
      setReferrals(referralsResponse.data.referrals || []);

      // Calculate stats
      const totalReferrals = referralsResponse.data.referrals?.length || 0;
      const activeReferrals = referralsResponse.data.referrals?.filter(ref => ref.status === 'active').length || 0;
      const totalEarnings = referralsResponse.data.referrals?.reduce((sum, ref) => sum + (ref.commission_earned || 0), 0) || 0;
      
      // Calculate monthly earnings (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const monthlyEarnings = referralsResponse.data.referrals
        ?.filter(ref => new Date(ref.created_at) >= thirtyDaysAgo)
        ?.reduce((sum, ref) => sum + (ref.commission_earned || 0), 0) || 0;

      // Calculate pending commissions
      const pendingCommissions = referralsResponse.data.referrals
        ?.filter(ref => ref.status === 'active' && ref.commission_earned === 0)
        ?.length || 0;

      setStats({
        totalReferrals,
        activeReferrals,
        totalEarnings: totalEarnings.toFixed(2),
        monthlyEarnings: monthlyEarnings.toFixed(2),
        pendingCommissions
      });

    } catch (error) {
      console.error('Error fetching referrals data:', error);
      setError('Failed to load referrals data');
    } finally {
      setIsLoading(false);
    }
  };

  const copyReferralLink = () => {
    const referralCode = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).referral_code : 'YOUR_CODE';
    const referralLink = `${window.location.origin}/register?ref=${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    alert('Referral link copied to clipboard!');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-600', text: 'Active' },
      pending: { color: 'bg-yellow-600', text: 'Pending' },
      completed: { color: 'bg-blue-600', text: 'Completed' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  };

  const getFilteredReferrals = () => {
    if (selectedPeriod === 'all') return referrals;
    
    const now = new Date();
    const filterDate = new Date();
    
    switch (selectedPeriod) {
      case '7d':
        filterDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        filterDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        filterDate.setDate(now.getDate() - 90);
        break;
      default:
        return referrals;
    }
    
    return referrals.filter(ref => new Date(ref.created_at) >= filterDate);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 text-xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-white mb-2">Error Loading Referrals</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <button
          onClick={fetchReferralsData}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Referral Program</h1>
          <p className="text-gray-400 mt-2">Earn bonuses and commissions by referring new members</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowReferralLink(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            🔗 Share Referral Link
          </button>
          <button
            onClick={copyReferralLink}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            📋 Copy Link
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="text-green-400 text-2xl font-bold">{stats.totalReferrals}</div>
          <div className="text-gray-400 text-sm">Total Referrals</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="text-blue-400 text-2xl font-bold">{stats.activeReferrals}</div>
          <div className="text-gray-400 text-sm">Active Referrals</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="text-yellow-400 text-2xl font-bold">{stats.pendingCommissions}</div>
          <div className="text-gray-400 text-sm">Pending Commissions</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="text-purple-400 text-2xl font-bold">${stats.monthlyEarnings}</div>
          <div className="text-gray-400 text-sm">Monthly Earnings</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="text-green-400 text-2xl font-bold">${stats.totalEarnings}</div>
          <div className="text-gray-400 text-sm">Total Earnings</div>
        </div>
      </div>

      {/* Referral Link Modal */}
      {showReferralLink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Share Your Referral Link</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your Referral Code
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).referral_code : 'YOUR_CODE'}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white font-mono text-sm"
                  />
                  <button
                    onClick={copyReferralLink}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Referral Link
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/register?ref=${localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).referral_code : 'YOUR_CODE'}`}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
                  />
                  <button
                    onClick={copyReferralLink}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="bg-blue-900 border border-blue-700 rounded-lg p-3">
                <p className="text-blue-200 text-sm">
                  💡 <strong>Pro Tip:</strong> Share this link on social media, forums, or with friends to earn more referrals!
                </p>
              </div>

              <button
                onClick={() => setShowReferralLink(false)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Period Filter */}
      <div className="flex items-center space-x-4">
        <span className="text-gray-300 font-medium">Filter by period:</span>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="all">All Time</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      {/* Referrals Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Your Referrals</h2>
          <p className="text-gray-400 text-sm mt-1">
            Track your referrals and earnings in real-time
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {getFilteredReferrals().length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                    <div className="text-4xl mb-2">👥</div>
                    <p>No referrals yet</p>
                    <p className="text-sm">Share your referral link to start earning commissions</p>
                  </td>
                </tr>
              ) : (
                getFilteredReferrals().map((referral) => (
                  <tr key={referral.id} className="hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {referral.referred_user?.username?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {referral.referred_user?.username || 'Unknown User'}
                          </div>
                          <div className="text-gray-400 text-sm">
                            ID: {referral.referred_id?.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      {formatDate(referral.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      {formatCurrency(referral.referred_user?.total_spent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-green-400 font-medium">
                      {formatCurrency(referral.commission_earned)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(referral.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">How the Referral System Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl mb-2">🔗</div>
            <h4 className="text-white font-medium mb-2">Share Your Link</h4>
            <p className="text-gray-400 text-sm">
              Share your unique referral link with potential members
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">💰</div>
            <h4 className="text-white font-medium mb-2">Earn Bonuses</h4>
            <p className="text-gray-400 text-sm">
              Get instant bonuses and ongoing commissions
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">📈</div>
            <h4 className="text-white font-medium mb-2">Grow Your Income</h4>
            <p className="text-gray-400 text-sm">
              Build passive income through referrals
            </p>
          </div>
        </div>
      </div>

      {/* Bonus Structure */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Bonus Structure</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-white font-medium mb-3">Instant Bonuses</h4>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-center space-x-2">
                <span className="text-green-400">✓</span>
                <span>$10 bonus for each successful referral</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-green-400">✓</span>
                <span>Bonus credited immediately upon registration</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-green-400">✓</span>
                <span>No minimum requirements</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">Ongoing Commissions</h4>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-center space-x-2">
                <span className="text-green-400">✓</span>
                <span>5% commission on all referral purchases</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-green-400">✓</span>
                <span>Lifetime commission on referral activity</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-green-400">✓</span>
                <span>Real-time commission tracking</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Referrals;
