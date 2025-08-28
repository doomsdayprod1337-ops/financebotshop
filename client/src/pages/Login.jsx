import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Eye, EyeOff, Shield, Skull, Lock } from 'lucide-react';

const Login = () => {
  const [credentials, setCredentials] = useState({
    loginIdentifier: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!credentials.loginIdentifier || !credentials.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('=== LOGIN PAGE: Submitting login ===');
      console.log('Login identifier:', credentials.loginIdentifier);
      
      // Determine if input is email or username
      const isEmail = credentials.loginIdentifier.includes('@');
      const loginData = isEmail 
        ? { email: credentials.loginIdentifier, password: credentials.password }
        : { username: credentials.loginIdentifier, password: credentials.password };
      
      const result = await login(loginData);
      console.log('Login result:', result);
      
      if (result.success) {
        console.log('Login successful, user:', result.user);
        
        // Redirect based on user role
        if (result.user?.is_admin) {
          console.log('Redirecting to admin panel');
          navigate('/admin', { replace: true });
        } else {
          console.log('Redirecting to dashboard');
          navigate('/dashboard', { replace: true });
        }
      } else {
        console.log('Login failed:', result.error);
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('=== LOGIN PAGE: Unexpected error ===');
      console.error('Error details:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
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
                <Lock className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                ENTER THE MARKET
          </h2>
              <p className="text-gray-400 text-sm">
                Access requires proper credentials
              </p>
            </div>

            {/* Login Form */}
            <div className="bg-gray-800/50 border border-gray-700 backdrop-blur-sm rounded-lg p-6">
              <div className="mb-6">
                <h3 className="text-white text-xl font-bold mb-2">Access Portal</h3>
                <p className="text-gray-400 text-sm">
                  Enter your credentials to continue
                </p>
        </div>
        
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="loginIdentifier" className="text-gray-300 text-sm font-medium">
                Email or Username
              </label>
              <input
                id="loginIdentifier"
                name="loginIdentifier"
                type="text"
                autoComplete="username"
                required
                    className="w-full px-3 py-2 bg-gray-700 border border-red-500/30 text-white placeholder-gray-500 rounded-md focus:outline-none focus:border-red-500 focus:ring-red-500 transition-colors"
                    placeholder="Enter email or username"
                value={credentials.loginIdentifier}
                onChange={handleChange}
                disabled={loading}
              />
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
                autoComplete="current-password"
                required
                      className="w-full px-3 py-2 bg-gray-700 border border-red-500/30 text-white placeholder-gray-500 rounded-md focus:outline-none focus:border-red-500 focus:ring-red-500 pr-10 transition-colors"
                      placeholder="Enter password"
                value={credentials.password}
                onChange={handleChange}
                disabled={loading}
              />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
            </div>
          </div>

          {error && (
                  <div className="bg-red-900/50 border border-red-500 rounded-md p-3">
                    <p className="text-red-200 text-sm text-center">{error}</p>
            </div>
          )}

            <button
              type="submit"
              disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>ENTERING...</span>
                </div>
              ) : (
                    'ENTER MARKET'
              )}
            </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <a href="/forgot-password" className="text-red-400 hover:text-red-300 transition-colors">
                    Forgot password?
                  </a>
                  <a href="/register" className="text-red-400 hover:text-red-300 transition-colors">
                    Create account
                  </a>
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

export default Login;
