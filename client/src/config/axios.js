import axios from 'axios';

// Create axios instance with proper configuration for Netlify deployment
const api = axios.create({
  // Use relative paths for Netlify functions
  // The /api/* path will be redirected to /.netlify/functions/* by Netlify
  baseURL: '',
  timeout: 30000, // Increased timeout for Netlify functions
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      const errorData = error.response?.data;
      // Handle ban/suspension responses
      if (errorData?.status && ['banned', 'suspended'].includes(errorData.status)) {
        // Clear token and redirect to login for banned users
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } else if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message;
      
      // Only redirect for specific token-related errors
      if (errorMessage === 'Invalid token' || errorMessage === 'Invalid or expired token') {
        // Clear token and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
