import React, { useState } from 'react';
import { CryptoScrollingBanner } from '../components/CryptoComponents';

const PaymentsPurchases = () => {
  const [activeTab, setActiveTab] = useState('payments');
  
  const [paymentMethods] = useState([
    {
      id: 1,
      name: 'Bitcoin',
      symbol: 'BTC',
      icon: '₿',
      address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      balance: 0.0025,
      color: 'text-yellow-400'
    },
    {
      id: 2,
      name: 'Ethereum',
      symbol: 'ETH',
      icon: 'Ξ',
      address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      balance: 0.15,
      color: 'text-blue-400'
    },
    {
      id: 3,
      name: 'Tether',
      symbol: 'USDT',
      icon: '₮',
      address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      balance: 150.00,
      color: 'text-green-400'
    },
    {
      id: 4,
      name: 'BNB',
      symbol: 'BNB',
      icon: '🟡',
      address: 'bnb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      balance: 2.5,
      color: 'text-yellow-500'
    }
  ]);

  const [purchases] = useState([
    {
      id: 'PUR-001',
      botId: 'PC1-VAIO-4558adb2cb76befd54a8',
      botName: 'PC1-VAIO',
      country: 'ES',
      price: 8.00,
      paymentMethod: 'Bitcoin',
      cryptoAmount: '0.00032 BTC',
      purchaseDate: '2024-01-15',
      downloadCount: 3,
      lastDownload: '2024-01-20',
      status: 'active'
    },
    {
      id: 'PUR-002',
      botId: 'PC2-Dell-7890abcdef123456',
      botName: 'PC2-Dell',
      country: 'US',
      price: 12.50,
      paymentMethod: 'Ethereum',
      cryptoAmount: '0.0062 ETH',
      purchaseDate: '2024-01-10',
      downloadCount: 1,
      lastDownload: '2024-01-10',
      status: 'active'
    },
    {
      id: 'PUR-003',
      botId: 'PC3-HP-4567ghijkl890123',
      botName: 'PC3-HP',
      country: 'GB',
      price: 15.75,
      paymentMethod: 'USDT',
      cryptoAmount: '15.75 USDT',
      purchaseDate: '2024-01-05',
      downloadCount: 5,
      lastDownload: '2024-01-18',
      status: 'active'
    },
    {
      id: 'PUR-004',
      botId: 'PC4-Lenovo-1234mnopqr567890',
      botName: 'PC4-Lenovo',
      country: 'DE',
      price: 9.99,
      paymentMethod: 'BNB',
      cryptoAmount: '0.0045 BNB',
      purchaseDate: '2023-12-28',
      downloadCount: 2,
      lastDownload: '2024-01-15',
      status: 'expired'
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500 text-white';
      case 'expired': return 'bg-red-500 text-white';
      case 'pending': return 'bg-yellow-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return '✅';
      case 'expired': return '⏰';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  const tabs = [
    { id: 'payments', label: 'Payment Methods', icon: '💰' },
    { id: 'purchases', label: 'Purchase History', icon: '💵' },
    { id: 'transactions', label: 'Recent Transactions', icon: '📊' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Crypto Scrolling Banner */}
      <CryptoScrollingBanner />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Payments & Purchases</h1>
              <p className="text-gray-400 mt-2">Manage your payment methods, view purchase history, and track transactions</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors">
                ➕ Add Payment Method
              </button>
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors">
                📊 Export History
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            {/* Payment Methods Tab */}
            {activeTab === 'payments' && (
              <div className="p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Payment Methods</h2>
                
                {/* Payment Methods Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="bg-gray-700 rounded-lg border border-gray-600 p-6 hover:border-gray-500 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <span className={`text-3xl ${method.color}`}>{method.icon}</span>
                        <span className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded">
                          {method.symbol}
                        </span>
                      </div>
                      <h3 className="text-lg font-medium text-white mb-2">{method.name}</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm text-gray-400">Balance</div>
                          <div className="text-xl font-bold text-green-400">
                            {method.balance} {method.symbol}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400">Address</div>
                          <div className="text-xs font-mono text-gray-300 break-all">
                            {method.address}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded transition-colors">
                          Send
                        </button>
                        <button className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-3 rounded transition-colors">
                          Receive
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Payment Settings */}
                <div className="bg-gray-700 rounded-lg border border-gray-600 p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Payment Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-medium text-white mb-3">Default Payment Method</h4>
                      <select className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="btc">Bitcoin (BTC)</option>
                        <option value="eth">Ethereum (ETH)</option>
                        <option value="usdt">Tether (USDT)</option>
                        <option value="bnb">BNB</option>
                      </select>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-white mb-3">Auto-Convert</h4>
                      <div className="flex items-center space-x-3">
                        <input type="checkbox" id="autoConvert" className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500" />
                        <label htmlFor="autoConvert" className="text-gray-300">Automatically convert payments to preferred currency</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Purchase History Tab */}
            {activeTab === 'purchases' && (
              <div className="p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Purchase History</h2>
                
                {/* Purchase Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-gray-700 rounded-lg border border-gray-600 p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-400 mb-2">
                        ${purchases.reduce((sum, p) => sum + p.price, 0).toFixed(2)}
                      </div>
                      <div className="text-gray-300">Total Spent</div>
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg border border-gray-600 p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-400 mb-2">
                        {purchases.filter(p => p.status === 'active').length}
                      </div>
                      <div className="text-gray-300">Active Bots</div>
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg border border-gray-600 p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-400 mb-2">
                        {purchases.reduce((sum, p) => sum + p.downloadCount, 0)}
                      </div>
                      <div className="text-gray-300">Total Downloads</div>
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg border border-gray-600 p-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-400 mb-2">
                        {purchases.filter(p => p.status === 'expired').length}
                      </div>
                      <div className="text-gray-300">Expired Bots</div>
                    </div>
                  </div>
                </div>

                {/* Purchases Table */}
                <div className="bg-gray-700 rounded-lg border border-gray-600 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-600">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Purchase ID</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Bot Details</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Price</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Payment</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Downloads</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-600">
                        {purchases.map((purchase) => (
                          <tr key={purchase.id} className="hover:bg-gray-600 transition-colors">
                            <td className="px-6 py-4 text-white font-medium font-mono">{purchase.id}</td>
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-blue-400 font-medium">{purchase.botName}</div>
                                <div className="text-xs text-gray-400 font-mono">{purchase.botId}</div>
                                <div className="text-xs text-gray-400">{purchase.country}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-green-400 font-medium">${purchase.price.toFixed(2)}</div>
                              <div className="text-xs text-gray-400">{purchase.cryptoAmount}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-gray-300">{purchase.paymentMethod}</div>
                              <div className="text-xs text-gray-400">{purchase.purchaseDate}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-white font-medium">{purchase.downloadCount}</div>
                              <div className="text-xs text-gray-400">Last: {purchase.lastDownload}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(purchase.status)}`}>
                                <span className="mr-1">{getStatusIcon(purchase.status)}</span>
                                {purchase.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <button className="text-blue-400 hover:text-blue-300 text-xs">
                                  Download
                                </button>
                                <button className="text-green-400 hover:text-green-300 text-xs">
                                  Renew
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Transactions Tab */}
            {activeTab === 'transactions' && (
              <div className="p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Recent Transactions</h2>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-700 rounded border border-gray-600">
                    <div className="flex items-center space-x-3">
                      <span className="text-green-400 text-xl">✅</span>
                      <div>
                        <div className="text-white font-medium">Received 0.001 BTC</div>
                        <div className="text-sm text-gray-400">From: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-medium">+0.001 BTC</div>
                      <div className="text-sm text-gray-400">2 hours ago</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-700 rounded border border-gray-600">
                    <div className="flex items-center space-x-3">
                      <span className="text-red-400 text-xl">📤</span>
                      <div>
                        <div className="text-white font-medium">Sent 0.05 ETH</div>
                        <div className="text-sm text-gray-400">To: 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-red-400 font-medium">-0.05 ETH</div>
                      <div className="text-sm text-gray-400">1 day ago</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-700 rounded border border-gray-600">
                    <div className="flex items-center space-x-3">
                      <span className="text-blue-400 text-xl">💳</span>
                      <div>
                        <div className="text-white font-medium">Bot Purchase: PC1-VAIO</div>
                        <div className="text-sm text-gray-400">Payment: 0.00032 BTC</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-blue-400 font-medium">-$8.00</div>
                      <div className="text-sm text-gray-400">3 days ago</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPurchases;
