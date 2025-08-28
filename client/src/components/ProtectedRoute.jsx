import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

const ProtectedRoute = ({ children, requireAuth = true, requireAdmin = false, redirectTo = '/login' }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Debug logging for admin routes
  if (process.env.NODE_ENV === 'development' && requireAdmin) {
    console.log('=== PROTECTED ROUTE DEBUG ===');
    console.log('Route:', location.pathname);
    console.log('Require Auth:', requireAuth);
    console.log('Require Admin:', requireAdmin);
    console.log('User:', user);
    console.log('User is_admin:', user?.is_admin);
    console.log('Loading:', loading);
  }

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If authentication is required and user is not logged in
  if (requireAuth && !user) {
    // Redirect to login with the current location to redirect back after login
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If admin access is required and user is not admin
  if (requireAdmin && user && !user.is_admin) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Admin access denied - redirecting to dashboard');
    }
    // Redirect to dashboard if user is not admin
    return <Navigate to="/dashboard" replace />;
  }

  // If user is logged in but trying to access login/register pages
  if (!requireAuth && user) {
    // Redirect to dashboard if they're already logged in
    return <Navigate to="/dashboard" replace />;
  }

  // User is authenticated and can access the page
  if (process.env.NODE_ENV === 'development' && requireAdmin) {
    console.log('Admin access granted - rendering component');
  }
  return children;
};

export default ProtectedRoute;
