import React, { useState } from 'react';

const News = () => {
  const [selectedNews, setSelectedNews] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const newsItems = [
    {
      id: 1,
      title: "New Anti-Detect Browser Released",
      date: "2024-01-15",
      category: "Software",
      content: "Version 7.2 of our anti-detect browser is now available with improved fingerprinting evasion.",
      fullContent: `We're excited to announce the release of Version 7.2 of our advanced anti-detect browser! This major update brings significant improvements in fingerprinting evasion and user privacy protection.

Key Features:
• Enhanced Canvas fingerprinting protection
• Improved WebGL spoofing capabilities
• Advanced audio fingerprinting prevention
• Better timezone and language handling
• Optimized performance and memory usage

The new version includes over 50+ new evasion techniques that make it virtually impossible for websites to track and identify users. Our team has spent months researching the latest detection methods and implementing countermeasures.

This update is available immediately for all existing users and will be automatically applied to new installations. The browser maintains its user-friendly interface while providing enterprise-level privacy protection.`
    },
    {
      id: 2,
      title: "Increased Bot Availability",
      date: "2024-01-14",
      category: "Market",
      content: "We've added 50,000+ new bots from various countries to our marketplace.",
      fullContent: `Great news for our users! We've significantly expanded our bot marketplace with the addition of over 50,000 new high-quality bots from various countries around the world.

New Additions:
• 15,000+ bots from European countries
• 20,000+ bots from North America
• 10,000+ bots from Asia-Pacific region
• 5,000+ bots from emerging markets

Each bot has been thoroughly tested and verified to ensure optimal performance and reliability. Our expanded network now covers 45+ countries, giving users unprecedented access to diverse IP addresses and locations.

The new bots are available immediately and can be purchased through our standard pricing tiers. We've also introduced bulk purchase discounts for users requiring large quantities.`
    },
    {
      id: 3,
      title: "Security Update",
      date: "2024-01-13",
      category: "Security",
      content: "Enhanced encryption protocols implemented across all bot packages.",
      fullContent: `Security is our top priority, and we're proud to announce a comprehensive security upgrade across all our bot packages and services.

Security Enhancements:
• AES-256 encryption for all data transmission
• Enhanced SSL/TLS protocols (TLS 1.3 support)
• Two-factor authentication for all user accounts
• Advanced DDoS protection systems
• Real-time threat monitoring and response

These improvements ensure that all user data, bot communications, and payment information remain completely secure. Our security team continuously monitors for emerging threats and implements proactive measures to protect our infrastructure.

The update has been deployed across all servers and requires no action from users. All existing security features remain active while these new protections are added seamlessly.`
    },
    {
      id: 4,
      title: "New Payment Methods",
      date: "2024-01-12",
      category: "Payment",
      content: "Added support for additional cryptocurrencies including Monero and Zcash.",
      fullContent: `We're expanding our payment options to provide users with more flexibility and privacy in their transactions.

New Payment Methods:
• Monero (XMR) - Complete privacy-focused cryptocurrency
• Zcash (ZEC) - Optional privacy with selective disclosure
• Litecoin (LTC) - Fast and low-fee alternative to Bitcoin
• Ethereum (ETH) - Smart contract platform support

All new payment methods are now live and ready for use. Users can select their preferred cryptocurrency during checkout, and we'll provide real-time exchange rates and transaction confirmations.

We've also implemented improved payment processing with faster confirmations and lower transaction fees. Our payment system automatically handles currency conversion and ensures accurate pricing in real-time.`
    }
  ];

  const openNewsModal = (newsItem) => {
    setSelectedNews(newsItem);
    setIsModalOpen(true);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  };

  const closeNewsModal = () => {
    setIsModalOpen(false);
    setSelectedNews(null);
    // Restore body scroll
    document.body.style.overflow = 'unset';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">News & Updates</h1>
        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">22</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {newsItems.map((item) => (
          <div key={item.id} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-blue-500 transition-colors">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">{item.date}</span>
                <span className="px-2 py-1 text-xs bg-blue-600 text-white rounded-full">{item.category}</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-gray-300 text-sm">{item.content}</p>
            </div>
            <div className="px-4 py-3 bg-gray-700">
              <button 
                onClick={() => openNewsModal(item)}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
              >
                Read More →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Newsletter Section */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">Stay Updated</h2>
        <p className="text-gray-300 mb-4">
          Subscribe to our newsletter to receive the latest updates about new bots, software releases, and security improvements.
        </p>
        <div className="flex space-x-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded transition-colors">
            Subscribe
          </button>
        </div>
      </div>

      {/* News Detail Modal */}
      {isModalOpen && selectedNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-75 transition-opacity duration-300"
            onClick={closeNewsModal}
          />
          
          {/* Modal Content */}
          <div className="relative bg-gray-800 rounded-lg border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gray-800 px-6 py-4 border-b border-gray-700 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded-full">
                    {selectedNews.category}
                  </span>
                  <span className="text-sm text-gray-400">{selectedNews.date}</span>
                </div>
                <button
                  onClick={closeNewsModal}
                  className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <h2 className="text-2xl font-bold text-white mt-3">{selectedNews.title}</h2>
            </div>
            
            {/* Modal Body */}
            <div className="px-6 py-6">
              <div className="prose prose-invert max-w-none">
                <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {selectedNews.fullContent}
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-800 px-6 py-4 border-t border-gray-700 rounded-b-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">
                  Published on {selectedNews.date}
                </span>
                <button
                  onClick={closeNewsModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default News;
