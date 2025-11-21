import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Posts from './pages/Posts';
import LiveTaxi from './pages/LiveTaxi';
import Subscriptions from './pages/Subscriptions';
import Notifications from './pages/Notifications';
import Blacklist from './pages/Blacklist';
import Reports from './pages/Reports';
import Wallets from './pages/Wallets';
import Countries from './pages/Countries';
import Vehicles from './pages/Vehicles';
import PaymentMethods from './pages/PaymentMethods';
import Cashouts from './pages/Cashouts';
import { WeightBracketsPage } from './pages/WeightBracketsPage';
import { PostService } from './services/postService';

function App() {
  // Initialize monthly cleaning when app starts
  React.useEffect(() => {
    PostService.initializeMonthlyCleaning();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />
            
            {/* Protected admin routes */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="posts" element={<Posts />} />
              <Route path="live-taxi" element={<LiveTaxi />} />
              <Route path="subscriptions" element={<Subscriptions />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="wallets" element={<Wallets />} />
              <Route path="cashouts" element={<Cashouts />} />
              <Route path="payment-methods" element={<PaymentMethods />} />
              <Route path="countries" element={<Countries />} />
              <Route path="vehicles" element={<Vehicles />} />
              <Route path="blacklist" element={<Blacklist />} />
              <Route path="reports" element={<Reports />} />
              <Route path="weight-brackets" element={<WeightBracketsPage />} />
            </Route>
            
            {/* Redirect root to dashboard if authenticated, otherwise to login */}
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
