import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const BinChecker = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [binInput, setBinInput] = useState('');
  const [bulkBins, setBulkBins] = useState('');
  const [checkMode, setCheckMode] = useState('single'); // 'single' or 'bulk'
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('checker');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Load history and stats
    loadHistory();
    loadStats();
  }, [isAuthenticated, navigate]);

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/bin-check/history');
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/bin-check/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSingleBinCheck = async () => {
    if (!binInput.trim()) {
      setError('Please enter a BIN');
      return;
    }

    // Validate BIN format
    if (!/^\d{6,8}$/.test(binInput.trim())) {
      setError('BIN must be 6-8 digits');
      return;
    }

    setError('');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/bin-check/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ bin: binInput.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.bin_info) {
          setResults([data.bin_info]);
          loadHistory(); // Refresh history
          loadStats(); // Refresh stats
        } else {
          setError('Invalid response from server');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to check BIN');
      }
    } catch (error) {
      console.error('BIN check error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkBinCheck = async () => {
    if (!bulkBins.trim()) {
      setError('Please enter BINs');
      return;
    }

    const bins = bulkBins.split(/[,;\n]/).map(bin => bin.trim()).filter(bin => bin);
    if (bins.length === 0) {
      setError('Please enter valid BINs');
      return;
    }

    if (bins.length > 100) {
      setError('Maximum 100 BINs allowed per request');
      return;
    }

    // Validate each BIN format
    const invalidBins = bins.filter(bin => !/^\d{6,8}$/.test(bin));
    if (invalidBins.length > 0) {
      setError(`Invalid BIN format: ${invalidBins.slice(0, 3).join(', ')}${invalidBins.length > 3 ? '...' : ''}`);
      return;
    }

    setError('');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/bin-check/bulk-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ bins })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.results) {
          setResults(data.results);
          loadHistory(); // Refresh history
          loadStats(); // Refresh stats
        } else {
          setError('Invalid response from server');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to check BINs');
      }
    } catch (error) {
      console.error('Bulk BIN check error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setBinInput('');
    setBulkBins('');
    setError('');
  };

  const exportResults = () => {
    if (results.length === 0) return;
    
    const csvContent = [
      'BIN,Brand,Type,Level,Country,Bank,Prepaid,Corporate,Source',
      ...results.map(result => 
        `${result.bin},${result.brand},${result.type},${result.level},${result.country},${result.bank},${result.prepaid},${result.corporate},${result.source}`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bin-check-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && checkMode === 'single') {
      handleSingleBinCheck();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🔍 BIN Checker</h1>
          <p className="text-gray-400">Validate and get detailed information about credit card BINs</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg mb-6">
          <button
            onClick={() => setActiveTab('checker')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              activeTab === 'checker' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🔍 BIN Checker
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              activeTab === 'history' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📚 History
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              activeTab === 'stats' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📊 Statistics
          </button>
        </div>

        {/* BIN Checker Tab */}
        {activeTab === 'checker' && (
          <div className="space-y-6">
            {/* Mode Selection */}
            <div className="flex space-x-4">
              <button
                onClick={() => setCheckMode('single')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  checkMode === 'single' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Single BIN Check
              </button>
              <button
                onClick={() => setCheckMode('bulk')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  checkMode === 'bulk' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Bulk BIN Check
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
                <div className="flex items-center">
                  <span className="mr-2">⚠️</span>
                  <span>{error}</span>
                  <button 
                    onClick={() => setError('')}
                    className="ml-auto text-red-300 hover:text-red-100"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Input Section */}
            <div className="bg-gray-800 rounded-lg p-6">
              {checkMode === 'single' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Enter BIN (6-8 digits)
                    </label>
                    <input
                      type="text"
                      value={binInput}
                      onChange={(e) => setBinInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="e.g., 411111"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={8}
                    />
                    <p className="text-sm text-gray-400 mt-1">
                      Press Enter to search or click the button below
                    </p>
                  </div>
                  <button
                    onClick={handleSingleBinCheck}
                    disabled={isLoading || !binInput.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    {isLoading ? '🔍 Checking...' : '🔍 Check BIN'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Enter BINs (separated by commas, semicolons, or new lines)
                    </label>
                    <textarea
                      value={bulkBins}
                      onChange={(e) => setBulkBins(e.target.value)}
                      placeholder="e.g., 411111, 555555, 622222"
                      rows={6}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-sm text-gray-400 mt-1">
                      Maximum 100 BINs per request
                    </p>
                  </div>
                  <button
                    onClick={handleBulkBinCheck}
                    disabled={isLoading || !bulkBins.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    {isLoading ? '🔍 Checking...' : '🔍 Check BINs'}
                  </button>
                </div>
              )}
            </div>

            {/* Results Section */}
            {results.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">
                    Results ({results.length})
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={exportResults}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      📥 Export CSV
                    </button>
                    <button
                      onClick={clearResults}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      🗑️ Clear
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4">BIN</th>
                        <th className="text-left py-3 px-4">Brand</th>
                        <th className="text-left py-3 px-4">Type</th>
                        <th className="text-left py-3 px-4">Level</th>
                        <th className="text-left py-3 px-4">Country</th>
                        <th className="text-left py-3 px-4">Bank</th>
                        <th className="text-left py-3 px-4">Prepaid</th>
                        <th className="text-left py-3 px-4">Corporate</th>
                        <th className="text-left py-3 px-4">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result, index) => (
                        <tr key={index} className="border-b border-gray-700 hover:bg-gray-700">
                          <td className="py-3 px-4 font-mono font-bold text-blue-400">{result.bin}</td>
                          <td className="py-3 px-4">{result.brand}</td>
                          <td className="py-3 px-4">{result.type}</td>
                          <td className="py-3 px-4">{result.level}</td>
                          <td className="py-3 px-4">{result.country}</td>
                          <td className="py-3 px-4">{result.bank}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              result.prepaid ? 'bg-green-600' : 'bg-red-600'
                            }`}>
                              {result.prepaid ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              result.corporate ? 'bg-green-600' : 'bg-red-600'
                            }`}>
                              {result.corporate ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              result.source === 'database' ? 'bg-blue-600' :
                              result.source === 'binlist_api' ? 'bg-green-600' :
                              result.source === 'zylalabs_api' ? 'bg-purple-600' :
                              result.source === 'fallback' ? 'bg-yellow-600' : 'bg-gray-600'
                            }`}>
                              {result.source}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">BIN Check History</h3>
            {history.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <div className="text-4xl mb-4">📚</div>
                <p>No BIN checks in history</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.slice(0, 20).map((item, index) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="font-mono text-lg text-blue-400">{item.bin}</span>
                        <span className="text-gray-400">|</span>
                        <span>{item.result?.brand || 'Unknown'}</span>
                        <span className="text-gray-400">|</span>
                        <span>{item.result?.country || 'Unknown'}</span>
                      </div>
                      <span className="text-sm text-gray-400">
                        {new Date(item.checked_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-6">BIN Check Statistics</h3>
            {stats ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">
                    {stats.total_checks}
                  </div>
                  <div className="text-gray-300">Total Checks</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">
                    {stats.unique_bins}
                  </div>
                  <div className="text-gray-300">Unique BINs</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-yellow-400 mb-2">
                    {stats.top_bins?.length || 0}
                  </div>
                  <div className="text-gray-300">Top BINs</div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <div className="text-4xl mb-4">📊</div>
                <p>No statistics available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BinChecker;
