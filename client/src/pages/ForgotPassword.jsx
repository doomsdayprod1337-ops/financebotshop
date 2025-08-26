import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/axios';

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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-red-600 rounded-full flex items-center justify-center">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none relative block w-full px-3 py-3 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
              placeholder="Enter your email address"
            />
          </div>

          {/* Message Display */}
          {message && (
            <div className={`text-center p-4 rounded-lg border-2 relative ${
              messageType === 'success'
                ? 'bg-green-900/50 text-green-300 border-green-500 shadow-lg' 
                : 'bg-red-900/50 text-red-300 border-red-500 shadow-lg'
            }`}>
              {/* Dismiss Button */}
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
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className="font-medium">{message}</span>
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

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </div>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="font-medium text-red-400 hover:text-red-300 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </form>

        <div className="text-center text-xs text-gray-500">
          <p>Don't have an account?</p>
          <Link
            to="/register"
            className="font-medium text-red-400 hover:text-red-300 transition-colors"
          >
            Sign up here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
