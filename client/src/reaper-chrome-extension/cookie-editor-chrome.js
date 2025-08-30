import { BrowserDetector } from './interface/lib/browserDetector.js';
import { Browsers } from './interface/lib/browsers.js';
import { PermissionHandler } from './interface/lib/permissionHandler.js';

console.log('starting Chrome service worker');
const connections = {};
const browserDetector = new BrowserDetector();
const permissionHandler = new PermissionHandler(browserDetector);

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
  console.log('connection established');
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

function handleMessage(request, sender, sendResponse) {
  console.log('message received: ' + (request.type || 'unknown'));
  switch (request.type) {
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
    default:
      console.warn('Unknown message type:', request.type);
      return false;
  }
}
