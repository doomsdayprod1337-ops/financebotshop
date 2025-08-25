// Default Admin Configuration
// This file contains the default admin credentials for the Genesis Market admin panel

const DEFAULT_ADMIN_CONFIG = {
  email: 'admin@admin.com',
  password: 'admin',
  role: 'admin',
  first_name: 'Admin',
  last_name: 'User',
  referral_code: 'ADMIN2024'
};

// Default admin login information
const ADMIN_LOGIN_INFO = {
  title: 'Genesis Market Admin Panel',
  subtitle: 'Default Login Credentials',
  credentials: {
    email: DEFAULT_ADMIN_CONFIG.email,
    password: DEFAULT_ADMIN_CONFIG.password
  },
  instructions: [
    'Use these credentials to access the admin panel',
    'Change the password after first login for security',
    'Keep these credentials secure and private'
  ]
};

module.exports = {
  DEFAULT_ADMIN_CONFIG,
  ADMIN_LOGIN_INFO
};
