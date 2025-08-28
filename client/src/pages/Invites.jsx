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
    referralCommissions: 0,
    tier1Earnings: 0,
    tier2Earnings: 0,
    tier3Earnings: 0,
    pendingCommissions: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateInvite, setShowCreateInvite] = useState(false);
  const [showTierManager, setShowTierManager] = useState(false);
  const [showReferralAnalytics, setShowReferralAnalytics] = useState(false);
  const [newInviteEmail, setNewInviteEmail] = useState('');
  const [selectedInviteType, setSelectedInviteType] = useState('general');
  const [selectedTier, setSelectedTier] = useState('tier1');
  const [inviteExpiry, setInviteExpiry] = useState('7');
  const [customPrice, setCustomPrice] = useState('');
  const [autoGenerateCount, setAutoGenerateCount] = useState(5);

  // Tier configurations
  const tierConfigs = {
    tier1: {
      name: 'Basic',
      icon: '🥉',
      color: 'bg-gray-600',
      bonus: 10,
      commission: 5,
      depositMatch: 0,
      features: ['Standard bonus', '5% commission', '7-day expiry'],
      price: 0
    },
    tier2: {
      name: 'Premium',
      icon: '🥈',
      color: 'bg-blue-600',
      bonus: 25,
      commission: 8,
      depositMatch: 10,
      features: ['Higher bonus', '8% commission', '14-day expiry', '10% deposit match'],
      price: 5
    },
    tier3: {
      name: 'Elite',
      icon: '🥇',
      color: 'bg-purple-600',
      bonus: 50,
      commission: 12,
      depositMatch: 25,
      features: ['Maximum bonus', '12% commission', '30-day expiry', '25% deposit match', 'Priority support'],
      price: 15
    }
  };

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
      setError('');
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      // For now, use mock data since the API endpoints don't exist yet
      // In production, you would uncomment the API calls below
      
      /*
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Fetch existing invites and referrals
      const [invitesResponse, referralsResponse] = await Promise.all([
        axios.get('/api/invites', config).catch(() => ({ data: { invites: [] } })),
        axios.get('/api/referrals', config).catch(() => ({ data: { referrals: [] } }))
      ]);

      const invitesData = invitesResponse.data?.invites || [];
      const referralsData = referralsResponse.data?.referrals || [];
      */

      // Mock data for development
      const mockInvites = [
        {
          id: 1,
          invite_code: 'INV-001',
          tier: 'tier1',
          email: null,
          status: 'pending',
          bonus_amount: 10,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          invite_code: 'INV-002',
          tier: 'tier2',
          email: 'user@example.com',
          status: 'used',
          bonus_amount: 25,
          created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 3,
          invite_code: 'INV-003',
          tier: 'tier3',
          email: null,
          status: 'pending',
          bonus_amount: 50,
          created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      const mockReferrals = [
        {
          id: 1,
          user_id: 101,
          commission_earned: 15.50,
          status: 'active',
          pending_commission: 0
        },
        {
          id: 2,
          user_id: 102,
          commission_earned: 8.75,
          status: 'pending',
          pending_commission: 8.75
        }
      ];

      const invitesData = mockInvites;
      const referralsData = mockReferrals;

      // Set the state
      setInvites(invitesData);
      setReferrals(referralsData);

      // Calculate comprehensive stats
      const totalInvites = invitesData.length;
      const usedInvites = invitesData.filter(invite => invite.status === 'used').length;
      const pendingInvites = totalInvites - usedInvites;
      const totalReferrals = referralsData.length;
      
      // Calculate tier-based earnings
      const tier1Earnings = invitesData
        .filter(invite => invite.tier === 'tier1' && invite.status === 'used')
        .reduce((sum, invite) => sum + (invite.bonus_amount || 10), 0);
      
      const tier2Earnings = invitesData
        .filter(invite => invite.tier === 'tier2' && invite.status === 'used')
        .reduce((sum, invite) => sum + (invite.bonus_amount || 25), 0);
      
      const tier3Earnings = invitesData
        .filter(invite => invite.tier === 'tier3' && invite.status === 'used')
        .reduce((sum, invite) => sum + (invite.bonus_amount || 50), 0);

      const inviteBonusEarned = tier1Earnings + tier2Earnings + tier3Earnings;
      const referralCommissions = referralsData.reduce((sum, ref) => sum + (ref.commission_earned || 0), 0);
      const pendingCommissions = referralsData
        .filter(ref => ref.status === 'pending')
        .reduce((sum, ref) => sum + (ref.pending_commission || 0), 0);
      
      const totalEarnings = inviteBonusEarned + referralCommissions;

      setStats({
        totalInvites,
        usedInvites,
        pendingInvites,
        totalReferrals,
        totalEarnings: totalEarnings.toFixed(2),
        inviteBonusEarned: inviteBonusEarned.toFixed(2),
        referralCommissions: referralCommissions.toFixed(2),
        tier1Earnings: tier1Earnings.toFixed(2),
        tier2Earnings: tier2Earnings.toFixed(2),
        tier3Earnings: tier3Earnings.toFixed(2),
        pendingCommissions: pendingCommissions.toFixed(2)
      });

    } catch (error) {
      console.error('Error fetching invites data:', error);
      if (error.response?.status === 401) {
        navigate('/login');
        return;
      }
      setError('Failed to load invites data. Using demo data instead.');
      
      // Set some basic demo data even on error
      setInvites([]);
      setReferrals([]);
      setStats({
        totalInvites: 0,
        usedInvites: 0,
        pendingInvites: 0,
        totalReferrals: 0,
        totalEarnings: '0.00',
        inviteBonusEarned: '0.00',
        referralCommissions: '0.00',
        tier1Earnings: '0.00',
        tier2Earnings: '0.00',
        tier3Earnings: '0.00',
        pendingCommissions: '0.00'
      });
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

      // For now, create a mock invite since the API doesn't exist yet
      // In production, you would uncomment the API call below
      
      /*
      const inviteData = {
        email: selectedInviteType === 'email' ? newInviteEmail.trim() : null,
        tier: selectedTier,
        expiryDays: parseInt(inviteExpiry),
        customPrice: customPrice ? parseFloat(customPrice) : null
      };

      const response = await axios.post('/api/invites', inviteData, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      */

      // Mock invite creation
      const mockInvite = {
        id: Date.now(),
        invite_code: `INV-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        tier: selectedTier,
        email: selectedInviteType === 'email' ? newInviteEmail.trim() : null,
        status: 'pending',
        bonus_amount: tierConfigs[selectedTier].bonus,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + parseInt(inviteExpiry) * 24 * 60 * 60 * 1000).toISOString()
      };

      // Add to local state
      setInvites(prev => [mockInvite, ...prev]);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalInvites: prev.totalInvites + 1,
        pendingInvites: prev.pendingInvites + 1
      }));

      setNewInviteEmail('');
      setCustomPrice('');
      setShowCreateInvite(false);
      
      // Show success message
      const inviteCode = mockInvite.invite_code;
      const tierName = tierConfigs[selectedTier].name;
      alert(`🎉 ${tierName} invite created successfully!\n\nCode: ${inviteCode}\nBonus: $${tierConfigs[selectedTier].bonus}\nCommission: ${tierConfigs[selectedTier].commission}%`);
      
    } catch (error) {
      console.error('Error creating invite:', error);
      if (error.response?.status === 401) {
        navigate('/login');
        return;
      }
      setError(error.response?.data?.error || 'Failed to create invite. Please try again.');
    }
  };

  const autoGenerateInvites = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // For now, create mock invites since the API doesn't exist yet
      // In production, you would uncomment the API call below
      
      /*
      const response = await axios.post('/api/invites/auto-generate', {
        count: parseInt(autoGenerateCount),
        tier: selectedTier,
        expiryDays: parseInt(inviteExpiry)
      }, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      */

      // Mock auto-generation
      const newInvites = [];
      for (let i = 0; i < parseInt(autoGenerateCount); i++) {
        const mockInvite = {
          id: Date.now() + i,
          invite_code: `INV-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
          tier: selectedTier,
          email: null,
          status: 'pending',
          bonus_amount: tierConfigs[selectedTier].bonus,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + parseInt(inviteExpiry) * 24 * 60 * 60 * 1000).toISOString()
        };
        newInvites.push(mockInvite);
      }

      // Add to local state
      setInvites(prev => [...newInvites, ...prev]);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalInvites: prev.totalInvites + newInvites.length,
        pendingInvites: prev.pendingInvites + newInvites.length
      }));

      setShowCreateInvite(false);
      
      const generatedCount = newInvites.length;
      alert(`🚀 Successfully generated ${generatedCount} ${tierConfigs[selectedTier].name} invites!\n\nYou can now sell these codes and earn commissions.`);
      
    } catch (error) {
      console.error('Error auto-generating invites:', error);
      setError(error.response?.data?.error || 'Failed to auto-generate invites. Please try again.');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const copyReferralLink = (inviteCode) => {
    const referralLink = `${window.location.origin}/register?ref=${inviteCode}`;
    navigator.clipboard.writeText(referralLink);
    alert('Referral link copied to clipboard!');
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-600', text: 'Pending' },
      used: { color: 'bg-green-600', text: 'Used' },
      expired: { color: 'bg-red-600', text: 'Expired' },
      sold: { color: 'bg-blue-600', text: 'Sold' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getTierBadge = (tier) => {
    const config = tierConfigs[tier] || tierConfigs.tier1;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${config.color}`}>
        {config.icon} {config.name}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getInviteType = (invite) => {
    if (invite.email) return 'Email-specific';
    return 'General';
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    try {
      return new Date(expiryDate) < new Date();
    } catch (error) {
      return false;
    }
  };

  const getInviteCode = (invite) => {
    return invite.invite_code || invite.code || invite.id || 'N/A';
  };

  const getInviteStatus = (invite) => {
    if (invite.status) return invite.status;
    if (isExpired(invite.expires_at)) return 'expired';
    return 'pending';
  };

  const getBonusAmount = (invite) => {
    const tier = invite.tier || 'tier1';
    return invite.bonus_amount || tierConfigs[tier].bonus;
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
      <div className="mb-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold text-white">🚀 Advanced Invite & Referral System</h1>
            <p className="text-gray-400 mt-2">Create tiered invites, earn commissions, and build your network for mutual earnings</p>
        </div>
        <div className="flex items-center space-x-4">
            {/* Demo Mode Indicator */}
            <div className="bg-yellow-900 border border-yellow-700 rounded-lg px-3 py-2">
              <div className="flex items-center space-x-2">
                <span className="text-yellow-400 text-lg">⚠️</span>
                <div className="text-yellow-200 text-sm">
                  <p className="font-medium">Demo Mode</p>
                  <p>Using mock data</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowTierManager(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <span>⚙️</span>
              <span>Tier Manager</span>
            </button>
          <button
            onClick={() => setShowCreateInvite(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <span>🎫</span>
            <span>Create Invite</span>
          </button>
          </div>
        </div>
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="text-blue-400 text-2xl font-bold">{stats.totalInvites}</div>
          <div className="text-gray-400 text-sm">Total Invites</div>
          <div className="text-xs text-gray-500 mt-1">Across all tiers</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="text-green-400 text-2xl font-bold">{stats.usedInvites}</div>
          <div className="text-gray-400 text-sm">Used Invites</div>
          <div className="text-xs text-gray-500 mt-1">Bonuses earned</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="text-yellow-400 text-2xl font-bold">{stats.totalReferrals}</div>
          <div className="text-gray-400 text-sm">Active Referrals</div>
          <div className="text-xs text-gray-500 mt-1">Ongoing commissions</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="text-purple-400 text-2xl font-bold">${stats.totalEarnings}</div>
          <div className="text-gray-400 text-sm">Total Earnings</div>
          <div className="text-xs text-gray-500 mt-1">Bonuses + Commissions</div>
        </div>
      </div>

      {/* Tier-based Earnings Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">🥉</span>
            <h3 className="text-white font-medium">Basic Tier</h3>
          </div>
          <div className="text-green-400 text-xl font-bold">${stats.tier1Earnings}</div>
          <p className="text-gray-400 text-sm">$10 bonus + 5% commission</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">🥈</span>
            <h3 className="text-white font-medium">Premium Tier</h3>
          </div>
          <div className="text-blue-400 text-xl font-bold">${stats.tier2Earnings}</div>
          <p className="text-gray-400 text-sm">$25 bonus + 8% commission</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">🥇</span>
            <h3 className="text-white font-medium">Elite Tier</h3>
          </div>
          <div className="text-purple-400 text-xl font-bold">${stats.tier3Earnings}</div>
          <p className="text-gray-400 text-sm">$50 bonus + 12% commission</p>
        </div>
      </div>

      {/* Commission Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="text-white font-medium mb-2">Referral Commissions</h3>
          <div className="text-blue-400 text-xl font-bold">${stats.referralCommissions}</div>
          <p className="text-gray-400 text-sm">Earned from referral purchases</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="text-white font-medium mb-2">Pending Commissions</h3>
          <div className="text-yellow-400 text-xl font-bold">${stats.pendingCommissions}</div>
          <p className="text-gray-400 text-sm">Awaiting payout</p>
        </div>
      </div>

      {/* Create Invite Modal */}
      {showCreateInvite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Create Advanced Invite</h3>
            
            <div className="space-y-4">
              {/* Tier Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Tier
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.entries(tierConfigs).map(([tierKey, config]) => (
                    <div
                      key={tierKey}
                      onClick={() => setSelectedTier(tierKey)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedTier === tierKey
                          ? 'border-blue-500 bg-blue-900 bg-opacity-20'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">{config.icon}</div>
                        <div className="text-white font-medium">{config.name}</div>
                        <div className="text-sm text-gray-400">${config.bonus} bonus</div>
                        <div className="text-xs text-gray-500">{config.commission}% commission</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invite Type */}
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

              {/* Email Input */}
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
                </div>
              )}

              {/* Custom Pricing */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Custom Price (Optional)
                </label>
                <input
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Set custom price for this invite"
                  min="0"
                  step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                  Leave empty to use tier default pricing
                  </p>
                </div>

              {/* Expiry Period */}
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

              {/* Auto-Generation */}
              <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
                <h4 className="text-blue-200 font-medium mb-2">🚀 Auto-Generate Multiple Invites</h4>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    value={autoGenerateCount}
                    onChange={(e) => setAutoGenerateCount(e.target.value)}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white w-20"
                    min="1"
                    max="50"
                  />
                  <span className="text-blue-200">invites</span>
                  <button
                    onClick={autoGenerateInvites}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                  >
                    Generate All
                  </button>
                </div>
                <p className="text-blue-200 text-sm mt-2">
                  Perfect for bulk selling and marketplace listings
                </p>
              </div>

              {/* Tier Benefits Display */}
              <div className="bg-gray-700 rounded-lg p-3">
                <h4 className="text-white font-medium mb-2">
                  {tierConfigs[selectedTier].icon} {tierConfigs[selectedTier].name} Tier Benefits:
                </h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  {tierConfigs[selectedTier].features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <span className="text-green-400 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Demo Mode Notice */}
              <div className="bg-blue-900 border border-blue-700 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <span className="text-blue-200 text-lg">ℹ️</span>
                  <div className="text-blue-200 text-sm">
                    <p className="font-medium">Demo Mode Active</p>
                    <p>This is a demonstration. In production, invites would be stored in the database and connected to real payment systems.</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={createInvite}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                >
                  Create Single Invite
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

      {/* Tier Manager Modal */}
      {showTierManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Tier Management & Pricing</h3>
            
            <div className="space-y-6">
              {/* Tier Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(tierConfigs).map(([tierKey, config]) => (
                  <div key={tierKey} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <div className="text-center mb-3">
                      <div className="text-3xl mb-2">{config.icon}</div>
                      <h4 className="text-white font-medium text-lg">{config.name}</h4>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Bonus:</span>
                        <span className="text-green-400 font-medium">${config.bonus}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Commission:</span>
                        <span className="text-blue-400 font-medium">{config.commission}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Deposit Match:</span>
                        <span className="text-purple-400 font-medium">{config.depositMatch}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Base Price:</span>
                        <span className="text-yellow-400 font-medium">${config.price}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <h5 className="text-white font-medium mb-2">Features:</h5>
                      <ul className="text-xs text-gray-400 space-y-1">
                        {config.features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <span className="text-green-400 mr-1">•</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              {/* Earnings Calculator */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">💰 Earnings Calculator</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 mb-2">Calculate potential earnings:</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>10 Basic Invites:</span>
                        <span className="text-green-400">$100 + 5% commissions</span>
                      </div>
                      <div className="flex justify-between">
                        <span>10 Premium Invites:</span>
                        <span className="text-blue-400">$250 + 8% commissions</span>
                      </div>
                      <div className="flex justify-between">
                        <span>10 Elite Invites:</span>
                        <span className="text-purple-400">$500 + 12% commissions</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-2">Referral benefits:</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Deposit bonuses:</span>
                        <span className="text-yellow-400">10-25% match</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ongoing commissions:</span>
                        <span className="text-blue-400">5-12% on purchases</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Network growth:</span>
                        <span className="text-green-400">Exponential earnings</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowTierManager(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Invites Section */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Your Invites & Referral Network</h2>
          <p className="text-gray-400 text-sm mt-1">
                Track invites, manage tiers, and monitor your earnings
              </p>
            </div>
            <button
              onClick={() => setShowReferralAnalytics(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
            >
              📊 Analytics
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Invite Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Bonus & Commission
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
                    <p className="text-sm">Create your first invite to start earning bonuses and commissions</p>
                  </td>
                </tr>
              ) : (
                invites.map((invite) => {
                  const inviteCode = getInviteCode(invite);
                  const status = getInviteStatus(invite);
                  const bonusAmount = getBonusAmount(invite);
                  const expired = isExpired(invite.expires_at);
                  const tier = invite.tier || 'tier1';
                  const tierConfig = tierConfigs[tier];
                  
                  return (
                    <tr key={invite.id || invite.invite_id} className={`hover:bg-gray-700 transition-colors ${
                      expired ? 'opacity-60' : ''
                    }`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`font-mono text-sm ${
                            status === 'used' ? 'text-green-400' : 
                            expired ? 'text-red-400' : 'text-blue-400'
                          }`}>
                            {inviteCode}
                          </span>
                          <button
                            onClick={() => copyToClipboard(inviteCode)}
                            className="text-gray-400 hover:text-white transition-colors"
                            title="Copy to clipboard"
                          >
                            📋
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTierBadge(tier)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          invite.email ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
                        }`}>
                          {getInviteType(invite)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="text-green-400 font-medium">${bonusAmount} bonus</div>
                          <div className="text-blue-400 text-xs">{tierConfig.commission}% commission</div>
                          {tierConfig.depositMatch > 0 && (
                            <div className="text-purple-400 text-xs">{tierConfig.depositMatch}% deposit match</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        {formatDate(invite.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        <span className={expired ? 'text-red-400' : ''}>
                          {formatDate(invite.expires_at)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                        {status === 'pending' && !expired && (
                            <>
                          <button
                            onClick={() => copyToClipboard(inviteCode)}
                                className="text-blue-400 hover:text-blue-300 text-xs transition-colors"
                          >
                            Copy Code
                          </button>
                              <button
                                onClick={() => copyReferralLink(inviteCode)}
                                className="text-green-400 hover:text-green-300 text-xs transition-colors"
                              >
                                Copy Link
                              </button>
                            </>
                        )}
                        {status === 'used' && (
                            <span className="text-green-400 text-xs">Bonus Earned!</span>
                        )}
                        {expired && status === 'pending' && (
                            <span className="text-red-400 text-xs">Expired</span>
                        )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 text-center">
          <div className="text-3xl mb-2">🎫</div>
          <h3 className="text-white font-medium mb-2">Create Invites</h3>
          <p className="text-gray-400 text-sm mb-3">
            Generate tiered invite codes
          </p>
          <button
            onClick={() => setShowCreateInvite(true)}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
          >
            Create Invite
          </button>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 text-center">
          <div className="text-3xl mb-2">⚙️</div>
          <h3 className="text-white font-medium mb-2">Manage Tiers</h3>
          <p className="text-gray-400 text-sm mb-3">
            Configure tier benefits
          </p>
          <button
            onClick={() => setShowTierManager(true)}
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors"
          >
            Manage Tiers
          </button>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 text-center">
          <div className="text-3xl mb-2">📊</div>
          <h3 className="text-white font-medium mb-2">Analytics</h3>
          <p className="text-gray-400 text-sm mb-3">
            Track performance
          </p>
          <button
            onClick={() => setShowReferralAnalytics(true)}
            className="inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
          >
            View Analytics
          </button>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 text-center">
          <div className="text-3xl mb-2">💰</div>
          <h3 className="text-white font-medium mb-2">Earnings</h3>
          <p className="text-gray-400 text-sm mb-3">
            Monitor commissions
          </p>
          <button className="inline-block bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded transition-colors">
            View Earnings
          </button>
        </div>
      </div>

      {/* How the Enhanced System Works */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🚀 How the Enhanced Invite & Referral System Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl mb-2">🎫</div>
            <h4 className="text-white font-medium mb-2">Create Tiered Invites</h4>
            <p className="text-gray-400 text-sm">
              Generate different invite tiers with varying bonuses and commission rates
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">💰</div>
            <h4 className="text-white font-medium mb-2">Earn Multiple Ways</h4>
            <p className="text-gray-400 text-sm">
              Get bonuses for used invites + ongoing commissions from referral purchases
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🔄</div>
            <h4 className="text-white font-medium mb-2">Automated Generation</h4>
            <p className="text-gray-400 text-sm">
              Bulk generate invites for marketplace selling and network building
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">📈</div>
            <h4 className="text-white font-medium mb-2">Passive Income</h4>
            <p className="text-gray-400 text-sm">
              Build a network that generates ongoing revenue through commissions
            </p>
          </div>
        </div>
      </div>

      {/* Demo Mode Information */}
      <div className="bg-blue-900 border border-blue-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-200 mb-4">ℹ️ Demo Mode Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-blue-200 font-medium mb-2">Current Status</h4>
            <ul className="text-blue-100 text-sm space-y-1">
              <li>• System is running in demonstration mode</li>
              <li>• All data is stored locally (refreshes on page reload)</li>
              <li>• Invite creation works with mock data</li>
              <li>• Tier system and calculations are fully functional</li>
            </ul>
          </div>
          <div>
            <h4 className="text-blue-200 font-medium mb-2">Production Implementation</h4>
            <ul className="text-blue-100 text-sm space-y-1">
              <li>• Uncomment API calls in the code</li>
              <li>• Implement backend invite management</li>
              <li>• Add real payment processing</li>
              <li>• Connect to database for persistence</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-800 rounded-lg">
          <p className="text-blue-200 text-sm text-center">
            💡 <strong>Note:</strong> This demo showcases the complete UI/UX and business logic. 
            The system is ready for backend integration when you're ready to deploy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Invites;
