import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Configs = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('cookiebullet');
  const [configs, setConfigs] = useState({
    cookiebullet: [],
    openbullet: [],
    silverbullet: [],
    bas: [],
    bltools: []
  });
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const tabConfigs = [
    { id: 'cookiebullet', name: 'Cookiebullet', icon: '🍪' },
    { id: 'openbullet', name: 'Openbullet', icon: '🔓' },
    { id: 'silverbullet', name: 'Silverbullet', icon: '🥈' },
    { id: 'bas', name: 'BAS', icon: '📊' },
    { id: 'bltools', name: 'BL Tools', icon: '🛠️' }
  ];

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/configs', {
        headers: {
          'Authorization': `Bearer ${user?.access_token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConfigs(data.configs);
      }
    } catch (error) {
      console.error('Error loading configs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCPMColor = (cpm) => {
    switch (cpm.toLowerCase()) {
      case 'low': return 'bg-green-500';
      case 'med': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'extreme': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDataTypeColor = (dataType) => {
    switch (dataType.toLowerCase()) {
      case 'user:pass': return 'bg-blue-500';
      case 'email:pass': return 'bg-purple-500';
      case 'cookies': return 'bg-green-500';
      case 'misc': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getCapturesColor = (captures) => {
    switch (captures.toLowerCase()) {
      case 'balance': return 'bg-green-500';
      case 'profile details': return 'bg-blue-500';
      case 'fullz': return 'bg-red-500';
      case 'payment methods': return 'bg-purple-500';
      case 'user location': return 'bg-yellow-500';
      case 'rewards/points': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  const getProxyColor = (proxy) => {
    switch (proxy.toLowerCase()) {
      case 'proxyless': return 'bg-gray-500';
      case 'http': return 'bg-blue-500';
      case 'socks4': return 'bg-green-500';
      case 'socks5': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const openConfigDetails = (config) => {
    setSelectedConfig(config);
  };

  const closeConfigDetails = () => {
    setSelectedConfig(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">⚙️ Configs</h1>
          <p className="text-gray-400">Browse and purchase high-quality configurations for various tools</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabConfigs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="text-xl mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>

        {/* Configs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {configs[activeTab]?.map((config) => (
            <div
              key={config.id}
              className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-all duration-200 cursor-pointer border border-gray-700 hover:border-blue-500"
              onClick={() => openConfigDetails(config)}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-white">{config.name}</h3>
                <span className="text-2xl font-bold text-green-400">${config.pricing}</span>
              </div>

              <div className="space-y-3">
                {/* CPM */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">CPM:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getCPMColor(config.cpm)}`}>
                    {config.cpm}
                  </span>
                </div>

                {/* Data Type */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Data Type:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getDataTypeColor(config.dataType)}`}>
                    {config.dataType}
                  </span>
                </div>

                {/* Captures */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Captures:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getCapturesColor(config.captures)}`}>
                    {config.captures}
                  </span>
                </div>

                {/* Proxy Options */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Proxy:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getProxyColor(config.proxyOptions)}`}>
                    {config.proxyOptions}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {(!configs[activeTab] || configs[activeTab].length === 0) && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">⚙️</div>
            <h3 className="text-2xl font-semibold text-gray-300 mb-2">No Configs Available</h3>
            <p className="text-gray-500">No configurations found for {tabConfigs.find(tab => tab.id === activeTab)?.name}</p>
          </div>
        )}
      </div>

      {/* Config Details Modal */}
      {selectedConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedConfig.name}</h2>
                  <p className="text-gray-400">Detailed configuration information</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-400 mb-1">${selectedConfig.pricing}</div>
                  <button
                    onClick={closeConfigDetails}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Config Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-3">Configuration Details</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">CPM:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getCPMColor(selectedConfig.cpm)}`}>
                          {selectedConfig.cpm}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Data Type:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getDataTypeColor(selectedConfig.dataType)}`}>
                          {selectedConfig.dataType}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Captures:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getCapturesColor(selectedConfig.captures)}`}>
                          {selectedConfig.captures}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Proxy Options:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getProxyColor(selectedConfig.proxyOptions)}`}>
                          {selectedConfig.proxyOptions}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-3">Description</h4>
                    <p className="text-gray-300">{selectedConfig.description || 'No description available.'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Example Captures */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-3">Example Captures</h4>
                    {selectedConfig.exampleCaptures ? (
                      <div className="bg-gray-800 rounded p-3 font-mono text-sm text-gray-300">
                        <pre>{selectedConfig.exampleCaptures}</pre>
                      </div>
                    ) : (
                      <p className="text-gray-400">No example captures available.</p>
                    )}
                  </div>

                  {/* Screenshots */}
                  {selectedConfig.screenshots && selectedConfig.screenshots.length > 0 && (
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-white mb-3">Screenshots</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedConfig.screenshots.map((screenshot, index) => (
                          <img
                            key={index}
                            src={screenshot}
                            alt={`Screenshot ${index + 1}`}
                            className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open(screenshot, '_blank')}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-700">
                <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200">
                  Purchase Config
                </button>
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200">
                  Add to Cart
                </button>
                <button
                  onClick={closeConfigDetails}
                  className="px-6 py-3 border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors duration-200"
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

export default Configs;
