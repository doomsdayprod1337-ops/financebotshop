import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { CartProvider } from './contexts/CartContext.jsx';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CreditCards from './pages/CreditCards.jsx';
import Bots from './pages/Bots.jsx';
import Services from './pages/Services.jsx';
import GenesisWiki from './pages/GenesisWiki.jsx';
import News from './pages/News.jsx';
import GenerateFP from './pages/GenerateFP.jsx';
import Purchases from './pages/Purchases.jsx';
import Payments from './pages/Payments.jsx';
import Tickets from './pages/Tickets.jsx';
import Software from './pages/Software.jsx';
import BinChecker from './pages/BinChecker.jsx';
import Downloads from './pages/Downloads.jsx';
import Profile from './pages/Profile.jsx';
import Invites from './pages/Invites.jsx';
import Referrals from './pages/Referrals.jsx';
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-gray-900 text-white">
            <Routes>
              {/* Public routes - no authentication required */}
              <Route path="/login" element={
                <ProtectedRoute requireAuth={false}>
                  <Login />
                </ProtectedRoute>
              } />
              <Route path="/register" element={
                <ProtectedRoute requireAuth={false}>
                  <Register />
                </ProtectedRoute>
              } />
              <Route path="/forgot-password" element={
                <ProtectedRoute requireAuth={false}>
                  <ForgotPassword />
                </ProtectedRoute>
              } />
              <Route path="/reset-password" element={
                <ProtectedRoute requireAuth={false}>
                  <ResetPassword />
                </ProtectedRoute>
              } />
              <Route path="/admin-login" element={<AdminLogin />} />
              
              {/* Admin routes - require admin authentication */}
              <Route path="/admin" element={
                <ProtectedRoute requireAuth={true} requireAdmin={true}>
                  <AdminPanel />
                </ProtectedRoute>
              } />
              
              {/* Protected routes - require authentication */}
              <Route path="/" element={
                <ProtectedRoute requireAuth={true}>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="credit-cards" element={<CreditCards />} />
                <Route path="bots" element={<Bots />} />
                <Route path="services" element={<Services />} />
                <Route path="wiki" element={<GenesisWiki />} />
                <Route path="genesis-wiki" element={<GenesisWiki />} />
                <Route path="news" element={<News />} />
                <Route path="generate-fp" element={<GenerateFP />} />
                <Route path="purchases" element={<Purchases />} />
                <Route path="payments" element={<Payments />} />
                <Route path="tickets" element={<Tickets />} />
                <Route path="software" element={<Software />} />
                <Route path="bin-checker" element={<BinChecker />} />
                <Route path="downloads" element={<Downloads />} />
                <Route path="profile" element={<Profile />} />
                <Route path="invites" element={<Invites />} />
                <Route path="referrals" element={<Referrals />} />
              </Route>
            </Routes>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
