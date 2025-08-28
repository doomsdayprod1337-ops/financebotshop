import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/axios';

const EnhancedInvites = () => {
  const navigate = useNavigate();
  const [invites, setInvites] = useState([]);
  const [packages, setPackages] = useState([]);
  const [stats, setStats] = useState({
    freeInvitesRemaining: 0,
    totalInvitesGenerated: 0,
    totalInvitesUsed: 0,
    activeInvites: 0,
    usedInvites: 0,
    totalSpentOnInvites: 0
  });
  const [tracking, setTracking] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateInvite, setShowCreateInvite] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [navigate, currentPage]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Fetch all data in parallel
      const [invitesRes, packagesRes, statsRes, trackingRes, purchasesRes] = await Promise.all([
        api.get('/api/enhanced-invites', config).catch(() => ({ data: { data: [], pagination: { pages: 1 } } })),
        api.get('/api/enhanced-invites/packages', config).catch(() => ({ data: { data: [] } })),
        api.get('/api/enhanced-invites/stats', config).catch(() => ({ data: { data: {} } })),
        api.get('/api/enhanced-invites/tracking', config).catch(() => ({ data: { data: [], pagination: { pages: 1 } } })),
        api.get('/api/enhanced-invites/purchases', config).catch(() => ({ data: { data: [], pagination: { pages: 1 } } }))
      ]);

      setInvites(invitesRes.data?.data || []);
      setPackages(packagesRes.data?.data || []);
      setStats(statsRes.data?.data || {});
      setTracking(trackingRes.data?.data || []);
      setPurchases(purchasesRes.data?.data || []);
      
      if (invitesRes.data?.pagination) {
        setTotalPages(invitesRes.data.pagination.pages);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        navigate('/login');
        return;
      }
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateInviteCode = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.post('/api/enhanced-invites/generate', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert(`Invite code generated successfully: ${response.data.data.invite_code}`);
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error generating invite code:', error);
      alert(error.response?.data?.error || 'Failed to generate invite code');
    }
  };

  const purchasePackage = async () => {
    if (!selectedPackage) return;

    try {
      const token = localStorage.getItem('token');
      const response = await api.post('/api/enhanced-invites/purchase', {
        packageId: selectedPackage.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert('Package purchased successfully!');
        setShowPurchaseModal(false);
        setSelectedPackage(null);
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error purchasing package:', error);
      alert(error.response?.data?.error || 'Failed to purchase package');
    }
  };

  const cancelInvite = async (inviteId) => {
    if (!confirm('Are you sure you want to cancel this invite?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await api.put('/api/enhanced-invites/cancel-invite', {
        inviteId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert('Invite cancelled successfully');
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error cancelling invite:', error);
      alert(error.response?.data?.error || 'Failed to cancel invite');
    }
  };

  const copyInviteCode = (code) => {
    navigator.clipboard.writeText(code);
    alert('Invite code copied to clipboard!');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'used': return 'text-blue-500';
      case 'expired': return 'text-red-500';
      case 'cancelled': return 'text-gray-500';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return '🟢';
      case 'used': return '🔵';
      case 'expired': return '🔴';
      case 'cancelled': return '⚪';
      default: return '❓';
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading invitation system...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h3 className="text-lg font-medium text-white mb-2">Error Loading Invitation System</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={fetchData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">🎯 Enhanced Invitation System</h1>
        <p className="text-gray-400 mt-2">Manage your invites with free codes and paid packages</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-green-500 rounded-lg">
              <span className="text-2xl">🆓</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">Free Invites Left</p>
              <p className="text-2xl font-bold text-green-400">{stats.freeInvitesRemaining || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-blue-500 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">Total Generated</p>
              <p className="text-2xl font-bold">{stats.totalInvitesGenerated || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-purple-500 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">Total Used</p>
              <p className="text-2xl font-bold">{stats.totalInvitesUsed || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-500 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">Total Spent</p>
              <p className="text-2xl font-bold">${(stats.totalSpentOnInvites || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={generateInviteCode}
          disabled={stats.freeInvitesRemaining <= 0}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            stats.freeInvitesRemaining > 0
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          🆓 Generate Free Invite
        </button>
        
        <button
          onClick={() => setShowPurchaseModal(true)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
        >
          💰 Buy More Invites
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex space-x-1 mb-6">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'invites', label: 'My Invites', icon: '🎫' },
            { id: 'tracking', label: 'Usage Tracking', icon: '📈' },
            { id: 'purchases', label: 'Purchase History', icon: '🛒' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3">Available Packages</h3>
                <div className="space-y-3">
                  {packages.map(pkg => (
                    <div key={pkg.id} className="flex justify-between items-center p-3 bg-gray-600 rounded">
                      <div>
                        <p className="font-medium">{pkg.name}</p>
                        <p className="text-sm text-gray-400">{pkg.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-400">${pkg.price}</p>
                        <p className="text-sm text-gray-400">{pkg.invite_count} invites</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3">Recent Activity</h3>
                <div className="space-y-2">
                  {invites.slice(0, 5).map(invite => (
                    <div key={invite.id} className="flex justify-between items-center text-sm">
                      <span className="font-mono">{invite.invite_code}</span>
                      <span className={`${getStatusColor(invite.status)}`}>
                        {getStatusIcon(invite.status)} {invite.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'invites' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">My Invite Codes</h3>
              <div className="text-sm text-gray-400">
                Page {currentPage} of {totalPages}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left">Code</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Created</th>
                    <th className="px-4 py-2 text-left">Used By</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {invites.map(invite => (
                    <tr key={invite.id} className="hover:bg-gray-700">
                      <td className="px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono">{invite.invite_code}</span>
                          <button
                            onClick={() => copyInviteCode(invite.invite_code)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            📋
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          invite.invite_type === 'free' 
                            ? 'bg-green-600 text-white' 
                            : 'bg-blue-600 text-white'
                        }`}>
                          {invite.invite_type}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`${getStatusColor(invite.status)}`}>
                          {getStatusIcon(invite.status)} {invite.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-400">
                        {formatDate(invite.created_at)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-400">
                        {invite.used_by_user ? (
                          <div>
                            <p>{invite.used_by_user.username}</p>
                            <p className="text-xs">{invite.used_by_user.email}</p>
                          </div>
                        ) : (
                          'Not used'
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {invite.status === 'active' && (
                          <button
                            onClick={() => cancelInvite(invite.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2 mt-6">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-gray-400">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tracking' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Invite Usage Tracking</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left">Invite Code</th>
                    <th className="px-4 py-2 text-left">Used By</th>
                    <th className="px-4 py-2 text-left">Used At</th>
                    <th className="px-4 py-2 text-left">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {tracking.map(item => (
                    <tr key={item.id} className="hover:bg-gray-700">
                      <td className="px-4 py-2 font-mono">{item.invite_code}</td>
                      <td className="px-4 py-2">
                        {item.used_by_user ? (
                          <div>
                            <p>{item.used_by_user.username}</p>
                            <p className="text-xs text-gray-400">{item.used_by_user.email}</p>
                          </div>
                        ) : (
                          'Unknown'
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-400">
                        {formatDate(item.used_at)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-400 font-mono">
                        {item.user_ip || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'purchases' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Purchase History</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left">Package</th>
                    <th className="px-4 py-2 text-left">Invites</th>
                    <th className="px-4 py-2 text-left">Price</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {purchases.map(purchase => (
                    <tr key={purchase.id} className="hover:bg-gray-700">
                      <td className="px-4 py-2">
                        <div>
                          <p className="font-medium">{purchase.package?.name}</p>
                          <p className="text-sm text-gray-400">{purchase.package?.description}</p>
                        </div>
                      </td>
                      <td className="px-4 py-2">{purchase.invite_count}</td>
                      <td className="px-4 py-2 text-green-400 font-bold">${purchase.price_paid}</td>
                      <td className="px-4 py-2 text-sm text-gray-400">
                        {formatDate(purchase.purchase_date)}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          purchase.status === 'completed' 
                            ? 'bg-green-600 text-white' 
                            : 'bg-yellow-600 text-white'
                        }`}>
                          {purchase.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Purchase Invite Package</h3>
            <div className="space-y-4">
              {packages.map(pkg => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPackage?.id === pkg.id
                      ? 'border-blue-500 bg-blue-900 bg-opacity-20'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{pkg.name}</p>
                      <p className="text-sm text-gray-400">{pkg.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-400">${pkg.price}</p>
                      <p className="text-sm text-gray-400">{pkg.invite_count} invites</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={purchasePackage}
                disabled={!selectedPackage}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  selectedPackage
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-600 cursor-not-allowed'
                }`}
              >
                Purchase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedInvites;
