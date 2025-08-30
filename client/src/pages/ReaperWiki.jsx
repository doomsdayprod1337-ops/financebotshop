import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/axios';

const ReaperWiki = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [wikiEntries, setWikiEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [wikiCount, setWikiCount] = useState(0);

  // Load wiki entries from database
  useEffect(() => {
    loadWikiEntries();
  }, []);

  // Load wiki count
  useEffect(() => {
    loadWikiCount();
  }, []);

  const loadWikiEntries = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/wiki-management');
      if (response.data.success) {
        setWikiEntries(response.data.wikiEntries || []);
      }
    } catch (error) {
      console.error('Error loading wiki entries:', error);
      setWikiEntries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWikiCount = async () => {
    try {
      const response = await api.get('/api/content-stats?timePeriod=7d');
      if (response.data.success) {
        setWikiCount(response.data.stats.wiki.recent);
      }
    } catch (error) {
      console.error('Error loading wiki count:', error);
    }
  };

  // Transform database entries to match expected format
  const wikiContent = {
    overview: {
      title: "Reaper Market Overview",
      content: [
        {
          section: "What is Reaper Market?",
          text: "Reaper Market is a premium, invitation-only marketplace for HQ credentials, digital fingerprints, and exclusively developed private tools. Our platform provides access to high-quality, private data from infected devices worldwide.",
          subsections: [
            "Premium credential marketplace",
            "Bot dump collections",
            "Professional services",
            "Secure and anonymous transactions"
          ]
        },
        {
          section: "Platform Features",
          text: "Our platform offers a comprehensive suite of tools and services designed for professionals and newbies alike.",
          subsections: [
            "Advanced filtering and search",
            "Real-time inventory updates",
            "Secure payment processing",
            "24/7 customer support",
            "Referral and bonus systems"
          ]
        },
        {
          section: "Security & Privacy",
          text: "We prioritize the security and privacy of our users with enterprise-grade encryption and anonymous transaction processing.",
          subsections: [
            "End-to-end encryption",
            "Anonymous payment methods",
            "No-logs policy",
            "Tor network support",
            "Multi-factor authentication"
          ]
        }
      ]
    },
    gettingStarted: {
      title: "Getting Started Guide",
      content: [
        {
          section: "Account Creation",
          text: "Creating an account on Reaper Market requires an invitation from an existing member. This ensures quality and security of our community.",
          steps: [
            "Obtain an invite code from a trusted member",
            "Visit the registration page",
            "Fill in your details and invite code",
            "Verify your email address",
            "Complete your profile setup"
          ]
        },
        {
          section: "First Purchase",
          text: "Making your first purchase is straightforward and secure. Follow these steps to get started.",
          steps: [
            "Browse available products",
            "Add items to your cart",
            "Review cart contents",
            "Choose payment method",
            "Complete transaction",
            "Download your purchase"
          ]
        },
        {
          section: "Security Best Practices",
          text: "Protect your account and maintain anonymity with these essential security practices.",
          steps: [
            "Use strong, unique passwords",
            "Enable two-factor authentication",
            "Use VPN or Tor for access",
            "Never share your credentials",
            "Regularly update your security settings"
          ]
        }
      ]
    },
    products: {
      title: "Product Categories",
      content: [
        {
          section: "Credit Cards",
          text: "Premium credit card data with full details including CVV, expiration dates, and cardholder information.",
          details: [
            "Card numbers and BIN information",
            "Bank details and locations",
            "SSN and DOB data",
            "Address and contact information",
            "Email and phone access"
          ]
        },
        {
          section: "Bot Dumps",
          text: "Comprehensive data from infected devices including login credentials, cookies, and system information.",
          details: [
            "Browser login credentials",
            "Stored cookies and sessions",
            "Browser extensions and plugins",
            "Installed applications",
            "System specifications and details"
          ]
        },
        {
          section: "Services",
          text: "Professional services including custom development, targeted attacks, and more.",
          details: [
            "Custom malware development",
            "Targeted phishing campaigns",
            "Social engineering services",
            "Infrastructure setup",
            "Training and consultation"
          ]
        }
      ]
    },
    payment: {
      title: "Payment & Transactions",
      content: [
        {
          section: "Accepted Payment Methods",
          text: "We accept various payment methods to ensure convenience and anonymity for our users.",
          methods: [
            "Cryptocurrencies (Bitcoin, Monero, Ethereum)",
            "Digital gift cards",
            "Prepaid debit cards",
            "Bank transfers (select regions)",
            "Escrow services for large transactions"
          ]
        },
        {
          section: "Transaction Security",
          text: "All transactions are secured with military-grade encryption and processed through secure channels.",
          features: [
            "End-to-end encryption",
            "Multi-signature wallets",
            "Escrow protection",
            "Dispute resolution system",
            "Transaction verification"
          ]
        },
        {
          section: "Pricing & Fees",
          text: "Our pricing is competitive and transparent, with no hidden fees or charges.",
          details: [
            "Competitive market rates",
            "Volume discounts available",
            "Referral bonuses",
            "Loyalty rewards program",
            "No hidden fees"
          ]
        }
      ]
    },
    support: {
      title: "Support & Community",
      content: [
        {
          section: "Customer Support",
          text: "Our dedicated support team is available 24/7 to assist you with any questions or issues.",
          services: [
            "24/7 live chat support",
            "Ticket system for complex issues",
            "Knowledge base and FAQs",
            "Video tutorials and guides",
            "Community forums"
          ]
        },
        {
          section: "Community Features",
          text: "Join our vibrant community of professionals and enthusiasts to share knowledge and experiences.",
          features: [
            "Private discussion forums",
            "Expert Q&A sessions",
            "Success story sharing",
            "Networking opportunities",
            "Exclusive member events"
          ]
        },
        {
          section: "Learning Resources",
          text: "Access comprehensive learning materials to improve your skills and knowledge.",
          resources: [
            "Video tutorials",
            "Written guides",
            "Case studies",
            "Best practices",
            "Security updates"
          ]
        }
      ]
    },
    referrals: {
      title: "Referral & Bonus System",
      content: [
        {
          section: "How Referrals Work",
          text: "Earn bonuses and commissions by referring new members to Reaper Market. Our referral system rewards both you and your referrals.",
          process: [
            "Share your referral code with potential members",
            "New members use your code during registration",
            "Both you and your referral receive bonuses",
            "Earn ongoing commissions from referral purchases",
            "Track your earnings in real-time"
          ]
        },
        {
          section: "Bonus Structure",
          text: "Our generous bonus structure ensures that both referrers and referrals benefit from the system.",
          bonuses: [
            "Instant $10 bonus for each successful referral",
            "5% commission on referral purchases",
            "Tiered rewards for high-performing referrers",
            "Monthly leaderboard competitions",
            "Exclusive rewards for top referrers"
          ]
        },
        {
          section: "Invite System",
          text: "Create and manage invites to control access to our exclusive marketplace.",
          features: [
            "Generate unlimited invite codes",
            "Track invite usage and status",
            "Set expiration dates for invites",
            "Email-specific invites",
            "Analytics and reporting"
          ]
        }
      ]
    }
  };

  const filteredContent = Object.entries(wikiContent).filter(([key, content]) =>
    content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    content.content.some(section => 
      section.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.text.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const renderContent = (content) => {
    return content.map((section, index) => (
      <div key={index} className="mb-8">
        <h3 className="text-xl font-semibold text-white mb-3 border-b border-gray-700 pb-2">
          {section.section}
        </h3>
        <p className="text-gray-300 mb-4 leading-relaxed">
          {section.text}
        </p>
        
        {section.subsections && (
          <ul className="list-disc list-inside space-y-2 text-gray-400">
            {section.subsections.map((item, idx) => (
              <li key={idx} className="ml-4">{item}</li>
            ))}
          </ul>
        )}
        
        {section.steps && (
          <ol className="list-decimal list-inside space-y-2 text-gray-400">
            {section.steps.map((step, idx) => (
              <li key={idx} className="ml-4">{step}</li>
            ))}
          </ol>
        )}
        
        {section.details && (
          <ul className="list-disc list-inside space-y-2 text-gray-400">
            {section.details.map((detail, idx) => (
              <li key={idx} className="ml-4">{detail}</li>
            ))}
          </ul>
        )}
        
        {section.methods && (
          <ul className="list-disc list-inside space-y-2 text-gray-400">
            {section.methods.map((method, idx) => (
              <li key={idx} className="ml-4">{method}</li>
            ))}
          </ul>
        )}
        
        {section.features && (
          <ul className="list-disc list-inside space-y-2 text-gray-400">
            {section.features.map((feature, idx) => (
              <li key={idx} className="ml-4">{feature}</li>
            ))}
          </ul>
        )}
        
        {section.services && (
          <ul className="list-disc list-inside space-y-2 text-gray-400">
            {section.services.map((service, idx) => (
              <li key={idx} className="ml-4">{service}</li>
            ))}
          </ul>
        )}
        
        {section.resources && (
          <ul className="list-disc list-inside space-y-2 text-gray-400">
            {section.resources.map((resource, idx) => (
              <li key={idx} className="ml-4">{resource}</li>
            ))}
          </ul>
        )}
        
        {section.process && (
          <ol className="list-decimal list-inside space-y-2 text-gray-400">
            {section.process.map((step, idx) => (
              <li key={idx} className="ml-4">{step}</li>
            ))}
          </ol>
        )}
        
        {section.bonuses && (
          <ul className="list-disc list-inside space-y-2 text-gray-400">
            {section.bonuses.map((bonus, idx) => (
              <li key={idx} className="ml-4">{bonus}</li>
            ))}
          </ul>
        )}
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Reaper Market Wiki</h1>
          <p className="text-gray-400 mt-2">Comprehensive guide to using Reaper Market</p>
        </div>
        <div className="flex items-center space-x-4">
          {wikiCount > 0 && (
            <span className="bg-purple-500 text-white text-xs px-3 py-2 rounded-full">{wikiCount} new entries</span>
          )}
          <Link
            to="/invites"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            🎫 Manage Invites
          </Link>
          <Link
            to="/referrals"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            👥 Referrals
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search wiki content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="absolute right-3 top-3 text-gray-400">
          🔍
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-700">
        {Object.entries(wikiContent).map(([key, content]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
              activeTab === key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {content.title}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 min-h-[600px]">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-gray-300 mt-2">Loading wiki content...</p>
          </div>
        ) : searchQuery ? (
          // Search Results
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">
              Search Results for "{searchQuery}"
            </h2>
            {filteredContent.length > 0 ? (
              filteredContent.map(([key, content]) => (
                <div key={key} className="mb-8">
                  <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">
                    {content.title}
                  </h3>
                  {renderContent(content.content)}
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-medium text-white mb-2">No results found</h3>
                <p className="text-gray-400">
                  Try adjusting your search terms or browse the tabs above
                </p>
              </div>
            )}
          </div>
        ) : (
          // Regular Tab Content
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">
              {wikiContent[activeTab].title}
            </h2>
            {renderContent(wikiContent[activeTab].content)}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 text-center">
          <div className="text-3xl mb-2">🎫</div>
          <h3 className="text-white font-medium mb-2">Create Invites</h3>
          <p className="text-gray-400 text-sm mb-3">
            Generate invite codes to bring new members
          </p>
          <Link
            to="/invites"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
          >
            Manage Invites
          </Link>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 text-center">
          <div className="text-3xl mb-2">👥</div>
          <h3 className="text-white font-medium mb-2">Referral Program</h3>
          <p className="text-gray-400 text-sm mb-3">
            Earn bonuses by referring new members
          </p>
          <Link
            to="/referrals"
            className="inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
          >
            View Referrals
          </Link>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 text-center">
          <div className="text-3xl mb-2">📚</div>
          <h3 className="text-white font-medium mb-2">Documentation</h3>
          <p className="text-gray-400 text-sm mb-3">
            Access comprehensive guides and tutorials
          </p>
          <button className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors">
            Browse Docs
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReaperWiki;
