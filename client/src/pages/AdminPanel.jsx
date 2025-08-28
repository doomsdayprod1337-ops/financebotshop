import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/axios';

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
            </div>
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-500 bg-opacity-20">
              <span className="text-2xl">🛍️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Products</p>
              <p className="text-2xl font-bold text-white">{stats.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-500 bg-opacity-20">
              <span className="text-2xl">🎫</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Open Tickets</p>
              <p className="text-2xl font-bold text-white">{stats.openTickets}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-500 bg-opacity-20">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-white">${stats.totalRevenue}</p>
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
          <div className="space-y-3 text-sm">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-300">New user registered</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-300">Product added</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-300">Support ticket opened</span>
            </div>
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
      'ID,Username,Email,Status,Role,Joined,Last Login',
      ...filteredUsers.map(user => 
        `${user.id},${user.username},${user.email},${user.status},${user.role || 'user'},${new Date(user.created_at).toLocaleDateString()},${user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}`
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
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-600">
            <thead className="bg-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-700 divide-y divide-gray-600">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-400">
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
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/admin/tickets');
      setTickets(response.data.tickets || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">🎫 Support Ticket Management</h2>
      
      <div className="bg-gray-700 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-600">
          <h3 className="text-lg font-semibold text-white">All Tickets</h3>
        </div>
        
        <div className="divide-y divide-gray-600">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    ticket.status === 'open' ? 'bg-red-100 text-red-800' :
                    ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {ticket.status}
                  </span>
                  <span className="text-white font-medium">#{ticket.id}</span>
                </div>
                <span className="text-gray-400 text-sm">
                  {new Date(ticket.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <h4 className="text-white font-medium mb-2">{ticket.subject}</h4>
              <p className="text-gray-300 text-sm mb-3">{ticket.message}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">From: {ticket.user_email}</span>
                <div className="flex space-x-2">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors">
                    Reply
                  </button>
                  <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs transition-colors">
                    Close
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

// Content Management Component
const ContentManagement = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">📝 Content Management</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* News Management */}
        <div className="bg-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">News Management</h3>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
              + Add News
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="bg-gray-600 rounded-lg p-3">
              <h4 className="text-white font-medium mb-2">Market Update - New Features</h4>
              <p className="text-gray-300 text-sm mb-2">Added new credit card categories and improved search...</p>
              <div className="flex space-x-2">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition-colors">
                  Edit
                </button>
                <button className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Wiki Management */}
        <div className="bg-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Wiki Management</h3>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
              + Add Wiki Entry
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="bg-gray-600 rounded-lg p-3">
              <h4 className="text-white font-medium mb-2">Getting Started Guide</h4>
              <p className="text-gray-300 text-sm mb-2">Complete guide for new users...</p>
              <div className="flex space-x-2">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition-colors">
                  Edit
                </button>
                <button className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
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
      creditCards: true,
      bots: true,
      services: true,
      wiki: true,
      news: true,
      binChecker: true,
      downloads: true
    },
    binChecker: {
      source: 'binlist',
      zylalabsApiKey: '9751|WUPyR6h9qlr8eUlgZSi4RMVVvrhoomBHzBfYaXn8'
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
            creditCards: true,
            bots: true,
            services: true,
            wiki: true,
            news: true,
            binChecker: true,
            downloads: true
          },
          binChecker: loadedSettings.binChecker || {
            source: 'binlist',
            zylalabsApiKey: '9751|WUPyR6h9qlr8eUlgZSi4RMVVvrhoomBHzBfYaXn8'
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
            onClick={() => setActiveTab('wallet')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'wallet'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            💰 Wallet Settings
          </button>
        </nav>
      </div>
      
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

            <div>
              <label className="block text-white font-medium mb-2">Minimum Deposit Amount (USD)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.minimumDepositAmount || 50.00}
                onChange={(e) => updateSetting('minimumDepositAmount', parseFloat(e.target.value) || 0)}
                placeholder="50.00"
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-gray-400 text-sm mt-1">
                Minimum amount users must deposit to add funds to their wallet
              </p>
            </div>
          </div>
        </div>

        {/* BIN Checker Configuration */}
        <div className="bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">🔍 BIN Checker Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-white font-medium mb-2">BIN Data Source</label>
              <select
                value={(settings.binChecker && settings.binChecker.source) || 'binlist'}
                onChange={(e) => updateBinCheckerSetting('source', e.target.value)}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="binlist">binlist.net (Free)</option>
                <option value="zylalabs">ZylaLabs (Premium)</option>
              </select>
              <p className="text-gray-400 text-sm mt-1">
                Select the primary source for BIN lookups. ZylaLabs provides premium data with higher accuracy.
              </p>
            </div>

            {(settings.binChecker && settings.binChecker.source === 'zylalabs') && (
              <div>
                <label className="block text-white font-medium mb-2">ZylaLabs API Key</label>
                <input
                  type="text"
                  value={(settings.binChecker && settings.binChecker.zylalabsApiKey) || ''}
                  onChange={(e) => updateBinCheckerSetting('zylalabsApiKey', e.target.value)}
                  placeholder="Enter your ZylaLabs API key"
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-gray-400 text-sm mt-1">
                  Your ZylaLabs API key for premium BIN lookups. The system will fallback to binlist.net if this fails.
                </p>
              </div>
            )}

            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Source Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-green-600 rounded-full"></span>
                  <span className="text-gray-300">binlist.net: Free, reliable, community-maintained database</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-purple-600 rounded-full"></span>
                  <span className="text-gray-300">ZylaLabs: Premium, high-accuracy, commercial database</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
                  <span className="text-gray-300">Local Database: Fast access to common BINs</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Options */}
        <div className="bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Menu Options</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settings.menuOptions && Object.entries(settings.menuOptions).map(([option, enabled]) => (
              <div key={option} className="flex items-center justify-between">
                <label className="text-white font-medium capitalize">
                  {option.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled || false}
                    onChange={(e) => updateMenuOption(option, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button and Status */}
        <div className="flex items-center justify-between">
          <div className="text-sm">
            {saveStatus && (
              <span className={`px-3 py-2 rounded ${
                saveStatus.includes('Error') ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
              }`}>
                {saveStatus}
              </span>
            )}
          </div>
          <button 
            onClick={saveSettings}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {isLoading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
        </div>
      )}

      {/* Wallet Settings Tab */}
      {activeTab === 'wallet' && (
        <div className="space-y-6">
          {/* Wallet Settings Configuration */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">💰 Wallet Settings Configuration</h3>
            
            <div className="space-y-6">
              {/* Payment Processor Selection */}
              <div>
                <label className="block text-white font-medium mb-2">Payment Processor</label>
                <select
                  value={(settings.walletSettings && settings.walletSettings.payment_processor) || 'manual'}
                  onChange={(e) => updateWalletSetting('payment_processor', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="manual">Manual (Direct Address)</option>
                  <option value="coinbase">Coinbase Commerce</option>
                  <option value="nowpayments">NowPayments</option>
                  <option value="bitpay">BitPay</option>
                </select>
                <p className="text-gray-400 text-sm mt-1">
                  Select your preferred payment processing method. Manual mode allows direct cryptocurrency addresses.
                </p>
              </div>

              {/* API Keys for Payment Processors */}
              {(settings.walletSettings && settings.walletSettings.payment_processor === 'coinbase') && (
                <div className="space-y-4">
                  <h4 className="text-white font-medium">Coinbase Commerce API</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white text-sm mb-1">API Key</label>
                      <input
                        type="text"
                        value={(settings.walletSettings && settings.walletSettings.coinbase_api_key) || ''}
                        onChange={(e) => updateWalletSetting('coinbase_api_key', e.target.value)}
                        placeholder="Enter Coinbase API key"
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm mb-1">API Secret</label>
                      <input
                        type="password"
                        value={(settings.walletSettings && settings.walletSettings.coinbase_api_secret) || ''}
                        onChange={(e) => updateWalletSetting('coinbase_api_secret', e.target.value)}
                        placeholder="Enter Coinbase API secret"
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {(settings.walletSettings && settings.walletSettings.payment_processor === 'nowpayments') && (
                <div className="space-y-4">
                  <h4 className="text-white font-medium">NowPayments API</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white text-sm mb-1">API Key</label>
                      <input
                        type="text"
                        value={(settings.walletSettings && settings.walletSettings.nowpayments_api_key) || ''}
                        onChange={(e) => updateWalletSetting('nowpayments_api_key', e.target.value)}
                        placeholder="Enter NowPayments API key"
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm mb-1">Public Key</label>
                      <input
                        type="text"
                        value={(settings.walletSettings && settings.walletSettings.nowpayments_public_key) || ''}
                        onChange={(e) => updateWalletSetting('nowpayments_public_key', e.target.value)}
                        placeholder="Enter NowPayments public key"
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {(settings.walletSettings && settings.walletSettings.payment_processor === 'bitpay') && (
                <div className="space-y-4">
                  <h4 className="text-white font-medium">BitPay API</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white text-sm mb-1">Merchant ID</label>
                      <input
                        type="text"
                        value={(settings.walletSettings && settings.walletSettings.bitpay_merchant_id) || ''}
                        onChange={(e) => updateWalletSetting('bitpay_merchant_id', e.target.value)}
                        placeholder="Enter BitPay Merchant ID"
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm mb-1">Private Key</label>
                      <input
                        type="password"
                        value={(settings.walletSettings && settings.walletSettings.bitpay_private_key) || ''}
                        onChange={(e) => updateWalletSetting('bitpay_private_key', e.target.value)}
                        placeholder="Enter BitPay Private Key"
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

                          {/* Cryptocurrency Addresses - Only show when manual mode is selected */}
            {(settings.walletSettings && settings.walletSettings.payment_processor === 'manual') && (
              <div>
                <h4 className="text-white font-medium mb-4">Cryptocurrency Addresses & Settings</h4>
                <p className="text-gray-400 text-sm mb-4">
                  Enable and configure individual cryptocurrency wallets for manual payments. All wallets are disabled by default.
                </p>
                <div className="space-y-4">
                  {settings.walletSettings && settings.walletSettings.currencies && Object.entries(settings.walletSettings.currencies).map(([currency, config]) => (
                    <div key={currency} className="bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">
                            {currency === 'BTC' ? '₿' : 
                             currency === 'LTC' ? 'Ł' : 
                             currency === 'ETH' ? 'Ξ' : 
                             currency === 'USDT_TRC20' ? '💎' : 
                             currency === 'USDT_ERC20' ? '🔷' : 
                             currency === 'XMR' ? 'ɱ' : 
                             currency === 'SOL' ? '◎' : '🪙'}
                          </span>
                          <span className="text-white font-medium">{currency.replace('_', ' ')}</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.enabled || false}
                            onChange={(e) => updateCurrencySetting(currency, 'enabled', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      {config.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-white text-sm mb-1">Wallet Address</label>
                            <input
                              type="text"
                              value={config.address || ''}
                              onChange={(e) => updateCurrencySetting(currency, 'address', e.target.value)}
                              placeholder={`Enter ${currency} address`}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-white text-sm mb-1">Min Amount</label>
                            <input
                              type="number"
                              step="0.000001"
                              value={config.min_amount || 0}
                              onChange={(e) => updateCurrencySetting(currency, 'min_amount', parseFloat(e.target.value))}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-white text-sm mb-1">Max Amount</label>
                            <input
                              type="number"
                              step="0.000001"
                              value={config.max_amount || 0}
                              onChange={(e) => updateCurrencySetting(currency, 'max_amount', parseFloat(e.target.value))}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-white text-sm mb-1">Network Fee</label>
                            <input
                              type="number"
                              step="0.000001"
                              value={config.network_fee || 0}
                              onChange={(e) => updateCurrencySetting(currency, 'network_fee', parseFloat(e.target.value))}
                              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

                          {/* Payment Processor Info */}
            {(settings.walletSettings && settings.walletSettings.payment_processor !== 'manual') && (
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                <h4 className="text-blue-300 font-medium mb-2">Payment Processor Active</h4>
                <p className="text-blue-200 text-sm">
                  When using {settings.walletSettings.payment_processor === 'coinbase' ? 'Coinbase Commerce' : 
                              settings.walletSettings.payment_processor === 'nowpayments' ? 'NowPayments' : 
                              settings.walletSettings.payment_processor === 'bitpay' ? 'BitPay' : 'the selected processor'}, 
                  individual wallet addresses are managed by the payment processor. 
                  You can switch to "Manual" mode to configure individual cryptocurrency addresses.
                </p>
              </div>
            )}

            {/* Manual Payment Settings */}
            {(settings.walletSettings && settings.walletSettings.payment_processor === 'manual') && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-4">Manual Payment Settings</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white font-medium mb-2">Payment Instructions</label>
                      <textarea
                        value={(settings.walletSettings && settings.walletSettings.manual_settings && settings.walletSettings.manual_settings.instructions) || ''}
                        onChange={(e) => updateManualSetting('instructions', e.target.value)}
                        rows={3}
                        placeholder="Enter payment instructions for customers"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(settings.walletSettings && settings.walletSettings.manual_settings && settings.walletSettings.manual_settings.confirmation_required) || false}
                            onChange={(e) => updateManualSetting('confirmation_required', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                        <span className="text-white text-sm">Require manual confirmation</span>
                      </div>
                      <div>
                        <label className="block text-white text-sm mb-1">Auto-confirm after blocks</label>
                        <input
                          type="number"
                          value={(settings.walletSettings && settings.walletSettings.manual_settings && settings.walletSettings.manual_settings.auto_confirm_after_blocks) || 6}
                          onChange={(e) => updateManualSetting('auto_confirm_after_blocks', parseInt(e.target.value))}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button for Wallet Settings */}
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  {saveStatus && (
                    <span className={`px-3 py-2 rounded ${
                      saveStatus.includes('Error') ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                    }`}>
                      {saveStatus}
                    </span>
                  )}
                </div>
                <button 
                  onClick={saveSettings}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {isLoading ? 'Saving...' : 'Save Wallet Settings'}
                </button>
              </div>
            </div>
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

  const expectedFields = [
    'CC', 'MM', 'YY', 'CVV', 'FIRST_NAME', 'LAST_NAME', 'STREET', 'CITY', 'ZIP', 
    'DOB', 'SSN', 'EMAIL', 'EMAIL_PASS', 'PHONE', 'FINGER_PRINT', 'BALANCE'
  ];

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

        // Create card object for API (matching new schema)
        const card = {
          cardNumber: cc,
          month: mm,
          year: yy,
          price: bulkPrice ? pricePerCard : parseFloat(filePrice) || pricePerCard
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

const FinanceDocManagement = ({ financeDocs, setFinanceDocs, showToast }) => (
  <div>
    <h3 className="text-xl font-semibold text-white mb-6">📄 Finance Document Management</h3>
    <p className="text-gray-400">Finance document management functionality coming soon...</p>
  </div>
);

const ConfigManagement = ({ configs, setConfigs, showToast }) => (
  <div>
    <h3 className="text-xl font-semibold text-white mb-6">⚙️ Config/Checker Management</h3>
    <p className="text-gray-400">Config and checker management functionality coming soon...</p>
  </div>
);

export default AdminPanel;
