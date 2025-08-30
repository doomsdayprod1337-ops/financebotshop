# 🔐 Reaper Chrome Extension Authentication System

## Overview

The Reaper Chrome Extension uses a comprehensive authentication system that validates registration keys against the Reaper Marketplace API and manages user sessions securely.

## 🏗️ Architecture

### Core Components

1. **`ReaperAuth` Class** (`interface/lib/auth.js`)
   - Main authentication handler
   - Manages activation keys, tokens, and user profiles
   - Handles API communication with marketplace

2. **Service Worker** (`cookie-reaper-service-worker.js`)
   - Background authentication management
   - Handles extension lifecycle events
   - Manages popup routing based on auth status

3. **Popup Interfaces**
   - `first-launch-popup.js` - Initial setup and registration
   - `cookie-reaper-popup.js` - Main extension interface

## 🔑 Activation Key Format

Activation keys follow this format:
```
REAPER-EXT-2024-XXXX-XXXX
```

**Components:**
- `REAPER-EXT` - Fixed prefix
- `2024` - Year identifier
- `XXXX-XXXX` - Two 4-character alphanumeric segments

**Example:**
```
REAPER-EXT-2024-A1B2-C3D4
```

## 🚀 Authentication Flow

### 1. First Launch
```
User installs extension → First launch popup → Registration page → Get activation key
```

### 2. Activation Process
```
Enter activation key → Validate with marketplace → Store tokens → Enable features
```

### 3. Session Management
```
Check token validity → Refresh if needed → Maintain user session → Periodic validation
```

## 📡 API Endpoints

### Base URL
```
https://reaper-market.com/api
```

### Endpoints

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/verify-key` | POST | Validate activation key | No |
| `/validate-extension` | POST | Check extension status | Yes |
| `/user/profile` | GET | Get user profile | Yes |
| `/auth/refresh` | POST | Refresh access token | Yes |
| `/auth/logout` | POST | Logout user | Yes |

### Request Headers
```javascript
{
  'Content-Type': 'application/json',
  'User-Agent': 'Reaper-Chrome-Extension/1.1.0',
  'Authorization': 'Bearer {accessToken}', // For authenticated requests
  'X-Extension-ID': '{extensionId}'
}
```

## 💾 Storage Management

### Chrome Storage Keys
```javascript
const STORAGE_KEYS = {
  ACTIVATION_KEY: 'activationKey',      // User's activation key
  USER_PROFILE: 'userProfile',          // User profile data
  AUTH_TOKEN: 'authToken',              // Access token
  REFRESH_TOKEN: 'refreshToken',        // Refresh token
  EXPIRES_AT: 'expiresAt',              // Token expiration timestamp
  EXTENSION_ID: 'extensionId',          // Extension identifier
  FIRST_LAUNCH: 'firstLaunchSeen',     // First launch flag
  LAST_SYNC: 'lastSync'                 // Last sync timestamp
};
```

### Data Persistence
- All authentication data is stored in Chrome's local storage
- Data persists across browser sessions
- Automatic cleanup on logout

## 🔄 Token Management

### Access Token
- JWT-based authentication
- Configurable expiration time
- Automatic refresh before expiry

### Refresh Token
- Long-lived token for session renewal
- Stored securely in extension storage
- Used to obtain new access tokens

### Token Refresh Logic
```javascript
// Check if token expires within 1 hour
if (timeUntilExpiry.hours <= 1) {
  await refreshAuthToken(refreshToken);
}
```

## 🛡️ Security Features

### 1. Key Validation
- Format validation using regex patterns
- Server-side verification
- Extension ID binding

### 2. Token Security
- Secure token storage
- Automatic token refresh
- Session timeout handling

### 3. API Security
- HTTPS-only communication
- User-Agent identification
- Extension ID verification

## 📱 User Interface Integration

### Popup Routing
The extension automatically routes users to the appropriate popup based on their authentication status:

```javascript
if (!authStatus.isAuthenticated) {
  if (!result.firstLaunchSeen) {
    // Show first launch popup
    await chrome.action.setPopup({ popup: 'first-launch-popup.html' });
  } else {
    // Show activation popup
    await chrome.action.setPopup({ popup: 'cookie-reaper-popup.html' });
  }
} else {
  // Show main popup
  await chrome.action.setPopup({ popup: 'cookie-reaper-popup.html' });
}
```

### Status Indicators
- Real-time authentication status
- Token expiration warnings
- User profile information
- Extension ID display

## 🔧 Configuration

### Environment Variables
```javascript
const API_BASE = 'https://reaper-market.com/api';
const EXTENSION_ID = chrome.runtime.id;
const EXTENSION_VERSION = chrome.runtime.getManifest().version;
```

### Customization
- API endpoints can be modified in `ReaperAuth` class
- Token refresh intervals are configurable
- Storage key names can be customized

## 📊 Error Handling

### Common Error Scenarios
1. **Invalid Activation Key**
   - Format validation failure
   - Server-side verification failure
   - Key already used by another extension

2. **Network Issues**
   - API endpoint unreachable
   - Timeout errors
   - Connection failures

3. **Token Issues**
   - Expired tokens
   - Invalid refresh tokens
   - Server authentication failures

### Error Recovery
- Automatic retry mechanisms
- Graceful degradation
- User-friendly error messages

## 🧪 Testing

### Development Testing
```javascript
// Test activation key format
const testKey = 'REAPER-EXT-2024-TEST-TEST';
const isValid = auth.isValidKeyFormat(testKey);

// Test authentication flow
const result = await auth.activateExtension(testKey);
```

### Mock API Responses
```javascript
// Example successful activation response
{
  "success": true,
  "userProfile": {
    "username": "testuser",
    "role": "premium",
    "subscription": {
      "plan": "Premium",
      "expiresAt": "2024-12-31T23:59:59Z"
    }
  },
  "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here",
  "expiresAt": "2024-01-01T00:00:00Z"
}
```

## 🚀 Deployment

### Production Checklist
- [ ] Update API endpoints to production URLs
- [ ] Configure proper CORS settings
- [ ] Set up SSL certificates
- [ ] Test activation flow end-to-end
- [ ] Verify token refresh functionality
- [ ] Test logout and cleanup

### Monitoring
- Console logging for debugging
- Error tracking and reporting
- User authentication analytics
- Extension performance metrics

## 🔒 Privacy & Compliance

### Data Collection
- Only necessary authentication data is stored
- No personal information is collected without consent
- All data is stored locally in the extension

### GDPR Compliance
- User data can be exported
- Account deletion support
- Transparent data usage policies

## 📚 API Documentation

### Verify Activation Key
```javascript
POST /api/verify-key
{
  "key": "REAPER-EXT-2024-XXXX-XXXX",
  "extensionId": "extension_id_here",
  "extensionVersion": "1.1.0",
  "platform": "Win32",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Response Format
```javascript
{
  "success": true,
  "userProfile": { /* user data */ },
  "authToken": "jwt_token",
  "refreshToken": "refresh_token",
  "expiresAt": "2024-01-01T00:00:00Z"
}
```

## 🆘 Troubleshooting

### Common Issues

1. **Extension Not Activating**
   - Check activation key format
   - Verify internet connection
   - Check browser console for errors

2. **Token Expiration Issues**
   - Check system clock accuracy
   - Verify refresh token validity
   - Check API endpoint availability

3. **Storage Issues**
   - Clear extension storage
   - Reinstall extension
   - Check Chrome storage permissions

### Debug Mode
Enable debug logging by setting:
```javascript
localStorage.setItem('debug', 'true');
```

## 🤝 Support

For technical support or questions about the authentication system:
- **Telegram**: @LogCachin
- **Website**: https://reaper-market.com
- **Documentation**: This README file

## 📄 License

This authentication system is proprietary to Reaper Market. Unauthorized use or distribution is prohibited.

---

**Version**: 1.1.0  
**Last Updated**: 2024  
**Maintainer**: Reaper Market Development Team
