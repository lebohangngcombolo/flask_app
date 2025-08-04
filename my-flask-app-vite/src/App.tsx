import React, { useEffect, useState } from 'react';
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
import ChatBot from './components/ChatBot';
import ForgotPassword from './pages/ForgotPassword';
import Programs from './pages/Programs';
import DigitalWallet from './pages/DigitalWallet';
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
import ClaimSubmission from "./pages/ClaimSubmission";
import Beneficiaries from './pages/Beneficiaries';
import AdminConcerns from './pages/AdminConcerns';
import MyGroups from "./pages/MyGroups";
import BeneficiaryApprovals from './pages/BeneficiaryApprovals';
import DealDetail from "./pages/DealDetail";
import IDeals from "./pages/IDeals";
import AdminFAQs from './pages/AdminFAQs';
import GroupDetails from './pages/GroupDetails';
import Transactions from './pages/Transactions';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminReports from './pages/AdminReports';
import AdminTeam from './pages/AdminTeam';
import Learning from './pages/Learning';
import AdminPayouts from './pages/AdminPayouts';
import AdminRoute from './components/AdminRoute';
import ScrollToTop from './components/ScrollToTop';

const App: React.FC = () => {
  // Removed unused user state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        await getCurrentUserService();
        // setUser(userData); // This line was removed as per the edit hint
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
        {/* ScrollToTop component to handle scroll behavior */}
        <ScrollToTop />
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
          <Route path="/learning" element={<Learning />} />

          {/* User dashboard routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="wallet" element={<DigitalWallet />} />
            <Route path="groups" element={<StokvelGroups />} />
            <Route path="my-groups" element={<MyGroups />} />
            <Route path="group/:groupId" element={<GroupDetails />} />
            <Route path="group-admin" element={<GroupAdminManagement />} />
            <Route path="kyc" element={<KYCPage />} />
            <Route path="referrals" element={<ReferralDashboard />} />
            <Route path="referral-history" element={<ReferralHistory />} />
            <Route path="tier/:tierId" element={<TierDetails />} />
            <Route path="claims" element={<ClaimSubmission />} />
            <Route path="beneficiaries" element={<Beneficiaries />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="marketplace" element={<Marketplace />} />
            <Route path="deals" element={<IDeals />} />
            <Route path="deal/:dealId" element={<DealDetail />} />
            <Route path="learning" element={<Learning />} />
          </Route>

          {/* Admin routes */}
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="stokvels" element={<StokvelManagement />} />
            <Route path="kyc" element={<KYCManagement />} />
            <Route path="concerns" element={<AdminConcerns />} />
            <Route path="beneficiaries" element={<BeneficiaryApprovals />} />
            <Route path="faqs" element={<AdminFAQs />} />
            <Route path="team" element={<AdminTeam />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="payouts" element={<AdminPayouts />} />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
