import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../config/axios';
import { Eye, EyeOff, Shield, Skull, Lock, RefreshCw } from 'lucide-react';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    const resetToken = searchParams.get('token');
    if (!resetToken) {
      setMessage('Invalid reset link. Please request a new password reset.');
      setMessageType('error');
      return;
    }
    setToken(resetToken);
  }, [searchParams]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setMessage('');
    setMessageType('');

    try {
      const response = await api.post('/api/reset-password', {
        token: token,
        password: formData.password
      });
      
      setMessage('Password reset successful! Redirecting to login...');
      setMessageType('success');
      
      // Redirect to login after 3 seconds
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      console.error('Reset password error:', error);
      
      let errorMessage = 'Failed to reset password. Please try again.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid reset token or password. Please request a new reset link.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Reset token has expired. Please request a new reset link.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Reset token not found. Please request a new reset link.';
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
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
              <div className="text-center">
                <div className="mx-auto h-20 w-20 bg-red-600 rounded-full flex items-center justify-center mb-6">
                  <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Invalid Reset Link
                </h2>
                <p className="text-gray-400 text-sm mb-6">
                  The password reset link is invalid or has expired.
                </p>
                <button
                  onClick={() => navigate('/forgot-password')}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg text-sm transition-colors font-medium"
                >
                  Request New Reset Link
                </button>
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
  }

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
                <RefreshCw className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                SET NEW PASSWORD
              </h2>
              <p className="text-gray-400 text-sm">
                Create a new secure password for your account
              </p>
            </div>

            {/* Reset Form */}
            <div className="bg-gray-800/50 border border-gray-700 backdrop-blur-sm rounded-lg p-6">
              <div className="mb-6">
                <h3 className="text-white text-xl font-bold mb-2">Password Reset</h3>
                <p className="text-gray-400 text-sm">
                  Enter your new password below
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="password" className="text-gray-300 text-sm font-medium">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 bg-gray-700 border text-white placeholder-gray-500 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 pr-10 transition-colors ${
                        errors.password ? 'border-red-500' : 'border-red-500/30'
                      }`}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-xs">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-gray-300 text-sm font-medium">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 bg-gray-700 border text-white placeholder-gray-500 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 pr-10 transition-colors ${
                        errors.confirmPassword ? 'border-red-500' : 'border-red-500/30'
                      }`}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-400 text-xs">{errors.confirmPassword}</p>
                  )}
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      <span className="text-sm font-medium">{message}</span>
                    </div>
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
                      <span>RESETTING...</span>
                    </div>
                  ) : (
                    'RESET PASSWORD'
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="text-center">
                  <button
                    onClick={() => navigate('/login')}
                    className="text-red-400 hover:text-red-300 transition-colors font-medium"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
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

export default ResetPassword;
