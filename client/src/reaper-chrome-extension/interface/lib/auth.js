/**
 * Reaper Chrome Extension Authentication System
 * Handles registration key validation, user authentication, and secure communication
 */

class ReaperAuth {
    constructor() {
        this.API_BASE = 'https://reaper-market.com/api';
        this.ENDPOINTS = {
            VERIFY_KEY: '/verify-key',
            VALIDATE_EXTENSION: '/validate-extension',
            GET_USER_PROFILE: '/user/profile',
            REFRESH_TOKEN: '/auth/refresh',
            LOGOUT: '/auth/logout'
        };
        
        this.STORAGE_KEYS = {
            ACTIVATION_KEY: 'activationKey',
            USER_PROFILE: 'userProfile',
            AUTH_TOKEN: 'authToken',
            REFRESH_TOKEN: 'refreshToken',
            EXPIRES_AT: 'expiresAt',
            EXTENSION_ID: 'extensionId',
            FIRST_LAUNCH: 'firstLaunchSeen',
            LAST_SYNC: 'lastSync'
        };
        
        this.isAuthenticated = false;
        this.userProfile = null;
        this.authToken = null;
        this.refreshToken = null;
        this.expiresAt = null;
    }

    /**
     * Initialize authentication system
     */
    async initialize() {
        try {
            console.log('Initializing Reaper Authentication...');
            
            // Get stored authentication data
            const stored = await this.getStoredAuth();
            
            if (stored.activationKey && stored.authToken) {
                // Validate existing authentication
                const isValid = await this.validateExistingAuth(stored);
                if (isValid) {
                    this.isAuthenticated = true;
                    this.userProfile = stored.userProfile;
                    this.authToken = stored.authToken;
                    this.refreshToken = stored.refreshToken;
                    this.expiresAt = stored.expiresAt;
                    
                    console.log('Authentication restored successfully');
                    return true;
                }
            }
            
            console.log('No valid authentication found');
            return false;
        } catch (error) {
            console.error('Authentication initialization failed:', error);
            return false;
        }
    }

    /**
     * Get stored authentication data from Chrome storage
     */
    async getStoredAuth() {
        try {
            const result = await chrome.storage.local.get([
                this.STORAGE_KEYS.ACTIVATION_KEY,
                this.STORAGE_KEYS.USER_PROFILE,
                this.STORAGE_KEYS.AUTH_TOKEN,
                this.STORAGE_KEYS.REFRESH_TOKEN,
                this.STORAGE_KEYS.EXPIRES_AT,
                this.STORAGE_KEYS.EXTENSION_ID
            ]);
            
            return {
                activationKey: result[this.STORAGE_KEYS.ACTIVATION_KEY] || null,
                userProfile: result[this.STORAGE_KEYS.USER_PROFILE] || null,
                authToken: result[this.STORAGE_KEYS.AUTH_TOKEN] || null,
                refreshToken: result[this.STORAGE_KEYS.REFRESH_TOKEN] || null,
                expiresAt: result[this.STORAGE_KEYS.EXPIRES_AT] || null,
                extensionId: result[this.STORAGE_KEYS.EXTENSION_ID] || chrome.runtime.id
            };
        } catch (error) {
            console.error('Failed to get stored auth:', error);
            return {};
        }
    }

    /**
     * Validate existing authentication
     */
    async validateExistingAuth(stored) {
        try {
            // Check if token is expired
            if (stored.expiresAt && new Date() > new Date(stored.expiresAt)) {
                console.log('Token expired, attempting refresh...');
                return await this.refreshAuthToken(stored.refreshToken);
            }
            
            // Validate token with server
            const response = await this.makeAuthenticatedRequest(
                this.ENDPOINTS.VALIDATE_EXTENSION,
                'POST',
                {
                    extensionId: stored.extensionId,
                    activationKey: stored.activationKey
                }
            );
            
            return response.success;
        } catch (error) {
            console.error('Existing auth validation failed:', error);
            return false;
        }
    }

    /**
     * Activate extension with registration key
     */
    async activateExtension(activationKey) {
        try {
            console.log('Activating extension with key:', activationKey);
            
            // Validate activation key format
            if (!this.isValidKeyFormat(activationKey)) {
                throw new Error('Invalid activation key format');
            }
            
            // Send activation request to marketplace
            const response = await fetch(`${this.API_BASE}${this.ENDPOINTS.VERIFY_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Reaper-Chrome-Extension/1.1.0'
                },
                body: JSON.stringify({
                    key: activationKey,
                    extensionId: chrome.runtime.id,
                    extensionVersion: chrome.runtime.getManifest().version,
                    platform: navigator.platform,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Store authentication data
                await this.storeAuthData(activationKey, data);
                
                // Set authentication state
                this.isAuthenticated = true;
                this.userProfile = data.userProfile;
                this.authToken = data.authToken;
                this.refreshToken = data.refreshToken;
                this.expiresAt = data.expiresAt;
                
                console.log('Extension activated successfully for user:', data.userProfile.username);
                return {
                    success: true,
                    userProfile: data.userProfile,
                    message: 'Extension activated successfully!'
                };
            } else {
                throw new Error(data.error || 'Activation failed');
            }
        } catch (error) {
            console.error('Extension activation failed:', error);
            throw error;
        }
    }

    /**
     * Store authentication data in Chrome storage
     */
    async storeAuthData(activationKey, authData) {
        try {
            const dataToStore = {
                [this.STORAGE_KEYS.ACTIVATION_KEY]: activationKey,
                [this.STORAGE_KEYS.USER_PROFILE]: authData.userProfile,
                [this.STORAGE_KEYS.AUTH_TOKEN]: authData.authToken,
                [this.STORAGE_KEYS.REFRESH_TOKEN]: authData.refreshToken,
                [this.STORAGE_KEYS.EXPIRES_AT]: authData.expiresAt,
                [this.STORAGE_KEYS.EXTENSION_ID]: chrome.runtime.id,
                [this.STORAGE_KEYS.LAST_SYNC]: new Date().toISOString()
            };
            
            await chrome.storage.local.set(dataToStore);
            console.log('Authentication data stored successfully');
        } catch (error) {
            console.error('Failed to store auth data:', error);
            throw error;
        }
    }

    /**
     * Refresh authentication token
     */
    async refreshAuthToken(refreshToken) {
        try {
            console.log('Refreshing authentication token...');
            
            const response = await fetch(`${this.API_BASE}${this.ENDPOINTS.REFRESH_TOKEN}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${refreshToken}`
                },
                body: JSON.stringify({
                    extensionId: chrome.runtime.id
                })
            });
            
            if (!response.ok) {
                throw new Error(`Token refresh failed: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Update stored tokens
                await chrome.storage.local.set({
                    [this.STORAGE_KEYS.AUTH_TOKEN]: data.authToken,
                    [this.STORAGE_KEYS.EXPIRES_AT]: data.expiresAt,
                    [this.STORAGE_KEYS.LAST_SYNC]: new Date().toISOString()
                });
                
                this.authToken = data.authToken;
                this.expiresAt = data.expiresAt;
                
                console.log('Token refreshed successfully');
                return true;
            } else {
                throw new Error('Token refresh failed');
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            return false;
        }
    }

    /**
     * Make authenticated request to marketplace API
     */
    async makeAuthenticatedRequest(endpoint, method = 'GET', body = null) {
        try {
            if (!this.isAuthenticated || !this.authToken) {
                throw new Error('Not authenticated');
            }
            
            // Check if token needs refresh
            if (this.expiresAt && new Date() > new Date(this.expiresAt)) {
                const refreshed = await this.refreshAuthToken(this.refreshToken);
                if (!refreshed) {
                    throw new Error('Token refresh failed');
                }
            }
            
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`,
                    'User-Agent': 'Reaper-Chrome-Extension/1.1.0',
                    'X-Extension-ID': chrome.runtime.id
                }
            };
            
            if (body) {
                options.body = JSON.stringify(body);
            }
            
            const response = await fetch(`${this.API_BASE}${endpoint}`, options);
            
            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired, try to refresh
                    const refreshed = await this.refreshAuthToken(this.refreshToken);
                    if (refreshed) {
                        // Retry request with new token
                        options.headers.Authorization = `Bearer ${this.authToken}`;
                        const retryResponse = await fetch(`${this.API_BASE}${endpoint}`, options);
                        return await retryResponse.json();
                    } else {
                        throw new Error('Authentication failed');
                    }
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Authenticated request failed:', error);
            throw error;
        }
    }

    /**
     * Get user profile from marketplace
     */
    async getUserProfile() {
        try {
            if (!this.isAuthenticated) {
                throw new Error('Not authenticated');
            }
            
            const response = await this.makeAuthenticatedRequest(this.ENDPOINTS.GET_USER_PROFILE);
            
            if (response.success) {
                this.userProfile = response.userProfile;
                // Update stored profile
                await chrome.storage.local.set({
                    [this.STORAGE_KEYS.USER_PROFILE]: response.userProfile,
                    [this.STORAGE_KEYS.LAST_SYNC]: new Date().toISOString()
                });
                
                return response.userProfile;
            } else {
                throw new Error(response.error || 'Failed to get user profile');
            }
        } catch (error) {
            console.error('Failed to get user profile:', error);
            throw error;
        }
    }

    /**
     * Logout and clear authentication
     */
    async logout() {
        try {
            if (this.isAuthenticated && this.authToken) {
                // Notify server about logout
                try {
                    await fetch(`${this.API_BASE}${this.ENDPOINTS.LOGOUT}`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${this.authToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            extensionId: chrome.runtime.id
                        })
                    });
                } catch (error) {
                    console.warn('Failed to notify server about logout:', error);
                }
            }
            
            // Clear stored authentication data
            await chrome.storage.local.remove([
                this.STORAGE_KEYS.ACTIVATION_KEY,
                this.STORAGE_KEYS.USER_PROFILE,
                this.STORAGE_KEYS.AUTH_TOKEN,
                this.STORAGE_KEYS.REFRESH_TOKEN,
                this.STORAGE_KEYS.EXPIRES_AT,
                this.STORAGE_KEYS.LAST_SYNC
            ]);
            
            // Reset authentication state
            this.isAuthenticated = false;
            this.userProfile = null;
            this.authToken = null;
            this.refreshToken = null;
            this.expiresAt = null;
            
            console.log('Logged out successfully');
            return true;
        } catch (error) {
            console.error('Logout failed:', error);
            return false;
        }
    }

    /**
     * Check if activation key format is valid
     */
    isValidKeyFormat(key) {
        // Expected format: REAPER-EXT-2024-XXXX-XXXX
        const keyPattern = /^REAPER-EXT-\d{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
        return keyPattern.test(key);
    }

    /**
     * Get authentication status
     */
    getAuthStatus() {
        return {
            isAuthenticated: this.isAuthenticated,
            userProfile: this.userProfile,
            expiresAt: this.expiresAt,
            extensionId: chrome.runtime.id
        };
    }

    /**
     * Check if authentication is expired
     */
    isExpired() {
        return this.expiresAt && new Date() > new Date(this.expiresAt);
    }

    /**
     * Get time until token expires
     */
    getTimeUntilExpiry() {
        if (!this.expiresAt) return null;
        
        const now = new Date();
        const expiry = new Date(this.expiresAt);
        const diff = expiry - now;
        
        if (diff <= 0) return 0;
        
        return {
            milliseconds: diff,
            seconds: Math.floor(diff / 1000),
            minutes: Math.floor(diff / 60000),
            hours: Math.floor(diff / 3600000)
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReaperAuth;
} else if (typeof window !== 'undefined') {
    window.ReaperAuth = ReaperAuth;
}
