document.addEventListener('DOMContentLoaded', function() {
    // Event listeners for buttons
    document.getElementById('register-and-activate').addEventListener('click', handleRegisterAndActivate);
    document.getElementById('contact-support').addEventListener('click', handleContactSupport);
    
    // Initialize particle effects
    initParticles();
    
    // Check if this is the first time launching the extension
    checkFirstLaunch();
    
    // Add interactive effects
    addInteractiveEffects();
});

function initParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 15;
    
    for (let i = 0; i < particleCount; i++) {
        createParticle(particlesContainer);
    }
    
    // Continuously create new particles
    setInterval(() => {
        if (particlesContainer.children.length < particleCount) {
            createParticle(particlesContainer);
        }
    }, 2000);
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Random starting position
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 6 + 's';
    particle.style.animationDuration = (Math.random() * 3 + 4) + 's';
    
    container.appendChild(particle);
    
    // Remove particle after animation
    setTimeout(() => {
        if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
        }
    }, 8000);
}

function addInteractiveEffects() {
    // Add hover effects to feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
            this.style.boxShadow = '0 15px 35px rgba(255, 0, 0, 0.3)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 10px 25px rgba(255, 0, 0, 0.2)';
        });
    });
    
    // Add click effects to buttons
    const buttons = document.querySelectorAll('.panel-section-footer-button');
    buttons.forEach(button => {
        button.addEventListener('mousedown', function() {
            this.style.transform = 'translateY(-1px) scale(0.98)';
        });
        
        button.addEventListener('mouseup', function() {
            this.style.transform = 'translateY(-3px) scale(1)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Add mask interaction
    const mask = document.querySelector('.mask');
    if (mask) {
        mask.addEventListener('mouseenter', function() {
            this.style.animation = 'maskFloat 2s ease-in-out infinite';
            this.style.boxShadow = '0 0 30px rgba(255, 0, 0, 0.5)';
        });
        
        mask.addEventListener('mouseleave', function() {
            this.style.animation = 'maskFloat 4s ease-in-out infinite';
            this.style.boxShadow = '0 0 20px rgba(255, 0, 0, 0.3)';
        });
    }
}

async function checkFirstLaunch() {
    try {
        // Check if user has seen the first launch popup before
        const result = await chrome.storage.local.get(['firstLaunchSeen', 'activationKey']);
        
        if (result.firstLaunchSeen && result.activationKey) {
            // User has seen this before and has an activation key
            // Check if the key is still valid
            const authStatus = await checkActivationStatus();
            if (authStatus.activated) {
                // Redirect to the main activation popup
                window.location.href = 'cookie-reaper-popup.html';
            }
        } else if (result.firstLaunchSeen) {
            // User has seen this before but no activation key
            // Redirect to the main activation popup
            window.location.href = 'cookie-reaper-popup.html';
        }
        // If firstLaunchSeen is false or undefined, stay on this page
    } catch (error) {
        console.error('Failed to check first launch status:', error);
    }
}

async function checkActivationStatus() {
    try {
        const response = await chrome.runtime.sendMessage({ type: 'checkActivation' });
        return response;
    } catch (error) {
        console.error('Failed to check activation status:', error);
        return { activated: false };
    }
}

async function handleRegisterAndActivate() {
    try {
        // Mark that user has seen the first launch popup
        await chrome.storage.local.set({ firstLaunchSeen: true });
        
        // Add button click effect
        const button = document.getElementById('register-and-activate');
        button.style.transform = 'scale(0.95)';
        setTimeout(() => button.style.transform = '', 150);
        
        // Show loading state
        button.disabled = true;
        button.innerHTML = '<span>🔄</span><span>Opening Registration...</span>';
        
        // Open the marketplace registration page
        await chrome.tabs.create({
            url: 'https://reaper-market.com/register',
            active: true
        });
        
        // Show success message with dark theme
        showMessage('Registration page opened! Complete your registration and get your activation key.', 'success');
        
        // After a delay, redirect to the main activation popup
        setTimeout(() => {
            window.location.href = 'cookie-reaper-popup.html';
        }, 3000);
        
    } catch (error) {
        console.error('Failed to handle registration:', error);
        showMessage('Failed to open registration page. Please visit reaper-market.com manually.', 'error');
        
        // Reset button state
        const button = document.getElementById('register-and-activate');
        button.disabled = false;
        button.innerHTML = '<span>🌐</span><span>Register & Activate</span>';
    }
}

async function handleContactSupport() {
    try {
        // Mark that user has seen the first launch popup
        await chrome.storage.local.set({ firstLaunchSeen: true });
        
        // Add button click effect
        const button = document.getElementById('contact-support');
        button.style.transform = 'scale(0.95)';
        setTimeout(() => button.style.transform = '', 150);
        
        // Show loading state
        button.disabled = true;
        button.innerHTML = '<span>🔄</span><span>Opening Support...</span>';
        
        // Open support contact page or Telegram
        await chrome.tabs.create({
            url: 'https://t.me/LogCachin',
            active: true
        });
        
        // Show success message with dark theme
        showMessage('Support contact opened! Get help with your activation.', 'success');
        
        // After a delay, redirect to the main activation popup
        setTimeout(() => {
            window.location.href = 'cookie-reaper-popup.html';
        }, 3000);
        
    } catch (error) {
        console.error('Failed to handle support contact:', error);
        showMessage('Failed to open support contact. Please contact @LogCachin on Telegram manually.', 'error');
        
        // Reset button state
        const button = document.getElementById('contact-support');
        button.disabled = false;
        button.innerHTML = '<span>💬</span><span>Contact Support</span>';
    }
}

function showMessage(message, type) {
    // Create message element with dark theme styling
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 18px 25px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        font-family: 'Rajdhani', sans-serif;
        z-index: 1000;
        max-width: 320px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
        animation: slideIn 0.4s ease;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-size: 13px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
    `;
    
    // Set background color based on type with dark theme
    if (type === 'success') {
        messageDiv.style.background = 'linear-gradient(135deg, #00cc00 0%, #009900 100%)';
        messageDiv.style.borderColor = 'rgba(0, 255, 0, 0.3)';
    } else {
        messageDiv.style.background = 'linear-gradient(135deg, #ff0000 0%, #cc0000 100%)';
        messageDiv.style.borderColor = 'rgba(255, 0, 0, 0.3)';
    }
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%) scale(0.8);
                opacity: 0;
            }
            to {
                transform: translateX(0) scale(1);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0) scale(1);
                opacity: 1;
            }
            to {
                transform: translateX(100%) scale(0.8);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Add to page
    document.body.appendChild(messageDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.4s ease';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 400);
    }, 5000);
}

// Add keyboard navigation support
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
        const focusedElement = document.activeElement;
        if (focusedElement && focusedElement.classList.contains('panel-section-footer-button')) {
            e.preventDefault();
            focusedElement.click();
        }
    }
});

// Add focus styles for accessibility
document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('.panel-section-footer-button');
    buttons.forEach(button => {
        button.addEventListener('focus', function() {
            this.style.outline = '2px solid #ff0000';
            this.style.outlineOffset = '2px';
        });
        
        button.addEventListener('blur', function() {
            this.style.outline = 'none';
        });
    });
});

// Add extension detection functionality
async function detectExtension() {
    try {
        // Try to ping the extension to see if it's properly loaded
        const response = await chrome.runtime.sendMessage({ type: 'ping' });
        return response.success;
    } catch (error) {
        console.error('Extension detection failed:', error);
        return false;
    }
}

// Check extension status periodically
setInterval(async () => {
    const isExtensionWorking = await detectExtension();
    if (!isExtensionWorking) {
        console.warn('Extension not responding to ping');
    }
}, 30000); // Check every 30 seconds
