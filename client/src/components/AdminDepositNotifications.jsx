import React, { useState, useEffect } from 'react';
import api from '../config/axios';

const AdminDepositNotifications = () => {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    loadPendingDeposits();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadPendingDeposits, 30000);
    
    return () => clearInterval(interval);
  }, [filterStatus, sortBy, sortOrder]);

  const loadPendingDeposits = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin-pending-deposits', {
        params: {
          status: filterStatus,
          sort_by: sortBy,
          sort_order: sortOrder
        }
      });
      
      if (response.data.success) {
        setDeposits(response.data.deposits);
        setSummary(response.data.summary);
        setLastUpdated(response.data.timestamp);
      } else {
        setError('Failed to load pending deposits');
      }
    } catch (error) {
      console.error('Error loading pending deposits:', error);
      setError(error.response?.data?.error || 'Failed to load pending deposits');
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyBadge = (urgencyLevel) => {
    const badges = {
      'expired': 'bg-red-600',
      'critical': 'bg-red-500',
      'warning': 'bg-yellow-500',
      'normal': 'bg-green-500'
    };
    
    const labels = {
      'expired': 'EXPIRED',
      'critical': 'CRITICAL',
      'warning': 'WARNING',
      'normal': 'NORMAL'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-bold rounded-full text-white ${badges[urgencyLevel] || 'bg-gray-500'}`}>
        {labels[urgencyLevel] || 'UNKNOWN'}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': 'bg-yellow-500',
      'confirmed': 'bg-green-500',
      'failed': 'bg-red-500',
      'timed_out': 'bg-gray-500'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full text-white ${badges[status] || 'bg-gray-500'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const formatCurrency = (amount, currency) => {
    if (!amount) return '0';
    
    const formatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    });
    
    return `${formatter.format(amount)} ${currency.toUpperCase()}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleConfirmDeposit = async (depositId) => {
    if (!window.confirm('Are you sure you want to confirm this deposit?')) {
      return;
    }

    try {
      const response = await api.post('/api/admin-confirm-deposit', {
        deposit_id: depositId,
        action: 'confirm'
      });

      if (response.data.success) {
        // Refresh the list
        loadPendingDeposits();
      } else {
        setError(response.data.error || 'Failed to confirm deposit');
      }
    } catch (error) {
      console.error('Error confirming deposit:', error);
      setError(error.response?.data?.error || 'Failed to confirm deposit');
    }
  };

  const handleRejectDeposit = async (depositId) => {
    if (!window.confirm('Are you sure you want to reject this deposit?')) {
      return;
    }

    try {
      const response = await api.post('/api/admin-confirm-deposit', {
        deposit_id: depositId,
        action: 'reject'
      });

      if (response.data.success) {
        // Refresh the list
        loadPendingDeposits();
      } else {
        setError(response.data.error || 'Failed to reject deposit');
      }
    } catch (error) {
      console.error('Error rejecting deposit:', error);
      setError(error.response?.data?.error || 'Failed to reject deposit');
    }
  };

  const handleExtendTimeout = async (depositId) => {
    if (!window.confirm('Extend the timeout by 1 hour?')) {
      return;
    }

    try {
      const response = await api.post('/api/admin-confirm-deposit', {
        deposit_id: depositId,
        action: 'extend'
      });

      if (response.data.success) {
        // Refresh the list
        loadPendingDeposits();
      } else {
        setError(response.data.error || 'Failed to extend timeout');
      }
    } catch (error) {
      console.error('Error extending timeout:', error);
      setError(error.response?.data?.error || 'Failed to extend timeout');
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">💰 Pending Deposit Notifications</h2>
          <p className="text-gray-400 mt-1">
            Monitor and manage pending cryptocurrency deposits
            {lastUpdated && (
              <span className="ml-2 text-sm">
                • Last updated: {formatDate(lastUpdated)}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={loadPendingDeposits}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Loading...</span>
            </>
          ) : (
            <>
              <span>🔄</span>
              <span>Refresh</span>
            </>
          )}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white">{summary.total_pending || 0}</div>
          <div className="text-gray-400 text-sm">Total Pending</div>
        </div>
        <div className="bg-red-600 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white">{summary.expired || 0}</div>
          <div className="text-red-100 text-sm">Expired</div>
        </div>
        <div className="bg-red-500 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white">{summary.critical || 0}</div>
          <div className="text-red-100 text-sm">Critical</div>
        </div>
        <div className="bg-yellow-500 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white">{summary.warning || 0}</div>
          <div className="text-yellow-100 text-sm">Warning</div>
        </div>
        <div className="bg-green-500 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white">{summary.normal || 0}</div>
          <div className="text-green-100 text-sm">Normal</div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-gray-700 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-white text-sm font-medium mb-1">Status Filter</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="failed">Failed</option>
              <option value="timed_out">Timed Out</option>
            </select>
          </div>
          
          <div>
            <label className="block text-white text-sm font-medium mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="created_at">Created Date</option>
              <option value="usd_amount">USD Amount</option>
              <option value="timeout_at">Timeout</option>
            </select>
          </div>
          
          <div>
            <label className="block text-white text-sm font-medium mb-1">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-600 text-white p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Deposits List */}
      <div className="bg-gray-700 rounded-lg p-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading deposits...</p>
          </div>
        ) : deposits.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No deposits found</p>
            <p className="text-gray-500 text-sm">All deposits have been processed</p>
          </div>
        ) : (
          <div className="space-y-4">
            {deposits.map((deposit) => (
              <div 
                key={deposit.id} 
                className={`bg-gray-800 rounded-lg p-4 border-l-4 ${
                  deposit.urgency_level === 'expired' ? 'border-red-600' :
                  deposit.urgency_level === 'critical' ? 'border-red-500' :
                  deposit.urgency_level === 'warning' ? 'border-yellow-500' :
                  'border-green-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      {getUrgencyBadge(deposit.urgency_level)}
                      {getStatusBadge(deposit.status)}
                      <span className="text-sm text-gray-400">
                        ID: {deposit.id.substring(0, 8)}...
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                      <div>
                        <span className="text-gray-400 text-sm">User:</span>
                        <div className="text-white font-medium">
                          {deposit.users?.username || 'Unknown'}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {deposit.users?.email || 'No email'}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-gray-400 text-sm">Amount:</span>
                        <div className="text-white font-medium">
                          {formatCurrency(deposit.usd_amount, 'USD')}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {formatCurrency(deposit.crypto_amount, deposit.selected_currency)}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-gray-400 text-sm">Created:</span>
                        <div className="text-white font-medium">
                          {formatDate(deposit.created_at)}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-gray-400 text-sm">Timeout:</span>
                        <div className={`font-medium ${
                          deposit.is_expired ? 'text-red-400' :
                          deposit.urgency_level === 'critical' ? 'text-red-300' :
                          deposit.urgency_level === 'warning' ? 'text-yellow-300' :
                          'text-green-300'
                        }`}>
                          {deposit.is_expired ? 'EXPIRED' : deposit.time_remaining_text}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {formatDate(deposit.timeout_at)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Payment Method:</span>
                        <span className="text-white ml-2">{deposit.payment_method || 'Manual'}</span>
                      </div>
                      
                      <div>
                        <span className="text-gray-400">Currency:</span>
                        <span className="text-white ml-2">{deposit.selected_currency?.toUpperCase()}</span>
                      </div>
                      
                      {deposit.wallet_address && (
                        <div className="md:col-span-2">
                          <span className="text-gray-400">Wallet Address:</span>
                          <div className="text-white font-mono text-xs break-all mt-1">
                            {deposit.wallet_address}
                          </div>
                        </div>
                      )}
                      
                      {deposit.transaction_link && (
                        <div className="md:col-span-2">
                          <span className="text-gray-400">Transaction:</span>
                          <a
                            href={deposit.transaction_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 ml-2 underline"
                          >
                            View on Blockchain Explorer →
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    {deposit.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleConfirmDeposit(deposit.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm transition-colors"
                        >
                          ✅ Confirm
                        </button>
                        
                        <button
                          onClick={() => handleRejectDeposit(deposit.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm transition-colors"
                        >
                          ❌ Reject
                        </button>
                        
                        <button
                          onClick={() => handleExtendTimeout(deposit.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors"
                        >
                          ⏰ Extend 1h
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDepositNotifications;
