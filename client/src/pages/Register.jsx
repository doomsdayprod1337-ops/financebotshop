import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../config/axios';
import { Eye, EyeOff, Shield, Skull, Lock, UserPlus } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('invite');
  const referralCode = searchParams.get('ref');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    inviteCode: inviteCode || '',
    referralCode: referralCode || ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

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

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters long';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    }

    // Confirm password validation
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
      const response = await api.post('/api/register', {
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        inviteCode: formData.inviteCode.trim() || null,
        referralCode: formData.referralCode.trim() || null
      });

      setMessage('Registration successful! Redirecting to login...');
      setMessageType('success');
      
      // Store token if needed
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid registration data. Please check your information.';
      } else if (error.response?.status === 409) {
        errorMessage = 'Username or email already exists. Please choose different credentials.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid invite code. Please check your invite code and try again.';
      } else if (error.response?.status === 422) {
        errorMessage = 'Validation failed. Please check your input and try again.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setMessage(errorMessage);
      setMessageType('error');
      
      // Auto-clear error messages after 8 seconds
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 8000);
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/(?=.*[a-z])/.test(password)) score++;
    if (/(?=.*[A-Z])/.test(password)) score++;
    if (/(?=.*\d)/.test(password)) score++;
    if (/(?=.*[!@#$%^&*])/.test(password)) score++;

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['text-red-500', 'text-orange-500', 'text-yellow-500', 'text-blue-500', 'text-green-500'];
    
    return {
      score: Math.min(score, 4),
      label: labels[Math.min(score, 4)],
      color: colors[Math.min(score, 4)]
    };
  };

  const passwordStrength = getPasswordStrength(formData.password);

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
                <UserPlus className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                JOIN THE MARKET
              </h2>
              <p className="text-gray-400 text-sm">
                Create your account to access premium assets
              </p>
            </div>

            {/* Default Invite Code Display */}
            <div className="bg-gradient-to-r from-green-900 to-blue-900 rounded-lg p-4 border border-green-700 mb-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-3">🎉 Grand Opening Special!</h3>
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-600 mb-3">
                  <div className="text-center">
                    <span className="text-gray-300 text-sm">Use Invite Code:</span>
                    <div className="mt-2">
                      <span className="text-xl font-bold text-green-400 font-mono bg-gray-700 px-3 py-1 rounded border border-green-500">
                        GRANDOPEN
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Unlimited access • Never expires • No restrictions
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      inviteCode: 'GRANDOPEN'
                    }));
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  🔑 Use GRANDOPEN Code
                </button>
              </div>
            </div>

            {/* Registration Form */}
            <div className="bg-gray-800/50 border border-gray-700 backdrop-blur-sm rounded-lg p-6">
              <div className="mb-6">
                <h3 className="text-white text-xl font-bold mb-2">Create Account</h3>
                <p className="text-gray-400 text-sm">
                  Join the marketplace with secure credentials
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-gray-300 text-sm font-medium">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 bg-gray-700 border text-white placeholder-gray-500 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 transition-colors ${
                      errors.username ? 'border-red-500' : 'border-red-500/30'
                    }`}
                    placeholder="Choose a unique username"
                  />
                  {errors.username && (
                    <p className="text-red-400 text-xs">{errors.username}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-gray-300 text-sm font-medium">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 bg-gray-700 border text-white placeholder-gray-500 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 transition-colors ${
                      errors.email ? 'border-red-500' : 'border-red-500/30'
                    }`}
                    placeholder="your@email.com"
                  />
                  {errors.email && (
                    <p className="text-red-400 text-xs">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-gray-300 text-sm font-medium">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 bg-gray-700 border text-white placeholder-gray-500 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 pr-10 transition-colors ${
                        errors.password ? 'border-red-500' : 'border-red-500/30'
                      }`}
                      placeholder="Create a strong password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`h-2 w-6 rounded-full ${
                                level <= passwordStrength.score
                                  ? passwordStrength.color.replace('text-', 'bg-')
                                  : 'bg-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className={`text-xs ${passwordStrength.color}`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                    </div>
                  )}
                  {errors.password && (
                    <p className="text-red-400 text-xs">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-gray-300 text-sm font-medium">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 bg-gray-700 border text-white placeholder-gray-500 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 pr-10 transition-colors ${
                        errors.confirmPassword ? 'border-red-500' : 'border-red-500/30'
                      }`}
                      placeholder="Confirm your password"
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

                <div className="space-y-2">
                  <label htmlFor="inviteCode" className="text-gray-300 text-sm font-medium">
                    Invite Code <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="inviteCode"
                    name="inviteCode"
                    type="text"
                    required
                    value={formData.inviteCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-red-500/30 text-white placeholder-gray-500 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 transition-colors"
                    placeholder="Enter your invite code"
                  />
                  <p className="text-xs text-gray-500">
                    Invite codes are required for registration.
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="referralCode" className="text-gray-300 text-sm font-medium">
                    Referral Code <span className="text-gray-500">(Optional)</span>
                  </label>
                  <input
                    id="referralCode"
                    name="referralCode"
                    type="text"
                    value={formData.referralCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-red-500/30 text-white placeholder-gray-500 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 transition-colors"
                    placeholder="Enter referral code for bonus"
                  />
                  <p className="text-xs text-gray-500">
                    Get bonus credits when someone uses your referral code.
                  </p>
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
                      <span>CREATING ACCOUNT...</span>
                    </div>
                  ) : (
                    'CREATE ACCOUNT'
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="text-center">
                  <p className="text-gray-400 text-sm">
                    Already have an account?{' '}
                    <Link to="/login" className="text-red-400 hover:text-red-300 font-medium transition-colors">
                      Sign in here
                    </Link>
                  </p>
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

export default Register;
