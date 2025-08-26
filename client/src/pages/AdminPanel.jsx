import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/axios';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
    if (user && !user.isAdmin) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch admin dashboard stats
  useEffect(() => {
    if (user?.isAdmin) {
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
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'products', label: 'Products', icon: '🛍️' },
    { id: 'tickets', label: 'Support Tickets', icon: '🎫' },
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
      case 'content':
        return <ContentManagement />;
      case 'settings':
        return <SystemSettings />;
      default:
        return <AdminDashboard stats={stats} />;
    }
  };

  if (!user?.isAdmin) {
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

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/admin/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserStatus = async (userId, status) => {
    try {
      await api.put('/api/admin/users', { userId, status });
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">👥 User Management</h2>
      
      <div className="bg-gray-700 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-600">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Registered Users</h3>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
              Export Users
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-600">
            <thead className="bg-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-700 divide-y divide-gray-600">
              {users.map((user) => (
                <tr key={user.id}>
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
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <select
                      value={user.status}
                      onChange={(e) => updateUserStatus(user.id, e.target.value)}
                      className="bg-gray-600 text-white text-sm rounded px-2 py-1 border border-gray-500"
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="banned">Banned</option>
                    </select>
                  </td>
                </tr>
              ))}
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
    menuOptions: {
      creditCards: true,
      bots: true,
      services: true,
      wiki: true,
      news: true,
      binChecker: true,
      downloads: true
    }
  });

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

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">⚙️ System Settings</h2>
      
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
          </div>
        </div>

        {/* Menu Options */}
        <div className="bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Menu Options</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(settings.menuOptions).map(([option, enabled]) => (
              <div key={option} className="flex items-center justify-between">
                <label className="text-white font-medium capitalize">
                  {option.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => updateMenuOption(option, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
