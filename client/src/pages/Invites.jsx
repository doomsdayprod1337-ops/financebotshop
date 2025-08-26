import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Invites = () => {
  const navigate = useNavigate();
  const [invites, setInvites] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [stats, setStats] = useState({
    totalInvites: 0,
    usedInvites: 0,
    pendingInvites: 0,
    totalReferrals: 0,
    totalEarnings: 0,
    inviteBonusEarned: 0,
    referralCommissions: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateInvite, setShowCreateInvite] = useState(false);
  const [newInviteEmail, setNewInviteEmail] = useState('');
  const [selectedInviteType, setSelectedInviteType] = useState('general');
  const [inviteExpiry, setInviteExpiry] = useState('7');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchInvitesData();
  }, [navigate]);

  const fetchInvitesData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Fetch existing invites and referrals
      const invitesResponse = await axios.get('/api/invites', config);
      const invites = invitesResponse.data.invites || [];
      
      const referralsResponse = await axios.get('/api/referrals', config);
      const referrals = referralsResponse.data.referrals || [];

      // Calculate stats
      const totalInvites = invitesResponse.data.invites?.length || 0;
      const usedInvites = invitesResponse.data.invites?.filter(invite => invite.status === 'used').length || 0;
      const pendingInvites = totalInvites - usedInvites;
      const totalReferrals = referralsResponse.data.referrals?.length || 0;
      
      // Calculate earnings
      const inviteBonusEarned = usedInvites * 10; // $10 per invite
      const referralCommissions = referralsResponse.data.referrals?.reduce((sum, ref) => sum + (ref.commission_earned || 0), 0) || 0;
      const totalEarnings = inviteBonusEarned + referralCommissions;

      setStats({
        totalInvites,
        usedInvites,
        pendingInvites,
        totalReferrals,
        totalEarnings: totalEarnings.toFixed(2),
        inviteBonusEarned: inviteBonusEarned.toFixed(2),
        referralCommissions: referralCommissions.toFixed(2)
      });

    } catch (error) {
      console.error('Error fetching invites data:', error);
      if (error.response?.status === 401) {
        navigate('/login');
        return;
      }
      setError('Failed to load invites data');
    } finally {
      setIsLoading(false);
    }
  };

  const createInvite = async () => {
    try {
      if (selectedInviteType === 'email' && !newInviteEmail.trim()) {
        setError('Please enter an email address for email-specific invites');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const inviteData = {
        email: selectedInviteType === 'email' ? newInviteEmail.trim() : null,
        expiryDays: parseInt(inviteExpiry)
      };

      const response = await axios.post('/api/invites', {
        email: selectedInviteType === 'email' ? newInviteEmail.trim() : null,
        expiryDays: parseInt(inviteExpiry)
      }, { headers: { Authorization: `Bearer ${token}` } });

      setNewInviteEmail('');
      setShowCreateInvite(false);
      fetchInvitesData(); // Refresh data
      
      // Show success message
      alert(`Invite created successfully! Code: ${response.data.invite.code}`);
      
    } catch (error) {
      console.error('Error creating invite:', error);
      if (error.response?.status === 401) {
        navigate('/login');
        return;
      }
      setError(error.response?.data?.error || 'Failed to create invite');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-600', text: 'Pending' },
      used: { color: 'bg-green-600', text: 'Used' },
      expired: { color: 'bg-red-600', text: 'Expired' }
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInviteType = (invite) => {
    if (invite.email) return 'Email-specific';
    return 'General';
  };

  const isExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date();
  };

  // Check if user is authenticated
  const token = localStorage.getItem('token');
  if (!token) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 text-xl mb-4">🔒</div>
        <h3 className="text-lg font-medium text-white mb-2">Authentication Required</h3>
        <p className="text-gray-400 mb-4">Please log in to access this page</p>
        <button
          onClick={() => navigate('/login')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 text-xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-white mb-2">Error Loading Invites</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <button
          onClick={fetchInvitesData}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
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
          <h1 className="text-3xl font-bold text-white">Invite Management</h1>
          <p className="text-gray-400 mt-2">Create and manage invites to grow your network</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowCreateInvite(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <span>🎫</span>
            <span>Create Invite</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="text-blue-400 text-2xl font-bold">{stats.totalInvites}</div>
          <div className="text-gray-400 text-sm">Total Invites</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="text-green-400 text-2xl font-bold">{stats.usedInvites}</div>
          <div className="text-gray-400 text-sm">Used Invites</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="text-yellow-400 text-2xl font-bold">{stats.pendingInvites}</div>
          <div className="text-gray-400 text-sm">Pending Invites</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="text-purple-400 text-2xl font-bold">${stats.totalEarnings}</div>
          <div className="text-gray-400 text-sm">Total Earnings</div>
        </div>
      </div>

      {/* Earnings Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="text-white font-medium mb-2">Invite Bonuses</h3>
          <div className="text-green-400 text-xl font-bold">${stats.inviteBonusEarned}</div>
          <p className="text-gray-400 text-sm">$10 per successful invite</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="text-white font-medium mb-2">Referral Commissions</h3>
          <div className="text-blue-400 text-xl font-bold">${stats.referralCommissions}</div>
          <p className="text-gray-400 text-sm">5% on referral purchases</p>
        </div>
      </div>

      {/* Create Invite Modal */}
      {showCreateInvite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Create New Invite</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Invite Type
                </label>
                <select
                  value={selectedInviteType}
                  onChange={(e) => setSelectedInviteType(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="general">General Invite</option>
                  <option value="email">Email-specific Invite</option>
                </select>
              </div>

              {selectedInviteType === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newInviteEmail}
                    onChange={(e) => setNewInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email to send invite to"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This invite can only be used by the specified email
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Expiry Period
                </label>
                <select
                  value={inviteExpiry}
                  onChange={(e) => setInviteExpiry(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="1">1 Day</option>
                  <option value="3">3 Days</option>
                  <option value="7">7 Days</option>
                  <option value="14">14 Days</option>
                  <option value="30">30 Days</option>
                </select>
              </div>

              <div className="bg-blue-900 border border-blue-700 rounded-lg p-3">
                <p className="text-blue-200 text-sm">
                  💡 <strong>Tip:</strong> General invites can be shared publicly, while email-specific invites are more secure.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={createInvite}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                >
                  Create Invite
                </button>
                <button
                  onClick={() => setShowCreateInvite(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invites Section */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Your Invites</h2>
          <p className="text-gray-400 text-sm mt-1">
            Track the status of your invites and earn bonuses when they're used
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Invite Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Bonus Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {invites.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-400">
                    <div className="text-4xl mb-2">🎫</div>
                    <p>No invites created yet</p>
                    <p className="text-sm">Create your first invite to start earning bonuses</p>
                  </td>
                </tr>
              ) : (
                invites.map((invite) => (
                  <tr key={invite.id} className={`hover:bg-gray-700 transition-colors ${
                    isExpired(invite.expires_at) ? 'opacity-60' : ''
                  }`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`font-mono text-sm ${
                          invite.status === 'used' ? 'text-green-400' : 
                          isExpired(invite.expires_at) ? 'text-red-400' : 'text-blue-400'
                        }`}>
                          {invite.invite_code}
                        </span>
                        <button
                          onClick={() => copyToClipboard(invite.invite_code)}
                          className="text-gray-400 hover:text-white transition-colors"
                          title="Copy to clipboard"
                        >
                          📋
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        invite.email ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
                      }`}>
                        {getInviteType(invite)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      {invite.email || 'General'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(invite.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-green-400 font-medium">
                      ${invite.bonus_amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      {formatDate(invite.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      <span className={isExpired(invite.expires_at) ? 'text-red-400' : ''}>
                        {formatDate(invite.expires_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {invite.status === 'pending' && !isExpired(invite.expires_at) && (
                        <button
                          onClick={() => copyToClipboard(invite.invite_code)}
                          className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                        >
                          Copy Code
                        </button>
                      )}
                      {invite.status === 'used' && (
                        <span className="text-green-400 text-sm">Bonus Earned!</span>
                      )}
                      {isExpired(invite.expires_at) && invite.status === 'pending' && (
                        <span className="text-red-400 text-sm">Expired</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 text-center">
          <div className="text-3xl mb-2">🎫</div>
          <h3 className="text-white font-medium mb-2">Create Invites</h3>
          <p className="text-gray-400 text-sm mb-3">
            Generate invite codes to bring new members
          </p>
          <button
            onClick={() => setShowCreateInvite(true)}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
          >
            Create Invite
          </button>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 text-center">
          <div className="text-3xl mb-2">👥</div>
          <h3 className="text-white font-medium mb-2">View Referrals</h3>
          <p className="text-gray-400 text-sm mb-3">
            Track your referrals and commissions
          </p>
          <a
            href="/referrals"
            className="inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
          >
            View Referrals
          </a>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 text-center">
          <div className="text-3xl mb-2">📊</div>
          <h3 className="text-white font-medium mb-2">Analytics</h3>
          <p className="text-gray-400 text-sm mb-3">
            Monitor your invite performance
          </p>
          <button className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors">
            View Analytics
          </button>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">How the Invite System Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl mb-2">🎫</div>
            <h4 className="text-white font-medium mb-2">Create Invites</h4>
            <p className="text-gray-400 text-sm">
              Generate unique invite codes to share with potential members
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">💰</div>
            <h4 className="text-white font-medium mb-2">Earn Bonuses</h4>
            <p className="text-gray-400 text-sm">
              Get $10 bonus for each invite used and ongoing referral commissions
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">📈</div>
            <h4 className="text-white font-medium mb-2">Grow Network</h4>
            <p className="text-gray-400 text-sm">
              Build your network and earn passive income from referrals
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invites;
