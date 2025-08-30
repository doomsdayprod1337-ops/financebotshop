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
    
    // File input change handler
    document.getElementById('stealer-log-file').addEventListener('change', handleFileSelect);
});

let selectedFile = null;

async function checkActivationStatus() {
    try {
        const response = await chrome.runtime.sendMessage({ type: 'checkActivation' });
        
        if (response.activated) {
            showMainContent(response.userProfile);
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

async function activateExtension() {
    const activationKey = document.getElementById('activation-key').value.trim();
    
    if (!activationKey) {
        showStatus('Please enter an activation key', 'error');
        return;
    }
    
    try {
        const response = await chrome.runtime.sendMessage({
            type: 'activate',
            params: { activationKey: activationKey }
        });
        
        if (response.success) {
            showStatus('Extension activated successfully!', 'success');
            showMainContent(response.userProfile);
        } else {
            showStatus(response.error || 'Activation failed', 'error');
        }
    } catch (error) {
        showStatus('Activation failed: ' + error.message, 'error');
    }
}

function showMainContent(userProfile) {
    document.getElementById('activation-section').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    
    if (userProfile && userProfile.username) {
        document.getElementById('username').textContent = userProfile.username;
    }
}

function showActivationSection() {
    document.getElementById('activation-section').style.display = 'block';
    document.getElementById('main-content').style.display = 'none';
}

function showStatus(message, type) {
    const statusDiv = document.getElementById('status-message');
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
        
        // Create a new tab to display cookies
        const cookiesTab = await chrome.tabs.create({
            url: 'chrome://extensions/',
            active: false
        });
        
        // Inject script to show cookies
        await chrome.scripting.executeScript({
            target: { tabId: cookiesTab.id },
            func: (cookieData) => {
                const div = document.createElement('div');
                div.innerHTML = `
                    <h2>Cookies for ${cookieData.url}</h2>
                    <pre>${JSON.stringify(cookieData.cookies, null, 2)}</pre>
                `;
                document.body.appendChild(div);
            },
            args: [{ url: currentTab.url, cookies: cookies }]
        });
        
        showStatus(`Found ${cookies.length} cookies`, 'success');
    } catch (error) {
        showStatus('Failed to view cookies: ' + error.message, 'error');
    }
}

async function exportCookies() {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentTab = tabs[0];
        
        const cookies = await chrome.cookies.getAll({ url: currentTab.url });
        
        if (cookies.length === 0) {
            showStatus('No cookies to export', 'error');
            return;
        }
        
        const exportData = {
            url: currentTab.url,
            timestamp: new Date().toISOString(),
            cookies: cookies
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `cookies_${currentTab.url.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        showStatus(`Exported ${cookies.length} cookies`, 'success');
    } catch (error) {
        showStatus('Failed to export cookies: ' + error.message, 'error');
    }
}

async function clearAllCookies() {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentTab = tabs[0];
        
        const cookies = await chrome.cookies.getAll({ url: currentTab.url });
        
        if (cookies.length === 0) {
            showStatus('No cookies to clear', 'error');
            return;
        }
        
        let deletedCount = 0;
        for (const cookie of cookies) {
            try {
                await chrome.cookies.remove({
                    url: currentTab.url,
                    name: cookie.name,
                    storeId: cookie.storeId
                });
                deletedCount++;
            } catch (error) {
                console.error('Failed to delete cookie:', cookie.name, error);
            }
        }
        
        showStatus(`Deleted ${deletedCount} cookies`, 'success');
    } catch (error) {
        showStatus('Failed to clear cookies: ' + error.message, 'error');
    }
}

function handleFileSelect(event) {
    selectedFile = event.target.files[0];
    if (selectedFile) {
        showStatus(`Selected file: ${selectedFile.name}`, 'success');
    }
}

async function importStealerLogs() {
    if (!selectedFile) {
        showStatus('Please select a stealer log file first', 'error');
        return;
    }
    
    try {
        const fileContent = await readFileAsText(selectedFile);
        let logs;
        
        try {
            logs = JSON.parse(fileContent);
        } catch (parseError) {
            // Try to parse as line-by-line JSON
            logs = fileContent.split('\n')
                .filter(line => line.trim())
                .map(line => {
                    try {
                        return JSON.parse(line);
                    } catch (e) {
                        return null;
                    }
                })
                .filter(log => log !== null);
        }
        
        if (!Array.isArray(logs)) {
            logs = [logs];
        }
        
        const response = await chrome.runtime.sendMessage({
            type: 'importStealerLogs',
            params: { logs: logs }
        });
        
        if (response.success) {
            showStatus(response.message, 'success');
        } else {
            showStatus(response.error, 'error');
        }
    } catch (error) {
        showStatus('Failed to import logs: ' + error.message, 'error');
    }
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = e => reject(e);
        reader.readAsText(file);
    });
}

async function exportDeviceProfile() {
    try {
        const response = await chrome.runtime.sendMessage({ type: 'exportDeviceProfile' });
        
        if (response.success) {
            const blob = new Blob([JSON.stringify(response.deviceProfile, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `device_profile_${Date.now()}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            showStatus('Device profile exported successfully', 'success');
        } else {
            showStatus(response.error, 'error');
        }
    } catch (error) {
        showStatus('Failed to export device profile: ' + error.message, 'error');
    }
}

async function cloneDevice() {
    try {
        const response = await chrome.runtime.sendMessage({ type: 'exportDeviceProfile' });
        
        if (response.success) {
            // Store the profile for later use
            await chrome.storage.local.set({ 
                clonedDeviceProfile: response.deviceProfile,
                cloneTimestamp: new Date().toISOString()
            });
            
            showStatus('Device profile cloned and saved', 'success');
        } else {
            showStatus(response.error, 'error');
        }
    } catch (error) {
        showStatus('Failed to clone device: ' + error.message, 'error');
    }
}

async function syncWithMarketplace() {
    try {
        // This would sync with reaper-market.com
        showStatus('Syncing with marketplace...', 'success');
        
        // Simulate sync delay
        setTimeout(() => {
            showStatus('Successfully synced with marketplace', 'success');
        }, 2000);
    } catch (error) {
        showStatus('Failed to sync with marketplace: ' + error.message, 'error');
    }
}

function openSettings() {
    chrome.runtime.openOptionsPage();
}
