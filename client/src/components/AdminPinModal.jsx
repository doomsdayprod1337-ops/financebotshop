import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminPinModal = ({ isOpen, onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const navigate = useNavigate();
  const pinInputRef = useRef(null);

  // Admin PIN - In production, this should be stored securely on the server
  const ADMIN_PIN = '1234'; // Change this to your desired admin PIN
  const MAX_ATTEMPTS = 3;
  const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  useEffect(() => {
    if (isOpen && pinInputRef.current) {
      pinInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isLocked && lockoutTime > 0) {
      const timer = setInterval(() => {
        setLockoutTime(prev => {
          if (prev <= 1000) {
            setIsLocked(false);
            setAttempts(0);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isLocked, lockoutTime]);

  const handlePinChange = (e) => {
    const value = e.target.value;
    if (value.length <= 4 && /^\d*$/.test(value)) {
      setPin(value);
      setError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isLocked) {
      return;
    }

    if (pin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }

    if (pin === ADMIN_PIN) {
      // Success - reset state and proceed
      setPin('');
      setError('');
      setAttempts(0);
      onSuccess();
      onClose();
    } else {
      // Failed attempt
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPin('');
      setError(`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);

      if (newAttempts >= MAX_ATTEMPTS) {
        // Lock out user
        setIsLocked(true);
        setLockoutTime(LOCKOUT_DURATION);
        setError(`Too many failed attempts. Account locked for ${Math.ceil(LOCKOUT_DURATION / 60000)} minutes.`);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const formatLockoutTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-md w-full p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">👑</div>
          <h2 className="text-xl font-bold text-white mb-2">Admin Access Required</h2>
          <p className="text-gray-400 text-sm">
            Enter your secure admin PIN to access the admin panel
          </p>
        </div>

        {/* Security Notice */}
        <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-400 text-lg">⚠️</span>
            <div className="text-yellow-200 text-sm">
              <p className="font-medium">Security Notice</p>
              <p>This action requires additional verification for your protection.</p>
            </div>
          </div>
        </div>

        {/* PIN Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Admin PIN
            </label>
            <input
              ref={pinInputRef}
              type="password"
              value={pin}
              onChange={handlePinChange}
              onKeyDown={handleKeyDown}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••"
              maxLength={4}
              disabled={isLocked}
              autoComplete="off"
            />
            <p className="text-xs text-gray-500 mt-1 text-center">
              Enter your 4-digit admin PIN
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`p-3 rounded-lg text-sm ${
              isLocked 
                ? 'bg-red-900 border border-red-700 text-red-200' 
                : 'bg-red-900 border border-red-700 text-red-200'
            }`}>
              <div className="flex items-center space-x-2">
                <span className="text-lg">
                  {isLocked ? '🔒' : '❌'}
                </span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Lockout Timer */}
          {isLocked && lockoutTime > 0 && (
            <div className="bg-red-900 border border-red-700 rounded-lg p-3 text-center">
              <div className="text-red-200 text-sm">
                <p className="font-medium">Account Locked</p>
                <p className="text-lg font-mono">
                  {formatLockoutTime(lockoutTime)}
                </p>
                <p>Remaining lockout time</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={isLocked || pin.length !== 4}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-colors font-medium"
            >
              {isLocked ? 'Locked' : 'Verify PIN'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLocked}
              className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Security Tips */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="text-center">
            <p className="text-gray-400 text-xs mb-2">🔒 Security Features:</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
              <div>• 4-digit PIN required</div>
              <div>• 3 attempts limit</div>
              <div>• 5-minute lockout</div>
              <div>• Session timeout</div>
            </div>
          </div>
        </div>

        {/* Emergency Access */}
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/admin-login')}
            className="text-blue-400 hover:text-blue-300 text-sm underline"
          >
            Need emergency access? Use admin login
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPinModal;
