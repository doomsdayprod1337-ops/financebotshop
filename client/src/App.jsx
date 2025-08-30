import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
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
import BotDetails from './pages/BotDetails.jsx';
import Services from './pages/Services.jsx';
import ReaperWiki from './pages/ReaperWiki.jsx';
import News from './pages/News.jsx';
import GenerateFP from './pages/GenerateFP.jsx';
import PaymentsPurchases from './pages/PaymentsPurchases.jsx';
import Tickets from './pages/Tickets.jsx';
import Software from './pages/Software.jsx';
import BinChecker from './pages/BinChecker.jsx';
import Downloads from './pages/Downloads.jsx';
import Profile from './pages/Profile.jsx';
import Invites from './pages/Invites.jsx';
import Referrals from './pages/Referrals.jsx';
import Deposits from './pages/Deposits.jsx';
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';
import CCDataDashboard from './pages/CCDataDashboard.jsx';
import CCImport from './pages/CCImport.jsx';
import CCManagement from './pages/CCManagement.jsx';
import CCAnalytics from './pages/CCAnalytics.jsx';
import Configs from './pages/Configs.jsx';
import FinanceDocuments from './pages/FinanceDocuments.jsx';

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
              
              {/* Admin routes - require admin authentication - MUST come before main routes */}
              <Route path="/admin" element={
                <ProtectedRoute requireAuth={true} requireAdmin={true}>
                  <AdminPanel />
                </ProtectedRoute>
              } />
              <Route path="/admin/cc-dashboard" element={
                <ProtectedRoute requireAuth={true} requireAdmin={true}>
                  <CCDataDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/cc-import" element={
                <ProtectedRoute requireAuth={true} requireAdmin={true}>
                  <CCImport />
                </ProtectedRoute>
              } />
              <Route path="/admin/cc-management" element={
                <ProtectedRoute requireAuth={true} requireAdmin={true}>
                  <CCManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/cc-analytics" element={
                <ProtectedRoute requireAuth={true} requireAdmin={true}>
                  <CCAnalytics />
                </ProtectedRoute>
              } />
              
              {/* Protected routes - require authentication - MUST come after admin routes */}
              <Route path="/" element={
                <ProtectedRoute requireAuth={true}>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="bots" element={<Bots />} />
                <Route path="bot/:botId" element={<BotDetails />} />
                <Route path="services" element={<Services />} />
                <Route path="wiki" element={<ReaperWiki />} />
                <Route path="news" element={<News />} />
                <Route path="generate-fp" element={<GenerateFP />} />
                <Route path="credit-cards" element={<CreditCards />} />
                <Route path="configs" element={<Configs />} />
                <Route path="finance-documents" element={<FinanceDocuments />} />
                <Route path="tickets" element={<Tickets />} />
                <Route path="software" element={<Software />} />
                <Route path="bin-checker" element={<BinChecker />} />
                <Route path="downloads" element={<Downloads />} />
                <Route path="profile" element={<Profile />} />
                <Route path="deposits" element={<Deposits />} />
                <Route path="invites" element={<Invites />} />
                <Route path="referrals" element={<Referrals />} />
                <Route path="payments-purchases" element={<PaymentsPurchases />} />
              </Route>
              
              {/* Catch-all route for 404 */}
              <Route path="*" element={
                <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-4">404</h1>
                    <p className="text-gray-400 mb-6">Page not found</p>
                    <Link to="/dashboard" className="text-blue-500 hover:text-blue-400">
                      Return to Dashboard
                    </Link>
                  </div>
                </div>
              } />
            </Routes>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
