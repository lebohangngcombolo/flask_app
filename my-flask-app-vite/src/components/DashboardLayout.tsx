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
