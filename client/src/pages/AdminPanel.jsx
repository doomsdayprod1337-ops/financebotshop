import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/axios';
import AdminDepositNotifications from '../components/AdminDepositNotifications';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user, refreshSession } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    openTickets: 0,
    totalRevenue: 0
  });

  // Check if user is admin
  useEffect(() => {
    if (user && !user.is_admin) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch admin dashboard stats
  useEffect(() => {
    if (user?.is_admin) {
      fetchAdminStats();
    }
  }, [user]);

  const fetchAdminStats = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/admin-stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message;
        if (errorMessage === 'Invalid or expired token') {
          // Try to refresh the session
          try {
            const result = await refreshSession();
            if (result.success) {
              // Retry fetching admin stats
              const retryResponse = await api.get('/api/admin-stats');
              if (retryResponse.data.success) {
                setStats(retryResponse.data.stats);
                return;
              }
            }
          } catch (refreshError) {
            console.error('Session refresh failed:', refreshError);
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'products', label: 'Products', icon: '🛍️' },
    { id: 'tickets', label: 'Support Tickets', icon: '🎫' },
    { id: 'deposits', label: 'Deposits', icon: '💰' },
    { id: 'data-management', label: 'Data/Stock Management', icon: '🗃️' },
    { id: 'content', label: 'Content Management', icon: '📝' },
    { id: 'settings', label: 'System Settings', icon: '⚙️' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard stats={stats} />;
      case 'users':
        return <UserManagement />;
      case 'products':
        return <ProductManagement />;
      case 'tickets':
        return <TicketManagement />;
      case 'deposits':
        return <AdminDepositNotifications />;
      case 'data-management':
        return <DataManagement />;
      case 'content':
        return <ContentManagement />;
      case 'settings':
        return <SystemSettings />;
      default:
        return <AdminDashboard stats={stats} />;
    }
  };

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400">Admin privileges required</p>
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
              <h1 className="text-xl font-bold text-white">🔐 Admin Panel</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    const result = await refreshSession();
                    if (result.success) {
                      // Refresh admin stats after successful session refresh
                      fetchAdminStats();
                    }
                  } catch (error) {
                    console.error('Session refresh failed:', error);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                disabled={isLoading}
              >
                {isLoading ? '🔄' : '🔄'} Refresh Session
              </button>
              <span className="text-gray-300">Welcome, {user.username}</span>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="bg-gray-800 rounded-lg p-1 mb-8">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800 rounded-lg p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

// Admin Dashboard Component
const AdminDashboard = ({ stats }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">📊 Admin Dashboard</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-700 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-500 bg-opacity-20">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
              <p className="text-xs text-green-400">+{stats.recentRegistrations?.length || 0} new (7d)</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-500 bg-opacity-20">
              <span className="text-2xl">📰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">News Posts</p>
              <p className="text-2xl font-bold text-white">{stats.totalNewsPosts || 0}</p>
              <p className="text-xs text-green-400">+{stats.recentNewsPosts || 0} new (7d)</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-500 bg-opacity-20">
              <span className="text-2xl">📚</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Wiki Entries</p>
              <p className="text-2xl font-bold text-white">{stats.totalWikiEntries || 0}</p>
              <p className="text-xs text-green-400">+{stats.recentWikiEntries || 0} new (7d)</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-500 bg-opacity-20">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Deposits</p>
              <p className="text-2xl font-bold text-white">{stats.totalDeposits || 0}</p>
              <p className="text-xs text-green-400">+{stats.recentDeposits || 0} new (7d)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-700 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-500 bg-opacity-20">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Deposit Status</p>
              <div className="space-y-1 mt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-yellow-400">Pending:</span>
                  <span className="text-white">{stats.pendingDeposits || 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-green-400">Confirmed:</span>
                  <span className="text-white">{stats.confirmedDeposits || 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-red-400">Failed:</span>
                  <span className="text-white">{stats.failedDeposits || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-500 bg-opacity-20">
              <span className="text-2xl">🎫</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Open Tickets</p>
              <p className="text-2xl font-bold text-white">{stats.openTickets || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-500 bg-opacity-20">
              <span className="text-2xl">🛍️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Products</p>
              <p className="text-2xl font-bold text-white">{stats.totalProducts || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
              Add New Product
            </button>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
              Create News Post
            </button>
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
              View Reports
            </button>
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3 text-sm max-h-48 overflow-y-auto">
            {stats.recentRegistrations && stats.recentRegistrations.length > 0 ? (
              stats.recentRegistrations.slice(0, 5).map((user, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-300">
                    New user: <span className="text-white font-medium">{user.username || user.email}</span>
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-sm">No recent registrations</div>
            )}
            
            {stats.recentDeposits > 0 && (
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-300">
                  <span className="text-white font-medium">{stats.recentDeposits}</span> new deposits (7d)
                </span>
              </div>
            )}
            
            {stats.recentNewsPosts > 0 && (
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-gray-300">
                  <span className="text-white font-medium">{stats.recentNewsPosts}</span> new news posts (7d)
                </span>
              </div>
            )}
            
            {stats.recentWikiEntries > 0 && (
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-300">
                  <span className="text-white font-medium">{stats.recentWikiEntries}</span> new wiki entries (7d)
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Database</span>
              <span className="text-green-400">● Online</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">API</span>
              <span className="text-green-400">● Online</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Storage</span>
              <span className="text-green-400">● Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// User Management Component
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await api.get('/api/admin/users');
      if (response.data.success) {
        setUsers(response.data.users || []);
      } else {
        setError('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Error fetching users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserStatus = async (userId, status) => {
    try {
      const response = await api.put('/api/admin/users', { userId, status });
      if (response.data.success) {
        // Update the user in the local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId ? { ...user, status } : user
          )
        );
      } else {
        setError('Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      setError('Error updating user status. Please try again.');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportUsers = () => {
    const csvContent = [
      'ID,Username,Email,Status,Role,Wallet Balance,Total Deposits,Total Deposit Amount,Total Purchases,Total Tickets,Registered IP,Last IP,Joined,Last Login',
      ...filteredUsers.map(user => 
        `${user.id},${user.username},${user.email},${user.status},${user.role || 'user'},${user.wallet_balance || 0},${user.totalDeposits || 0},${user.totalDepositAmount || 0},${user.totalPurchases || 0},${user.totalTickets || 0},${user.registered_ip || 'N/A'},${user.last_ip_address || 'N/A'},${new Date(user.created_at).toLocaleDateString()},${user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading && users.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">👥 User Management</h2>
        <div className="bg-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-400">Loading users...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">👥 User Management</h2>
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-white hover:text-gray-200">
              ✕
            </button>
          </div>
        </div>
      )}
      
      <div className="bg-gray-700 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-600">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <h3 className="text-lg font-semibold text-white">Registered Users ({filteredUsers.length})</h3>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <button 
                onClick={exportUsers}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                📥 Export Users
              </button>
              <button 
                onClick={fetchUsers}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                {isLoading ? '🔄 Refreshing...' : '🔄 Refresh'}
              </button>
            </div>
          </div>
          
          {/* Search and Filter Controls */}
          <div className="mt-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by username or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* User Statistics Summary */}
        <div className="px-6 py-4 bg-gray-600 border-t border-gray-500">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
            <div className="text-center">
              <div className="text-white font-semibold">{filteredUsers.length}</div>
              <div className="text-gray-400">Total Users</div>
            </div>
            <div className="text-center">
              <div className="text-green-400 font-semibold">
                ${filteredUsers.reduce((sum, user) => sum + (user.wallet_balance || 0), 0).toFixed(2)}
              </div>
              <div className="text-gray-400">Total Wallet</div>
            </div>
            <div className="text-center">
              <div className="text-blue-400 font-semibold">
                {filteredUsers.reduce((sum, user) => sum + (user.totalDeposits || 0), 0)}
              </div>
              <div className="text-gray-400">Total Deposits</div>
            </div>
            <div className="text-center">
              <div className="text-purple-400 font-semibold">
                {filteredUsers.reduce((sum, user) => sum + (user.totalPurchases || 0), 0)}
              </div>
              <div className="text-gray-400">Total Purchases</div>
            </div>
            <div className="text-center">
              <div className="text-yellow-400 font-semibold">
                {filteredUsers.reduce((sum, user) => sum + (user.totalTickets || 0), 0)}
              </div>
              <div className="text-gray-400">Total Tickets</div>
            </div>
            <div className="text-center">
              <div className="text-gray-300 font-semibold">
                ${filteredUsers.reduce((sum, user) => sum + (user.totalDepositAmount || 0), 0).toFixed(2)}
              </div>
              <div className="text-gray-400">Total Deposited</div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-600">
            <thead className="bg-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Wallet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Deposits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Purchases</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Tickets</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">IP Addresses</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-700 divide-y divide-gray-600">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="12" className="px-6 py-8 text-center text-gray-400">
                    {searchTerm || statusFilter !== 'all' ? 'No users match your search criteria' : 'No users found'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-600 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">{user.username}</div>
                          <div className="text-sm text-gray-400">ID: {user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' : 
                        user.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' || user.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role || user.is_admin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div className="text-green-400 font-medium">${(user.wallet_balance || 0).toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div className="text-blue-400 font-medium">{user.totalDeposits || 0}</div>
                      <div className="text-xs text-gray-400">${(user.totalDepositAmount || 0).toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div className="text-purple-400 font-medium">{user.totalPurchases || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div className="text-yellow-400 font-medium">{user.totalTickets || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div className="text-xs">
                        <div className="text-gray-400">Reg: <span className="text-white">{user.registered_ip || 'N/A'}</span></div>
                        <div className="text-gray-400">Last: <span className="text-white">{user.last_ip_address || 'N/A'}</span></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <select
                        value={user.status}
                        onChange={(e) => updateUserStatus(user.id, e.target.value)}
                        className="bg-gray-600 text-white text-sm rounded px-2 py-1 border border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="banned">Banned</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Product Management Component
const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/admin/products');
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">🛍️ Product Management</h2>
      
      <div className="bg-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">All Products</h3>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
            + Add New Product
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-gray-600 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-medium">{product.name}</h4>
                <span className="text-green-400 font-bold">${product.price}</span>
              </div>
              <p className="text-gray-300 text-sm mb-3">{product.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Stock: {product.stock}</span>
                <div className="flex space-x-2">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors">
                    Edit
                  </button>
                  <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Ticket Management Component
const TicketManagement = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [newReply, setNewReply] = useState({ message: '' });

  const categories = [
    { value: 'technical', label: 'Technical Issue', icon: '🔧' },
    { value: 'billing', label: 'Billing & Payment', icon: '💳' },
    { value: 'account', label: 'Account Issue', icon: '👤' },
    { value: 'general', label: 'General Inquiry', icon: '❓' },
    { value: 'bug_report', label: 'Bug Report', icon: '🐛' },
    { value: 'feature_request', label: 'Feature Request', icon: '💡' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-green-500' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
    { value: 'high', label: 'High', color: 'bg-orange-500' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-500' }
  ];

  const statuses = [
    { value: 'open', label: 'Open', color: 'bg-blue-500' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-500' },
    { value: 'waiting_for_user', label: 'Waiting for User', color: 'bg-purple-500' },
    { value: 'resolved', label: 'Resolved', color: 'bg-green-500' },
    { value: 'closed', label: 'Closed', color: 'bg-gray-500' }
  ];

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/tickets', {
        headers: {
          'Authorization': `Bearer ${user?.access_token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      const response = await fetch('/api/tickets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`
        },
        body: JSON.stringify({
          id: ticketId,
          status: newStatus
        })
      });

      if (response.ok) {
        fetchTickets();
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket({ ...selectedTicket, status: newStatus });
        }
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const assignTicket = async (ticketId, adminId) => {
    try {
      const response = await fetch('/api/tickets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`
        },
        body: JSON.stringify({
          id: ticketId,
          assigned_admin_id: adminId
        })
      });

      if (response.ok) {
        fetchTickets();
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket({ ...selectedTicket, assigned_admin_id: adminId });
        }
      }
    } catch (error) {
      console.error('Error assigning ticket:', error);
    }
  };

  const addReply = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !newReply.message.trim()) return;

    try {
      const response = await fetch('/api/ticket-replies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`
        },
        body: JSON.stringify({
          ticket_id: selectedTicket.id,
          message: newReply.message
        })
      });

      if (response.ok) {
        // Reload the selected ticket to get updated replies
        const ticketResponse = await fetch(`/api/tickets?id=${selectedTicket.id}`, {
          headers: {
            'Authorization': `Bearer ${user?.access_token}`
          }
        });
        
        if (ticketResponse.ok) {
          const ticketData = await ticketResponse.json();
          setSelectedTicket(ticketData.ticket);
          setTickets(tickets.map(t => t.id === selectedTicket.id ? ticketData.ticket : t));
        }
        
        setNewReply({ message: '' });
      }
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  const getStatusColor = (status) => {
    const statusObj = statuses.find(s => s.value === status);
    return statusObj ? statusObj.color : 'bg-gray-500';
  };

  const getPriorityColor = (priority) => {
    const priorityObj = priorities.find(p => p.value === priority);
    return priorityObj ? priorityObj.color : 'bg-gray-500';
  };

  const getCategoryIcon = (category) => {
    const categoryObj = categories.find(c => c.value === category);
    return categoryObj ? categoryObj.icon : '❓';
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filterStatus !== 'all' && ticket.status !== filterStatus) return false;
    if (filterCategory !== 'all' && ticket.category !== filterCategory) return false;
    if (filterPriority !== 'all' && ticket.priority !== filterPriority) return false;
    return true;
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">🎫 Support Ticket Management</h2>
      
      {/* Ticket Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{tickets.filter(t => t.status === 'open').length}</div>
          <div className="text-sm text-gray-300">Open</div>
        </div>
        <div className="bg-gray-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{tickets.filter(t => t.status === 'in_progress').length}</div>
          <div className="text-sm text-gray-300">In Progress</div>
        </div>
        <div className="bg-gray-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{tickets.filter(t => t.status === 'waiting_for_user').length}</div>
          <div className="text-sm text-gray-300">Waiting</div>
        </div>
        <div className="bg-gray-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{tickets.filter(t => t.status === 'resolved').length}</div>
          <div className="text-sm text-gray-300">Resolved</div>
        </div>
        <div className="bg-gray-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-400">{tickets.filter(t => t.status === 'closed').length}</div>
          <div className="text-sm text-gray-300">Closed</div>
        </div>
        </div>
        
      {/* Filters */}
      <div className="bg-gray-700 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-gray-300 text-sm mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              {statuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-1">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.icon} {category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-1">Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Priorities</option>
              {priorities.map(priority => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.map((ticket) => (
          <div
            key={ticket.id}
            className="bg-gray-700 rounded-lg p-6 hover:bg-gray-600 transition-all duration-200 cursor-pointer border border-gray-600 hover:border-blue-500"
            onClick={() => setSelectedTicket(ticket)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">{ticket.title}</h3>
                <p className="text-gray-300 text-sm line-clamp-2">{ticket.description}</p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(ticket.status)}`}>
                  {statuses.find(s => s.value === ticket.status)?.label || ticket.status}
                  </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getPriorityColor(ticket.priority)}`}>
                  {priorities.find(p => p.value === ticket.priority)?.label || ticket.priority}
                </span>
                </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center">
                  <span className="mr-2">{getCategoryIcon(ticket.category)}</span>
                  {categories.find(c => c.value === ticket.category)?.label || ticket.category}
                </span>
                <span>From: {ticket.user?.email || 'Unknown'}</span>
                <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                {ticket.updated_at && (
                  <span>Updated: {new Date(ticket.updated_at).toLocaleDateString()}</span>
                )}
              </div>
              <div className="text-right">
                <span className="text-blue-400">Click to view details</span>
              </div>
            </div>
          </div>
        ))}
              </div>
              
      {/* Empty State */}
      {filteredTickets.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🎫</div>
          <h3 className="text-2xl font-semibold text-gray-300 mb-2">No Tickets Found</h3>
          <p className="text-gray-500">
            {tickets.length === 0 
              ? "No support tickets have been created yet." 
              : "No tickets match your current filters."}
          </p>
        </div>
      )}

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedTicket.title}</h2>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(selectedTicket.status)}`}>
                      {statuses.find(s => s.value === selectedTicket.status)?.label || selectedTicket.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getPriorityColor(selectedTicket.priority)}`}>
                      {priorities.find(p => p.value === selectedTicket.priority)?.label || selectedTicket.priority}
                    </span>
                    <span className="flex items-center text-gray-400">
                      <span className="mr-2">{getCategoryIcon(selectedTicket.category)}</span>
                      {categories.find(c => c.value === selectedTicket.category)?.label || selectedTicket.category}
                    </span>
                  </div>
                  <p className="text-gray-400">From: {selectedTicket.user?.email || 'Unknown'}</p>
                  <p className="text-gray-400">Created: {new Date(selectedTicket.created_at).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  </button>
                </div>

              {/* Ticket Description */}
              <div className="bg-gray-700 rounded-lg p-4 mb-6">
                <h4 className="text-lg font-semibold text-white mb-3">Description</h4>
                <p className="text-gray-300 whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>

              {/* Admin Actions */}
              <div className="bg-gray-700 rounded-lg p-4 mb-6">
                <h4 className="text-lg font-semibold text-white mb-3">Admin Actions</h4>
                <div className="flex flex-wrap gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm mb-1">Status</label>
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value)}
                      className="bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      {statuses.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm mb-1">Assign to Admin</label>
                    <select
                      value={selectedTicket.assigned_admin_id || ''}
                      onChange={(e) => assignTicket(selectedTicket.id, e.target.value)}
                      className="bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Unassigned</option>
                      <option value={user.id}>Assign to me</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Replies */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-4">Conversation</h4>
                <div className="space-y-4">
                  {selectedTicket.replies?.map((reply) => (
                    <div
                      key={reply.id}
                      className={`p-4 rounded-lg ${
                        reply.is_admin_reply ? 'bg-blue-900 border-l-4 border-blue-500' : 'bg-gray-700'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">
                            {reply.user?.full_name || reply.user?.email || 'Unknown User'}
                          </span>
                          {reply.is_admin_reply && (
                            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">Admin</span>
                          )}
                        </div>
                        <span className="text-gray-400 text-sm">
                          {new Date(reply.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-300 whitespace-pre-wrap">{reply.message}</p>
            </div>
          ))}
        </div>
      </div>

              {/* Add Reply Form */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-3">Add Admin Reply</h4>
                <form onSubmit={addReply} className="space-y-4">
                  <textarea
                    value={newReply.message}
                    onChange={(e) => setNewReply({ message: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    rows="3"
                    placeholder="Type your admin response here..."
                    required
                  />
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                    >
                      Send Reply
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewReply({ message: '' })}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                    >
                      Clear
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Content Management Component
const ContentManagement = () => {
  const [news, setNews] = useState([]);
  const [wikiEntries, setWikiEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [showWikiModal, setShowWikiModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [editingWiki, setEditingWiki] = useState(null);
  const [timePeriod, setTimePeriod] = useState('7d');
  const [contentStats, setContentStats] = useState({
    news: { recent: 0, total: 0 },
    wiki: { recent: 0, total: 0 }
  });
  const [newsForm, setNewsForm] = useState({
    title: '',
    content: '',
    category: '',
    fullContent: ''
  });
  const [wikiForm, setWikiForm] = useState({
    title: '',
    content: '',
    category: '',
    section: '',
    subsections: '',
    steps: '',
    details: ''
  });

  // Load content on component mount
  useEffect(() => {
    loadContent();
  }, []);

  // Load content stats when time period changes
  useEffect(() => {
    loadContentStats();
  }, [timePeriod]);

  const loadContent = async () => {
    try {
      setIsLoading(true);
      
      // Load news
      const newsResponse = await api.get('/api/news-management');
      if (newsResponse.data.success) {
        setNews(newsResponse.data.news || []);
      }
      
      // Load wiki entries
      const wikiResponse = await api.get('/api/wiki-management');
      if (wikiResponse.data.success) {
        setWikiEntries(wikiResponse.data.wikiEntries || []);
      }
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadContentStats = async () => {
    try {
      const response = await api.get(`/api/content-stats?timePeriod=${timePeriod}`);
      if (response.data.success) {
        setContentStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error loading content stats:', error);
    }
  };

  const handleNewsSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      if (editingNews) {
        // Update existing news
        const response = await api.put('/api/news-management', {
          id: editingNews.id,
          ...newsForm
        });
        if (response.data.success) {
          setNews(news.map(item => 
            item.id === editingNews.id ? response.data.news : item
          ));
          setEditingNews(null);
        }
      } else {
        // Create new news
        const response = await api.post('/api/news-management', newsForm);
        if (response.data.success) {
          setNews([response.data.news, ...news]);
        }
      }
      
      setShowNewsModal(false);
      setNewsForm({ title: '', content: '', category: '', fullContent: '' });
    } catch (error) {
      console.error('Error saving news:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWikiSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      if (editingWiki) {
        // Update existing wiki entry
        const response = await api.put('/api/wiki-management', {
          id: editingWiki.id,
          ...wikiForm
        });
        if (response.data.success) {
          setWikiEntries(wikiEntries.map(item => 
            item.id === editingWiki.id ? response.data.wikiEntry : item
          ));
          setEditingWiki(null);
        }
      } else {
        // Create new wiki entry
        const response = await api.post('/api/wiki-management', wikiForm);
        if (response.data.success) {
          setWikiEntries([response.data.wikiEntry, ...wikiEntries]);
        }
      }
      
      setShowWikiModal(false);
      setWikiForm({ title: '', content: '', category: '', section: '', subsections: '', steps: '', details: '' });
    } catch (error) {
      console.error('Error saving wiki entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditNews = (newsItem) => {
    setEditingNews(newsItem);
    setNewsForm({
      title: newsItem.title,
      content: newsItem.content,
      category: newsItem.category,
      fullContent: newsItem.full_content || newsItem.content
    });
    setShowNewsModal(true);
  };

  const handleEditWiki = (wikiItem) => {
    setEditingWiki(wikiItem);
    setWikiForm({
      title: wikiItem.title,
      content: wikiItem.content,
      category: wikiItem.category,
      section: wikiItem.section || '',
      subsections: wikiItem.subsections || '',
      steps: wikiItem.steps || '',
      details: wikiItem.details || ''
    });
    setShowWikiModal(true);
  };

  const handleDeleteNews = async (id) => {
    if (window.confirm('Are you sure you want to delete this news item?')) {
      try {
        const response = await api.delete('/api/news-management', { data: { id } });
        if (response.data.success) {
          setNews(news.filter(item => item.id !== id));
        }
      } catch (error) {
        console.error('Error deleting news:', error);
      }
    }
  };

  const handleDeleteWiki = async (id) => {
    if (window.confirm('Are you sure you want to delete this wiki entry?')) {
      try {
        const response = await api.delete('/api/wiki-management', { data: { id } });
        if (response.data.success) {
          setWikiEntries(wikiEntries.filter(item => item.id !== id));
        }
      } catch (error) {
        console.error('Error deleting wiki entry:', error);
      }
    }
  };

  const openNewsModal = () => {
    setEditingNews(null);
    setNewsForm({ title: '', content: '', category: '', fullContent: '' });
    setShowNewsModal(true);
  };

  const openWikiModal = () => {
    setEditingWiki(null);
    setWikiForm({ title: '', content: '', category: '', section: '', subsections: '', steps: '', details: '' });
    setShowWikiModal(true);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">📝 Content Management</h2>
      
      {/* Time Period Selector and Stats */}
      <div className="bg-gray-700 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Content Statistics</h3>
          <div className="flex items-center space-x-4">
            <label className="text-gray-300 text-sm">Time Period:</label>
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
              className="bg-gray-600 text-white px-3 py-2 rounded-lg text-sm border border-gray-500 focus:outline-none focus:border-blue-500"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-600 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{contentStats.news.recent}</div>
            <div className="text-sm text-gray-300">New News Posts</div>
            <div className="text-xs text-gray-400">({timePeriod})</div>
          </div>
          <div className="bg-gray-600 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{contentStats.news.total}</div>
            <div className="text-sm text-gray-300">Total News Posts</div>
          </div>
          <div className="bg-gray-600 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{contentStats.wiki.recent}</div>
            <div className="text-sm text-gray-300">New Wiki Entries</div>
            <div className="text-xs text-gray-400">({timePeriod})</div>
          </div>
          <div className="bg-gray-600 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{contentStats.wiki.total}</div>
            <div className="text-sm text-gray-300">Total Wiki Entries</div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* News Management */}
        <div className="bg-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">News Management</h3>
            <button 
              onClick={openNewsModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              + Add News
            </button>
          </div>
          
          {/* News Summary */}
          <div className="mb-4 p-3 bg-gray-600 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">
                Total Articles: <span className="text-white font-semibold">{news.length}</span>
              </span>
              <div className="flex space-x-3">
                {Object.entries(
                  news.reduce((acc, article) => {
                    acc[article.category] = (acc[article.category] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([category, count]) => (
                  <span key={category} className="text-gray-400">
                    {category}: <span className="text-green-400 font-medium">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-gray-300 text-center py-4">Loading...</div>
            ) : news.length === 0 ? (
              <div className="text-gray-300 text-center py-4">No news items found</div>
            ) : (
              news.map((newsItem) => (
                <div key={newsItem.id} className="bg-gray-600 rounded-lg p-4 border border-gray-500 hover:border-gray-400 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-white font-semibold text-lg mb-2">{newsItem.title}</h4>
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full font-medium">
                          {newsItem.category}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {new Date(newsItem.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-3">
                      <button 
                        onClick={() => handleEditNews(newsItem)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors font-medium"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteNews(newsItem.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs transition-colors font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-gray-300 text-sm leading-relaxed">{newsItem.content}</p>
                    
                    {newsItem.full_content && newsItem.full_content !== newsItem.content && (
                      <div className="text-gray-400 text-xs">
                        <span className="font-medium">Full Content:</span> {newsItem.full_content.substring(0, 100)}...
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-500">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>ID: {newsItem.id.substring(0, 8)}...</span>
                      <span>Updated: {new Date(newsItem.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Wiki Management */}
        <div className="bg-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Wiki Management</h3>
            <button 
              onClick={openWikiModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              + Add Wiki Entry
            </button>
          </div>
          
          {/* Search and Filter */}
          <div className="mb-4 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search wiki entries..."
              className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none text-sm"
              onChange={(e) => {
                const searchTerm = e.target.value.toLowerCase();
                const filtered = wikiEntries.filter(entry => 
                  entry.title.toLowerCase().includes(searchTerm) ||
                  entry.content.toLowerCase().includes(searchTerm) ||
                  entry.category.toLowerCase().includes(searchTerm)
                );
                // You can add a filtered state here if needed
              }}
            />
            <select className="bg-gray-600 text-white px-3 py-2 rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none text-sm">
              <option value="">All Categories</option>
              <option value="overview">Overview</option>
              <option value="gettingStarted">Getting Started</option>
              <option value="products">Products</option>
              <option value="security">Security</option>
              <option value="troubleshooting">Troubleshooting</option>
            </select>
          </div>
          
          {/* Wiki Summary */}
          <div className="mb-4 p-3 bg-gray-600 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">
                Total Entries: <span className="text-white font-semibold">{wikiEntries.length}</span>
              </span>
              <div className="flex space-x-3">
                {Object.entries(
                  wikiEntries.reduce((acc, entry) => {
                    acc[entry.category] = (acc[entry.category] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([category, count]) => (
                  <span key={category} className="text-gray-400">
                    {category}: <span className="text-purple-400 font-medium">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-gray-300 text-center py-4">Loading...</div>
            ) : wikiEntries.length === 0 ? (
              <div className="text-gray-300 text-center py-4">No wiki entries found</div>
            ) : (
              wikiEntries.map((wikiItem) => (
                <div key={wikiItem.id} className="bg-gray-600 rounded-lg p-4 border border-gray-500 hover:border-gray-400 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-white font-semibold text-lg mb-2">{wikiItem.title}</h4>
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full font-medium">
                          {wikiItem.category}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {new Date(wikiItem.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-3">
                      <button 
                        onClick={() => handleEditWiki(wikiItem)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors font-medium"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteWiki(wikiItem.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs transition-colors font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-gray-300 text-sm leading-relaxed">{wikiItem.content}</p>
                    
                    {wikiItem.section && (
                      <div className="text-gray-400 text-xs">
                        <span className="font-medium">Section:</span> {wikiItem.section}
                      </div>
                    )}
                    
                    {wikiItem.subsections && wikiItem.subsections.length > 0 && (
                      <div className="text-gray-400 text-xs">
                        <span className="font-medium">Subsections:</span> {wikiItem.subsections.join(', ')}
                      </div>
                    )}
                    
                    {wikiItem.steps && wikiItem.steps.length > 0 && (
                      <div className="text-gray-400 text-xs">
                        <span className="font-medium">Steps:</span> {wikiItem.steps.length} step(s)
                      </div>
                    )}
                    
                    {wikiItem.details && (
                      <div className="text-gray-400 text-xs">
                        <span className="font-medium">Details:</span> {wikiItem.details.substring(0, 100)}...
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-500">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>ID: {wikiItem.id.substring(0, 8)}...</span>
                      <span>Updated: {new Date(wikiItem.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* News Modal */}
      {showNewsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingNews ? 'Edit News' : 'Add News'}
            </h3>
            <form onSubmit={handleNewsSubmit} className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={newsForm.title}
                  onChange={(e) => setNewsForm({...newsForm, title: e.target.value})}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">Category</label>
                <select
                  value={newsForm.category}
                  onChange={(e) => setNewsForm({...newsForm, category: e.target.value})}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Software">Software</option>
                  <option value="Market">Market</option>
                  <option value="Security">Security</option>
                  <option value="Payment">Payment</option>
                  <option value="General">General</option>
                </select>
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">Short Content</label>
                <textarea
                  value={newsForm.content}
                  onChange={(e) => setNewsForm({...newsForm, content: e.target.value})}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                  rows="3"
                  required
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">Full Content</label>
                <textarea
                  value={newsForm.fullContent}
                  onChange={(e) => setNewsForm({...newsForm, fullContent: e.target.value})}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                  rows="6"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : (editingNews ? 'Update' : 'Create')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewsModal(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Wiki Modal */}
      {showWikiModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingWiki ? 'Edit Wiki Entry' : 'Add Wiki Entry'}
            </h3>
            <form onSubmit={handleWikiSubmit} className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={wikiForm.title}
                  onChange={(e) => setWikiForm({...wikiForm, title: e.target.value})}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">Category</label>
                <select
                  value={wikiForm.category}
                  onChange={(e) => setWikiForm({...wikiForm, category: e.target.value})}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="overview">Overview</option>
                  <option value="gettingStarted">Getting Started</option>
                  <option value="products">Products</option>
                  <option value="security">Security</option>
                  <option value="troubleshooting">Troubleshooting</option>
                </select>
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">Section</label>
                <input
                  type="text"
                  value={wikiForm.section}
                  onChange={(e) => setWikiForm({...wikiForm, section: e.target.value})}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., What is Reaper Market?"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">Content</label>
                <textarea
                  value={wikiForm.content}
                  onChange={(e) => setWikiForm({...wikiForm, content: e.target.value})}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                  rows="4"
                  required
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">Subsections (one per line)</label>
                <textarea
                  value={wikiForm.subsections}
                  onChange={(e) => setWikiForm({...wikiForm, subsections: e.target.value})}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                  rows="3"
                  placeholder="Premium credential marketplace&#10;Bot dump collections&#10;Professional services"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">Steps (one per line)</label>
                <textarea
                  value={wikiForm.steps}
                  onChange={(e) => setWikiForm({...wikiForm, steps: e.target.value})}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                  rows="3"
                  placeholder="Obtain an invite code&#10;Visit the registration page&#10;Complete your profile setup"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">Additional Details</label>
                <textarea
                  value={wikiForm.details}
                  onChange={(e) => setWikiForm({...wikiForm, details: e.target.value})}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                  rows="3"
                  placeholder="Additional information, tips, or notes..."
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : (editingWiki ? 'Update' : 'Create')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowWikiModal(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// System Settings Component
const SystemSettings = () => {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    registrationEnabled: true,
    inviteRequired: true,
    maxFileSize: 10,
    minimumDepositAmount: 50.00,
              menuOptions: {
            bots: true,
            news: true,
            wiki: true,
            services: true,
            downloads: true,
            binChecker: true,
            creditCards: true,
            configs: true,
            finance: true
          },
              binChecker: {
            source: 'binlist',
            zylalabsApiKey: '9751|WUPyR6h9qlr8eUlgZSi4RMVVvrhoomBHzBfYaXn8'
          },
          financeApis: {
            binApiCheckers: {
              zyla: { enabled: false, apiKey: '' },
              binlist: { enabled: true, apiKey: '' },
              apiNinjas: { enabled: false, apiKey: '' }
            },
            routingApiCheckers: {
              apiVerve: { enabled: false, apiKey: '' }
            },
            cardCheckingApis: {
              plaid: { enabled: false, clientId: '', secret: '' },
              stripe: { enabled: false, publishableKey: '', secretKey: '' },
              paypal: { enabled: false, clientId: '', secret: '' },
              braintree: { enabled: false, merchantId: '', publicKey: '', privateKey: '' },
              wooCommerce: { enabled: false, consumerKey: '', consumerSecret: '' }
            }
          },
    walletSettings: {
      payment_processor: 'manual',
      coinbase_api_key: '',
      coinbase_api_secret: '',
      nowpayments_api_key: '',
      nowpayments_public_key: '',
      bitpay_merchant_id: '',
      bitpay_private_key: '',
      currencies: {
        BTC: { enabled: true, address: '', min_amount: 0.001, max_amount: 1.0, network_fee: 0.0001 },
        LTC: { enabled: true, address: '', min_amount: 0.01, max_amount: 100.0, network_fee: 0.001 },
        ETH: { enabled: true, address: '', min_amount: 0.01, max_amount: 10.0, network_fee: 0.005 },
        USDT_TRC20: { enabled: true, address: '', min_amount: 10.0, max_amount: 10000.0, network_fee: 1.0 },
        USDT_ERC20: { enabled: true, address: '', min_amount: 10.0, max_amount: 10000.0, network_fee: 10.0 },
        XMR: { enabled: true, address: '', min_amount: 0.01, max_amount: 100.0, network_fee: 0.0001 },
        SOL: { enabled: true, address: '', min_amount: 0.1, max_amount: 1000.0, network_fee: 0.000005 }
      },
      manual_settings: {
        enabled: true,
        instructions: 'Send payment to the address below and include your order ID in the memo/note field.',
        confirmation_required: true,
        auto_confirm_after_blocks: 6
      }
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/admin-settings');
      if (response.data.success) {
        // Ensure all required properties exist with defaults
        const loadedSettings = response.data.settings || {};
        setSettings({
          maintenanceMode: loadedSettings.maintenanceMode || false,
          registrationEnabled: loadedSettings.registrationEnabled !== undefined ? loadedSettings.registrationEnabled : true,
          inviteRequired: loadedSettings.inviteRequired !== undefined ? loadedSettings.inviteRequired : true,
          maxFileSize: loadedSettings.maxFileSize || 10,
          minimumDepositAmount: loadedSettings.minimumDepositAmount || 50.00,
          menuOptions: loadedSettings.menuOptions || {
            bots: true,
            news: true,
            wiki: true,
            services: true,
            downloads: true,
            binChecker: true,
            creditCards: true,
            configs: true,
            finance: true
          },
          binChecker: loadedSettings.binChecker || {
            source: 'binlist',
            zylalabsApiKey: '9751|WUPyR6h9qlr8eUlgZSi4RMVVvrhoomBHzBfYaXn8'
          },
          financeApis: loadedSettings.financeApis || {
            binApiCheckers: {
              zyla: { enabled: false, apiKey: '' },
              binlist: { enabled: true, apiKey: '' },
              apiNinjas: { enabled: false, apiKey: '' }
            },
            routingApiCheckers: {
              apiVerve: { enabled: false, apiKey: '' }
            },
            cardCheckingApis: {
              plaid: { enabled: false, clientId: '', secret: '' },
              stripe: { enabled: false, publishableKey: '', secretKey: '' },
              paypal: { enabled: false, clientId: '', secret: '' },
              braintree: { enabled: false, merchantId: '', publicKey: '', privateKey: '' },
              wooCommerce: { enabled: false, consumerKey: '', consumerSecret: '' }
            }
          },
          walletSettings: loadedSettings.walletSettings || {
            payment_processor: 'manual',
            coinbase_api_key: '',
            coinbase_api_secret: '',
            nowpayments_api_key: '',
            nowpayments_public_key: '',
            bitpay_merchant_id: '',
            bitpay_private_key: '',
            currencies: {
              BTC: { enabled: false, address: '', min_amount: 0.001, max_amount: 1.0, network_fee: 0.0001 },
              LTC: { enabled: false, address: '', min_amount: 0.01, max_amount: 100.0, network_fee: 0.001 },
              ETH: { enabled: false, address: '', min_amount: 0.01, max_amount: 10.0, network_fee: 0.005 },
              USDT_TRC20: { enabled: false, address: '', min_amount: 10.0, max_amount: 10000.0, network_fee: 1.0 },
              USDT_ERC20: { enabled: false, address: '', min_amount: 10.0, max_amount: 10000.0, network_fee: 10.0 },
              XMR: { enabled: false, address: '', min_amount: 0.01, max_amount: 100.0, network_fee: 0.0001 },
              SOL: { enabled: false, address: '', min_amount: 0.1, max_amount: 1000.0, network_fee: 0.000005 }
            },
            manual_settings: {
              enabled: true,
              instructions: 'Send payment to the address below and include your order ID in the memo/note field.',
              confirmation_required: true,
              auto_confirm_after_blocks: 6
            }
          }
        });
      } else {
        console.error('Failed to load settings:', response.data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Use default settings if API fails
      console.log('Using default settings due to API error');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsLoading(true);
      setSaveStatus('Saving...');
      
      console.log('Attempting to save settings:', settings);
      const response = await api.post('/api/admin-settings', { settings });
      console.log('Save response:', response);
      
      if (response.data.success) {
        setSaveStatus('Settings saved successfully!');
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        console.error('Save failed:', response.data);
        setSaveStatus(`Save failed: ${response.data.error || 'Unknown error'}`);
        setTimeout(() => setSaveStatus(''), 5000);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      console.error('Error details:', error.response?.data || error.message);
      setSaveStatus(`Error: ${error.response?.data?.error || error.message || 'Unknown error'}`);
      setTimeout(() => setSaveStatus(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateMenuOption = (option, enabled) => {
    setSettings(prev => ({
      ...prev,
      menuOptions: {
        ...prev.menuOptions,
        [option]: enabled
      }
    }));
  };

  const updateBinCheckerSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      binChecker: {
        ...prev.binChecker,
        [key]: value
      }
    }));
  };

  const updateWalletSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      walletSettings: {
        ...prev.walletSettings,
        [key]: value
      }
    }));
  };

  const updateCurrencySetting = (currency, key, value) => {
    setSettings(prev => ({
      ...prev,
      walletSettings: {
        ...prev.walletSettings,
        currencies: {
          ...prev.walletSettings.currencies,
          [currency]: {
            ...prev.walletSettings.currencies[currency],
            [key]: value
          }
        }
      }
    }));
  };

  const updateManualSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      walletSettings: {
        ...prev.walletSettings,
        manual_settings: {
          ...prev.walletSettings.manual_settings,
          [key]: value
        }
      }
    }));
  };

  const updateFinanceApiSetting = (category, provider, key, value) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      
      if (key === 'enabled' && value === true) {
        // If enabling a provider, disable all others in the same category
        Object.keys(newSettings.financeApis[category]).forEach(p => {
          newSettings.financeApis[category][p].enabled = false;
        });
        // Then enable the selected provider
        newSettings.financeApis[category][provider].enabled = true;
      } else {
        // For non-enabled changes, just update the specific value
        newSettings.financeApis[category][provider][key] = value;
      }
      
      return newSettings;
    });
  };

  if (isLoading && !settings.menuOptions) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">⚙️ System Settings</h2>
        <div className="bg-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-400">Loading settings...</span>
          </div>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState('general');

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">⚙️ System Settings</h2>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-600 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'general'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            General Settings
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'database'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            🗄️ Database Configuration
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'wallet'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            💰 Wallet Settings
          </button>
          <button
            onClick={() => setActiveTab('finance-apis')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'finance-apis'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            🔌 Finance APIs
          </button>
        </nav>
      </div>
      
      {/* Save Status Display */}
      {saveStatus && (
        <div className={`mb-6 p-4 rounded-lg ${
          saveStatus.includes('successfully') 
            ? 'bg-green-900/20 border border-green-700 text-green-300' 
            : saveStatus.includes('failed') || saveStatus.includes('Error')
            ? 'bg-red-900/20 border border-red-700 text-red-300'
            : 'bg-blue-900/20 border border-blue-700 text-blue-300'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span>
                {saveStatus.includes('successfully') ? '✅' : 
                 saveStatus.includes('failed') || saveStatus.includes('Error') ? '❌' : '🔄'}
              </span>
              <span>{saveStatus}</span>
            </div>
            <button 
              onClick={() => setSaveStatus('')}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {activeTab === 'general' && (
        <div className="space-y-6">
          {/* General Settings */}
          <div className="bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">General Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-white font-medium">Maintenance Mode</label>
                <p className="text-gray-400 text-sm">Enable to show maintenance page to users</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => updateSetting('maintenanceMode', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-white font-medium">User Registration</label>
                <p className="text-gray-400 text-sm">Allow new users to register</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.registrationEnabled}
                  onChange={(e) => updateSetting('registrationEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-white font-medium">Invite Code Required</label>
                <p className="text-gray-400 text-sm">Require invite codes for registration</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.inviteRequired}
                  onChange={(e) => updateSetting('inviteRequired', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
            <div>
                <label className="text-white font-medium">Maximum File Size (MB)</label>
                <p className="text-gray-400 text-sm">Maximum allowed file size for uploads</p>
              </div>
              <input
                type="number"
                min="1"
                max="100"
                value={settings.maxFileSize}
                onChange={(e) => updateSetting('maxFileSize', parseInt(e.target.value))}
                className="w-20 px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
        </div>


          </div>
        </div>

        {/* Menu Options */}
        <div className="bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
            <span className="mr-2">🎛️</span>
            Menu Options
            <span className="ml-2 text-sm text-gray-400 font-normal">(Control which features are visible to users)</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(settings.menuOptions).map(([option, enabled]) => {
              const menuItemConfig = {
                bots: { icon: '🤖', label: 'Bots', description: 'AI-powered automation tools' },
                news: { icon: '📰', label: 'News', description: 'Latest updates and announcements' },
                wiki: { icon: '📚', label: 'Wiki', description: 'Knowledge base and documentation' },
                services: { icon: '🛠️', label: 'Services', description: 'Professional services offered' },
                downloads: { icon: '⬇️', label: 'Downloads', description: 'Software and file downloads' },
                binChecker: { icon: '🔍', label: 'BIN Checker', description: 'Credit card BIN validation tool' },
                creditCards: { icon: '💳', label: 'Credit Cards', description: 'Credit card management system' },
                configs: { icon: '⚙️', label: 'Configs', description: 'Configuration files and checker tools' },
                finance: { icon: '📄', label: 'Finance Documents', description: 'Financial documents and resources' }
              };
              
              const config = menuItemConfig[option] || { icon: '⚙️', label: option.replace(/([A-Z])/g, ' $1'), description: 'Menu option' };
              
              return (
                <div key={option} className={`relative p-4 rounded-lg border transition-all duration-200 ${
                  enabled 
                    ? 'border-green-500 bg-green-900/10' 
                    : 'border-gray-600 bg-gray-800/50'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`text-2xl ${enabled ? 'text-green-400' : 'text-gray-500'}`}>
                        {config.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-medium ${enabled ? 'text-white' : 'text-gray-400'}`}>
                          {config.label}
                        </h4>
                        <p className={`text-sm ${enabled ? 'text-gray-300' : 'text-gray-500'}`}>
                          {config.description}
                        </p>
                      </div>
                    </div>
                    
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => updateMenuOption(option, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 rounded-full peer transition-all duration-200 ${
                        enabled 
                          ? 'bg-green-600 peer-focus:ring-4 peer-focus:ring-green-800' 
                          : 'bg-gray-600 peer-focus:ring-4 peer-focus:ring-blue-800'
                      } peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                    </label>
                  </div>
                  
                  {/* Status indicator */}
                  <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                    enabled ? 'bg-green-400' : 'bg-gray-500'
                  }`}></div>
                </div>
              );
            })}
          </div>
          
          {/* Quick Actions for Menu Options */}
          <div className="mt-6 pt-6 border-t border-gray-600">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Quick Actions</h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  Object.keys(settings.menuOptions).forEach(option => {
                    updateMenuOption(option, true);
                  });
                }}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors flex items-center space-x-1"
              >
                <span>✅</span>
                <span>Enable All</span>
              </button>
              <button
                onClick={() => {
                  Object.keys(settings.menuOptions).forEach(option => {
                    updateMenuOption(option, false);
                  });
                }}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors flex items-center space-x-1"
              >
                <span>❌</span>
                <span>Disable All</span>
              </button>
              <button
                onClick={() => {
                  // Enable only essential features
                  const essential = ['bots', 'news', 'wiki', 'configs', 'finance'];
                  Object.keys(settings.menuOptions).forEach(option => {
                    updateMenuOption(option, essential.includes(option));
                  });
                }}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors flex items-center space-x-1"
              >
                <span>⭐</span>
                <span>Essential Only</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Save Button for General Settings */}
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>Save General Settings</span>
              </>
            )}
          </button>
        </div>
      </div>
      )}

      {activeTab === 'database' && (
        <DatabaseConfiguration />
      )}

      {activeTab === 'wallet' && (
        <div className="space-y-6">
          {/* Minimum Deposit Amount */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">💰 Deposit Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Minimum Deposit Amount ($)</label>
                  <p className="text-gray-400 text-sm">Minimum amount users can deposit</p>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={settings.minimumDepositAmount}
                  onChange={(e) => updateSetting('minimumDepositAmount', parseFloat(e.target.value))}
                  className="w-24 px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Payment Processor Settings */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">💳 Payment Processor</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-white font-medium mb-2">Payment Processor</label>
                <select
                  value={settings.walletSettings.payment_processor}
                  onChange={(e) => updateWalletSetting('payment_processor', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="manual">Manual Payment</option>
                  <option value="coinbase">Coinbase Commerce</option>
                  <option value="nowpayments">NowPayments</option>
                  <option value="bitpay">BitPay</option>
                </select>
              </div>

              {settings.walletSettings.payment_processor === 'coinbase' && (
                <div className="space-y-4">
                    <div>
                    <label className="block text-white font-medium mb-2">Coinbase API Key</label>
                      <input
                      type="password"
                      value={settings.walletSettings.coinbase_api_key}
                        onChange={(e) => updateWalletSetting('coinbase_api_key', e.target.value)}
                      placeholder="Enter your Coinbase API key"
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                    <label className="block text-white font-medium mb-2">Coinbase API Secret</label>
                      <input
                        type="password"
                      value={settings.walletSettings.coinbase_api_secret}
                        onChange={(e) => updateWalletSetting('coinbase_api_secret', e.target.value)}
                      placeholder="Enter your Coinbase API secret"
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                  </div>
                </div>
              )}

              {settings.walletSettings.payment_processor === 'nowpayments' && (
                <div className="space-y-4">
                    <div>
                    <label className="block text-white font-medium mb-2">NowPayments API Key</label>
                      <input
                      type="password"
                      value={settings.walletSettings.nowpayments_api_key}
                        onChange={(e) => updateWalletSetting('nowpayments_api_key', e.target.value)}
                      placeholder="Enter your NowPayments API key"
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                    <label className="block text-white font-medium mb-2">NowPayments Public Key</label>
                      <input
                      type="password"
                      value={settings.walletSettings.nowpayments_public_key}
                        onChange={(e) => updateWalletSetting('nowpayments_public_key', e.target.value)}
                      placeholder="Enter your NowPayments public key"
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                  </div>
                </div>
              )}

              {settings.walletSettings.payment_processor === 'bitpay' && (
                <div className="space-y-4">
                    <div>
                    <label className="block text-white font-medium mb-2">BitPay Merchant ID</label>
                      <input
                        type="text"
                      value={settings.walletSettings.bitpay_merchant_id}
                        onChange={(e) => updateWalletSetting('bitpay_merchant_id', e.target.value)}
                      placeholder="Enter your BitPay merchant ID"
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                    <label className="block text-white font-medium mb-2">BitPay Private Key</label>
                      <input
                        type="password"
                      value={settings.walletSettings.bitpay_private_key}
                        onChange={(e) => updateWalletSetting('bitpay_private_key', e.target.value)}
                      placeholder="Enter your BitPay private key"
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cryptocurrency Settings */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">🪙 Cryptocurrency Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(settings.walletSettings.currencies).map(([currency, config]) => (
                <div key={currency} className={`border rounded-lg p-4 transition-all duration-200 ${
                  config.enabled 
                    ? 'border-green-500 bg-green-900/10' 
                    : 'border-gray-600 bg-gray-800/50'
                }`}>
                  
                  {/* Crypto Header with Image and Toggle */}
                  <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                          <span className="text-2xl">
                          {currency === 'BTC' && '₿'}
                          {currency === 'ETH' && 'Ξ'}
                          {currency === 'LTC' && 'Ł'}
                          {currency === 'DOGE' && 'Ð'}
                          {currency === 'BCH' && '₿'}
                          {currency === 'XMR' && 'ɱ'}
                          {currency === 'SOL' && '◎'}
                          {currency === 'USDT_TRC20' && '💎'}
                          {currency === 'USDT_ERC20' && '💎'}
                          {!['BTC', 'ETH', 'LTC', 'DOGE', 'BCH', 'XMR', 'SOL', 'USDT_TRC20', 'USDT_ERC20'].includes(currency) && '🪙'}
                          </span>
                        </div>
                      <div>
                        <h4 className="text-white font-medium">{currency}</h4>
                        <p className="text-gray-400 text-xs">
                          {currency === 'BTC' && 'Bitcoin'}
                          {currency === 'ETH' && 'Ethereum'}
                          {currency === 'LTC' && 'Litecoin'}
                          {currency === 'DOGE' && 'Dogecoin'}
                          {currency === 'BCH' && 'Bitcoin Cash'}
                          {currency === 'XMR' && 'Monero'}
                          {currency === 'SOL' && 'Solana'}
                          {currency === 'USDT_TRC20' && 'Tether (TRC20)'}
                          {currency === 'USDT_ERC20' && 'Tether (ERC20)'}
                          {!['BTC', 'ETH', 'LTC', 'DOGE', 'BCH', 'XMR', 'SOL', 'USDT_TRC20', 'USDT_ERC20'].includes(currency) && 'Cryptocurrency'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Toggle Switch */}
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                        checked={config.enabled}
                            onChange={(e) => updateCurrencySetting(currency, 'enabled', e.target.checked)}
                            className="sr-only peer"
                          />
                      <div className={`w-12 h-6 rounded-full peer peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 transition-colors duration-200 ${
                        config.enabled ? 'bg-green-600' : 'bg-red-600'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 ${config.enabled ? 'translate-x-6' : 'translate-x-1'}`}></div>
                      </div>
                        </label>
                      </div>
                      
                  {/* Status Indicator */}
                  <div className="mb-4">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      config.enabled 
                        ? 'bg-green-900 text-green-300' 
                        : 'bg-red-900 text-red-300'
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${config.enabled ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      {config.enabled ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                  
                  {/* Configuration Fields (only when enabled) */}
                      {config.enabled && (
                    <div className="space-y-3">
                          <div>
                        <label className="block text-white text-sm mb-1 font-medium">
                          💳 Wallet Address
                        </label>
                            <input
                              type="text"
                          value={config.address}
                              onChange={(e) => updateCurrencySetting(currency, 'address', e.target.value)}
                          placeholder={`Enter ${currency} wallet address`}
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                            />
                          </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                          <div>
                          <label className="block text-white text-xs mb-1">Min Amount</label>
                            <input
                              type="number"
                              step="0.000001"
                            value={config.min_amount}
                              onChange={(e) => updateCurrencySetting(currency, 'min_amount', parseFloat(e.target.value))}
                            placeholder="0.001"
                            className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                          </div>
                          <div>
                          <label className="block text-white text-xs mb-1">Max Amount</label>
                            <input
                              type="number"
                              step="0.000001"
                            value={config.max_amount}
                              onChange={(e) => updateCurrencySetting(currency, 'max_amount', parseFloat(e.target.value))}
                            placeholder="1.0"
                            className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                          </div>
                      </div>
                      
                          <div>
                        <label className="block text-white text-xs mb-1">Network Fee</label>
                            <input
                              type="number"
                              step="0.000001"
                          value={config.network_fee}
                              onChange={(e) => updateCurrencySetting(currency, 'network_fee', parseFloat(e.target.value))}
                          placeholder="0.0001"
                          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                          </div>
                      
                      {/* Save Button */}
                      <button
                        onClick={() => {
                          // Save functionality - could be enhanced later
                          console.log(`${currency} settings saved`);
                        }}
                        className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors"
                      >
                        💾 Save {currency} Settings
                      </button>
                    </div>
                  )}
                  
                  {/* Disabled State Message */}
                  {!config.enabled && (
                    <div className="text-center py-4">
                      <p className="text-gray-500 text-sm">
                        Enable {currency} to configure wallet settings
                      </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
            
            {/* Quick Actions */}
            <div className="mt-6 pt-4 border-t border-gray-600">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    Object.keys(settings.walletSettings.currencies).forEach(currency => {
                      updateCurrencySetting(currency, 'enabled', true);
                    });
                    console.log('All cryptocurrencies enabled');
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                >
                  ✅ Enable All
                </button>
                <button
                  onClick={() => {
                    Object.keys(settings.walletSettings.currencies).forEach(currency => {
                      updateCurrencySetting(currency, 'enabled', false);
                    });
                    console.log('All cryptocurrencies disabled');
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                >
                  ❌ Disable All
                </button>
                <button
                  onClick={() => {
                    // Reset to default values
                    Object.keys(settings.walletSettings.currencies).forEach(currency => {
                      updateCurrencySetting(currency, 'min_amount', 0.001);
                      updateCurrencySetting(currency, 'max_amount', 1.0);
                      updateCurrencySetting(currency, 'network_fee', 0.0001);
                    });
                    console.log('Reset to default values');
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                >
                  🔄 Reset Defaults
                </button>
              </div>
            </div>
          </div>

            {/* Manual Payment Settings */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">📝 Manual Payment Settings</h3>
                  <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white font-medium">Enable Manual Payments</label>
                  <p className="text-gray-400 text-sm">Allow users to pay manually to wallet addresses</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.walletSettings.manual_settings.enabled}
                    onChange={(e) => updateManualSetting('enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {settings.walletSettings.manual_settings.enabled && (
                <>
                    <div>
                      <label className="block text-white font-medium mb-2">Payment Instructions</label>
                      <textarea
                      value={settings.walletSettings.manual_settings.instructions}
                        onChange={(e) => updateManualSetting('instructions', e.target.value)}
                      placeholder="Enter payment instructions for users"
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      />
                    </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-white font-medium">Require Admin Confirmation</label>
                      <p className="text-gray-400 text-sm">Manually confirm payments before crediting accounts</p>
                    </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                        checked={settings.walletSettings.manual_settings.confirmation_required}
                            onChange={(e) => updateManualSetting('confirmation_required', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div>
                    <label className="block text-white font-medium mb-2">Auto-confirm After Blocks</label>
                        <input
                          type="number"
                      min="1"
                      max="100"
                      value={settings.walletSettings.manual_settings.auto_confirm_after_blocks}
                          onChange={(e) => updateManualSetting('auto_confirm_after_blocks', parseInt(e.target.value))}
                      className="w-32 px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    <p className="text-gray-400 text-sm mt-1">Number of blockchain confirmations before auto-confirming</p>
                      </div>
                </>
              )}
            </div>
          </div>
          
          {/* Save Button for Wallet Settings */}
          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Save Wallet Settings</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'finance-apis' && (
        <div className="space-y-6">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg p-6 border border-blue-500/30">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">🔌</div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Finance APIs Configuration</h3>
                <p className="text-blue-200 text-sm">Configure and manage all financial service integrations and API connections</p>
              </div>
            </div>
          </div>

          {/* BIN API Checkers */}
          <div className="bg-gray-700 rounded-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center space-x-3 mb-6">
              <div className="text-2xl">🔍</div>
              <div>
                <h3 className="text-xl font-semibold text-white">BIN API Checkers</h3>
                <p className="text-gray-400 text-sm">Credit card BIN (Bank Identification Number) lookup services for card validation</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Zyla Labs */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-600 hover:border-blue-400 transition-all duration-200 hover:shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">🚀</div>
                    <div>
                      <label className="text-white font-medium text-lg">Zyla Labs</label>
                      <p className="text-gray-400 text-sm">Advanced BIN lookup service with detailed card information, issuer details, and fraud scoring</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Premium</span>
                        <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">High Accuracy</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.financeApis.binApiCheckers.zyla.enabled}
                      onChange={(e) => updateFinanceApiSetting('binApiCheckers', 'zyla', 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span className="text-xs text-gray-400">Toggle to enable</span>
                </div>
                {settings.financeApis.binApiCheckers.zyla.enabled && (
                  <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                    <label className="block text-white font-medium mb-2 text-sm">🔑 API Key</label>
                    <input
                      type="password"
                      value={settings.financeApis.binApiCheckers.zyla.apiKey}
                      onChange={(e) => updateFinanceApiSetting('binApiCheckers', 'zyla', 'apiKey', e.target.value)}
                      placeholder="Enter Zyla Labs API key"
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-1">Get your API key from <a href="https://zylalabs.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">zylalabs.com</a></p>
                  </div>
                )}
              </div>

              {/* BinList */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-600 hover:border-green-400 transition-all duration-200 hover:shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">🆓</div>
                    <div>
                      <label className="text-white font-medium text-lg">BinList</label>
                      <p className="text-gray-400 text-sm">Free BIN lookup service with basic card information (no API key required)</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Free</span>
                        <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">Basic Info</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.financeApis.binApiCheckers.binlist.enabled}
                      onChange={(e) => updateFinanceApiSetting('binApiCheckers', 'binlist', 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span className="text-xs text-gray-400">Toggle to enable</span>
                </div>
                {settings.financeApis.binApiCheckers.binlist.enabled && (
                  <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                    <label className="block text-white font-medium mb-2 text-sm">🔑 API Key (Optional)</label>
                    <input
                      type="password"
                      value={settings.financeApis.binApiCheckers.binlist.apiKey}
                      onChange={(e) => updateFinanceApiSetting('binApiCheckers', 'binlist', 'apiKey', e.target.value)}
                      placeholder="Enter BinList API key (optional)"
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-1">Optional: Add API key for higher rate limits</p>
                  </div>
                )}
              </div>

              {/* API Ninjas */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-600 hover:border-purple-400 transition-all duration-200 hover:shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">⚡</div>
                    <div>
                      <label className="text-white font-medium text-lg">API Ninjas</label>
                      <p className="text-gray-400 text-sm">Fast and reliable BIN lookup service with comprehensive card data</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">Fast</span>
                        <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Reliable</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.financeApis.binApiCheckers.apiNinjas.enabled}
                      onChange={(e) => updateFinanceApiSetting('binApiCheckers', 'apiNinjas', 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span className="text-xs text-gray-400">Toggle to enable</span>
                </div>
                {settings.financeApis.binApiCheckers.apiNinjas.enabled && (
                  <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                    <label className="block text-white font-medium mb-2 text-sm">🔑 API Key</label>
                    <input
                      type="password"
                      value={settings.financeApis.binApiCheckers.apiNinjas.apiKey}
                      onChange={(e) => updateFinanceApiSetting('binApiCheckers', 'apiNinjas', 'apiKey', e.target.value)}
                      placeholder="Enter API Ninjas API key"
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-1">Get your API key from <a href="https://api-ninjas.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">api-ninjas.com</a></p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Routing API Checkers */}
          <div className="bg-gray-700 rounded-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center space-x-3 mb-6">
              <div className="text-2xl">🏦</div>
              <div>
                <h3 className="text-xl font-semibold text-white">Routing API Checkers</h3>
                <p className="text-gray-400 text-sm">Bank routing number validation and bank information lookup services</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* APIVerve */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-600 hover:border-green-400 transition-all duration-200 hover:shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">🏛️</div>
                    <div>
                      <label className="text-white font-medium text-lg">APIVerve Routing</label>
                      <p className="text-gray-400 text-sm">Verify US bank routing numbers and get comprehensive bank information</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">US Banks</span>
                        <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Detailed Info</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.financeApis.routingApiCheckers.apiVerve.enabled}
                      onChange={(e) => updateFinanceApiSetting('routingApiCheckers', 'apiVerve', 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span className="text-xs text-gray-400">Toggle to enable</span>
                </div>
                {settings.financeApis.routingApiCheckers.apiVerve.enabled && (
                  <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                    <label className="block text-white font-medium mb-2 text-sm">🔑 API Key</label>
                    <input
                      type="password"
                      value={settings.financeApis.routingApiCheckers.apiVerve.apiKey}
                      onChange={(e) => updateFinanceApiSetting('routingApiCheckers', 'apiVerve', 'apiKey', e.target.value)}
                      placeholder="Enter APIVerve API key"
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-1">Get your API key from <a href="https://apiverve.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">apiverve.com</a></p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card Checking APIs */}
          <div className="bg-gray-700 rounded-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center space-x-3 mb-6">
              <div className="text-2xl">💳</div>
              <div>
                <h3 className="text-xl font-semibold text-white">Card Checking APIs</h3>
                <p className="text-gray-400 text-sm">Payment processing and card verification services for secure transactions</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Plaid */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-600 hover:border-purple-400 transition-all duration-200 hover:shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">🔗</div>
                    <div>
                      <label className="text-white font-medium text-lg">Plaid</label>
                      <p className="text-gray-400 text-sm">Connect bank accounts and verify financial data with industry-leading security</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">Banking</span>
                        <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Secure</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.financeApis.cardCheckingApis.plaid.enabled}
                      onChange={(e) => updateFinanceApiSetting('cardCheckingApis', 'plaid', 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span className="text-xs text-gray-400">Toggle to enable</span>
                </div>
                {settings.financeApis.cardCheckingApis.plaid.enabled && (
                  <div className="bg-gray-700 rounded-lg p-3 border border-gray-600 space-y-3">
                    <div>
                      <label className="block text-white font-medium mb-2 text-sm">🆔 Client ID</label>
                      <input
                        type="password"
                        value={settings.financeApis.cardCheckingApis.plaid.clientId}
                        onChange={(e) => updateFinanceApiSetting('cardCheckingApis', 'plaid', 'clientId', e.target.value)}
                        placeholder="Enter Plaid Client ID"
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2 text-sm">🔐 Secret</label>
                      <input
                        type="password"
                        value={settings.financeApis.cardCheckingApis.plaid.secret}
                        onChange={(e) => updateFinanceApiSetting('cardCheckingApis', 'plaid', 'secret', e.target.value)}
                        placeholder="Enter Plaid Secret"
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-400">Get your credentials from <a href="https://plaid.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">plaid.com</a></p>
                  </div>
                )}
              </div>

              {/* Stripe */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-600 hover:border-purple-400 transition-all duration-200 hover:shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">💸</div>
                    <div>
                      <label className="text-white font-medium text-lg">Stripe</label>
                      <p className="text-gray-400 text-sm">Process payments and verify card information with global payment infrastructure</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">Payments</span>
                        <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Global</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.financeApis.cardCheckingApis.stripe.enabled}
                      onChange={(e) => updateFinanceApiSetting('cardCheckingApis', 'stripe', 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span className="text-xs text-gray-400">Toggle to enable</span>
                </div>
                {settings.financeApis.cardCheckingApis.stripe.enabled && (
                  <div className="bg-gray-700 rounded-lg p-3 border border-gray-600 space-y-3">
                    <div>
                      <label className="block text-white font-medium mb-2 text-sm">🔑 Publishable Key</label>
                      <input
                        type="password"
                        value={settings.financeApis.cardCheckingApis.stripe.publishableKey}
                        onChange={(e) => updateFinanceApiSetting('cardCheckingApis', 'stripe', 'publishableKey', e.target.value)}
                        placeholder="Enter Stripe Publishable Key"
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2 text-sm">🔐 Secret Key</label>
                      <input
                        type="password"
                        value={settings.financeApis.cardCheckingApis.stripe.secretKey}
                        onChange={(e) => updateFinanceApiSetting('cardCheckingApis', 'stripe', 'secretKey', e.target.value)}
                        placeholder="Enter Stripe Secret Key"
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-400">Get your keys from <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">stripe.com</a></p>
                  </div>
                )}
              </div>

              {/* PayPal */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-600 hover:border-purple-400 transition-all duration-200 hover:shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">📱</div>
                    <div>
                      <label className="text-white font-medium text-lg">PayPal</label>
                      <p className="text-gray-400 text-sm">Process PayPal payments and verify accounts with trusted payment platform</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">PayPal</span>
                        <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Trusted</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.financeApis.cardCheckingApis.paypal.enabled}
                      onChange={(e) => updateFinanceApiSetting('cardCheckingApis', 'paypal', 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span className="text-xs text-gray-400">Toggle to enable</span>
                </div>
                {settings.financeApis.cardCheckingApis.paypal.enabled && (
                  <div className="bg-gray-700 rounded-lg p-3 border border-gray-600 space-y-3">
                    <div>
                      <label className="block text-white font-medium mb-2 text-sm">🆔 Client ID</label>
                      <input
                        type="password"
                        value={settings.financeApis.cardCheckingApis.paypal.clientId}
                        onChange={(e) => updateFinanceApiSetting('cardCheckingApis', 'paypal', 'clientId', e.target.value)}
                        placeholder="Enter PayPal Client ID"
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2 text-sm">🔐 Secret</label>
                      <input
                        type="password"
                        value={settings.financeApis.cardCheckingApis.paypal.secret}
                        onChange={(e) => updateFinanceApiSetting('cardCheckingApis', 'paypal', 'secret', e.target.value)}
                        placeholder="Enter PayPal Secret"
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-400">Get your credentials from <a href="https://developer.paypal.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">developer.paypal.com</a></p>
                  </div>
                )}
              </div>

              {/* Braintree */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-600 hover:border-purple-400 transition-all duration-200 hover:shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">🧠</div>
                    <div>
                      <label className="text-white font-medium text-lg">Braintree</label>
                      <p className="text-gray-400 text-sm">Process payments and verify card information with flexible payment solutions</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">Flexible</span>
                        <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Multi-Platform</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.financeApis.cardCheckingApis.braintree.enabled}
                      onChange={(e) => updateFinanceApiSetting('cardCheckingApis', 'braintree', 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span className="text-xs text-gray-400">Toggle to enable</span>
                </div>
                {settings.financeApis.cardCheckingApis.braintree.enabled && (
                  <div className="bg-gray-700 rounded-lg p-3 border border-gray-600 space-y-3">
                    <div>
                      <label className="block text-white font-medium mb-2 text-sm">🏪 Merchant ID</label>
                      <input
                        type="password"
                        value={settings.financeApis.cardCheckingApis.braintree.merchantId}
                        onChange={(e) => updateFinanceApiSetting('cardCheckingApis', 'braintree', 'merchantId', e.target.value)}
                        placeholder="Enter Braintree Merchant ID"
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2 text-sm">🔑 Public Key</label>
                      <input
                        type="password"
                        value={settings.financeApis.cardCheckingApis.braintree.publicKey}
                        onChange={(e) => updateFinanceApiSetting('cardCheckingApis', 'braintree', 'publicKey', e.target.value)}
                        placeholder="Enter Braintree Public Key"
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2 text-sm">🔐 Private Key</label>
                      <input
                        type="password"
                        value={settings.financeApis.cardCheckingApis.braintree.privateKey}
                        onChange={(e) => updateFinanceApiSetting('cardCheckingApis', 'braintree', 'privateKey', e.target.value)}
                        placeholder="Enter Braintree Private Key"
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-400">Get your credentials from <a href="https://braintreepayments.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">braintreepayments.com</a></p>
                  </div>
                )}
              </div>

              {/* WooCommerce */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-600 hover:border-purple-400 transition-all duration-200 hover:shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">🛒</div>
                    <div>
                      <label className="text-white font-medium text-lg">WooCommerce</label>
                      <p className="text-gray-400 text-sm">Integrate with WooCommerce stores for seamless payment processing</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">E-commerce</span>
                        <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">WordPress</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.financeApis.cardCheckingApis.wooCommerce.enabled}
                      onChange={(e) => updateFinanceApiSetting('cardCheckingApis', 'wooCommerce', 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span className="text-xs text-gray-400">Toggle to enable</span>
                </div>
                {settings.financeApis.cardCheckingApis.wooCommerce.enabled && (
                  <div className="bg-gray-700 rounded-lg p-3 border border-gray-600 space-y-3">
                    <div>
                      <label className="block text-white font-medium mb-2 text-sm">🔑 Consumer Key</label>
                      <input
                        type="password"
                        value={settings.financeApis.cardCheckingApis.wooCommerce.consumerKey}
                        onChange={(e) => updateFinanceApiSetting('cardCheckingApis', 'wooCommerce', 'consumerKey', e.target.value)}
                        placeholder="Enter WooCommerce Consumer Key"
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-medium mb-2 text-sm">🔐 Consumer Secret</label>
                      <input
                        type="password"
                        value={settings.financeApis.cardCheckingApis.wooCommerce.consumerSecret}
                        onChange={(e) => updateFinanceApiSetting('cardCheckingApis', 'wooCommerce', 'consumerSecret', e.target.value)}
                        placeholder="Enter WooCommerce Consumer Secret"
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-400">Get your keys from your WooCommerce store's Advanced &gt; REST API settings</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-700 rounded-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center space-x-3 mb-6">
              <div className="text-2xl">⚡</div>
              <div>
                <h3 className="text-xl font-semibold text-white">Quick Actions</h3>
                <p className="text-gray-400 text-sm">Quickly configure common API settings and presets</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <button
                onClick={() => {
                  // Enable first BIN API checker (only one can be active)
                  const firstProvider = Object.keys(settings.financeApis.binApiCheckers)[0];
                  updateFinanceApiSetting('binApiCheckers', firstProvider, 'enabled', true);
                  console.log(`Enabled ${firstProvider} BIN API checker`);
                }}
                className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <span>✅</span>
                <span>Enable First BIN API</span>
              </button>
              <button
                onClick={() => {
                  // Disable all BIN API checkers
                  Object.keys(settings.financeApis.binApiCheckers).forEach(provider => {
                    updateFinanceApiSetting('binApiCheckers', provider, 'enabled', false);
                  });
                  console.log('All BIN API checkers disabled');
                }}
                className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <span>❌</span>
                <span>Disable All BIN APIs</span>
              </button>
              <button
                onClick={() => {
                  // Enable first card checking API (only one can be active)
                  const firstProvider = Object.keys(settings.financeApis.cardCheckingApis)[0];
                  updateFinanceApiSetting('cardCheckingApis', firstProvider, 'enabled', true);
                  console.log(`Enabled ${firstProvider} card checking API`);
                }}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <span>💳</span>
                <span>Enable First Card API</span>
              </button>
              <button
                onClick={() => {
                  // Disable all card checking APIs
                  Object.keys(settings.financeApis.cardCheckingApis).forEach(provider => {
                    updateFinanceApiSetting('cardCheckingApis', provider, 'enabled', false);
                  });
                  console.log('All card checking APIs disabled');
                }}
                className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <span>❌</span>
                <span>Disable All Card APIs</span>
              </button>
              <button
                onClick={() => {
                  // Enable first routing API checker (only one can be active)
                  const firstProvider = Object.keys(settings.financeApis.routingApiCheckers)[0];
                  updateFinanceApiSetting('routingApiCheckers', firstProvider, 'enabled', true);
                  console.log(`Enabled ${firstProvider} routing API checker`);
                }}
                className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <span>🏦</span>
                <span>Enable First Routing API</span>
              </button>
              <button
                onClick={() => {
                  // Test all enabled APIs
                  console.log('Testing all enabled APIs...');
                }}
                className="px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <span>🧪</span>
                <span>Test All APIs</span>
              </button>
            </div>
          </div>
          
          {/* Save Button for Finance APIs */}
          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-3 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Saving Finance API Settings...</span>
                </>
              ) : (
                <>
                  <span className="text-lg">💾</span>
                  <span>Save Finance API Settings</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Data Management Component
const DataManagement = () => {
  const [activeDataTab, setActiveDataTab] = useState('credit-cards');
  const [creditCards, setCreditCards] = useState([]);
  const [cookies, setCookies] = useState([]);
  const [inboxRequests, setInboxRequests] = useState([]);
  const [financeDocs, setFinanceDocs] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Fetch finance documents
  const fetchFinanceDocs = async () => {
    try {
      const response = await api.get('/api/finance-documents');
      if (response.data.success) {
        setFinanceDocs(response.data.financeDocuments);
      }
    } catch (error) {
      console.error('Error fetching finance documents:', error);
    }
  };

  // Load finance documents on component mount
  useEffect(() => {
    fetchFinanceDocs();
  }, []);

  const dataTabs = [
    { id: 'credit-cards', label: 'Credit Cards', icon: '💳' },
    { id: 'cookies', label: 'Cookies', icon: '🍪' },
    { id: 'inbox-requests', label: 'Inbox Requests', icon: '📥' },
    { id: 'finance-docs', label: 'Finance Documents', icon: '📄' },
    { id: 'configs', label: 'Configs/Checkers', icon: '⚙️' }
  ];

  const showToastNotification = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  const renderDataTabContent = () => {
    switch (activeDataTab) {
      case 'credit-cards':
        return <CreditCardManagement 
          creditCards={creditCards} 
          setCreditCards={setCreditCards}
          showToast={showToastNotification}
        />;
      case 'cookies':
        return <CookieManagement 
          cookies={cookies} 
          setCookies={setCookies}
          showToast={showToastNotification}
        />;
      case 'inbox-requests':
        return <InboxRequestManagement 
          inboxRequests={inboxRequests} 
          setInboxRequests={setInboxRequests}
          showToast={showToastNotification}
        />;
      case 'finance-docs':
        return <FinanceDocManagement 
          financeDocs={financeDocs} 
          setFinanceDocs={setFinanceDocs}
          showToast={showToastNotification}
        />;
      case 'configs':
        return <ConfigManagement 
          configs={configs} 
          setConfigs={setConfigs}
          showToast={showToastNotification}
        />;
      default:
        return <CreditCardManagement 
          creditCards={creditCards} 
          setCreditCards={setCreditCards}
          showToast={showToastNotification}
        />;
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">🗃️ Data/Stock Management</h2>
      
      {/* Data Type Tabs */}
      <div className="bg-gray-700 rounded-lg p-1 mb-6">
        <div className="flex space-x-1">
          {dataTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveDataTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                activeDataTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-600'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Data Tab Content */}
      <div className="bg-gray-700 rounded-lg p-6">
        {renderDataTabContent()}
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          toastType === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            <span>{toastType === 'success' ? '✅' : '❌'}</span>
            <span>{toastMessage}</span>
            <button 
              onClick={() => setShowToast(false)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Credit Card Management Component
const CreditCardManagement = ({ creditCards, setCreditCards, showToast }) => {
  const [uploadMethod, setUploadMethod] = useState('file'); // 'file' or 'paste'
  const [delimiter, setDelimiter] = useState('|');
  const [fileContent, setFileContent] = useState('');
  const [pastedContent, setPastedContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pricePerCard, setPricePerCard] = useState(5.00);
  const [bulkPrice, setBulkPrice] = useState(false);
  const [detectedFormat, setDetectedFormat] = useState(null);
  const [customFormat, setCustomFormat] = useState([]);
  const [showFormatEditor, setShowFormatEditor] = useState(false);

  // Fetch credit cards from database
  const fetchCreditCards = async () => {
    try {
      const response = await api.get('/api/credit-cards/list');
      if (response.data.success) {
        setCreditCards(response.data.cards || []);
      }
    } catch (error) {
      console.error('Error fetching credit cards:', error);
      showToast('Failed to fetch credit cards from database', 'error');
    }
  };

  // Load credit cards on component mount
  useEffect(() => {
    fetchCreditCards();
  }, []);

  const delimiters = [
    { value: '|', label: 'Pipe (|)' },
    { value: ',', label: 'Comma (,)' },
    { value: ':', label: 'Colon (:)' },
    { value: ';', label: 'Semicolon (;)' }
  ];

  // Standard field definitions
  const fieldDefinitions = {
    'CC': { label: 'Card Number', required: true, type: 'card_number' },
    'MM': { label: 'Expiry Month', required: true, type: 'month' },
    'YY': { label: 'Expiry Year', required: true, type: 'year' },
    'CVV': { label: 'CVV', required: false, type: 'cvv' },
    'FIRST_NAME': { label: 'First Name', required: false, type: 'first_name' },
    'LAST_NAME': { label: 'Last Name', required: false, type: 'last_name' },
    'STREET': { label: 'Street Address', required: false, type: 'street' },
    'CITY': { label: 'City', required: false, type: 'city' },
    'STATE': { label: 'State', required: false, type: 'state' },
    'ZIP': { label: 'ZIP Code', required: false, type: 'zip' },
    'DOB': { label: 'Date of Birth', required: false, type: 'dob' },
    'SSN': { label: 'Social Security Number', required: false, type: 'ssn' },
    'EMAIL': { label: 'Email', required: false, type: 'email' },
    'EMAIL_PASS': { label: 'Email Password', required: false, type: 'email_pass' },
    'PHONE': { label: 'Phone Number', required: false, type: 'phone' },
    'FINGERPRINT': { label: 'Fingerprint', required: false, type: 'fingerprint' },
    'BALANCE': { label: 'Balance', required: false, type: 'balance' },
    'PRICE': { label: 'Price', required: false, type: 'price' }
  };

  // Auto-detect format from data
  const detectFormat = (content, delimiter) => {
    if (!content.trim()) return null;
    
    const lines = content.trim().split('\n').filter(line => line.trim());
    if (lines.length === 0) return null;
    
    // Analyze first few lines to detect pattern
    const sampleLines = lines.slice(0, Math.min(3, lines.length));
    const fieldCounts = sampleLines.map(line => line.split(delimiter).length);
    
    // Check if all lines have same field count
    const consistentFieldCount = fieldCounts.every(count => count === fieldCounts[0]);
    if (!consistentFieldCount) return null;
    
    const fieldCount = fieldCounts[0];
    const firstLine = lines[0];
    const fields = firstLine.split(delimiter);
    
    // Try to identify fields based on content patterns
    const detectedFields = fields.map((field, index) => {
      const cleanField = field.trim().toUpperCase();
      
      // Try to match with known patterns
      if (/^\d{14,17}$/.test(cleanField.replace(/\s+/g, ''))) {
        return { index, field: 'CC', confidence: 'high' };
      }
      if (/^\d{1,2}$/.test(cleanField) && parseInt(cleanField) >= 1 && parseInt(cleanField) <= 12) {
        return { index, field: 'MM', confidence: 'high' };
      }
      if (/^\d{2}$/.test(cleanField) && parseInt(cleanField) >= 20 && parseInt(cleanField) <= 99) {
        return { index, field: 'YY', confidence: 'high' };
      }
      if (/^\d{3,4}$/.test(cleanField)) {
        return { index, field: 'CVV', confidence: 'medium' };
      }
      if (/^\d+\.?\d*$/.test(cleanField) && parseFloat(cleanField) > 0) {
        return { index, field: 'BALANCE', confidence: 'medium' };
      }
      if (/^[A-Z\s]+$/i.test(cleanField) && cleanField.length > 1) {
        if (index === 4) return { index, field: 'FIRST_NAME', confidence: 'medium' };
        if (index === 5) return { index, field: 'LAST_NAME', confidence: 'medium' };
        if (index === 6) return { index, field: 'STREET', confidence: 'medium' };
        if (index === 7) return { index, field: 'CITY', confidence: 'medium' };
        if (index === 8) return { index, field: 'STATE', confidence: 'medium' };
      }
      if (/^\d{5}(-\d{4})?$/.test(cleanField)) {
        return { index, field: 'ZIP', confidence: 'medium' };
      }
      if (/^\d{3}-\d{2}-\d{4}$/.test(cleanField)) {
        return { index, field: 'SSN', confidence: 'high' };
      }
      if (/^[^\s@]+@[^\s\s@]+\.[^\s@]+$/.test(cleanField)) {
        return { index, field: 'EMAIL', confidence: 'high' };
      }
      if (/^\d{10,11}$/.test(cleanField.replace(/[^\d]/g, ''))) {
        return { index, field: 'PHONE', confidence: 'medium' };
      }
      
      // Default to unknown field
      return { index, field: `FIELD_${index + 1}`, confidence: 'low' };
    });
    
    return {
      fieldCount,
      fields: detectedFields,
      sampleData: sampleLines,
      delimiter
    };
  };

  // Update format detection when content or delimiter changes
  useEffect(() => {
    const content = uploadMethod === 'file' ? fileContent : pastedContent;
    if (content.trim()) {
      const detected = detectFormat(content, delimiter);
      setDetectedFormat(detected);
      if (detected) {
        setCustomFormat(detected.fields.map(f => f.field));
      }
    } else {
      setDetectedFormat(null);
      setCustomFormat([]);
    }
  }, [fileContent, pastedContent, delimiter, uploadMethod]);

  const validateCardNumber = (cardNumber) => {
    // Remove spaces and dashes
    const cleanNumber = cardNumber.replace(/\s+/g, '').replace(/-/g, '');
    // Check if it's 14-17 digits
    return /^\d{14,17}$/.test(cleanNumber);
  };

  const validateExpiry = (month, year) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100; // Get last 2 digits
    const currentMonth = currentDate.getMonth() + 1; // January is 0
    
    const expMonth = parseInt(month);
    const expYear = parseInt(year);
    
    if (expYear < currentYear) return false;
    if (expYear === currentYear && expMonth < currentMonth) return false;
    if (expMonth < 1 || expMonth > 12) return false;
    
    return true;
  };

  const processCreditCards = async () => {
    setIsProcessing(true);
    
    try {
      const content = uploadMethod === 'file' ? fileContent : pastedContent;
      if (!content.trim()) {
        showToast('Please provide credit card data', 'error');
        return;
      }

      const lines = content.trim().split('\n').filter(line => line.trim());
      const processedCards = [];
      const expiredCards = [];
      const invalidCards = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const fields = line.split(delimiter);
        
        // Use custom format if available, otherwise use detected format
        const formatToUse = customFormat.length > 0 ? customFormat : 
                           (detectedFormat ? detectedFormat.fields.map(f => f.field) : []);
        
        if (formatToUse.length === 0) {
          // Fallback to basic processing
        if (fields.length < 4) {
          invalidCards.push({ line: i + 1, reason: 'Insufficient fields - need CC, MM, YY, PRICE' });
          continue;
        }

        const [cc, mm, yy, filePrice] = fields;

        // Validate card number
        if (!validateCardNumber(cc)) {
          invalidCards.push({ line: i + 1, reason: 'Invalid card number format' });
          continue;
        }

        // Validate expiry
        if (!validateExpiry(mm, yy)) {
          expiredCards.push({ line: i + 1, reason: 'Card expired' });
          continue;
        }

          // Create card object for API
        const card = {
          cardNumber: cc,
          month: mm,
          year: yy,
          price: bulkPrice ? pricePerCard : parseFloat(filePrice) || pricePerCard
        };

        processedCards.push(card);
        } else {
          // Use custom format
          const cardData = {};
          let hasRequiredFields = true;
          
          formatToUse.forEach((fieldType, index) => {
            if (index < fields.length) {
              cardData[fieldType] = fields[index].trim();
            }
          });
          
          // Check required fields
          if (!cardData.CC || !cardData.MM || !cardData.YY) {
            invalidCards.push({ line: i + 1, reason: 'Missing required fields: CC, MM, YY' });
            hasRequiredFields = false;
          }
          
          if (hasRequiredFields) {
            // Validate card number
            if (!validateCardNumber(cardData.CC)) {
              invalidCards.push({ line: i + 1, reason: 'Invalid card number format' });
              continue;
            }

            // Validate expiry
            if (!validateExpiry(cardData.MM, cardData.YY)) {
              expiredCards.push({ line: i + 1, reason: 'Card expired' });
              continue;
            }

            // Create enhanced card object
            const card = {
              cardNumber: cardData.CC,
              month: cardData.MM,
              year: cardData.YY,
              cvv: cardData.CVV || '',
              firstName: cardData.FIRST_NAME || '',
              lastName: cardData.LAST_NAME || '',
              street: cardData.STREET || '',
              city: cardData.CITY || '',
              state: cardData.STATE || '',
              zip: cardData.ZIP || '',
              dob: cardData.DOB || '',
              ssn: cardData.SSN || '',
              email: cardData.EMAIL || '',
              emailPass: cardData.EMAIL_PASS || '',
              phone: cardData.PHONE || '',
              fingerprint: cardData.FINGERPRINT || '',
              balance: cardData.BALANCE || '',
              price: bulkPrice ? pricePerCard : (parseFloat(cardData.PRICE || cardData.BALANCE) || pricePerCard)
            };

            processedCards.push(card);
          }
        }
      }

      // Show notifications for expired/invalid cards
      if (expiredCards.length > 0) {
        showToast(`${expiredCards.length} expired cards were removed`, 'error');
      }
      if (invalidCards.length > 0) {
        showToast(`${invalidCards.length} invalid cards were removed`, 'error');
      }

      // Save valid cards to database
      if (processedCards.length > 0) {
        try {
          const response = await api.post('/api/credit-cards/import', {
            cards: processedCards,
            delimiter: delimiter
          });

          if (response.data.success) {
            const { imported, duplicates } = response.data.data;
            const summary = response.data.summary;
            
            // Update local state with imported cards
            setCreditCards(prev => [...prev, ...imported]);
            
            // Show success message
            showToast(`Successfully imported ${summary.valid} credit cards`, 'success');
            
            // Show duplicate warning if any
            if (summary.duplicates > 0) {
              showToast(`${summary.duplicates} duplicate cards were skipped`, 'warning');
            }
            
            // Clear inputs
            setFileContent('');
            setPastedContent('');
            setDetectedFormat(null);
            setCustomFormat([]);
            
            // Refresh the credit cards list from database
            fetchCreditCards();
          } else {
            showToast('Failed to import credit cards', 'error');
          }
        } catch (apiError) {
          console.error('API Error:', apiError);
          if (apiError.response?.data?.error) {
            showToast(`Import failed: ${apiError.response.data.error}`, 'error');
          } else {
            showToast('Failed to save credit cards to database', 'error');
          }
        }
      } else {
        showToast('No valid credit cards found', 'error');
      }

    } catch (error) {
      console.error('Error processing credit cards:', error);
      showToast('Error processing credit cards', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Import from CC_data.txt file
  const importFromCCDataFile = async () => {
    try {
      setIsProcessing(true);
      showToast('Importing from CC_data.txt...', 'info');
      
      // Fetch the CC_data.txt file content
      const response = await fetch('/Log%20Examples/cc_data.txt');
      if (!response.ok) {
        throw new Error('Failed to fetch CC_data.txt');
      }
      
      const content = await response.text();
      const lines = content.trim().split('\n').filter(line => line.trim());
      
      let processedCards = [];
      let expiredCards = [];
      let invalidCards = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const fields = line.split('|');
        
        // Check if we have at least the basic required fields
        if (fields.length < 4) {
          invalidCards.push({ line: i + 1, reason: 'Insufficient fields - need CC, MM, YY, PRICE' });
          continue;
        }

        const [cc, mm, yy, filePrice] = fields;

        // Validate card number
        if (!validateCardNumber(cc)) {
          invalidCards.push({ line: i + 1, reason: 'Invalid card number format' });
          continue;
        }

        // Validate expiry
        if (!validateExpiry(mm, yy)) {
          expiredCards.push({ line: i + 1, reason: 'Card expired' });
          continue;
        }

        // Use price from file or generate random price
        const finalPrice = filePrice ? parseFloat(filePrice) : (Math.random() * 45 + 5).toFixed(2);

        // Create card object for API (matching new schema)
        const card = {
          cardNumber: cc,
          month: mm,
          year: yy,
          price: finalPrice
        };

        processedCards.push(card);
      }

      // Show notifications for expired/invalid cards
      if (expiredCards.length > 0) {
        showToast(`${expiredCards.length} expired cards were removed`, 'error');
      }
      if (invalidCards.length > 0) {
        showToast(`${invalidCards.length} invalid cards were removed`, 'error');
      }

      // Save valid cards to database
      if (processedCards.length > 0) {
        try {
          const response = await api.post('/api/credit-cards/import', {
            cards: processedCards,
            delimiter: '|'
          });

          if (response.data.success) {
            const { imported, duplicates } = response.data.data;
            const summary = response.data.summary;
            
            // Update local state with imported cards
            setCreditCards(prev => [...prev, ...imported]);
            
            // Show success message
            showToast(`Successfully imported ${summary.valid} credit cards from CC_data.txt`, 'success');
            
            // Show duplicate warning if any
            if (summary.duplicates > 0) {
              showToast(`${summary.duplicates} duplicate cards were skipped`, 'warning');
            }
            
            // Show summary
            setTimeout(() => {
              showToast(`Import Summary: ${summary.valid} valid, ${summary.invalid} invalid, ${summary.expired} expired, ${summary.duplicates} duplicates`, 'info');
            }, 1000);
            
            // Refresh the credit cards list from database
            fetchCreditCards();
          } else {
            showToast('Failed to import credit cards from CC_data.txt', 'error');
          }
        } catch (apiError) {
          console.error('API Error:', apiError);
          if (apiError.response?.data?.error) {
            showToast(`Import failed: ${apiError.response.data.error}`, 'error');
          } else {
            showToast('Failed to save credit cards to database', 'error');
          }
        }
      } else {
        showToast('No valid credit cards found in CC_data.txt', 'error');
      }

    } catch (error) {
      console.error('Error importing from CC_data.txt:', error);
      showToast('Error importing from CC_data.txt', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFileContent(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  const removeCard = async (cardId) => {
    try {
      const response = await api.delete('/api/credit-cards/delete', {
        data: { id: cardId }
      });

      if (response.data.success) {
        setCreditCards(prev => prev.filter(card => card.id !== cardId));
        showToast('Credit card removed', 'success');
      } else {
        showToast('Failed to remove credit card', 'error');
      }
    } catch (error) {
      console.error('Error removing credit card:', error);
      showToast('Failed to remove credit card', 'error');
    }
  };

  const updateCardPrice = async (cardId, newPrice) => {
    try {
      const response = await api.put('/api/credit-cards/update-price', {
        id: cardId,
        updates: { price: parseFloat(newPrice) }
      });

      if (response.data.success) {
        setCreditCards(prev => prev.map(card => 
          card.id === cardId ? { ...card, price: parseFloat(newPrice) } : card
        ));
        showToast('Card price updated', 'success');
      } else {
        showToast('Failed to update card price', 'error');
      }
    } catch (error) {
      console.error('Error updating card price:', error);
      showToast('Failed to update card price', 'error');
    }
  };

  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-6">💳 Credit Card Management</h3>
      
      {/* Format Information */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h4 className="text-lg font-semibold text-white mb-4">📋 Expected Format</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h5 className="text-blue-400 font-medium mb-3">Standard Format (Auto-detected)</h5>
            <div className="bg-gray-900 p-4 rounded border border-gray-600">
              <div className="text-sm font-mono text-gray-300 space-y-1">
                <div><span className="text-green-400">CC</span>|MM|YY|CVV|FIRST_NAME|LAST_NAME|STREET|CITY|STATE|ZIP|DOB|SSN|EMAIL|EMAIL_PASS|PHONE|FINGERPRINT|BALANCE</div>
                <div className="text-xs text-gray-500 mt-2">
                  <span className="text-green-400">●</span> Required fields
                  <span className="text-yellow-400 ml-3">●</span> Optional fields
                </div>
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-2">
              The system will automatically detect your format and map fields intelligently.
            </p>
          </div>
          
          <div>
            <h5 className="text-blue-400 font-medium mb-3">Supported Delimiters</h5>
            <div className="space-y-2">
              {delimiters.map(del => (
                <div key={del.value} className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-300">{del.label}</span>
                  <code className="px-2 py-1 bg-gray-700 rounded text-xs text-blue-400">{del.value}</code>
                </div>
              ))}
            </div>
            
            <h5 className="text-blue-400 font-medium mb-3 mt-4">Field Types</h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(fieldDefinitions).slice(0, 8).map(([key, def]) => (
                <div key={key} className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${def.required ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <span className="text-gray-400">{def.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Upload Section */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h4 className="text-lg font-semibold text-white mb-4">Import Credit Cards</h4>
        
        {/* Upload Method Selection */}
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setUploadMethod('file')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              uploadMethod === 'file' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            📁 Upload File
          </button>
          <button
            onClick={() => setUploadMethod('paste')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              uploadMethod === 'paste' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            📋 Paste Content
          </button>
        </div>

        {/* Delimiter Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Delimiter
          </label>
          <select
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {delimiters.map(del => (
              <option key={del.value} value={del.value}>{del.label}</option>
            ))}
          </select>
        </div>

        {/* Format Detection */}
        {detectedFormat && (
          <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-blue-400 font-medium">🔍 Format Detected</h5>
              <button
                onClick={() => setShowFormatEditor(!showFormatEditor)}
                className="text-blue-400 hover:text-blue-300 text-sm underline"
              >
                {showFormatEditor ? 'Hide Editor' : 'Customize Format'}
              </button>
            </div>
            
            <div className="mb-3">
              <p className="text-blue-300 text-sm mb-2">
                Detected {detectedFormat.fieldCount} fields with {delimiter} delimiter
              </p>
              <div className="flex flex-wrap gap-2">
                {detectedFormat.fields.map((field, index) => (
                  <div
                    key={index}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      field.confidence === 'high' ? 'bg-green-600 text-white' :
                      field.confidence === 'medium' ? 'bg-yellow-600 text-white' :
                      'bg-gray-600 text-gray-300'
                    }`}
                    title={`Field ${index + 1}: ${field.field} (${field.confidence} confidence)`}
                  >
                    {field.field}
                  </div>
                ))}
              </div>
            </div>

            {/* Sample Data Preview */}
            <div className="mb-3">
              <p className="text-blue-300 text-sm mb-2">Sample Data:</p>
              <div className="bg-gray-800 p-3 rounded text-xs font-mono text-gray-300 overflow-x-auto">
                {detectedFormat.sampleData.map((line, lineIndex) => (
                  <div key={lineIndex} className="mb-1">
                    <span className="text-blue-400">Line {lineIndex + 1}:</span> {line}
                  </div>
                ))}
              </div>
            </div>

            {/* Format Editor */}
            {showFormatEditor && (
              <div className="mt-4 p-3 bg-gray-800 rounded border border-gray-600">
                <p className="text-blue-300 text-sm mb-3">Customize field mapping:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {detectedFormat.fields.map((field, index) => (
                    <div key={index} className="space-y-1">
                      <label className="block text-xs text-gray-400">Field {index + 1}</label>
                      <select
                        value={customFormat[index] || field.field}
                        onChange={(e) => {
                          const newFormat = [...customFormat];
                          newFormat[index] = e.target.value;
                          setCustomFormat(newFormat);
                        }}
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {Object.entries(fieldDefinitions).map(([key, def]) => (
                          <option key={key} value={key}>
                            {def.label} {def.required ? '(Required)' : ''}
                          </option>
                        ))}
                        <option value={`FIELD_${index + 1}`}>Unknown Field</option>
                      </select>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={() => setCustomFormat(detectedFormat.fields.map(f => f.field))}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                  >
                    Reset to Detected
                  </button>
                  <button
                    onClick={() => setCustomFormat([])}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded"
                  >
                    Clear Custom
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Price Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Price per Card ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={pricePerCard}
              onChange={(e) => setPricePerCard(parseFloat(e.target.value))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center">
            <label className="flex items-center space-x-2 text-gray-300">
              <input
                type="checkbox"
                checked={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.checked)}
                className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
              />
              <span>Use same price for all imported cards</span>
            </label>
          </div>
        </div>

        {/* File Upload */}
        {uploadMethod === 'file' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Upload Text File
            </label>
            <input
              type="file"
              accept=".txt,.csv"
              onChange={handleFileUpload}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {fileContent && (
              <div className="mt-2 p-3 bg-gray-700 rounded text-sm text-gray-300">
                <p>File loaded: {fileContent.split('\n').length} lines</p>
              </div>
            )}
          </div>
        )}

        {/* Paste Content */}
        {uploadMethod === 'paste' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Paste Credit Card Data
            </label>
            <textarea
              value={pastedContent}
              onChange={(e) => setPastedContent(e.target.value)}
              placeholder="Paste your credit card data here, one line per card..."
              rows={6}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
            />
          </div>
        )}

        {/* Expected Format Info */}
        <div className="mb-4 p-4 bg-blue-900 bg-opacity-20 border border-blue-700 rounded-lg">
          <h5 className="text-sm font-medium text-blue-300 mb-2">Expected Format:</h5>
          <p className="text-xs text-blue-200 font-mono">
            CC{delimiter}MM{delimiter}YY{delimiter}PRICE
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Note: Only CC (card number), MM (month), YY (year), and PRICE are required.
            Card type will be automatically detected, and card number will be hashed for security.
          </p>
        </div>

        {/* Import Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={processCreditCards}
            disabled={isProcessing || (!fileContent && !pastedContent)}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {isProcessing ? '🔄 Processing...' : '📥 Import Credit Cards'}
          </button>
          
          <button
            onClick={importFromCCDataFile}
            disabled={isProcessing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {isProcessing ? '🔄 Processing...' : '📁 Import from CC_data.txt'}
          </button>
        </div>
      </div>

      {/* Credit Cards List */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-4">
          Imported Credit Cards ({creditCards.length})
        </h4>
        
        {creditCards.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">💳</div>
            <p>No credit cards imported yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4">Card Number</th>
                  <th className="text-left py-3 px-4">Card Type</th>
                  <th className="text-left py-3 px-4">Expiry</th>
                  <th className="text-left py-3 px-4">Price</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Imported</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {creditCards.map((card) => (
                  <tr key={card.id} className="border-b border-gray-700 hover:bg-gray-700">
                    <td className="py-3 px-4">
                      <span className="font-mono text-blue-400">
                        {card.card_number ? card.card_number.replace(/(\d{4})/g, '$1 ').trim() : 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                        {card.card_type || 'Unknown'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono">
                        {card.expiry_month?.toString().padStart(2, '0')}/{card.expiry_year}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={card.price}
                        onChange={(e) => updateCardPrice(card.id, e.target.value)}
                        className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-white text-xs rounded ${
                        card.status === 'available' ? 'bg-green-600' : 
                        card.status === 'sold' ? 'bg-blue-600' : 
                        card.status === 'expired' ? 'bg-red-600' : 'bg-gray-600'
                      }`}>
                        {card.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-gray-400">
                        {card.imported_at ? new Date(card.imported_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => removeCard(card.id)}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        🗑️ Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Placeholder components for other data types
const CookieManagement = ({ cookies, setCookies, showToast }) => (
  <div>
    <h3 className="text-xl font-semibold text-white mb-6">🍪 Cookie Management</h3>
    <p className="text-gray-400">Cookie management functionality coming soon...</p>
  </div>
);

const InboxRequestManagement = ({ inboxRequests, setInboxRequests, showToast }) => (
  <div>
    <h3 className="text-xl font-semibold text-white mb-6">📥 Inbox Request Management</h3>
    <p className="text-gray-400">Inbox request management functionality coming soon...</p>
  </div>
);

const FinanceDocManagement = ({ financeDocs, setFinanceDocs, showToast }) => {
  const [bulkData, setBulkData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const handleBulkUpload = async () => {
    if (!bulkData.trim()) {
      showToast('Please enter data to upload', 'error');
      return;
    }

    const lines = bulkData.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      showToast('No valid data found', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/api/finance-documents/bulk-create', {
        data: lines
      });

      if (response.data.success) {
        showToast(response.data.message, 'success');
        setBulkData('');
        // Refresh the finance documents list
        fetchFinanceDocs();
      } else {
        showToast(response.data.error || 'Failed to upload documents', 'error');
      }
    } catch (error) {
      console.error('Error uploading finance documents:', error);
      const errorMessage = error.response?.data?.error || 'Failed to upload documents';
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await api.delete(`/api/finance-documents/${id}`);
      if (response.data.success) {
        showToast('Finance document deleted successfully', 'success');
        // Refresh the finance documents list
        fetchFinanceDocs();
      } else {
        showToast(response.data.error || 'Failed to delete document', 'error');
      }
    } catch (error) {
      console.error('Error deleting finance document:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete document';
      showToast(errorMessage, 'error');
    }
    setShowDeleteConfirm(false);
    setDeleteId(null);
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-6">📄 Finance Document Management</h3>
      
      {/* Bulk Upload Section */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h4 className="text-lg font-medium text-white mb-4">📤 Bulk Upload Finance Documents</h4>
        <p className="text-gray-400 mb-4">
          Paste finance document data in the format: AN|RN|ADDRESS|CITY|STATE|ZIP|BALANCE|DOWNLOAD_LINK
        </p>
        
        <div className="mb-4">
          <textarea
            value={bulkData}
            onChange={(e) => setBulkData(e.target.value)}
            placeholder="AN123456|RN789012|123 Main St|New York|NY|10001|5000.00|https://example.com/doc1.pdf"
            className="w-full h-32 bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 resize-none"
          />
        </div>
        
        <button
          onClick={handleBulkUpload}
          disabled={isLoading || !bulkData.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          {isLoading ? 'Uploading...' : 'Upload Documents'}
        </button>
      </div>

      {/* Finance Documents List */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h4 className="text-lg font-medium text-white mb-4">📋 Finance Documents ({financeDocs?.length || 0})</h4>
        
        {financeDocs && financeDocs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Account Number</th>
                  <th className="px-4 py-3">Reference Number</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3">ZIP</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Download Link</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {financeDocs.map((doc) => (
                  <tr key={doc.id} className="border-b border-gray-700 hover:bg-gray-700">
                    <td className="px-4 py-3">{doc.id}</td>
                    <td className="px-4 py-3 font-mono text-xs">{doc.account_number}</td>
                    <td className="px-4 py-3 font-mono">{doc.reference_number}</td>
                    <td className="px-4 py-3 max-w-xs truncate">{doc.address}</td>
                    <td className="px-4 py-3">{doc.city}</td>
                    <td className="px-4 py-3">{doc.state}</td>
                    <td className="px-4 py-3">{doc.zip_code}</td>
                    <td className="px-4 py-3">${doc.balance?.toFixed(2)}</td>
                    <td className="px-4 py-3 max-w-xs truncate">
                      <a href={doc.download_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                        {doc.download_link}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => confirmDelete(doc.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400">No finance documents found.</p>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-white mb-4">Confirm Delete</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete this finance document? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ConfigManagement = ({ configs, setConfigs, showToast }) => {
  const [uploadMode, setUploadMode] = useState('single'); // 'single' or 'bulk'
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [configForm, setConfigForm] = useState({
    name: '',
    description: '',
    price: '',
    cpm: 'Med',
    proxyType: 'Proxyless',
    proxySource: 'N/A',
    dataType: 'User:Pass',
    captureExample: '',
    screenshots: []
  });

  // CPM Options
  const cpmOptions = ['Low', 'Med', 'High', 'Elite'];
  
  // Proxy Type Options
  const proxyTypeOptions = ['Proxyless', 'HTTP', 'Socks4', 'Socks5'];
  
  // Proxy Source Options
  const proxySourceOptions = ['Private', 'Public', 'Residential', 'Static', 'N/A'];
  
  // Data Type Options
  const dataTypeOptions = ['User:Pass', 'Email:Pass', 'Login:Pass', 'Cookie Files', 'CC Combo'];

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;

    // Validate file types
    const allowedExtensions = ['.svb', '.loli', '.anom', '.lce', '.proj', '.xml'];
    const invalidFiles = files.filter(file => {
      const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      return !allowedExtensions.includes(extension);
    });

    if (invalidFiles.length > 0) {
      showToast(`Invalid file type(s): ${invalidFiles.map(f => f.name).join(', ')}`, 'error');
      return;
    }

    // Validate file sizes (50MB limit)
    const oversizedFiles = files.filter(file => file.size > 50 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      showToast(`File(s) too large: ${oversizedFiles.map(f => `${f.name} (${Math.round(f.size / 1024 / 1024)}MB)`).join(', ')}`, 'error');
      return;
    }

    try {
      setIsUploading(true);
      
      if (uploadMode === 'single') {
        // Single file upload - show config modal
        setSelectedFile(files[0]);
        setShowConfigModal(true);
      } else {
        // Bulk upload - process all files
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        
        // Here you would typically upload to your API
        // For now, we'll simulate the upload
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const uploadedFileData = files.map(file => ({
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.name.substring(file.name.lastIndexOf('.') + 1).toUpperCase(),
          uploadedAt: new Date().toISOString(),
          status: 'pending'
        }));
        
        setUploadedFiles(prev => [...prev, ...uploadedFileData]);
        showToast(`Successfully uploaded ${files.length} file(s)`, 'success');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showToast('Upload failed. Please try again.', 'error');
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) return;

    // Validate price
    if (!configForm.price || parseFloat(configForm.price) <= 0) {
      showToast('Please enter a valid price greater than 0', 'error');
      return;
    }

    try {
      // Here you would typically save the configuration to your API
      // For now, we'll simulate the save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const configData = {
        id: Date.now() + Math.random(),
        file: selectedFile,
        config: { ...configForm },
        createdAt: new Date().toISOString(),
        status: 'active'
      };
      
      setConfigs(prev => [...prev, configData]);
      setShowConfigModal(false);
      setSelectedFile(null);
      setConfigForm({
        name: '',
        description: '',
        price: '',
        cpm: 'Med',
        proxyType: 'Proxyless',
        proxySource: 'N/A',
        dataType: 'User:Pass',
        captureExample: '',
        screenshots: []
      });
      
      showToast('Configuration saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving configuration:', error);
      showToast('Failed to save configuration. Please try again.', 'error');
    }
  };

  const handleScreenshotUpload = (event) => {
    const files = Array.from(event.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      showToast('Please select valid image files', 'error');
      return;
    }

    // Convert images to base64 for preview (in production, you'd upload to a server)
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setConfigForm(prev => ({
          ...prev,
          screenshots: [...prev.screenshots, {
            name: file.name,
            data: e.target.result,
            size: file.size
          }]
        }));
      };
      reader.readAsDataURL(file);
    });
    
    showToast(`Added ${imageFiles.length} screenshot(s)`, 'success');
  };

  const removeScreenshot = (index) => {
    setConfigForm(prev => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== index)
    }));
  };

  const getFileTypeIcon = (fileName) => {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    const icons = {
      '.svb': '🔫', // Silverbullet
      '.loli': '🚀', // Openbullet
      '.anom': '🚀', // Openbullet
      '.lce': '🍪', // Cookiebullet
      '.proj': '🛠️', // BL Tools
      '.xml': '🤖'  // BAS
    };
    return icons[extension] || '📄';
  };

  const getFileTypeName = (fileName) => {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    const names = {
      '.svb': 'Silverbullet',
      '.loli': 'Openbullet',
      '.anom': 'Openbullet',
      '.lce': 'Cookiebullet',
      '.proj': 'BL Tools',
      '.xml': 'BAS'
    };
    return names[extension] || 'Unknown';
  };

  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-6">⚙️ Config/Checker Management</h3>
      
      {/* Upload Section */}
      <div className="bg-gray-700 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-lg font-medium text-white mb-2">📁 Upload Configuration Files</h4>
            <p className="text-gray-400 text-sm">Upload Silverbullet (.svb), Openbullet (.loli/.anom), Cookiebullet (.lce), BL Tools (.proj), or BAS (.xml) files</p>
          </div>
          
          {/* Upload Mode Toggle */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">Upload Mode:</span>
            <div className="flex bg-gray-600 rounded-lg p-1">
              <button
                onClick={() => setUploadMode('single')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  uploadMode === 'single'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Single
              </button>
              <button
                onClick={() => setUploadMode('bulk')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  uploadMode === 'bulk'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Bulk
              </button>
            </div>
          </div>
        </div>

        {/* File Upload Area */}
        <div className="border-2 border-dashed border-gray-500 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
          <div className="text-4xl mb-4">📁</div>
          <h5 className="text-lg font-medium text-white mb-2">
            {uploadMode === 'single' ? 'Drop a single config file here' : 'Drop multiple config files here'}
          </h5>
          <p className="text-gray-400 text-sm mb-4">
            Supported formats: .svb, .loli, .anom, .lce, .proj, .xml
          </p>
          
          <label className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors">
            <span className="mr-2">📤</span>
            {uploadMode === 'single' ? 'Select Single File' : 'Select Multiple Files'}
            <input
              type="file"
              multiple={uploadMode === 'bulk'}
              accept=".svb,.loli,.anom,.lce,.proj,.xml"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          
          {isUploading && (
            <div className="mt-4 flex items-center justify-center text-blue-400">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400 mr-2"></div>
              Uploading...
            </div>
          )}
        </div>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="bg-gray-700 rounded-lg p-6 mb-6">
          <h4 className="text-lg font-medium text-white mb-4">📋 Uploaded Files</h4>
          <div className="space-y-3">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between bg-gray-600 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getFileTypeIcon(file.name)}</span>
                  <div>
                    <div className="text-white font-medium">{file.name}</div>
                    <div className="text-gray-400 text-sm">
                      {getFileTypeName(file.name)} • {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    file.status === 'active' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
                  }`}>
                    {file.status}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedFile(file);
                      setShowConfigModal(true);
                    }}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                  >
                    Configure
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Configs */}
      {configs.length > 0 && (
        <div className="bg-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-medium text-white mb-4">⚙️ Existing Configurations</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {configs.map((config) => (
              <div key={config.id} className="bg-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{getFileTypeIcon(config.file.name)}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    config.status === 'active' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
                  }`}>
                    {config.status}
                  </span>
                </div>
                <h5 className="text-white font-medium mb-2">{config.config.name || config.file.name}</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price:</span>
                    <span className="text-green-400 font-bold">${config.config.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">CPM:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      config.config.cpm === 'Low' ? 'bg-green-600' :
                      config.config.cpm === 'Med' ? 'bg-yellow-600' :
                      config.config.cpm === 'High' ? 'bg-orange-600' :
                      'bg-red-600'
                    } text-white`}>
                      {config.config.cpm}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Proxy:</span>
                    <span className="text-white">{config.config.proxyType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Data:</span>
                    <span className="text-white">{config.config.dataType}</span>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-400">
                  Created: {new Date(config.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configuration Modal */}
      {showConfigModal && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">⚙️ Configure {selectedFile.name}</h3>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleConfigSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-white mb-4">📝 Basic Information</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Config Name</label>
                      <input
                        type="text"
                        value={configForm.name}
                        onChange={(e) => setConfigForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter a descriptive name for this config"
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Description</label>
                      <textarea
                        value={configForm.description}
                        onChange={(e) => setConfigForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe what this config does and its features"
                        rows="3"
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">💰 Price (USD)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-400">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={configForm.price}
                          onChange={(e) => setConfigForm(prev => ({ ...prev, price: e.target.value }))}
                          placeholder="0.00"
                          className="w-full pl-8 pr-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Set the price users will pay to access this configuration
                      </p>
                    </div>
                  </div>
                </div>

                {/* Performance & Proxy Settings */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-white mb-4">⚡ Performance & Proxy Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">CPM (Capture Per Min)</label>
                      <select
                        value={configForm.cpm}
                        onChange={(e) => setConfigForm(prev => ({ ...prev, cpm: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        {cpmOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Proxy Type</label>
                      <select
                        value={configForm.proxyType}
                        onChange={(e) => setConfigForm(prev => ({ ...prev, proxyType: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        {proxyTypeOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Proxy Source</label>
                      <select
                        value={configForm.proxySource}
                        onChange={(e) => setConfigForm(prev => ({ ...prev, proxySource: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        {proxySourceOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Data Type</label>
                      <select
                        value={configForm.dataType}
                        onChange={(e) => setConfigForm(prev => ({ ...prev, dataType: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        {dataTypeOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Capture Example */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-white mb-4">📊 Capture Example</h4>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Example Output</label>
                    <textarea
                      value={configForm.captureExample}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, captureExample: e.target.value }))}
                      placeholder="Paste an example of what the capture output looks like when the config runs successfully"
                      rows="4"
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      This helps users understand what data they can expect to capture
                    </p>
                  </div>
                </div>

                {/* Screenshots */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-white mb-4">📸 Screenshots</h4>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Upload Screenshots</label>
                    <div className="border-2 border-dashed border-gray-500 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                      <div className="text-2xl mb-2">📷</div>
                      <p className="text-gray-400 text-sm mb-3">
                        Upload screenshots showing the config in action
                      </p>
                      <label className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer transition-colors">
                        <span className="mr-2">📤</span>
                        Select Images
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleScreenshotUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    
                    {/* Screenshot Previews */}
                    {configForm.screenshots.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-white text-sm font-medium mb-2">Uploaded Screenshots:</h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {configForm.screenshots.map((screenshot, index) => (
                            <div key={index} className="relative">
                              <img
                                src={screenshot.data}
                                alt={screenshot.name}
                                className="w-full h-24 object-cover rounded border border-gray-500"
                              />
                              <button
                                onClick={() => removeScreenshot(index)}
                                className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                              >
                                ×
                              </button>
                              <p className="text-xs text-gray-400 mt-1 truncate">{screenshot.name}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                  >
                    💾 Save Configuration
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Database Configuration Component
const DatabaseConfiguration = () => {
  const [dbConfig, setDbConfig] = useState({
    supabaseUrl: '',
    supabaseAnonKey: '',
    supabaseServiceKey: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [testStatus, setTestStatus] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('unknown');
  const [envVarStatus, setEnvVarStatus] = useState({
    supabaseUrl: false,
    supabaseAnonKey: false,
    supabaseServiceKey: false
  });

  useEffect(() => {
    // Load current environment variables (these would be read-only in production)
    // In a real app, you'd get these from your backend
    const currentConfig = {
      supabaseUrl: process.env.REACT_APP_SUPABASE_URL || '',
      supabaseAnonKey: process.env.REACT_APP_SUPABASE_ANON_KEY || '',
      supabaseServiceKey: process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || ''
    };
    
    setDbConfig(currentConfig);
    
    // Check which environment variables are set
    setEnvVarStatus({
      supabaseUrl: !!currentConfig.supabaseUrl,
      supabaseAnonKey: !!currentConfig.supabaseAnonKey,
      supabaseServiceKey: !!currentConfig.supabaseServiceKey
    });
  }, []);

  const updateDbConfig = (key, value) => {
    setDbConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const testConnection = async () => {
    try {
      setIsLoading(true);
      setTestStatus('Testing connection...');
      setConnectionStatus('testing');

      // Test the connection using the credit-cards test endpoint
      const response = await api.get('/api/credit-cards/test-connection');
      
      if (response.data.success) {
        setTestStatus('✅ Connection successful! Database is accessible.');
        setConnectionStatus('connected');
      } else {
        setTestStatus('❌ Connection failed: ' + (response.data.error || 'Unknown error'));
        setConnectionStatus('failed');
      }
    } catch (error) {
      console.error('Connection test error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      setTestStatus('❌ Connection failed: ' + errorMessage);
      setConnectionStatus('failed');
    } finally {
      setIsLoading(false);
    }
  };

  const testAllEndpoints = async () => {
    try {
      setIsLoading(true);
      setTestStatus('Testing all API endpoints...');
      setConnectionStatus('testing');

      const endpoints = [
        '/api/content-stats',
        '/api/bots',
        '/api/credit-cards',
        '/api/services',
        '/api/configs',
        '/api/deposits',
        '/api/tickets',
        '/api/invites'
      ];

      const results = [];
      
      for (const endpoint of endpoints) {
        try {
          const response = await api.get(endpoint);
          results.push({ endpoint, status: 'success', data: response.data });
        } catch (error) {
          results.push({ 
            endpoint, 
            status: 'error', 
            error: error.response?.data?.error || error.message 
          });
        }
      }

      const successCount = results.filter(r => r.status === 'success').length;
      const totalCount = results.length;
      
      if (successCount === totalCount) {
        setTestStatus(`✅ All ${totalCount} endpoints are working correctly!`);
        setConnectionStatus('connected');
      } else {
        setTestStatus(`⚠️ ${successCount}/${totalCount} endpoints working. Some endpoints have issues.`);
        setConnectionStatus('partial');
      }

      // Log detailed results for debugging
      console.log('Endpoint test results:', results);
      
    } catch (error) {
      console.error('Endpoint test error:', error);
      setTestStatus('❌ Failed to test endpoints: ' + error.message);
      setConnectionStatus('failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400';
      case 'partial': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      case 'testing': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return '✅';
      case 'partial': return '⚠️';
      case 'failed': return '❌';
      case 'testing': return '🔄';
      default: return '❓';
    }
  };

  return (
    <div className="space-y-6">
      {/* Database Connection Status */}
      <div className="bg-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🗄️ Database Connection Status</h3>
        
        <div className="flex items-center space-x-4 mb-6">
          <div className={`text-2xl ${getStatusColor()}`}>
            {getStatusIcon()}
          </div>
          <div>
            <div className={`text-lg font-medium ${getStatusColor()}`}>
              {connectionStatus === 'connected' && 'Database Connected'}
              {connectionStatus === 'partial' && 'Partial Connection'}
              {connectionStatus === 'failed' && 'Connection Failed'}
              {connectionStatus === 'testing' && 'Testing Connection...'}
              {connectionStatus === 'unknown' && 'Connection Status Unknown'}
            </div>
            <div className="text-gray-400 text-sm">
              {testStatus || 'Click "Test Connection" to check database status'}
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={testConnection}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {isLoading ? '🔄 Testing...' : '🔌 Test Connection'}
          </button>
          
          <button
            onClick={testAllEndpoints}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {isLoading ? '🔄 Testing...' : '🧪 Test All Endpoints'}
          </button>
        </div>
      </div>

      {/* Supabase Configuration */}
      <div className="bg-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🔑 Supabase Configuration</h3>
        
        {/* Environment Variable Status */}
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <h4 className="text-white font-medium mb-3">Environment Variable Status</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${envVarStatus.supabaseUrl ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-300">SUPABASE_URL</span>
              <span className={`text-xs px-2 py-1 rounded ${envVarStatus.supabaseUrl ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                {envVarStatus.supabaseUrl ? 'Set' : 'Missing'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${envVarStatus.supabaseAnonKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-300">SUPABASE_ANON_KEY</span>
              <span className={`text-xs px-2 py-1 rounded ${envVarStatus.supabaseAnonKey ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                {envVarStatus.supabaseAnonKey ? 'Set' : 'Missing'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${envVarStatus.supabaseServiceKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-300">SUPABASE_SERVICE_ROLE_KEY</span>
              <span className={`text-xs px-2 py-1 rounded ${envVarStatus.supabaseServiceKey ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                {envVarStatus.supabaseServiceKey ? 'Set' : 'Missing'}
              </span>
            </div>
          </div>
          
          {!envVarStatus.supabaseUrl || !envVarStatus.supabaseAnonKey || !envVarStatus.supabaseServiceKey ? (
            <div className="mt-3 p-3 bg-red-900/20 border border-red-700 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="text-red-400">⚠️</div>
                <span className="text-red-300 text-sm">
                  <strong>Missing environment variables detected!</strong> Set these in your Netlify environment variables to fix database connection issues.
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-3 p-3 bg-green-900/20 border border-green-700 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="text-green-400">✅</div>
                <span className="text-green-300 text-sm">
                  <strong>All environment variables are set!</strong> Your database should be accessible.
                </span>
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">Supabase URL</label>
            <input
              type="url"
              value={dbConfig.supabaseUrl}
              onChange={(e) => updateDbConfig('supabaseUrl', e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-gray-400 text-sm mt-1">Your Supabase project URL</p>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Supabase Anon Key</label>
            <input
              type="password"
              value={dbConfig.supabaseAnonKey}
              onChange={(e) => updateDbConfig('supabaseAnonKey', e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-gray-400 text-sm mt-1">Public anonymous key for client-side operations</p>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Supabase Service Role Key</label>
            <input
              type="password"
              value={dbConfig.supabaseServiceKey}
              onChange={(e) => updateDbConfig('supabaseServiceKey', e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-gray-400 text-sm mt-1">Service role key for admin operations (keep secure)</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="text-yellow-400 text-xl">⚠️</div>
            <div>
              <h4 className="text-yellow-400 font-medium mb-2">Important Notes</h4>
              <ul className="text-yellow-300 text-sm space-y-1">
                <li>• These credentials are stored in your environment variables</li>
                <li>• The Service Role Key has full database access - keep it secure</li>
                <li>• Changes to these values require restarting your application</li>
                <li>• For Netlify, set these in your environment variables</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Environment Variables Help */}
      <div className="bg-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🌐 Environment Variables Setup</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-white font-medium mb-2">For Netlify Deployment:</h4>
            <div className="bg-gray-800 p-4 rounded-lg font-mono text-sm text-green-400">
              <div>SUPABASE_URL=https://your-project.supabase.co</div>
              <div>SUPABASE_ANON_KEY=your-anon-key-here</div>
              <div>SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here</div>
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">For Local Development:</h4>
            <div className="bg-gray-800 p-4 rounded-lg font-mono text-sm text-blue-400">
              <div>REACT_APP_SUPABASE_URL=https://your-project.supabase.co</div>
              <div>REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here</div>
              <div>REACT_APP_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here</div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="text-blue-400 text-xl">💡</div>
              <div>
                <h4 className="text-blue-400 font-medium mb-2">How to Set Environment Variables</h4>
                <ol className="text-blue-300 text-sm space-y-1 list-decimal list-inside">
                  <li>Go to your Netlify dashboard</li>
                  <li>Navigate to Site settings → Environment variables</li>
                  <li>Add each variable with its corresponding value</li>
                  <li>Redeploy your site for changes to take effect</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="bg-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🔧 Troubleshooting</h3>
        
        <div className="space-y-4">
          <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
            <h4 className="text-red-400 font-medium mb-2">Common Issues:</h4>
            <ul className="text-red-300 text-sm space-y-1">
              <li>• <strong>Missing Supabase environment variables:</strong> Check if all three variables are set</li>
              <li>• <strong>Invalid Supabase URL:</strong> Ensure the URL format is correct</li>
              <li>• <strong>Invalid API keys:</strong> Verify keys are copied correctly from Supabase dashboard</li>
              <li>• <strong>Database permissions:</strong> Check if your Supabase project has the required tables</li>
              <li>• <strong>Row Level Security (RLS):</strong> Ensure RLS policies allow your operations</li>
            </ul>
          </div>

          <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
            <h4 className="text-green-400 font-medium mb-2">Quick Fixes:</h4>
            <ul className="text-green-300 text-sm space-y-1">
              <li>• <strong>Test connection first:</strong> Use the "Test Connection" button above</li>
              <li>• <strong>Check environment variables:</strong> Verify they're set in your deployment platform</li>
              <li>• <strong>Restart application:</strong> Environment variable changes require restart</li>
              <li>• <strong>Check Supabase dashboard:</strong> Ensure your project is active and accessible</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Save Button for Database Configuration */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            // For database config, we'll show a message since these are environment variables
            alert('Database configuration is managed through environment variables. Please update your environment variables and restart the application for changes to take effect.');
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2"
        >
          <span>💾</span>
          <span>Save Database Config</span>
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;
