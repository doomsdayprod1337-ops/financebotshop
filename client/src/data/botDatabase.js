// Bot database based on actual log examples
// Excludes sensitive information like credentials, cookies, downloads, etc.

export const botDatabase = [
  {
    id: 'US0FGID0XSDVPPQMQJ07GCPSACLPIH1QK_2025_08_22T19_67_17_504390',
    name: 'XQA-PC',
    status: 'active',
    country: 'US',
    ip: '99.82.252.101',
    os: 'Windows 10 Home x64',
    lastSeen: '2023-10-02 17:17:50',
    firstSeen: '2022-09-23 16:10:50',
    lastViewed: '2023-10-02 17:17:50',
    price: 12.50,
    isVerified: true,
    browser: 'Chrome',
    browserVersion: '109.0.5414.120',
    
    // Hardware info (safe)
    ram: '16GB DDR4',
    cpu: 'AMD Ryzen 5 5600X 6-Core',
    disk: 'Unknown',
    network: 'Ethernet',
    
    // Activity (safe)
    last24h: 156,
    lastWeek: 892,
    lastMonth: 3247,
    
    // Resources detected (safe domains only)
    knownResources: [
      { name: 'Chase Bank', type: 'banking', count: 2, lastUpdated: '2023-10-02 17:17:50' },
      { name: 'PayPal', type: 'financial', count: 1, lastUpdated: '2023-10-02 17:17:50' },
      { name: 'Amazon', type: 'ecommerce', count: 2, lastUpdated: '2023-10-02 17:17:50' }
    ],
    otherResources: [
      { name: 'Discord', type: 'social', count: 1, lastUpdated: '2023-10-02 17:17:50' },
      { name: 'Epic Games', type: 'gaming', count: 1, lastUpdated: '2023-10-02 17:17:50' },
      { name: 'Spotify', type: 'entertainment', count: 1, lastUpdated: '2023-10-02 17:17:50' }
    ],
    
    // Browser data (safe counts only)
    cookies: 1247,
    savedLogins: 89,
    formData: 156,
    injectScripts: 23,
    
    // Purchase info
    purchaseDate: '2023-10-02 17:17:50',
    purchaseStatus: 'Purchased',
    viewedCount: 5,
    
    // Notes about sensitive data (not showing actual data)
    notes: {
      processes: 'Multiple system processes detected (not shown for security)',
      software: 'Various applications including Chrome, Edge, OBS Studio, Epic Games',
      autofills: 'Autofill data available (not displayed)',
      cookies: 'Cookie data available (not displayed)'
    }
  },
  
  {
    id: 'US0ACTLR1ECAT6WRLMLC9SSOLLNUFUVU0_2025_08_22T12_64_38_326172',
    name: 'Jacis-PC',
    status: 'active',
    country: 'US',
    ip: '2601:2c3:c97f:f4b0:8c24:28fc:c59e:8d41',
    os: 'Windows 10 Home x64',
    lastSeen: '2022-11-18 23:00:44',
    firstSeen: '2022-11-18 23:00:44',
    lastViewed: '2022-11-18 23:00:44',
    price: 8.75,
    isVerified: true,
    browser: 'Chrome',
    browserVersion: 'Unknown',
    
    // Hardware info (safe)
    ram: '8GB DDR4',
    cpu: 'Intel Core i5-8250U',
    disk: 'Unknown',
    network: 'WiFi',
    
    // Activity (safe)
    last24h: 42,
    lastWeek: 156,
    lastMonth: 647,
    
    // Resources detected (safe domains only)
    knownResources: [
      { name: 'Chase Bank', type: 'banking', count: 4, lastUpdated: '2022-11-18 23:00:44' },
      { name: 'PayPal', type: 'financial', count: 2, lastUpdated: '2022-11-18 23:00:44' },
      { name: 'Amazon', type: 'ecommerce', count: 11, lastUpdated: '2022-11-18 23:00:44' }
    ],
    otherResources: [
      { name: 'Yahoo Mail', type: 'email', count: 1, lastUpdated: '2022-11-18 23:00:44' }
    ],
    
    // Browser data (safe counts only)
    cookies: 892,
    savedLogins: 45,
    formData: 78,
    injectScripts: 12,
    
    // Purchase info
    purchaseDate: '2022-11-18 23:00:44',
    purchaseStatus: 'Purchased',
    viewedCount: 3,
    
    // Notes about sensitive data (not showing actual data)
    notes: {
      processes: 'Multiple system processes detected (not shown for security)',
      software: 'Various applications including Chrome, Edge, McAfee WebAdvisor',
      autofills: 'Autofill data available (not displayed)',
      cookies: 'Cookie data available (not displayed)'
    }
  },
  
  {
    id: 'US0FLL024TZPYH5GQ04CCZ3E4KC6TOKS8_2025_08_22T15_54_30_355637',
    name: 'Raymond-PC',
    status: 'active',
    country: 'CA',
    ip: '70.52.150.138',
    os: 'Windows 11 Home',
    lastSeen: '2024-07-04 07:26:05',
    firstSeen: '2024-07-04 07:26:05',
    lastViewed: '2024-07-04 07:26:05',
    price: 15.25,
    isVerified: true,
    browser: 'Chrome',
    browserVersion: 'Unknown',
    
    // Hardware info (safe)
    ram: '16GB DDR4',
    cpu: 'Intel Core i5-12600K 12th Gen',
    disk: 'Unknown',
    network: 'Ethernet',
    
    // Activity (safe)
    last24h: 89,
    lastWeek: 423,
    lastMonth: 1892,
    
    // Resources detected (safe domains only)
    knownResources: [
      { name: 'NordVPN', type: 'vpn', count: 1, lastUpdated: '2024-07-04 07:26:05' },
      { name: 'OneDrive', type: 'cloud', count: 1, lastUpdated: '2024-07-04 07:26:05' }
    ],
    otherResources: [
      { name: 'Intel Graphics', type: 'hardware', count: 1, lastUpdated: '2024-07-04 07:26:05' }
    ],
    
    // Browser data (safe counts only)
    cookies: 1567,
    savedLogins: 123,
    formData: 234,
    injectScripts: 34,
    
    // Purchase info
    purchaseDate: '2024-07-04 07:26:05',
    purchaseStatus: 'Purchased',
    viewedCount: 7,
    
    // Notes about sensitive data (not showing actual data)
    notes: {
      processes: 'Multiple system processes detected (not shown for security)',
      software: 'Various applications including NordVPN, OneDrive',
      wallets: 'MetaMask wallet data available (not displayed)',
      localStorage: 'Local storage data available (not displayed)'
    }
  },
  
  {
    id: 'US0B9UBT81IZLNI9GGK74KAHJDBTOSJTU_2025_08_22T10_62_06_246307',
    name: 'Steam-PC',
    status: 'active',
    country: 'US',
    ip: '192.168.1.100',
    os: 'Windows 10 Pro',
    lastSeen: '2023-08-15 14:30:22',
    firstSeen: '2023-08-15 14:30:22',
    lastViewed: '2023-08-15 14:30:22',
    price: 9.50,
    isVerified: true,
    browser: 'Chrome',
    browserVersion: '115.0.5790.102',
    
    // Hardware info (safe)
    ram: '32GB DDR4',
    cpu: 'Intel Core i7-12700K',
    disk: '1TB NVMe SSD',
    network: 'Ethernet',
    
    // Activity (safe)
    last24h: 234,
    lastWeek: 1247,
    lastMonth: 5234,
    
    // Resources detected (safe domains only)
    knownResources: [
      { name: 'Steam', type: 'gaming', count: 15, lastUpdated: '2023-08-15 14:30:22' },
      { name: 'Discord', type: 'social', count: 8, lastUpdated: '2023-08-15 14:30:22' }
    ],
    otherResources: [
      { name: 'Epic Games', type: 'gaming', count: 3, lastUpdated: '2023-08-15 14:30:22' }
    ],
    
    // Browser data (safe counts only)
    cookies: 2156,
    savedLogins: 167,
    formData: 289,
    injectScripts: 45,
    
    // Purchase info
    purchaseDate: '2023-08-15 14:30:22',
    purchaseStatus: 'Purchased',
    viewedCount: 12,
    
    // Notes about sensitive data (not showing actual data)
    notes: {
      processes: 'Multiple system processes detected (not shown for security)',
      software: 'Various applications including Steam, Discord, Epic Games',
      autofills: 'Autofill data available (not displayed)',
      cookies: 'Cookie data available (not displayed)'
    }
  },
  
  {
    id: 'US0FBT9U9RECO6S7B1BAGRTR4WOS140BQ_2025_08_22T13_74_20_659268',
    name: 'Soft-PC',
    status: 'active',
    country: 'DE',
    ip: '185.216.71.42',
    os: 'Windows 11 Pro',
    lastSeen: '2024-01-12 09:15:33',
    firstSeen: '2024-01-12 09:15:33',
    lastViewed: '2024-01-12 09:15:33',
    price: 18.75,
    isVerified: true,
    browser: 'Firefox',
    browserVersion: '121.0.1',
    
    // Hardware info (safe)
    ram: '64GB DDR5',
    cpu: 'AMD Ryzen 9 7950X',
    disk: '2TB NVMe SSD',
    network: 'Ethernet',
    
    // Activity (safe)
    last24h: 567,
    lastWeek: 2891,
    lastMonth: 12456,
    
    // Resources detected (safe domains only)
    knownResources: [
      { name: 'Discord', type: 'social', count: 23, lastUpdated: '2024-01-12 09:15:33' },
      { name: 'GitHub', type: 'development', count: 12, lastUpdated: '2024-01-12 09:15:33' }
    ],
    otherResources: [
      { name: 'Stack Overflow', type: 'development', count: 8, lastUpdated: '2024-01-12 09:15:33' }
    ],
    
    // Browser data (safe counts only)
    cookies: 3456,
    savedLogins: 234,
    formData: 456,
    injectScripts: 67,
    
    // Purchase info
    purchaseDate: '2024-01-12 09:15:33',
    purchaseStatus: 'Purchased',
    viewedCount: 19,
    
    // Notes about sensitive data (not showing actual data)
    notes: {
      processes: 'Multiple system processes detected (not shown for security)',
      software: 'Various applications including Discord, development tools',
      autofills: 'Autofill data available (not displayed)',
      cookies: 'Cookie data available (not displayed)'
    }
  }
];

// Helper function to get bot by ID
export const getBotById = (id) => {
  return botDatabase.find(bot => bot.id === id);
};

// Helper function to get all bots
export const getAllBots = () => {
  return botDatabase;
};

// Helper function to get bots by country
export const getBotsByCountry = (countryCode) => {
  return botDatabase.filter(bot => bot.country === countryCode);
};

// Helper function to get bots by status
export const getBotsByStatus = (status) => {
  return botDatabase.filter(bot => bot.status === status);
};
