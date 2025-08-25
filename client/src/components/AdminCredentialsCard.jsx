import React from 'react';

const AdminCredentialsCard = ({ showAutoFill = false, onAutoFill }) => {
  return (
    <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-6 border border-blue-700 shadow-lg">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white text-lg">🔑</span>
          </div>
          <h3 className="text-xl font-bold text-white">Default Admin Access</h3>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-600 mb-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 font-medium">Email:</span>
              <span className="text-green-400 font-mono text-sm bg-gray-700 px-2 py-1 rounded">
                admin@admin.com
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300 font-medium">Password:</span>
              <span className="text-green-400 font-mono text-sm bg-gray-700 px-2 py-1 rounded">
                admin
              </span>
            </div>
          </div>
        </div>

        {showAutoFill && onAutoFill && (
          <button
            onClick={onAutoFill}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors mb-3"
          >
            🔑 Auto-Fill Credentials
          </button>
        )}

        <div className="text-xs text-gray-400 space-y-1">
          <p>⚠️ Change password after first login for security</p>
          <p>🔒 Keep these credentials secure and private</p>
        </div>
      </div>
    </div>
  );
};

export default AdminCredentialsCard;
