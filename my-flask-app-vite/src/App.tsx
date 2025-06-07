import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AboutUs from './pages/AboutUs';
import Contact from './pages/Contact';
import News from './pages/News';
import Marketplace from './pages/Marketplace';
import UserProfile from './pages/UserProfile';
import UserManagement from './pages/UserManagement';
import StokvelManagement from './components/admin/StokvelManagement';
import { isAuthenticated, getCurrentUser } from './utils/auth';
import { useAuth } from './hooks/useAuth';
import ChatBot from './components/ChatBot';
import ForgotPassword from './pages/ForgotPassword';
import Programs from './pages/Programs';
import DigitalWallet from './pages/DigitalWallet';

// Protected route for regular users
const UserRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuth = isAuthenticated();
  const user = getCurrentUser();
  
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  
  // If user is admin, redirect to admin dashboard
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  
  return <>{children}</>;
};

// Protected route for admin users
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuth = isAuthenticated();
  const user = getCurrentUser();
  
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  
  // If user is not admin, redirect to user dashboard
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  // Fetch user on app load to check authentication status
  const { fetchUser } = useAuth();
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <Router>
      {/* ChatBot is placed outside of Routes so it's always visible */}
      {/* You might want to conditionally render this based on user login status */}
      <ChatBot />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/programs" element={<Programs />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/news" element={<News />} />

        {/* User routes */}
        <Route path="/dashboard/*" element={
          <UserRoute>
            <Routes>
              <Route index element={<Dashboard />} />
              <Route path="profile" element={<UserProfile />} />
              <Route path="marketplace" element={<Marketplace />} />
              <Route path="digital-wallet" element={<DigitalWallet />} />
            </Routes>
          </UserRoute>
        } />

        {/* Admin routes */}
        <Route path="/admin/*" element={
          <AdminRoute>
            <Routes>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/dashboard" element={<AdminDashboard />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/stokvels" element={<StokvelManagement />} />
            </Routes>
          </AdminRoute>
        } />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
