import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Wallet = () => {
  const { user, syncWallet } = useAuth();
  const [syncing, setSyncing] = useState(false);

  const handleSyncWallet = async () => {
    if (!user) return;
    
    setSyncing(true);
    try {
      const result = await syncWallet();
      if (result.success) {
        console.log('Wallet synced successfully:', result.wallet_balance);
      } else {
        console.error('Wallet sync failed:', result.error);
      }
    } catch (error) {
      console.error('Error syncing wallet:', error);
    } finally {
      setSyncing(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Wallet Balance</h3>
        <button
          onClick={handleSyncWallet}
          disabled={syncing}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white text-sm rounded-md transition-colors flex items-center space-x-2"
        >
          {syncing ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Syncing...</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Sync</span>
            </>
          )}
        </button>
      </div>
      
      <div className="text-3xl font-bold text-green-400 mb-2">
        ${(user.wallet_balance || 0).toFixed(2)}
      </div>
      
      <div className="text-sm text-gray-400">
        Last synced: {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        Automatic sync temporarily disabled. Use manual sync button above.
      </div>
    </div>
  );
};

export default Wallet;
