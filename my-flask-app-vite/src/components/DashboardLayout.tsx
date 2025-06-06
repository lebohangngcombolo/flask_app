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
  ShoppingBag
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
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
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Selected file for upload:', file.name);
      event.target.value = '';
    }
  };

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

              {/* Profile Icon with Dropdown */}
              <div className="relative ml-auto">
                <button
                  onClick={toggleProfileMenu}
                  className="flex items-center space-x-2 p-2 rounded-full text-gray-700 hover:bg-gray-100 focus:outline-none"
                >
                   <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                      {user?.profilePicture ? (
                         <img
                           src={user.profilePicture}
                           alt={user?.name}
                           className="w-full h-full object-cover"
                         />
                      ) : (
                         <User className="w-5 h-5 text-blue-600" />
                      )}
                   </div>
                   <ChevronDown className={`w-4 h-4 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown Menu */}
                <AnimatePresence>
                  {isProfileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.1 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
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
                        onClick={() => { handleProfilePictureClick(); setIsProfileMenuOpen(false); }}
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

        {/* Search Bar Below Nav */}
        <div className="bg-gray-100 border-b border-gray-200 sticky top-16 z-20 shadow-sm md:static md:top-auto md:z-auto md:shadow-none">
           <div className="container mx-auto px-4 py-3">
              <div className="relative max-w-full md:max-w-lg">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
           </div>
        </div>

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

      <ChatBot />
    </div>
  );
};

export default DashboardLayout;
