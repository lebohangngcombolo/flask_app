import React from 'react';
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
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
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
              {/* Comment out routes that don't have components yet */}
              {/* <Route path="groups" element={<UserGroups />} /> */}
              {/* <Route path="contributions" element={<Contributions />} /> */}
              {/* <Route path="withdrawals" element={<Withdrawals />} /> */}
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
              {/* Other admin routes */}
              {/* <Route path="groups" element={<GroupManagement />} /> */}
              {/* <Route path="transactions" element={<TransactionManagement />} /> */}
              {/* <Route path="reports" element={<Reports />} /> */}
              {/* <Route path="settings" element={<AdminSettings />} /> */}
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
