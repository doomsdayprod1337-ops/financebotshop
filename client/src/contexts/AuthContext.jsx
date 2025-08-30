import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../config/axios';
import BanNotification from '../components/BanNotification';

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
  const [banInfo, setBanInfo] = useState(null);

  // Update last activity on user interaction
  const updateActivity = () => {
    setLastActivity(Date.now());
  };

  // Session refresh mechanism
  useEffect(() => {
    if (token && user) {
      const refreshInterval = setInterval(async () => {
        const now = Date.now();
        const timeSinceActivity = now - lastActivity;
        
        // If user has been inactive for more than 25 minutes, refresh the session
        if (timeSinceActivity > 25 * 60 * 1000) {
          console.log('Session refresh needed, attempting to refresh...');
          const result = await refreshSession();
          if (result.success) {
            setLastActivity(now);
            console.log('Session refreshed successfully');
          } else {
            console.log('Session refresh failed, logging out');
            logout();
          }
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
        if (process.env.NODE_ENV === 'development') {
          console.log('Wallet sync temporarily disabled');
        }
        return;
      }
      
      // Initial sync with delay to prevent immediate spam
      const initialSyncTimeout = setTimeout(() => {
        syncWallet();
      }, 1000); // Wait 1 second before first sync
      
      // Set up periodic wallet sync every 5 minutes (increased from 2 minutes)
      const walletSyncInterval = setInterval(() => {
        if (process.env.NODE_ENV === 'development') {
          console.log('Periodic wallet sync triggered');
        }
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
    if (process.env.NODE_ENV === 'development') {
      console.log('=== AUTH CONTEXT: Token changed ===');
      console.log('Token exists:', !!token);
    }
    
    if (token) {
      // Check if token is expired (JWT tokens expire after 1 hour)
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (tokenPayload.exp && tokenPayload.exp < currentTime) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Token is expired, logging out');
          }
          logout();
          return;
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Error parsing token payload:', error);
        }
        // If we can't parse the token, it's invalid
        logout();
        return;
      }
      
      // Set api default header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      if (process.env.NODE_ENV === 'development') {
        console.log('Axios Authorization header set');
      }
      
      // Only verify token if we don't have a user yet or if loading is true
      if (!user || loading) {
        verifyToken();
      }
      
      // Add loading timeout to prevent infinite loading
      const loadingTimeout = setTimeout(() => {
        if (loading) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Loading timeout reached, forcing loading to false');
          }
          setLoading(false);
        }
      }, 10000); // 10 seconds timeout
      
      return () => clearTimeout(loadingTimeout);
    } else {
      // Clear api header
      delete api.defaults.headers.common['Authorization'];
      if (process.env.NODE_ENV === 'development') {
        console.log('API Authorization header cleared');
      }
      setLoading(false);
    }
  }, [token]); // Remove loading from dependencies to prevent infinite loops
 
   const verifyToken = async (retryCount = 0) => {
    // Prevent multiple simultaneous verifications
    if (verifyToken.isRunning) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Token verification already running, skipping...');
      }
      return;
    }
    
    verifyToken.isRunning = true;
    
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('=== AUTH CONTEXT: Verifying token ===');
        console.log('Retry attempt:', retryCount);
      }
      
      const response = await api.get('/api/verify');
      if (process.env.NODE_ENV === 'development') {
        console.log('Token verification successful:', response.data);
      }
      
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        if (process.env.NODE_ENV === 'development') {
          console.log('User state updated:', response.data.user);
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('Token verification failed - no user data');
        }
        // Don't logout immediately, just set loading to false
        setLoading(false);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('=== AUTH CONTEXT: Token verification failed ===');
        console.error('Error details:', error);
        console.error('Response data:', error.response?.data);
      }
      
      // Retry logic for network errors
      if (retryCount < 2 && (!error.response || error.code === 'ERR_NETWORK')) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Network error, retrying... (${retryCount + 1}/3)`);
        }
        setTimeout(() => verifyToken(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
      
      // Handle different types of errors
      if (error.response?.status === 403) {
        // Handle ban/suspension responses
        const errorData = error.response?.data;
        if (errorData?.status && ['banned', 'suspended'].includes(errorData.status)) {
          if (process.env.NODE_ENV === 'development') {
            console.log('User is banned/suspended:', errorData.status);
          }
          setBanInfo({
            status: errorData.status,
            message: errorData.message || 'Your account has been restricted'
          });
          logout();
          return;
        }
      } else if (error.response?.status === 401) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message;
        
        if (errorMessage === 'Invalid token' || errorMessage === 'Invalid or expired token') {
          if (process.env.NODE_ENV === 'development') {
            console.log('Invalid/expired token error - logging out');
          }
          logout();
        } else if (errorMessage === 'User not found') {
          if (process.env.NODE_ENV === 'development') {
            console.log('User not found error - this might be a temporary issue, not logging out');
          }
          // Don't logout for user not found, just set loading to false
          setLoading(false);
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('Other 401 error - not logging out, setting loading to false');
          }
          setLoading(false);
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('Non-critical error - not logging out, setting loading to false');
        }
        setLoading(false);
      }
    } finally {
      verifyToken.isRunning = false;
    }
  };

  const login = async (loginData) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('=== AUTH CONTEXT: Login attempt ===');
        console.log('Login data:', loginData);
      }
      
      const response = await api.post('/api/login', loginData);
      if (process.env.NODE_ENV === 'development') {
        console.log('Login API response:', response.data);
      }
      
      if (response.data.success && response.data.token && response.data.user) {
        const { token: newToken, user: userData } = response.data;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Login successful, setting token and user');
          console.log('Wallet balance from login:', userData.wallet_balance);
        }
        
        // Set token first (this will trigger useEffect)
        setToken(newToken);
        localStorage.setItem('token', newToken);
        
        // Set user immediately for immediate UI update
        setUser(userData);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Login completed successfully');
        }
        return { 
          success: true, 
          user: userData,
          token: newToken
        };
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('Login API returned invalid response');
        }
        return { 
          success: false, 
          error: 'Invalid response from server'
        };
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('=== AUTH CONTEXT: Login failed ===');
        console.error('Error details:', error);
        console.error('Response data:', error.response?.data);
      }
      
      // Handle ban/suspension responses
      if (error.response?.status === 403) {
        const errorData = error.response?.data;
        if (errorData?.status && ['banned', 'suspended'].includes(errorData.status)) {
          setBanInfo({
            status: errorData.status,
            message: errorData.message || 'Your account has been restricted'
          });
          return { 
            success: false, 
            error: errorData.error || 'Account restricted',
            status: errorData.status
          };
        }
      }
      
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  const syncWallet = async () => {
    // Prevent multiple simultaneous syncs
    if (syncWallet.isRunning) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Wallet sync already running, skipping...');
      }
      return { success: false, error: 'Sync already in progress' };
    }
    
    syncWallet.isRunning = true;
    
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('=== AUTH CONTEXT: Syncing wallet ===');
      }
      
      const response = await api.get('/api/sync-wallet');
      
      if (response.data.success && response.data.wallet_balance !== undefined) {
        const newBalance = response.data.wallet_balance;
        
        setUser(prevUser => {
          if (prevUser && prevUser.wallet_balance !== newBalance) {
            if (process.env.NODE_ENV === 'development') {
              console.log('Wallet balance updated:', prevUser.wallet_balance, '->', newBalance);
            }
            return { ...prevUser, wallet_balance: newBalance };
          }
          return prevUser;
        });
        
        return { success: true, wallet_balance: newBalance };
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('Wallet sync failed - invalid response');
        }
        return { success: false, error: 'Invalid response from server' };
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Wallet sync error:', error);
      }
      return { success: false, error: 'Wallet sync failed' };
    } finally {
      syncWallet.isRunning = false;
    }
  };

  const logout = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('=== AUTH CONTEXT: Logging out ===');
    }
    
    // Clear state
    setUser(null);
    setToken(null);
    
    // Clear localStorage
    localStorage.removeItem('token');
    
    // Clear api header
    delete api.defaults.headers.common['Authorization'];
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Logout completed');
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await api.post('/api/change-password', {
        currentPassword,
        newPassword
      });
      
      return { success: true, message: response.data.message };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Password change failed:', error);
      }
      return { 
        success: false, 
        error: error.response?.data?.error || 'Password change failed'
      };
    }
  };

  const refreshSession = async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('=== AUTH CONTEXT: Manual session refresh ===');
      }
      const response = await api.get('/api/verify');
      
      if (response.data.success && response.data.user) {
        const updatedUser = response.data.user;
        if (process.env.NODE_ENV === 'development') {
          console.log('Session refreshed successfully');
          console.log('Wallet balance from refresh:', updatedUser.wallet_balance);
        }
        
        setUser(updatedUser);
        setLastActivity(Date.now());
        
        return { success: true };
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('Session refresh failed');
        }
        return { success: false, error: 'Failed to refresh session' };
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Session refresh error:', error);
      }
      return { success: false, error: 'Session refresh failed' };
    }
  };

  const clearBanInfo = () => {
    setBanInfo(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    banInfo,
    login,
    logout,
    changePassword,
    refreshSession,
    syncWallet,
    clearBanInfo
  };

  // Only log state changes in development mode and when there are actual changes
  if (process.env.NODE_ENV === 'development') {
    // Use useEffect to log only when values actually change, not on every render
    useEffect(() => {
      console.log('=== AUTH CONTEXT: State Updated ===');
      console.log('User:', user ? 'exists' : 'none');
      console.log('Token:', token ? 'exists' : 'none');
      console.log('Loading:', loading);
      console.log('Is authenticated:', !!user);
    }, [user, token, loading]);
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      {banInfo && (
        <BanNotification
          status={banInfo.status}
          message={banInfo.message}
          onClose={clearBanInfo}
        />
      )}
    </AuthContext.Provider>
  );
};
