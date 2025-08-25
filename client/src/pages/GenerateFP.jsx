import React, { useState } from 'react';

const GenerateFP = () => {
  const [fingerprint, setFingerprint] = useState({
    country: 'US',
    browser: 'Chrome',
    os: 'Windows',
    language: 'en-US',
    timezone: 'America/New_York'
  });

  const [generatedFP, setGeneratedFP] = useState(null);

  const handleGenerate = () => {
    // Simulate fingerprint generation
    const fp = {
      id: `FP-${Date.now()}`,
      ...fingerprint,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      screen: '1920x1080',
      canvas: 'canvas_hash_abc123',
      webgl: 'webgl_hash_def456',
      audio: 'audio_hash_ghi789',
      fonts: ['Arial', 'Calibri', 'Times New Roman'],
      plugins: ['Chrome PDF Plugin', 'Chrome PDF Viewer'],
      timestamp: new Date().toISOString()
    };
    setGeneratedFP(fp);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Generate Fingerprint</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Fingerprint Configuration</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
              <select
                value={fingerprint.country}
                onChange={(e) => setFingerprint({...fingerprint, country: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
                <option value="ES">Spain</option>
                <option value="IT">Italy</option>
                <option value="JP">Japan</option>
                <option value="CA">Canada</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Browser</label>
              <select
                value={fingerprint.browser}
                onChange={(e) => setFingerprint({...fingerprint, browser: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Chrome">Chrome</option>
                <option value="Firefox">Firefox</option>
                <option value="Edge">Edge</option>
                <option value="Safari">Safari</option>
                <option value="Opera">Opera</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Operating System</label>
              <select
                value={fingerprint.os}
                onChange={(e) => setFingerprint({...fingerprint, os: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Windows">Windows</option>
                <option value="macOS">macOS</option>
                <option value="Linux">Linux</option>
                <option value="Android">Android</option>
                <option value="iOS">iOS</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
              <select
                value={fingerprint.language}
                onChange={(e) => setFingerprint({...fingerprint, language: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="de-DE">German</option>
                <option value="fr-FR">French</option>
                <option value="es-ES">Spanish</option>
                <option value="it-IT">Italian</option>
                <option value="ja-JP">Japanese</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Timezone</label>
              <select
                value={fingerprint.timezone}
                onChange={(e) => setFingerprint({...fingerprint, timezone: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Berlin">Berlin</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={handleGenerate}
            className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded transition-colors"
          >
            Generate Fingerprint
          </button>
        </div>

        {/* Generated Fingerprint Display */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Generated Fingerprint</h2>
          
          {generatedFP ? (
            <div className="space-y-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-white mb-3">Basic Info</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">ID:</span>
                    <span className="text-white ml-2">{generatedFP.id}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Country:</span>
                    <span className="text-white ml-2">{generatedFP.country}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Browser:</span>
                    <span className="text-white ml-2">{generatedFP.browser}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">OS:</span>
                    <span className="text-white ml-2">{generatedFP.os}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-white mb-3">Technical Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">User Agent:</span>
                    <div className="text-white text-xs bg-gray-800 p-2 rounded mt-1 break-all">{generatedFP.userAgent}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Screen:</span>
                    <span className="text-white ml-2">{generatedFP.screen}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Canvas Hash:</span>
                    <span className="text-white ml-2 font-mono text-xs">{generatedFP.canvas}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors">
                  Download
                </button>
                <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded transition-colors">
                  Use in Bot
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✏️</div>
              <h3 className="text-lg font-medium text-white mb-2">No Fingerprint Generated</h3>
              <p className="text-gray-400">Configure your settings and click "Generate Fingerprint" to create a new digital identity.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerateFP;
