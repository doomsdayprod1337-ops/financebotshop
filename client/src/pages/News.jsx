import React from 'react';

const News = () => {
  const newsItems = [
    {
      id: 1,
      title: "New Anti-Detect Browser Released",
      date: "2024-01-15",
      category: "Software",
      content: "Version 7.2 of our anti-detect browser is now available with improved fingerprinting evasion."
    },
    {
      id: 2,
      title: "Increased Bot Availability",
      date: "2024-01-14",
      category: "Market",
      content: "We've added 50,000+ new bots from various countries to our marketplace."
    },
    {
      id: 3,
      title: "Security Update",
      date: "2024-01-13",
      category: "Security",
      content: "Enhanced encryption protocols implemented across all bot packages."
    },
    {
      id: 4,
      title: "New Payment Methods",
      date: "2024-01-12",
      category: "Payment",
      content: "Added support for additional cryptocurrencies including Monero and Zcash."
    }
  ];

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
              <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                Read More →
              </button>
            </div>
          </div>
        ))}
      </div>

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
    </div>
  );
};

export default News;
