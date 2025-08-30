import React, { useState } from 'react';

const Software = () => {
  const [isExtensionInstalled, setIsExtensionInstalled] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [checkMessage, setCheckMessage] = useState('');
  const [activationKey] = useState('REAPER-EXT-2024-XXXX-XXXX');
  
  // Extension ID - this should match your actual Chrome extension ID
  const EXTENSION_ID = 'abcdefghijklmnopqrstuvwxyz123456';
  
  const checkExtensionInstallation = async () => {
    setIsChecking(true);
    setCheckMessage('');
    
    try {
      // Method 1: Try to detect extension by attempting to connect to it
      const isInstalled = await detectExtension();
      
      if (isInstalled) {
        setIsExtensionInstalled(true);
        setCheckMessage('✅ Extension detected! Launching...');
        
        // Launch the extension popup
        await launchExtension();
        
        setTimeout(() => {
          setCheckMessage('🚀 Extension launched successfully!');
        }, 1000);
      } else {
        setIsExtensionInstalled(false);
        setCheckMessage('❌ Extension not found. Please install from Chrome Web Store first.');
      }
    } catch (error) {
      console.error('Extension check error:', error);
      setIsExtensionInstalled(false);
      setCheckMessage('❌ Error checking extension: ' + error.message);
    } finally {
      setIsChecking(false);
    }
  };
  
  const detectExtension = async () => {
    return new Promise((resolve) => {
      // Try to detect if extension is installed by checking if we can access it
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        // Check if we can send a message to our extension
        chrome.runtime.sendMessage(EXTENSION_ID, { action: 'ping' }, (response) => {
          if (chrome.runtime.lastError) {
            // Extension not installed or not accessible
            resolve(false);
          } else {
            // Extension responded
            resolve(true);
          }
        });
      } else {
        // Chrome extension APIs not available
        resolve(false);
      }
      
      // Fallback: Check if extension element exists in DOM
      setTimeout(() => {
        const extensionElement = document.querySelector(`[data-extension-id="${EXTENSION_ID}"]`);
        if (extensionElement) {
          resolve(true);
        } else {
          // Try to detect by checking for extension-specific CSS or elements
          const hasExtensionStyles = document.querySelector('link[href*="chrome-extension://"]');
          if (hasExtensionStyles) {
            resolve(true);
          } else {
            resolve(false);
          }
        }
      }, 100);
    });
  };
  
  const launchExtension = async () => {
    try {
      // Method 1: Try to open extension popup programmatically
      if (typeof chrome !== 'undefined' && chrome.action && chrome.action.openPopup) {
        chrome.action.openPopup();
        return;
      }
      
      // Method 2: Try to send message to extension to open popup
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage(EXTENSION_ID, { 
          action: 'openPopup',
          target: 'first-launch-popup.js'
        });
        return;
      }
      
      // Method 3: Try to navigate to extension popup URL
      const popupUrl = `chrome-extension://${EXTENSION_ID}/interface/popup/first-launch-popup.js`;
      
      // Check if the popup file exists
      const response = await fetch(popupUrl);
      if (response.ok) {
        // Try to open in new tab or window
        window.open(popupUrl, '_blank');
      } else {
        throw new Error('Popup file not accessible');
      }
      
    } catch (error) {
      console.error('Error launching extension:', error);
      throw new Error('Failed to launch extension popup');
    }
  };
  
  const downloadExtension = () => {
    // Chrome Web Store URL - replace with your actual extension URL
    const chromeWebStoreUrl = `https://chrome.google.com/webstore/detail/your-extension-name/${EXTENSION_ID}`;
    window.open(chromeWebStoreUrl, '_blank');
  };

  return (
    <div className="space-y-6 relative min-h-screen">
      <h1 className="text-3xl font-bold text-white">Software & Tools</h1>
      
      {/* Chrome Extension Card */}
      <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg p-6 border border-blue-500/30">
        <div className="flex items-center space-x-4">
          <div className="text-4xl">🌐</div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">Reaper Market Chrome Extension</h3>
            <p className="text-blue-200 text-sm mb-3">
              Official browser extension for seamless marketplace integration and enhanced functionality
            </p>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isExtensionInstalled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-300">
                  {isExtensionInstalled ? 'Extension Active' : 'Extension Not Detected'}
                </span>
              </div>
              <span className="text-xs text-gray-400 px-2 py-1 bg-gray-700 rounded">
                v2.1.4
              </span>
            </div>
            
            {/* Check Message Display */}
            {checkMessage && (
              <div className={`mt-3 p-3 rounded-lg text-sm ${
                checkMessage.includes('✅') || checkMessage.includes('🚀')
                  ? 'bg-green-900/20 border border-green-700 text-green-300'
                  : 'bg-red-900/20 border border-red-700 text-red-300'
              }`}>
                {checkMessage}
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Extension Features */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">🚀 Key Features</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center space-x-2">
                <span className="text-green-400">✓</span>
                <span>Auto-login to marketplace</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-green-400">✓</span>
                <span>Real-time notifications</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-green-400">✓</span>
                <span>Quick access to tools</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-green-400">✓</span>
                <span>Enhanced security features</span>
              </li>
            </ul>
          </div>
          
          {/* Installation Instructions */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">📥 Installation</h4>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <span className="text-blue-400">1.</span>
                <span>Download from Chrome Web Store</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-400">2.</span>
                <span>Install and enable extension</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-400">3.</span>
                <span>Use activation key below</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-400">4.</span>
                <span>Extension will auto-bind to account</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button 
            onClick={downloadExtension}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <span>🌐</span>
            <span>Download Extension</span>
          </button>
          <button 
            onClick={checkExtensionInstallation}
            disabled={isChecking}
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              isExtensionInstalled 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
            } ${isChecking ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span>{isChecking ? '🔄' : isExtensionInstalled ? '✅' : '🔍'}</span>
            <span>{isChecking ? 'Checking...' : isExtensionInstalled ? 'Extension Active' : 'Check Installation'}</span>
          </button>
          <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2">
            <span>📖</span>
            <span>View Documentation</span>
          </button>
        </div>
        
        {/* Extension ID Display for Debugging */}
        <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
          <div className="text-xs text-gray-400 mb-1">Extension ID (for developers):</div>
          <div className="font-mono text-sm text-gray-300 break-all">{EXTENSION_ID}</div>
        </div>
      </div>

      {/* Original Reaper Software Section */}
      <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 text-center">
        <div className="text-6xl mb-4">⚙️</div>
        <h3 className="text-lg font-medium text-white mb-2">Reaper Software</h3>
        <p className="text-gray-400">Download Reaper Market tools and anti-detect software</p>
        <div className="mt-4 text-sm text-gray-500">
          <p>Version: 7.2 | 22.2</p>
        </div>
      </div>

      {/* Fixed Activation Key at Bottom Middle */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-full px-6 py-3 shadow-2xl border-2 border-white/20">
          <div className="flex items-center space-x-3">
            <div className="text-white text-lg">🔑</div>
            <div className="text-center">
              <div className="text-white text-sm font-medium">Activation Key</div>
              <div className="text-white font-mono text-lg font-bold tracking-wider">
                {activationKey}
              </div>
            </div>
            <button 
              onClick={() => navigator.clipboard.writeText(activationKey)}
              className="text-white hover:text-blue-200 transition-colors"
              title="Copy to clipboard"
            >
              📋
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Software;
