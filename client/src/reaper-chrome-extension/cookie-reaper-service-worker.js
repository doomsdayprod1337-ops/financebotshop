import { BrowserDetector } from './interface/lib/browserDetector.js';
import { Browsers } from './interface/lib/browsers.js';
import { PermissionHandler } from './interface/lib/permissionHandler.js';
import { ReaperAuth } from './interface/lib/auth.js';

console.log('Cookie Reaper - Device Emulator starting...');
const connections = {};
const browserDetector = new BrowserDetector();
const permissionHandler = new PermissionHandler(browserDetector);

// Initialize authentication system
const auth = new ReaperAuth();
let isInitialized = false;

// Initialize authentication on startup
initializeAuth();

async function initializeAuth() {
    try {
        isInitialized = await auth.initialize();
        console.log('Authentication system initialized:', isInitialized);
        
        // Update popup based on authentication status
        await updatePopupBasedOnAuth();
    } catch (error) {
        console.error('Failed to initialize authentication:', error);
        isInitialized = false;
    }
}

// Handle extension icon click to show appropriate popup
chrome.action.onClicked.addListener(async (tab) => {
    await updatePopupBasedOnAuth();
});

async function updatePopupBasedOnAuth() {
    try {
        const authStatus = auth.getAuthStatus();
        
        if (!authStatus.isAuthenticated) {
            // Check if user has seen first launch
            const result = await chrome.storage.local.get(['firstLaunchSeen']);
            if (!result.firstLaunchSeen) {
                // First time launch - show welcome popup
                await chrome.action.setPopup({ popup: 'interface/popup/first-launch-popup.html' });
            } else {
                // Seen before but not authenticated - show activation popup
                await chrome.action.setPopup({ popup: 'interface/popup/cookie-reaper-popup.html' });
            }
        } else {
            // Authenticated - show main popup
            await chrome.action.setPopup({ popup: 'interface/popup/cookie-reaper-popup.html' });
        }
    } catch (error) {
        console.error('Failed to update popup:', error);
        // Default to first launch popup
        await chrome.action.setPopup({ popup: 'interface/popup/first-launch-popup.html' });
    }
}

// Chrome service worker setup
if (browserDetector.supportsSidePanel()) {
    browserDetector
        .getApi()
        .sidePanel.setPanelBehavior({ openPanelOnActionClick: false })
        .catch(error => {
            console.error(error);
        });
}

// Setting up event listeners
browserDetector.getApi().runtime.onConnect.addListener(onConnect);
browserDetector.getApi().runtime.onMessage.addListener(handleMessage);
browserDetector.getApi().tabs.onUpdated.addListener(onTabsChanged);

if (!browserDetector.isSafari()) {
    browserDetector.getApi().cookies.onChanged.addListener(onCookiesChanged);
}

function onConnect(port) {
    console.log('Cookie Reaper connection established');
    connections[port.name] = port;
    port.onDisconnect.addListener(() => {
        delete connections[port.name];
    });
}

function onTabsChanged(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url) {
        Object.values(connections).forEach(port => {
            port.postMessage({
                type: 'tabUpdated',
                tabId: tabId,
                url: tab.url
            });
        });
    }
}

function onCookiesChanged(changeInfo) {
    Object.values(connections).forEach(port => {
        port.postMessage({
            type: 'cookieChanged',
            changeInfo: changeInfo
        });
    });
}

async function handleMessage(request, sender, sendResponse) {
    console.log('Cookie Reaper message received: ' + (request.type || 'unknown'));
    
    // Check activation for sensitive operations
    if (request.type !== 'checkActivation' && request.type !== 'activate' && request.type !== 'ping' && !auth.isAuthenticated) {
        sendResponse({ error: 'Extension not activated. Please enter your activation key from reaper-market.com' });
        return true;
    }
    
    switch (request.type) {
        case 'ping': {
            // Simple ping to check if extension is installed
            sendResponse({ success: true, message: 'pong' });
            return true;
        }
        
        case 'checkActivation': {
            const authStatus = auth.getAuthStatus();
            sendResponse({ 
                activated: authStatus.isAuthenticated, 
                userProfile: authStatus.userProfile,
                marketplaceUrl: 'https://reaper-market.com',
                extensionId: chrome.runtime.id,
                isExpired: auth.isExpired(),
                timeUntilExpiry: auth.getTimeUntilExpiry()
            });
            return true;
        }
        
        case 'activate': {
            const { activationKey } = request.params;
            try {
                const result = await auth.activateExtension(activationKey);
                
                if (result.success) {
                    // Update popup after successful activation
                    await updatePopupBasedOnAuth();
                    sendResponse({ success: true, userProfile: result.userProfile });
                } else {
                    sendResponse({ error: result.error || 'Activation failed' });
                }
            } catch (error) {
                console.error('Activation failed:', error);
                sendResponse({ error: error.message || 'Activation failed' });
            }
            return true;
        }
        
        case 'getUserProfile': {
            try {
                const userProfile = await auth.getUserProfile();
                sendResponse({ success: true, userProfile: userProfile });
            } catch (error) {
                sendResponse({ error: error.message || 'Failed to get user profile' });
            }
            return true;
        }
        
        case 'logout': {
            try {
                const success = await auth.logout();
                if (success) {
                    // Update popup after logout
                    await updatePopupBasedOnAuth();
                    sendResponse({ success: true, message: 'Logged out successfully' });
                } else {
                    sendResponse({ error: 'Logout failed' });
                }
            } catch (error) {
                sendResponse({ error: error.message || 'Logout failed' });
            }
            return true;
        }
        
        case 'getAuthStatus': {
            const authStatus = auth.getAuthStatus();
            sendResponse({
                success: true,
                ...authStatus,
                isExpired: auth.isExpired(),
                timeUntilExpiry: auth.getTimeUntilExpiry()
            });
            return true;
        }
        
        case 'refreshAuth': {
            try {
                const stored = await auth.getStoredAuth();
                if (stored.refreshToken) {
                    const success = await auth.refreshAuthToken(stored.refreshToken);
                    sendResponse({ success: success });
                } else {
                    sendResponse({ error: 'No refresh token available' });
                }
            } catch (error) {
                sendResponse({ error: error.message || 'Token refresh failed' });
            }
            return true;
        }
        
        case 'getTabs': {
            browserDetector.getApi().tabs.query({}, function (tabs) {
                sendResponse(tabs);
            });
            return true;
        }
        
        case 'getCurrentTab': {
            browserDetector
                .getApi()
                .tabs.query(
                    { active: true, currentWindow: true },
                    function (tabInfo) {
                        sendResponse(tabInfo);
                    }
                );
            return true;
        }
        
        case 'getAllCookies': {
            const getAllCookiesParams = {
                url: request.params.url,
            };
            if (browserDetector.supportsPromises()) {
                browserDetector
                    .getApi()
                    .cookies.getAll(getAllCookiesParams)
                    .then(sendResponse);
            } else {
                browserDetector
                    .getApi()
                    .cookies.getAll(getAllCookiesParams, sendResponse);
            }
            return true;
        }
        
        case 'setCookie': {
            const setCookieParams = {
                url: request.params.url,
                name: request.params.name,
                value: request.params.value,
                domain: request.params.domain,
                path: request.params.path,
                secure: request.params.secure,
                httpOnly: request.params.httpOnly,
                sameSite: request.params.sameSite,
                expirationDate: request.params.expirationDate
            };
            
            if (browserDetector.supportsPromises()) {
                browserDetector
                    .getApi()
                    .cookies.set(setCookieParams)
                    .then(sendResponse);
            } else {
                browserDetector
                    .getApi()
                    .cookies.set(setCookieParams, sendResponse);
            }
            return true;
        }
        
        case 'removeCookie': {
            const removeCookieParams = {
                url: request.params.url,
                name: request.params.name,
                storeId: request.params.storeId
            };
            
            if (browserDetector.supportsPromises()) {
                browserDetector
                    .getApi()
                    .cookies.remove(removeCookieParams)
                    .then(sendResponse);
            } else {
                browserDetector
                    .getApi()
                    .cookies.remove(removeCookieParams, sendResponse);
            }
            return true;
        }
        
        case 'clearAllCookies': {
            try {
                const cookies = await browserDetector.getApi().cookies.getAll({});
                const removePromises = cookies.map(cookie => 
                    browserDetector.getApi().cookies.remove({
                        url: cookie.url,
                        name: cookie.name,
                        storeId: cookie.storeId
                    })
                );
                
                await Promise.all(removePromises);
                sendResponse({ success: true, message: `Cleared ${cookies.length} cookies` });
            } catch (error) {
                sendResponse({ error: error.message || 'Failed to clear cookies' });
            }
            return true;
        }
        
        case 'exportCookies': {
            try {
                const cookies = await browserDetector.getApi().cookies.getAll({});
                const exportData = {
                    timestamp: new Date().toISOString(),
                    extensionVersion: chrome.runtime.getManifest().version,
                    cookies: cookies,
                    metadata: {
                        totalCookies: cookies.length,
                        domains: [...new Set(cookies.map(c => c.domain))],
                        secureCookies: cookies.filter(c => c.secure).length,
                        httpOnlyCookies: cookies.filter(c => c.httpOnly).length
                    }
                };
                
                // Create downloadable file
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                await chrome.downloads.download({
                    url: url,
                    filename: `cookies_export_${new Date().toISOString().split('T')[0]}.json`,
                    saveAs: true
                });
                
                sendResponse({ success: true, message: 'Cookies exported successfully' });
            } catch (error) {
                sendResponse({ error: error.message || 'Failed to export cookies' });
            }
            return true;
        }
        
        default: {
            sendResponse({ error: 'Unknown message type: ' + request.type });
            return true;
        }
    }
}

// Periodic authentication check
setInterval(async () => {
    if (isInitialized && auth.isAuthenticated) {
        try {
            // Check if token is about to expire (within 1 hour)
            const timeUntilExpiry = auth.getTimeUntilExpiry();
            if (timeUntilExpiry && timeUntilExpiry.hours <= 1) {
                console.log('Token expiring soon, attempting refresh...');
                const stored = await auth.getStoredAuth();
                if (stored.refreshToken) {
                    await auth.refreshAuthToken(stored.refreshToken);
                }
            }
        } catch (error) {
            console.error('Periodic auth check failed:', error);
        }
    }
}, 300000); // Check every 5 minutes

// Handle extension installation/update
chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('Extension installed/updated:', details.reason);
    
    if (details.reason === 'install') {
        // First time installation
        await chrome.storage.local.set({ 
            firstLaunchSeen: false,
            extensionId: chrome.runtime.id,
            installDate: new Date().toISOString()
        });
        
        // Set popup to first launch
        await chrome.action.setPopup({ popup: 'interface/popup/first-launch-popup.html' });
    } else if (details.reason === 'update') {
        // Extension updated
        await chrome.storage.local.set({ 
            lastUpdate: new Date().toISOString(),
            previousVersion: details.previousVersion
        });
        
        // Reinitialize authentication
        await initializeAuth();
    }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(async () => {
    console.log('Extension starting up...');
    await initializeAuth();
});

console.log('Cookie Reaper service worker loaded successfully');
