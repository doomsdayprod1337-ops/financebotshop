import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

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

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

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

    try {
      const response = await api.post('/api/register', {
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        inviteCode: formData.inviteCode.trim() || null,
        referralCode: formData.referralCode.trim() || null
      });

      setMessage('Registration successful! Redirecting to login...');
      
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
      
      if (error.response?.data?.error) {
        setMessage(error.response.data.error);
      } else {
        setMessage('Registration failed. Please try again.');
      }
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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-r from-red-600 to-purple-600 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white">Join Genesis Market</h2>
          <p className="mt-2 text-gray-400">
            Access the premium marketplace for digital assets
          </p>
        </div>

        {/* Default Invite Code Display */}
        <div className="bg-gradient-to-r from-green-900 to-blue-900 rounded-lg p-6 border border-green-700">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-3">🎉 Grand Opening Special!</h3>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-600 mb-3">
              <div className="text-center">
                <span className="text-gray-300 text-sm">Use Invite Code:</span>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-green-400 font-mono bg-gray-700 px-4 py-2 rounded border border-green-500">
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
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm transition-colors"
            >
              🔑 Use GRANDOPEN Code
            </button>
          </div>
        </div>

        {/* Registration Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.username ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Choose a unique username"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-400">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="your@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.password ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Create a strong password"
              />
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-2 w-8 rounded-full ${
                            level <= passwordStrength.score
                              ? passwordStrength.color.replace('text-', 'bg-')
                              : 'bg-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-sm ${passwordStrength.color}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                </div>
              )}
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Invite Code */}
            <div>
              <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-300 mb-2">
                Invite Code <span className="text-red-400">*</span>
              </label>
              <input
                id="inviteCode"
                name="inviteCode"
                type="text"
                required
                value={formData.inviteCode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your invite code"
              />
              <p className="mt-1 text-xs text-gray-500">
                Invite codes are required for registration. Contact an existing member to get one.
              </p>
            </div>

            {/* Referral Code (Optional) */}
            <div>
              <label htmlFor="referralCode" className="block text-sm font-medium text-gray-300 mb-2">
                Referral Code <span className="text-gray-500">(Optional)</span>
              </label>
              <input
                id="referralCode"
                name="referralCode"
                type="text"
                value={formData.referralCode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter referral code for bonus"
              />
              <p className="mt-1 text-xs text-gray-500">
                Get bonus credits when someone uses your referral code.
              </p>
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`text-center p-3 rounded-md ${
              message.includes('successful') 
                ? 'bg-green-900 text-green-300 border border-green-700' 
                : 'bg-red-900 text-red-300 border border-red-700'
            }`}>
              {message}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creating Account...</span>
              </div>
            ) : (
              'Create Account'
            )}
          </button>

          {/* Terms and Privacy */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              By creating an account, you agree to our{' '}
              <Link to="/terms" className="text-blue-400 hover:text-blue-300">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-blue-400 hover:text-blue-300">
                Privacy Policy
              </Link>
            </p>
          </div>
        </form>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
              Sign in here
            </Link>
          </p>
        </div>

        {/* Features */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-medium text-white mb-3">Why Join Genesis Market?</h3>
          <div className="space-y-2 text-xs text-gray-400">
            <div className="flex items-center space-x-2">
              <span className="text-green-400">✓</span>
              <span>Access to premium stolen credentials</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-400">✓</span>
              <span>Secure and anonymous transactions</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-400">✓</span>
              <span>24/7 customer support</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-400">✓</span>
              <span>Referral bonus system</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
