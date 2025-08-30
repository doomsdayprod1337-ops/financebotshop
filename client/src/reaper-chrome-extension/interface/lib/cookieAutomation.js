/**
 * Cookie Automation Handler
 * Handles automated loading and validation of cookies from text files
 */
export class CookieAutomation {
  constructor(browserDetector, storageHandler) {
    this.browserDetector = browserDetector;
    this.storageHandler = storageHandler;
    this.loadedCookies = [];
    this.validationResults = [];
  }

  /**
   * Loads cookies from file input elements
   * @param {FileList} files - FileList from file input
   * @returns {Array} Array of parsed cookies
   */
  async loadCookiesFromFiles(files) {
    this.loadedCookies = [];
    
    for (const file of files) {
      try {
        const cookies = await this.parseCookieFile(file);
        this.loadedCookies.push(...cookies);
      } catch (error) {
        console.error(`Error parsing file ${file.name}:`, error);
        throw new Error(`Failed to parse ${file.name}: ${error.message}`);
      }
    }
    
    // Store loaded cookies count
    await this.storageHandler.set('cookieAutomationLoadedCount', this.loadedCookies.length);
    
    return this.loadedCookies;
  }

  /**
   * Parses a single cookie file
   * @param {File} file - File object to parse
   * @returns {Array} Array of parsed cookies
   */
  async parseCookieFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const text = event.target.result;
          
          // Import and parse using existing NetscapeFormat
          import('./netscapeFormat.js').then(({ NetscapeFormat }) => {
            try {
              const cookies = NetscapeFormat.parse(text);
              resolve(cookies);
            } catch (parseError) {
              reject(new Error(`Invalid Netscape format: ${parseError.message}`));
            }
          }).catch(reject);
          
        } catch (error) {
          reject(new Error(`File read error: ${error.message}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Gets the count of loaded cookies
   * @returns {number} Number of loaded cookies
   */
  async getLoadedCookieCount() {
    if (this.loadedCookies.length === 0) {
      return await this.storageHandler.get('cookieAutomationLoadedCount') || 0;
    }
    return this.loadedCookies.length;
  }

  /**
   * Gets the loaded cookies
   * @returns {Array} Array of loaded cookies
   */
  getLoadedCookies() {
    return this.loadedCookies;
  }

  /**
   * Applies cookies to the browser
   * @param {Array} cookies - Array of cookies to apply
   */
  async applyCookies(cookies) {
    const results = [];
    
    for (const cookie of cookies) {
      try {
        // Prepare cookie for browser
        const preparedCookie = this.prepareCookieForBrowser(cookie);
        
        // Set cookie using browser API
        await this.setCookie(preparedCookie);
        
        results.push({
          success: true,
          cookie: cookie,
          message: 'Cookie applied successfully'
        });
      } catch (error) {
        results.push({
          success: false,
          cookie: cookie,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Prepares a cookie object for browser consumption
   * @param {Object} cookie - Raw cookie object
   * @returns {Object} Prepared cookie object
   */
  prepareCookieForBrowser(cookie) {
    return {
      domain: cookie.domain,
      name: cookie.name,
      value: cookie.value,
      path: cookie.path || '/',
      secure: cookie.secure || false,
      httpOnly: cookie.httpOnly || false,
      expirationDate: cookie.expiration || null,
      sameSite: 'no_restriction'
    };
  }

  /**
   * Sets a cookie in the browser
   * @param {Object} cookie - Cookie object to set
   */
  async setCookie(cookie) {
    return new Promise((resolve, reject) => {
      const url = `https://${cookie.domain}${cookie.path}`;
      
      if (this.browserDetector.supportsPromises()) {
        this.browserDetector.getApi().cookies.set({
          ...cookie,
          url: url
        }).then(resolve).catch(reject);
      } else {
        this.browserDetector.getApi().cookies.set({
          ...cookie,
          url: url
        }, (result) => {
          if (this.browserDetector.getApi().runtime.lastError) {
            reject(new Error(this.browserDetector.getApi().runtime.lastError.message));
          } else {
            resolve(result);
          }
        });
      }
    });
  }

  /**
   * Refreshes a domain and captures a specific value to validate cookies
   * @param {string} domain - Domain to refresh
   * @param {string} validationSelector - CSS selector or identifier for validation
   * @returns {Object} Validation result
   */
  async validateDomain(domain, validationSelector) {
    try {
      // Create a new tab to test the domain
      const tab = await this.createTab(domain);
      
      // Wait for page to load
      await this.waitForPageLoad(tab.id);
      
      // Execute script to capture validation value
      const validationResult = await this.executeValidationScript(tab.id, validationSelector);
      
      // Close the tab
      await this.closeTab(tab.id);
      
      return {
        success: true,
        domain: domain,
        validationValue: validationResult,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        domain: domain,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Creates a new tab with the specified URL
   * @param {string} url - URL to open
   * @returns {Object} Tab object
   */
  async createTab(url) {
    return new Promise((resolve, reject) => {
      if (this.browserDetector.supportsPromises()) {
        this.browserDetector.getApi().tabs.create({ url: url })
          .then(resolve)
          .catch(reject);
      } else {
        this.browserDetector.getApi().tabs.create({ url: url }, (tab) => {
          if (this.browserDetector.getApi().runtime.lastError) {
            reject(new Error(this.browserDetector.getApi().runtime.lastError.message));
          } else {
            resolve(tab);
          }
        });
      }
    });
  }

  /**
   * Waits for a page to finish loading
   * @param {number} tabId - Tab ID to wait for
   */
  async waitForPageLoad(tabId) {
    return new Promise((resolve) => {
      const listener = (tabIdChanged, changeInfo) => {
        if (tabIdChanged === tabId && changeInfo.status === 'complete') {
          this.browserDetector.getApi().tabs.onUpdated.removeListener(listener);
          resolve();
        }
      };
      
      this.browserDetector.getApi().tabs.onUpdated.addListener(listener);
      
      // Timeout after 30 seconds
      setTimeout(() => {
        this.browserDetector.getApi().tabs.onUpdated.removeListener(listener);
        resolve();
      }, 30000);
    });
  }

  /**
   * Executes validation script in a tab
   * @param {number} tabId - Tab ID to execute script in
   * @param {string} validationSelector - CSS selector or identifier
   * @returns {string} Validation value
   */
  async executeValidationScript(tabId, validationSelector) {
    return new Promise((resolve, reject) => {
      const script = `
        (function() {
          try {
            // Try different validation methods
            let value = null;
            
            // Method 1: CSS selector
            if (document.querySelector('${validationSelector}')) {
              value = document.querySelector('${validationSelector}').textContent || 
                      document.querySelector('${validationSelector}').value ||
                      document.querySelector('${validationSelector}').innerHTML;
            }
            
            // Method 2: Look for common validation indicators
            if (!value) {
              const indicators = document.querySelectorAll('[class*="valid"], [class*="success"], [class*="logged"], [class*="auth"]');
              if (indicators.length > 0) {
                value = indicators[0].textContent || indicators[0].innerHTML;
              }
            }
            
            // Method 3: Check for specific text patterns
            if (!value) {
              const bodyText = document.body.textContent;
              if (bodyText.includes('Welcome') || bodyText.includes('Dashboard') || 
                  bodyText.includes('Profile') || bodyText.includes('Account')) {
                value = 'Authenticated';
              }
            }
            
            return value || 'No validation value found';
          } catch (error) {
            return 'Error: ' + error.message;
          }
        })();
      `;
      
      if (this.browserDetector.supportsPromises()) {
        this.browserDetector.getApi().tabs.executeScript(tabId, { code: script })
          .then(results => resolve(results[0]))
          .catch(reject);
      } else {
        this.browserDetector.getApi().tabs.executeScript(tabId, { code: script }, (results) => {
          if (this.browserDetector.getApi().runtime.lastError) {
            reject(new Error(this.browserDetector.getApi().runtime.lastError.message));
          } else {
            resolve(results[0]);
          }
        });
      }
    });
  }

  /**
   * Closes a tab
   * @param {number} tabId - Tab ID to close
   */
  async closeTab(tabId) {
    return new Promise((resolve, reject) => {
      if (this.browserDetector.supportsPromises()) {
        this.browserDetector.getApi().tabs.remove(tabId)
          .then(resolve)
          .catch(reject);
      } else {
        this.browserDetector.getApi().tabs.remove(tabId, () => {
          if (this.browserDetector.getApi().runtime.lastError) {
            reject(new Error(this.browserDetector.getApi().runtime.lastError.message));
          } else {
            resolve();
          }
        });
      }
    });
  }

  /**
   * Runs the complete automation process
   * @param {string} validationSelector - CSS selector for validation
   * @returns {Object} Complete automation results
   */
  async runAutomation(validationSelector = '.user-info, .profile, .dashboard') {
    try {
      // Check if cookies are loaded
      if (this.loadedCookies.length === 0) {
        throw new Error('No cookies loaded. Please select cookie files first.');
      }
      
      // Apply cookies to browser
      const applicationResults = await this.applyCookies(this.loadedCookies);
      
      // Get unique domains from cookies
      const domains = [...new Set(this.loadedCookies.map(cookie => cookie.domain))];
      
      // Validate each domain
      const validationResults = [];
      for (const domain of domains) {
        const result = await this.validateDomain(domain, validationSelector);
        validationResults.push(result);
      }
      
      // Store results
      this.validationResults = validationResults;
      await this.storageHandler.set('cookieAutomationResults', validationResults);
      
      return {
        success: true,
        cookiesLoaded: this.loadedCookies.length,
        cookiesApplied: applicationResults.filter(r => r.success).length,
        domainsValidated: validationResults.length,
        validationResults: validationResults,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Automation failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Runs automation with pre-loaded cookies (for background script integration)
   * @param {Array} cookies - Array of cookie objects
   * @param {string} validationSelector - CSS selector for validation
   * @returns {Object} Automation results
   */
  async runAutomationWithCookies(cookies, validationSelector = '.user-info, .profile, .dashboard') {
    try {
      if (!cookies || cookies.length === 0) {
        throw new Error('No cookies provided');
      }
      
      // Apply cookies to browser
      const applicationResults = await this.applyCookies(cookies);
      
      // Get unique domains from cookies
      const domains = [...new Set(cookies.map(cookie => cookie.domain))];
      
      // Validate each domain
      const validationResults = [];
      for (const domain of domains) {
        const result = await this.validateDomain(domain, validationSelector);
        validationResults.push(result);
      }
      
      return {
        success: true,
        cookiesLoaded: cookies.length,
        cookiesApplied: applicationResults.filter(r => r.success).length,
        domainsValidated: validationResults.length,
        validationResults: validationResults,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Automation failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Gets the last automation results
   * @returns {Array} Array of validation results
   */
  async getLastResults() {
    if (this.validationResults.length === 0) {
      this.validationResults = await this.storageHandler.get('cookieAutomationResults') || [];
    }
    return this.validationResults;
  }

  /**
   * Clears stored automation data
   */
  async clearData() {
    this.loadedCookies = [];
    this.validationResults = [];
    await this.storageHandler.remove('cookieAutomationLoadedCount');
    await this.storageHandler.remove('cookieAutomationResults');
  }
}
