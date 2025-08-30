import React from 'react';

const BanNotification = ({ status, message, onClose }) => {
  const getStatusInfo = () => {
    switch (status) {
      case 'banned':
        return {
          icon: '🚫',
          title: 'Account Banned',
          color: 'bg-red-600',
          borderColor: 'border-red-500',
          textColor: 'text-red-100'
        };
      case 'suspended':
        return {
          icon: '⚠️',
          title: 'Account Suspended',
          color: 'bg-yellow-600',
          borderColor: 'border-yellow-500',
          textColor: 'text-yellow-100'
        };
      default:
        return {
          icon: '❌',
          title: 'Account Deactivated',
          color: 'bg-gray-600',
          borderColor: 'border-gray-500',
          textColor: 'text-gray-100'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className={`max-w-md w-full ${statusInfo.color} rounded-lg shadow-2xl border-2 ${statusInfo.borderColor}`}>
        <div className="p-6 text-center">
          <div className="text-6xl mb-4">{statusInfo.icon}</div>
          <h2 className={`text-2xl font-bold ${statusInfo.textColor} mb-4`}>
            {statusInfo.title}
          </h2>
          
          <div className={`${statusInfo.textColor} mb-6 text-sm leading-relaxed`}>
            <p className="mb-3">{message}</p>
            
            {status === 'banned' && (
              <div className="bg-red-700 bg-opacity-50 rounded-lg p-3 mt-4">
                <p className="font-semibold mb-2">What this means:</p>
                <ul className="text-left space-y-1">
                  <li>• You cannot access your account</li>
                  <li>• All active sessions have been terminated</li>
                  <li>• You cannot log in or use the platform</li>
                </ul>
              </div>
            )}
            
            {status === 'suspended' && (
              <div className="bg-yellow-700 bg-opacity-50 rounded-lg p-3 mt-4">
                <p className="font-semibold mb-2">What this means:</p>
                <ul className="text-left space-y-1">
                  <li>• Your account is temporarily disabled</li>
                  <li>• You cannot access the platform</li>
                  <li>• Contact support for reinstatement</li>
                </ul>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            {status === 'banned' && (
              <button
                onClick={() => window.open('mailto:support@example.com?subject=Account Ban Appeal', '_blank')}
                className="w-full bg-red-700 hover:bg-red-800 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                📧 Appeal Ban
              </button>
            )}
            
            {status === 'suspended' && (
              <button
                onClick={() => window.open('mailto:support@example.com?subject=Account Suspension Inquiry', '_blank')}
                className="w-full bg-yellow-700 hover:bg-yellow-800 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                📧 Contact Support
              </button>
            )}
            
            <button
              onClick={onClose}
              className="w-full bg-gray-700 hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BanNotification;
