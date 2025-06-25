import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  CreditCard,
  CheckCircle,
  Users,
  Gift,
  Briefcase,
  ShoppingBag,
  Menu,
  Bell
} from 'lucide-react';
import ProfileDropdown from './ProfileDropdown';
import { useAuth } from '../hooks/useAuth';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

const sidebarItems = [
  { label: 'User Profile', path: '/dashboard/profile', icon: User },
  { label: 'Digital Wallet', path: '/dashboard/digital-wallet', icon: CreditCard },
  { label: 'KYC', path: '/dashboard/kyc', icon: CheckCircle },
  { label: 'Beneficiaries', path: '/dashboard/beneficiaries', icon: Users },
  { label: 'Refer & Earn', path: '/dashboard/refer', icon: Gift },
  { label: 'Stokvel Groups', path: '/dashboard/stokvel-groups', icon: Briefcase },
];


const topNavItems = [
  { label: 'Marketplace', path: '/dashboard/marketplace' },
  { label: 'Offers', path: '/dashboard/offers' },
  { label: 'Announcements', path: '/dashboard/announcements' },
];

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();
  
  // Add notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch('/api/user/notifications', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
          setUnreadCount(data.filter((n: any) => !n.is_read).length);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };

    fetchNotifications();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Click outside to close notifications
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.notification-dropdown') && !target.closest('.notification-button')) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/user/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-dark-background">
      {/* --- TOP HEADER --- */}
      <header className="bg-white dark:bg-dark-card border-b dark:border-dark-border px-4 h-16 flex items-center justify-between shadow-sm flex-shrink-0 z-10">
        <div className="flex items-center">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
          <div className="w-px h-6 bg-gray-200 dark:bg-dark-border mx-4"></div>
          <div className="cursor-pointer" onClick={() => navigate('/dashboard')}>
            <span className="text-xl font-bold text-gray-800 dark:text-dark-text">i-STOKVEL</span>
          </div>
        </div>
        <div className="flex items-center gap-4 relative">
          {/* Top Nav Items */}
          <div className="flex items-center space-x-2">
            {topNavItems.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`text-sm font-medium px-3 py-2 rounded transition-colors ${
                  location.pathname.startsWith(item.path)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {/* Notifications Bell (fully functional, with dropdown) */}
          <div className="relative">
            <button
              className="relative text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            >
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </button>
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg z-50">
                <div className="p-4 border-b font-semibold">Notifications</div>
                <ul className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <li className="p-4 text-gray-500">No notifications</li>
                  ) : (
                    notifications.map((notification) => {
                      console.log('Notification data:', notification.data);
                      console.log('KYC URL:', notification.data?.kyc_url);
                      
                      return (
                        <li key={notification.id} className={`p-4 border-b last:border-0 ${!notification.is_read ? 'bg-blue-50' : ''}`}>
                          <div className="font-medium">{notification.title}</div>
                          <div className="text-sm text-gray-600">{notification.message}</div>
                          <div className="text-xs text-gray-400 mt-1">{new Date(notification.created_at).toLocaleString()}</div>
                          {notification.type === "kyc_required" && notification.data?.kyc_url && (
                            <Link
                              to={notification.data.kyc_url}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              Complete KYC Now
                            </Link>
                          )}
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>
            )}
          </div>
          {/* Profile Dropdown */}
          <ProfileDropdown user={user} />
        </div>
      </header>
      
      {/* --- MAIN BODY --- */}
      <div className="flex flex-1 overflow-hidden">
        {/* --- SIDEBAR --- */}
        <aside 
          className={`bg-white dark:bg-dark-card border-r dark:border-dark-border flex-shrink-0 flex flex-col justify-between transition-all duration-300 ease-in-out ${
            sidebarOpen ? 'w-64' : 'w-0 border-r-0'
          } overflow-hidden`}
        >
          <div className="overflow-y-auto">
            <nav className="flex-1 mt-4 px-2 space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.label}
                  className={`w-full flex items-center px-3 py-2.5 text-sm text-left rounded-lg my-1 transition-colors ${
                    location.pathname.startsWith(item.path)
                      ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="mr-3 flex-shrink-0" size={20} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
          
        </aside>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
