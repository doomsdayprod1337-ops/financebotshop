import { BrowserDetector } from '../lib/browserDetector.js';
import { Cookie } from '../lib/cookie.js';
import { GenericStorageHandler } from '../lib/genericStorageHandler.js';
import { JsonFormat } from '../lib/jsonFormat.js';
import { NetscapeFormat } from '../lib/netscapeFormat.js';
import { OptionsHandler } from '../lib/optionsHandler.js';
import { PermissionHandler } from '../lib/permissionHandler.js';
import { ThemeHandler } from '../lib/themeHandler.js';
import { CookieHandlerPopup } from '../popup/cookieHandlerPopup.js';
import { CookieAutomation } from '../lib/cookieAutomation.js';

document.addEventListener('DOMContentLoaded', async event => {
  const browserDetector = new BrowserDetector();
  const storageHandler = new GenericStorageHandler(browserDetector);
  const optionHandler = new OptionsHandler(browserDetector, storageHandler);
  const themeHandler = new ThemeHandler(optionHandler);
  const cookieHandler = new CookieHandlerPopup(browserDetector);
  const permissionHandler = new PermissionHandler(browserDetector);
  const cookieAutomation = new CookieAutomation(browserDetector, storageHandler);
  
  const advancedCookieInput = document.getElementById('advanced-cookie');
  const showDevtoolsInput = document.getElementById('devtool-show');
  const animationsEnabledInput = document.getElementById('animations-enabled');
  const exportFormatInput = document.getElementById('export-format');
  const extraInfoInput = document.getElementById('extra-info');
  const themeInput = document.getElementById('theme');
  const buttonBarTopInput = document.getElementById('button-bar-top');
  const adsEnabledInput = document.getElementById('ads-enabled');
  
  // Automation elements
  const automationFilesInput = document.getElementById('automation-files');
  const validationSelectorInput = document.getElementById('validation-selector');
  const runAutomationButton = document.getElementById('run-automation');
  const testFilesButton = document.getElementById('test-files');
  const clearAutomationButton = document.getElementById('clear-automation');
  const automationResultsDiv = document.getElementById('automation-results');
  const resultsContentDiv = document.getElementById('results-content');

  await optionHandler.loadOptions();
  themeHandler.updateTheme();
  setFormValues();
  optionHandler.on('optionsChanged', setFormValues);
  setInputEvents();

  /**
   * Sets the value of the form based on the saved options.
   */
  async function setFormValues() {
    console.log('Setting up the form');
    handleAnimationsEnabled();
    advancedCookieInput.checked = optionHandler.getCookieAdvanced();
    showDevtoolsInput.checked = optionHandler.getDevtoolsEnabled();
    animationsEnabledInput.checked = optionHandler.getAnimationsEnabled();
    exportFormatInput.value = optionHandler.getExportFormat();
    extraInfoInput.value = optionHandler.getExtraInfo();
    themeInput.value = optionHandler.getTheme();
    buttonBarTopInput.checked = optionHandler.getButtonBarTop();
    adsEnabledInput.checked = optionHandler.getAdsEnabled();

    // Set automation values
    // Load and display last results if available
    const lastResults = await cookieAutomation.getLastResults();
    if (lastResults && lastResults.length > 0) {
      displayAutomationResults(lastResults);
    }

    if (!browserDetector.isSafari()) {
      document
        .querySelectorAll('.github-sponsor')
        .forEach(el => el.classList.remove('hidden'));
    }
  }

  /**
   * Sets the different input listeners to save the form changes.
   */
  function setInputEvents() {
    advancedCookieInput.addEventListener('change', event => {
      if (!event.isTrusted) {
        return;
      }
      optionHandler.setCookieAdvanced(advancedCookieInput.checked);
    });
    showDevtoolsInput.addEventListener('change', event => {
      if (!event.isTrusted) {
        return;
      }
      optionHandler.setDevtoolsEnabled(showDevtoolsInput.checked);
    });
    animationsEnabledInput.addEventListener('change', event => {
      if (!event.isTrusted) {
        return;
      }
      optionHandler.setAnimationsEnabled(animationsEnabledInput.checked);
      handleAnimationsEnabled();
    });
    exportFormatInput.addEventListener('change', event => {
      if (!event.isTrusted) {
        return;
      }
      optionHandler.setExportFormat(exportFormatInput.value);
    });
    extraInfoInput.addEventListener('change', event => {
      if (!event.isTrusted) {
        return;
      }
      optionHandler.setExtraInfo(extraInfoInput.value);
    });
    themeInput.addEventListener('change', event => {
      if (!event.isTrusted) {
        return;
      }
      optionHandler.setTheme(themeInput.value);
      themeHandler.updateTheme();
    });
    buttonBarTopInput.addEventListener('change', event => {
      if (!event.isTrusted) {
        return;
      }
      optionHandler.setButtonBarTop(buttonBarTopInput.checked);
    });
    adsEnabledInput.addEventListener('change', event => {
      if (!event.isTrusted) {
        return;
      }
      optionHandler.setAdsEnabled(adsEnabledInput.checked);
    });

    document
      .getElementById('delete-all')
      .addEventListener('click', async event => {
        await deleteAllCookies();
      });

    document
      .getElementById('export-all-json')
      .addEventListener('click', async event => {
        await exportCookiesAsJson();
      });

    document
      .getElementById('export-all-netscape')
      .addEventListener('click', async event => {
        await exportCookiesAsNetscape();
      });

    // Automation event listeners
    automationFilesInput.addEventListener('change', async event => {
      if (!event.isTrusted) {
        return;
      }
      
      try {
        const files = event.target.files;
        if (files.length > 0) {
          await cookieAutomation.loadCookiesFromFiles(files);
          alert(`Successfully loaded ${files.length} file(s) with cookies. Ready to run automation.`);
        }
      } catch (error) {
        console.error('Error loading cookie files:', error);
        alert(`Error loading cookie files: ${error.message}`);
      }
    });

    validationSelectorInput.addEventListener('change', async event => {
      if (!event.isTrusted) {
        return;
      }
      await storageHandler.set('cookieAutomationValidationSelector', validationSelectorInput.value);
    });

    runAutomationButton.addEventListener('click', async event => {
      await runAutomation();
    });

    testFilesButton.addEventListener('click', async event => {
      await testFiles();
    });

    clearAutomationButton.addEventListener('click', async event => {
      await clearAutomation();
    });
  }

  /**
   * Get permissions for All urls.
   */
  async function getAllPermissions() {
    const hasPermissions =
      await permissionHandler.checkPermissions('<all_urls>');
    if (!hasPermissions) {
      await permissionHandler.requestPermission('<all_urls>');
    }
  }

  /**
   * Get all cookies for the browser
   */
  async function getAllCookies() {
    await getAllPermissions();
    return new Promise((resolve, reject) => {
      cookieHandler.getAllCookiesInBrowser(function (cookies) {
        const loadedCookies = [];
        for (const cookie of cookies) {
          const id = Cookie.hashCode(cookie);
          loadedCookies[id] = new Cookie(id, cookie, optionHandler);
        }
        resolve(loadedCookies);
      });
    });
  }

  /**
   * Delete all cookies.
   */
  async function deleteAllCookies() {
    const deleteAll = confirm(
      'Are you sure you want to delete ALL your cookies?'
    );
    if (!deleteAll) {
      return;
    }
    const cookies = await getAllCookies();
    for (const cookieId in cookies) {
      if (!Object.prototype.hasOwnProperty.call(cookies, cookieId)) {
        continue;
      }
      const exportedCookie = cookies[cookieId].cookie;
      const url = 'https://' + exportedCookie.domain + exportedCookie.path;
      cookieHandler.removeCookie(exportedCookie.name, url);
    }
    alert('All your cookies were deleted');
  }

  /**
   * Export all cookies in the JSON format.
   */
  async function exportCookiesAsJson() {
    const cookies = await getAllCookies();
    copyText(JsonFormat.format(cookies));
    alert('Done!');
  }

  /**
   * Export all cookies in the Netscape format.
   */
  async function exportCookiesAsNetscape() {
    const cookies = await getAllCookies();
    copyText(NetscapeFormat.format(cookies));
    alert('Done!');
  }

  /**
   * Copy some text to the user's clipboard.
   * @param {string} text Text to copy.
   */
  function copyText(text) {
    const fakeText = document.createElement('textarea');
    fakeText.classList.add('clipboardCopier');
    fakeText.textContent = text;
    document.body.appendChild(fakeText);
    fakeText.focus();
    fakeText.select();
    // TODO: switch to clipboard API.
    document.execCommand('Copy');
    document.body.removeChild(fakeText);
  }

  /**
   * Enables or disables the animations based on the options.
   */
  function handleAnimationsEnabled() {
    if (optionHandler.getAnimationsEnabled()) {
      document.body.classList.remove('notransition');
    } else {
      document.body.classList.add('notransition');
    }
  }

  /**
   * Runs the cookie automation process
   */
  async function runAutomation() {
    try {
      // Check if cookies are loaded
      const cookieCount = await cookieAutomation.getLoadedCookieCount();
      if (cookieCount === 0) {
        alert('Please select cookie files first');
        return;
      }

      // Get validation selector
      const validationSelector = validationSelectorInput.value || '.user-info, .profile, .dashboard';

      // Disable buttons and show running state
      setAutomationButtonsState(true);
      displayAutomationResults([], 'running');

      // Run automation
      const results = await cookieAutomation.runAutomation(validationSelector);

      if (results.success) {
        displayAutomationResults(results.validationResults, 'success');
        alert(`Automation completed successfully!\n\nCookies loaded: ${results.cookiesLoaded}\nDomains validated: ${results.domainsValidated}`);
      } else {
        displayAutomationResults([], 'error');
        alert(`Automation failed: ${results.error}`);
      }

    } catch (error) {
      console.error('Automation error:', error);
      displayAutomationResults([], 'error');
      alert(`Automation error: ${error.message}`);
    } finally {
      setAutomationButtonsState(false);
    }
  }

  /**
   * Tests the loaded cookie files
   */
  async function testFiles() {
    try {
      const cookieCount = await cookieAutomation.getLoadedCookieCount();
      if (cookieCount === 0) {
        alert('Please select cookie files first');
        return;
      }

      const cookies = cookieAutomation.getLoadedCookies();
      const domains = [...new Set(cookies.map(cookie => cookie.domain))];
      
      alert(`Cookie files loaded successfully!\n\nFiles processed: ${cookieCount} cookies\nUnique domains: ${domains.length}\n\nDomains found:\n${domains.join('\n')}`);
      
    } catch (error) {
      console.error('Test files error:', error);
      alert(`Error testing files: ${error.message}`);
    }
  }

  /**
   * Clears automation data
   */
  async function clearAutomation() {
    const confirmed = confirm('Are you sure you want to clear all automation data? This will remove the loaded cookies and results.');
    if (confirmed) {
      try {
        await cookieAutomation.clearData();
        automationFilesInput.value = '';
        validationSelectorInput.value = '.user-info, .profile, .dashboard';
        automationResultsDiv.style.display = 'none';
        alert('Automation data cleared successfully');
      } catch (error) {
        console.error('Clear automation error:', error);
        alert(`Error clearing automation data: ${error.message}`);
      }
    }
  }

  /**
   * Sets the state of automation buttons
   */
  function setAutomationButtonsState(disabled) {
    runAutomationButton.disabled = disabled;
    testFilesButton.disabled = disabled;
    clearAutomationButton.disabled = disabled;
    
    if (disabled) {
      runAutomationButton.innerHTML = '<span class="spinner"></span>Running...';
    } else {
      runAutomationButton.innerHTML = 'Run Automation';
    }
  }

  /**
   * Displays automation results
   */
  function displayAutomationResults(results, status = 'success') {
    if (!results || results.length === 0) {
      automationResultsDiv.style.display = 'none';
      return;
    }

    automationResultsDiv.style.display = 'block';
    resultsContentDiv.className = `results-display ${status}`;

    let content = '';
    if (status === 'running') {
      content = 'Automation is running...\nPlease wait for completion.';
    } else if (status === 'error') {
      content = 'Automation failed. Please check the configuration and try again.';
    } else {
      content = `Automation Results (${new Date().toLocaleString()}):\n\n`;
      
      for (const result of results) {
        if (result.success) {
          content += `✅ ${result.domain}: ${result.validationValue}\n`;
        } else {
          content += `❌ ${result.domain}: ${result.error}\n`;
        }
      }
    }

    resultsContentDiv.textContent = content;
  }
});
