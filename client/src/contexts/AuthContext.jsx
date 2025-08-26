import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Update last activity on user interaction
  const updateActivity = () => {
    setLastActivity(Date.now());
  };

  // Session refresh mechanism
  useEffect(() => {
    if (token && user) {
      const refreshInterval = setInterval(() => {
        const now = Date.now();
        const timeSinceActivity = now - lastActivity;
        
        // If user has been inactive for more than 30 minutes, refresh the session
        if (timeSinceActivity > 30 * 60 * 1000) {
          console.log('Session refresh needed, updating last activity');
          setLastActivity(now);
        }
      }, 5 * 60 * 1000); // Check every 5 minutes

      return () => clearInterval(refreshInterval);
    }
  }, [token, user, lastActivity]);

  // Automatic wallet sync mechanism
  useEffect(() => {
    if (token && user) {
      // Temporary disable wallet sync to prevent console spam
      const WALLET_SYNC_ENABLED = false; // Set to true when ready
      
      if (!WALLET_SYNC_ENABLED) {
        console.log('Wallet sync temporarily disabled');
        return;
      }
      
      // Initial sync with delay to prevent immediate spam
      const initialSyncTimeout = setTimeout(() => {
        syncWallet();
      }, 1000); // Wait 1 second before first sync
      
      // Set up periodic wallet sync every 5 minutes (increased from 2 minutes)
      const walletSyncInterval = setInterval(() => {
        console.log('Periodic wallet sync triggered');
        syncWallet();
      }, 5 * 60 * 1000); // Every 5 minutes

      return () => {
        clearTimeout(initialSyncTimeout);
        clearInterval(walletSyncInterval);
      };
    }
  }, [token, user]); // Remove syncWallet from dependencies to prevent infinite loop

  // Add activity listeners
  useEffect(() => {
    if (token && user) {
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      events.forEach(event => {
        document.addEventListener(event, updateActivity, true);
      });

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, updateActivity, true);
        });
      };
    }
  }, [token, user]);

  // Configure axios defaults when token changes
  useEffect(() => {
    console.log('=== AUTH CONTEXT: Token changed ===');
    console.log('Token exists:', !!token);
    
    if (token) {
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('Axios Authorization header set');
      
      // Verify token immediately
      verifyToken();
      
      // Add loading timeout to prevent infinite loading
      const loadingTimeout = setTimeout(() => {
        if (loading) {
          console.log('Loading timeout reached, forcing loading to false');
          setLoading(false);
        }
      }, 10000); // 10 seconds timeout
      
      return () => clearTimeout(loadingTimeout);
    } else {
      // Clear axios header
      delete axios.defaults.headers.common['Authorization'];
      console.log('Axios Authorization header cleared');
      setLoading(false);
    }
  }, [token, loading]);

  const verifyToken = async (retryCount = 0) => {
    try {
      console.log('=== AUTH CONTEXT: Verifying token ===');
      console.log('Retry attempt:', retryCount);
      
      const response = await axios.get('/api/verify');
      console.log('Token verification successful:', response.data);
      
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        console.log('User state updated:', response.data.user);
      } else {
        console.log('Token verification failed - no user data');
        // Don't logout immediately, just set loading to false
        setLoading(false);
      }
    } catch (error) {
      console.error('=== AUTH CONTEXT: Token verification failed ===');
      console.error('Error details:', error);
      console.error('Response data:', error.response?.data);
      
      // Retry logic for network errors
      if (retryCount < 2 && (!error.response || error.code === 'ERR_NETWORK')) {
        console.log(`Network error, retrying... (${retryCount + 1}/3)`);
        setTimeout(() => verifyToken(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
      
      // Only logout on specific authentication errors, not on network/server errors
      if (error.response?.status === 401 && error.response?.data?.error === 'Invalid token') {
        console.log('Invalid token error - logging out');
        logout();
      } else if (error.response?.status === 401 && error.response?.data?.error === 'User not found') {
        console.log('User not found error - this might be a temporary issue, not logging out');
        // Don't logout for user not found, just set loading to false
        setLoading(false);
      } else {
        console.log('Non-critical error - not logging out, setting loading to false');
        setLoading(false);
      }
    }
  };

  const login = async (loginData) => {
    try {
      console.log('=== AUTH CONTEXT: Login attempt ===');
      console.log('Login data:', loginData);
      
      const response = await axios.post('/api/login', loginData);
      console.log('Login API response:', response.data);
      
      if (response.data.success && response.data.token && response.data.user) {
        const { token: newToken, user: userData } = response.data;
        
        console.log('Login successful, setting token and user');
        console.log('Wallet balance from login:', userData.wallet_balance);
        
        // Set token first (this will trigger useEffect)
        setToken(newToken);
        localStorage.setItem('token', newToken);
        
        // Set user immediately for immediate UI update
        setUser(userData);
        
        console.log('Login completed successfully');
        return { 
          success: true, 
          user: userData,
          token: newToken
        };
      } else {
        console.log('Login API returned invalid response');
        return { 
          success: false, 
          error: 'Invalid response from server'
        };
      }
    } catch (error) {
      console.error('=== AUTH CONTEXT: Login failed ===');
      console.error('Error details:', error);
      console.error('Response data:', error.response?.data);
      
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  const syncWallet = async () => {
    try {
      // Prevent multiple simultaneous sync calls
      if (syncWallet.isRunning) {
        console.log('Wallet sync already in progress, skipping...');
        return { success: false, error: 'Sync already in progress' };
      }
      
      syncWallet.isRunning = true;
      console.log('=== AUTH CONTEXT: Syncing wallet ===');
      
      const response = await axios.get('/api/sync-wallet');
      
      if (response.data.success && response.data.wallet_balance !== undefined) {
        const newBalance = response.data.wallet_balance;
        console.log('Wallet balance synced:', newBalance);
        
        // Update user state with new wallet balance
        setUser(prevUser => {
          if (prevUser) {
            return {
              ...prevUser,
              wallet_balance: newBalance
            };
          }
          return prevUser;
        });
        
        return { success: true, wallet_balance: newBalance };
      } else {
        console.log('Wallet sync failed - invalid response');
        return { success: false, error: 'Invalid response from server' };
      }
    } catch (error) {
      console.error('Wallet sync error:', error);
      return { success: false, error: 'Wallet sync failed' };
    } finally {
      syncWallet.isRunning = false;
    }
  };

  const logout = () => {
    console.log('=== AUTH CONTEXT: Logging out ===');
    
    // Clear state
    setUser(null);
    setToken(null);
    
    // Clear localStorage
    localStorage.removeItem('token');
    
    // Clear axios header
    delete axios.defaults.headers.common['Authorization'];
    
    console.log('Logout completed');
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await axios.post('/api/change-password', {
        currentPassword,
        newPassword
      });
      
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Password change failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Password change failed'
      };
    }
  };

  const refreshSession = async () => {
    try {
      console.log('=== AUTH CONTEXT: Manual session refresh ===');
      const response = await axios.get('/api/verify');
      
      if (response.data.success && response.data.user) {
        const updatedUser = response.data.user;
        console.log('Session refreshed successfully');
        console.log('Wallet balance from refresh:', updatedUser.wallet_balance);
        
        setUser(updatedUser);
        setLastActivity(Date.now());
        
        return { success: true };
      } else {
        console.log('Session refresh failed');
        return { success: false, error: 'Failed to refresh session' };
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      return { success: false, error: 'Session refresh failed' };
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    changePassword,
    refreshSession,
    syncWallet
  };

  console.log('=== AUTH CONTEXT: Current state ===');
  console.log('User:', user ? 'exists' : 'none');
  console.log('Token:', token ? 'exists' : 'none');
  console.log('Loading:', loading);
  console.log('Is authenticated:', !!user);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
