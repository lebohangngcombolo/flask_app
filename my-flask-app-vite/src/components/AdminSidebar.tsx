import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Calendar,
  MessageSquare,
  Settings,
  FileText,
  BarChart2
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Manage Stokvels', path: '/admin/stokvels', icon: Users },
  { name: 'Members', path: '/admin/members', icon: Users },
  { name: 'Contributions', path: '/admin/contributions', icon: CreditCard },
  { name: 'Reports', path: '/admin/reports', icon: FileText },
  { name: 'Calendar', path: '/admin/calendar', icon: Calendar },
  { name: 'Messages', path: '/admin/messages', icon: MessageSquare },
  { name: 'Settings', path: '/admin/settings', icon: Settings }
];

const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 pt-16 transition-all duration-300 ease-in-out ${
      isOpen ? 'w-64' : 'w-16'
    }`}>
      {/* Hamburger Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-4 left-4 p-2 rounded-lg hover:bg-gray-100"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      <div className="px-4 py-6">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                title={!isOpen ? item.name : undefined}
              >
                <item.icon className="h-5 w-5" />
                {isOpen && <span className="ml-3">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default AdminSidebar;
