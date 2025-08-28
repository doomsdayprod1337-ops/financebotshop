import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/axios';
import { Shield, Skull, Lock, Mail, Key } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage('Please enter your email address');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');
    setMessageType('');

    try {
      const response = await api.post('/api/forgot-password', { email: email.trim() });
      
      if (response.data.resetLink) {
        // Development mode - show the reset link
        setMessage(`Password reset link generated! Reset Link: ${response.data.resetLink}`);
        setMessageType('success');
      } else {
        setMessage('Password reset instructions have been sent to your email');
        setMessageType('success');
      }
      setEmail('');
    } catch (error) {
      console.error('Forgot password error:', error);
      
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 404) {
        errorMessage = 'Email address not found. Please check your email or register.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many reset attempts. Please wait before trying again.';
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setIsLoading(false);
      
      // Auto-clear error messages after 8 seconds
      if (messageType === 'error') {
        setTimeout(() => {
          setMessage('');
          setMessageType('');
        }, 8000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-pattern opacity-5"></div>
      
      {/* Dark overlay with subtle red gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 opacity-90"></div>
      
      {/* Floating red particles effect */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-red-500 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="p-6 flex justify-between items-center border-b border-gray-700/30">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Skull className="w-8 h-8 text-red-500 animate-pulse" />
              <div className="absolute inset-0 bg-red-500 opacity-20 blur-md rounded-full"></div>
            </div>
            <h1 className="text-2xl font-bold text-red-500 text-glow-red animate-pulse">
              REAPER MARKET
            </h1>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Shield className="w-4 h-4" />
            <span>Secure Portal</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            {/* Welcome Message */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-800 rounded-full border border-red-500/30 mb-4 border-glow-red">
                <Key className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                RESET ACCESS
              </h2>
              <p className="text-gray-400 text-sm">
                Recover your account credentials
              </p>
            </div>

            {/* Reset Form */}
            <div className="bg-gray-800/50 border border-gray-700 backdrop-blur-sm rounded-lg p-6">
              <div className="mb-6">
                <h3 className="text-white text-xl font-bold mb-2">Password Recovery</h3>
                <p className="text-gray-400 text-sm">
                  Enter your email to receive reset instructions
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-gray-300 text-sm font-medium">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-red-500/30 text-white placeholder-gray-500 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 transition-colors"
                      placeholder="Enter your email address"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Mail className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Message Display */}
                {message && (
                  <div className={`text-center p-3 rounded-md border relative ${
                    messageType === 'success'
                      ? 'bg-green-900/50 text-green-300 border-green-500' 
                      : 'bg-red-900/50 text-red-300 border-red-500'
                  }`}>
                    <button
                      onClick={() => {
                        setMessage('');
                        setMessageType('');
                      }}
                      className={`absolute top-2 right-2 p-1 rounded-full hover:bg-opacity-20 ${
                        messageType === 'success' 
                          ? 'hover:bg-green-400 text-green-300' 
                          : 'hover:bg-red-400 text-red-300'
                      }`}
                      aria-label="Dismiss message"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    
                    <div className="flex items-center justify-center space-x-2">
                      {messageType === 'success' ? (
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      <span className="text-sm font-medium">{message}</span>
                    </div>
                    
                    {/* Copy button for reset link in development mode */}
                    {messageType === 'success' && message.includes('Reset Link:') && (
                      <div className="mt-3">
                        <button
                          onClick={() => {
                            const resetLink = message.split('Reset Link: ')[1];
                            navigator.clipboard.writeText(resetLink);
                            // Show temporary success message
                            const originalMessage = message;
                            setMessage('Reset link copied to clipboard!');
                            setTimeout(() => setMessage(originalMessage), 2000);
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Copy Reset Link
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>SENDING...</span>
                    </div>
                  ) : (
                    'SEND RESET LINK'
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="text-center">
                  <Link
                    to="/login"
                    className="text-red-400 hover:text-red-300 transition-colors font-medium"
                  >
                    Back to Login
                  </Link>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-6 text-center text-xs text-gray-500">
              <p>Don't have an account?</p>
              <Link
                to="/register"
                className="font-medium text-red-400 hover:text-red-300 transition-colors"
              >
                Sign up here
              </Link>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 border-t border-gray-700/30">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <p>&copy; 2024 Reaper Market. All rights reserved.</p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-red-500 transition-colors">Privacy</a>
              <a href="#" className="hover:text-red-500 transition-colors">Terms</a>
              <a href="#" className="hover:text-red-500 transition-colors">Support</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ForgotPassword;
