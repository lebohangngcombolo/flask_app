import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
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
import PhoneAuth from './pages/PhoneAuth';
import KYCPage from './pages/KYC';
import { getCurrentUser as getCurrentUserService } from './utils/auth';
import DashboardLayout from './components/DashboardLayout';
import { Toaster } from 'react-hot-toast';
import GroupAdminManagement from './pages/GroupAdminManagement';
import StokvelGroups from './pages/StokvelGroups';
import { ThemeProvider } from 'next-themes';
import KYCManagement from './pages/KYCManagement';
import AdminLayout from "./components/AdminLayout";
import ReferralHistory from './pages/ReferralHistory';
import ReferralDashboard from './pages/ReferralDashboard';
import TierDetails from './pages/TierDetails';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  
  if (!isAuthenticated()) {
    // Redirect to login but save the attempted url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // SECURITY FIX: Additional check for verification status
  const user = getCurrentUser();
  if (!user || !user.is_verified) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUserService();
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    if (localStorage.getItem('token')) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Toaster position="top-center" reverseOrder={false} />
      <ToastContainer />
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

          {/* User dashboard routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="digital-wallet" element={<DigitalWallet />} />
            <Route path="kyc" element={<KYCPage />} />
            <Route path="marketplace" element={<Marketplace />} />
            <Route path="stokvel-groups" element={<StokvelGroups />} />
            <Route path="refer" element={<ReferralDashboard />} />
            <Route path="referral-history" element={<ReferralHistory />} />
            <Route path="stokvel-groups/:category/:tier" element={<TierDetails />} />
            {/* Add more dashboard sub-pages here if needed */}
          </Route>

          {/* Admin routes - ONLY NESTED UNDER /admin */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="kyc-management" element={<KYCManagement />} />
            <Route path="groups" element={<GroupAdminManagement />} />
            <Route path="group-admin-management" element={<GroupAdminManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="stokvels" element={<StokvelManagement />} />
          </Route>
          
          {/* Phone Auth route */}
          <Route path="/phone-auth" element={<PhoneAuth />} />


          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
