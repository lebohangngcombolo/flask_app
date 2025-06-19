<<<<<<< HEAD
=======
<<<<<<< HEAD
import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  User, 
  CreditCard,
  CheckCircle,
  Users,
  Gift,
  Briefcase,
  ShoppingBag,
  Menu
} from 'lucide-react';
import ProfileDropdown from './ProfileDropdown';

const sidebarItems = [
  { label: 'User', path: '/dashboard/profile', icon: User },
  { label: 'Digital Wallet', path: '/dashboard/digital-wallet', icon: CreditCard },
  { label: 'KYC', path: '/dashboard/kyc', icon: CheckCircle },
  { label: 'Beneficiaries', path: '/dashboard/beneficiaries', icon: Users },
  { label: 'Refer & Earn', path: '/dashboard/refer', icon: Gift },
  { label: 'Stokvel Groups', path: '/dashboard/groups', icon: Briefcase },
];
const bottomSidebarItem = { label: 'Marketplace', path: '/dashboard/marketplace', icon: ShoppingBag };

const topNavItems = [
  'Home',
  'Offers',
  'Contributions overview',
  'Recent activity',
  'Payout Schedule',
  'AI features',
];

// Dummy user for ProfileDropdown (replace with real user data)
const user = {
  name: 'Member User',
  email: 'member@example.com',
  // profilePicture: 'url-to-profile-pic.jpg'
};

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Collapsed by default

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside 
        className={`bg-white border-r flex flex-col justify-between transition-all duration-200 ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        <div>
          {/* Hamburger and Logo */}
          <div
            className="flex items-center justify-center p-4 border-b cursor-pointer"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? (
              <span className="font-bold text-xl">i-STOKVEL</span>
            ) : (
              <Menu size={28} />
            )}
        </div>
          {/* Sidebar Items */}
          <nav className="flex-1 mt-2">
            {sidebarItems.map((item) => (
              <button
                key={item.label}
                className={`w-full flex items-center px-4 py-2 text-left rounded-lg my-1 transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-100 border-l-4 border-blue-600 font-bold text-blue-700'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => navigate(item.path)}
              >
                <item.icon className="mr-3 text-lg" size={22} />
                {sidebarOpen && item.label}
              </button>
            ))}
        </nav>
        </div>
        {/* Marketplace at the bottom */}
        <div className="mb-4">
          <button
            className={`w-full flex items-center px-4 py-2 text-left rounded-lg my-1 transition-colors ${
              location.pathname === bottomSidebarItem.path
                ? 'bg-blue-100 border-l-4 border-blue-600 font-bold text-blue-700'
                : 'hover:bg-gray-100'
            }`}
            onClick={() => navigate(bottomSidebarItem.path)}
          >
            <bottomSidebarItem.icon className="mr-3 text-lg" size={22} />
            {sidebarOpen && bottomSidebarItem.label}
          </button>
            </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
          <nav className="flex items-center">
            {topNavItems.map((item) => (
              <div
                key={item}
                className="mr-6 cursor-pointer hover:underline"
              >
                {item}
              </div>
            ))}
          </nav>
          {/* ProfileDropdown on the right */}
          <div className="flex items-center">
            <ProfileDropdown user={user} />
          </div>
        </header>
        {/* Main Content Area */}
        <main className="flex-1 p-6 bg-gray-50 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
=======
>>>>>>> 03ccbce380626419915c5ff9484c34b37668a0ea
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Bell, 
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Home,
  DollarSign,
  Activity,
  BarChart2,
  Briefcase,
  Calendar,
  Upload,
  Mail,
  BellRing,
  ShoppingBag,
  Camera,
  Sparkles,
  Wand2,
  Image
} from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import ChatBot from './ChatBot';

interface NavItem {
  id: string;
  label?: string;
  icon?: React.ComponentType<{ className?: string }>;
  path?: string;
  separator?: boolean;
}

export interface MarketplaceNavItemProp extends NavItem {}

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    role: 'admin' | 'member';
    profilePicture?: string;
  } | null;
  sidebarNavItems: NavItem[];
  marketplaceNavItem: MarketplaceNavItemProp;
}

// Define horizontal navigation items here for now.
// In a real app, these would likely come from a prop or context based on user role.
const horizontalNavItems: NavItem[] = [
  { id: 'home', label: 'Home', path: '/dashboard' },
  { id: 'offers', label: 'Offers', path: '/dashboard/offers' },
  { id: 'contributions-overview', label: 'Contributions overview', path: '/dashboard/contributions-overview' },
  { id: 'recent-activity', label: 'Recent activity', path: '/dashboard/recent-activity' },
  { id: 'payout-schedule', label: 'Payout Schedule', path: '/dashboard/payout-schedule' },
  { id: 'ai-features', label: 'AI features', path: '/dashboard/ai-features' },
];

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  user,
  sidebarNavItems,
  marketplaceNavItem
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStep, setUploadStep] = useState<'select' | 'edit' | 'complete'>('select');
  const [selectedFilter, setSelectedFilter] = useState<string>('none');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const filters = [
    { name: 'none', label: 'Original' },
    { name: 'vintage', label: 'Vintage' },
    { name: 'grayscale', label: 'Grayscale' },
    { name: 'warm', label: 'Warm' },
    { name: 'cool', label: 'Cool' },
    { name: 'dramatic', label: 'Dramatic' }
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const handleNotificationToggle = (type: 'email' | 'push') => {
    setNotificationSettings(prev => ({
      ...prev,
      [type]: !prev[type],
    }));
    console.log(`${type} notifications toggled. New setting: ${!notificationSettings[type]}`);
  };

  const handleProfilePictureClick = () => {
    setShowUploadModal(true);
    setUploadStep('select');
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        setUploadStep('edit');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const UploadModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-6 w-[480px] max-w-[90vw]"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            Profile Picture Studio
          </h3>
          <button
            onClick={() => {
              setShowUploadModal(false);
              setUploadStep('select');
              setPreviewUrl(null);
            }}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {uploadStep === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div
                onClick={handleUploadClick}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 hover:bg-gray-50 transition-all cursor-pointer"
              >
                <div className="space-y-4">
                  <div className="w-20 h-20 mx-auto bg-blue-50 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">Click to browse</p>
                    <p className="text-sm text-gray-500">Select a profile picture</p>
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </motion.div>
          )}

          {uploadStep === 'edit' && previewUrl && (
            <motion.div
              key="edit"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="relative aspect-square w-full max-w-[300px] mx-auto">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className={`w-full h-full rounded-xl object-cover ${selectedFilter !== 'none' ? `filter-${selectedFilter}` : ''}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl" />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Choose a Filter</h4>
                <div className="grid grid-cols-3 gap-3">
                  {filters.map((filter) => (
                    <button
                      key={filter.name}
                      onClick={() => setSelectedFilter(filter.name)}
                      className={`p-2 rounded-lg text-sm font-medium transition-all ${
                        selectedFilter === filter.name
                          ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setUploadStep('select');
                    setPreviewUrl(null);
                  }}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    setIsUploading(true);
                    // Simulate upload
                    setTimeout(() => {
                      setIsUploading(false);
                      setUploadStep('complete');
                    }, 1500);
                  }}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Apply Changes
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {uploadStep === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Profile Updated!</h3>
              <p className="text-gray-500 mb-6">Your new profile picture has been saved successfully.</p>
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Done
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside 
        className={`fixed md:static top-0 left-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col justify-between ${
          isSidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        <div>
        <div className="flex items-center justify-center h-16 border-b border-gray-200">
          <button 
              onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-2">
            {sidebarNavItems.map((item) => {
              if (item.separator) {
                return (
                  <div key={item.id} className="border-t border-gray-200 my-4"></div>
                );
              }

            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
                <Link
                key={item.id}
                  to={item.path}
                className={`w-full flex items-center ${isSidebarOpen ? 'space-x-3' : 'justify-center'} px-4 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                title={!isSidebarOpen ? item.label : undefined}
              >
                  {Icon && <Icon className="w-5 h-5" />}
                {isSidebarOpen && <span>{item.label}</span>}
                </Link>
            );
          })}
        </nav>
        </div>

        {/* Bottom section of sidebar (Marketplace and User Profile if sidebar is closed) */}
        <div className="mb-4 px-4 pb-4 space-y-2">
          {/* Marketplace Link */}
          {marketplaceNavItem && (
            <Link
              key={marketplaceNavItem.id}
              to={marketplaceNavItem.path || '#'}
              className={`w-full flex items-center ${isSidebarOpen ? 'space-x-3' : 'justify-center'} px-4 py-2 rounded-lg transition-colors ${
                location.pathname === marketplaceNavItem.path
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              title={!isSidebarOpen ? marketplaceNavItem.label : undefined}
            >
              {marketplaceNavItem.icon && <marketplaceNavItem.icon className="w-5 h-5" />}
              {isSidebarOpen && <span>{marketplaceNavItem.label}</span>}
            </Link>
          )}

          {/* User Profile Section - Show only when sidebar is closed */}
          {user && !isSidebarOpen && (
            <div className="flex items-center justify-center pt-4 border-t border-gray-200">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-blue-600" />
                )}
              </div>
                </div>
              )}
            </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'md:ml-0' : 'md:ml-0'}`}>
        {/* Horizontal Top Navigation Bar */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16 gap-x-4">
              {/* Hamburger Menu Button */}
              <button
                onClick={toggleSidebar}
                className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none"
              >
                <Menu className="h-6 w-6" />
              </button>

              {/* Horizontal Navigation Tabs */}
              <div className="hidden md:flex items-center space-x-6">
                {horizontalNavItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      className={`text-gray-600 hover:text-blue-600 transition-colors duration-200 ${
                        isActive ? 'font-semibold text-blue-600 border-b-2 border-blue-600' : ''
                      } py-5`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              {/* Enhanced Profile Icon with Dropdown */}
              <div className="relative ml-auto">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleProfileMenu}
                  className="flex items-center space-x-2 p-2 rounded-full text-gray-700 hover:bg-gray-100 focus:outline-none"
                >
                  <div className="relative group">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center overflow-hidden">
                      {user?.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={user?.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div 
                      onClick={() => { setShowUploadModal(true); setIsProfileMenuOpen(false); }}
                      className="absolute inset-0 rounded-full bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                </motion.button>

                {/* Profile Dropdown Menu */}
                <AnimatePresence>
                  {isProfileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg py-2 z-50"
                    >
                      {/* Upload Profile Picture */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        onClick={() => { setShowUploadModal(true); setIsProfileMenuOpen(false); }}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload Picture</span>
                      </button>

                      {/* Notifications Header */}
                      <div className="block px-4 py-2 text-xs text-gray-400 uppercase">
                        Notifications
                      </div>

                      {/* Email Notifications Toggle */}
                      <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <span className="flex items-center space-x-2">
                          <Mail className="w-4 h-4" />
                          <span>Email</span>
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                <input
                            type="checkbox"
                            checked={notificationSettings.email}
                            onChange={() => handleNotificationToggle('email')}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
              </div>

                      {/* Push Notifications Toggle */}
                      <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <span className="flex items-center space-x-2">
                          <BellRing className="w-4 h-4" />
                          <span>Push</span>
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationSettings.push}
                            onChange={() => handleNotificationToggle('push')}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
            </div>

                      {/* Separator */}
                      <div className="border-t border-gray-100 my-1"></div>

                      {/* Logout Item */}
              <button
                        onClick={() => { handleLogout(); setIsProfileMenuOpen(false); }}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                        <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </nav>

        {/* Main content - remove any extra padding/margin that might cause gaps */}
        <main className="bg-gray-100 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && <UploadModal />}

      <ChatBot />
    </div>
  );
};

export default DashboardLayout;
<<<<<<< HEAD
=======
>>>>>>> origin/master
>>>>>>> 03ccbce380626419915c5ff9484c34b37668a0ea
