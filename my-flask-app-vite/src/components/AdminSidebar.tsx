import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Folder,
  BarChart2,
  ShieldCheck,
  FileText,
  Bell,
  Settings,
  UserCheck
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType;
  tooltip: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, tooltip: 'Overview and platform stats' },
  { name: 'Manage Users', path: '/admin/users', icon: Users, tooltip: 'View, edit, and manage all users' },
  { name: 'Manage Groups', path: '/admin/groups', icon: Folder, tooltip: 'Create, edit, and manage all stokvel groups' },
  { name: 'Contribution Analytics', path: '/admin/analytics', icon: BarChart2, tooltip: 'View and analyze contributions' },
  { name: 'KYC Approvals', path: '/admin/kyc', icon: ShieldCheck, tooltip: 'Approve or reject KYC submissions' },
  { name: 'Reports', path: '/admin/reports', icon: FileText, tooltip: 'View and download platform reports' },
  { name: 'Notifications', path: '/admin/notifications', icon: Bell, tooltip: 'Send and manage notifications' },
  { name: 'Settings', path: '/admin/settings', icon: Settings, tooltip: 'Platform and admin settings' },
  { name: 'Admin Team', path: '/admin/team', icon: UserCheck, tooltip: 'Manage admin team and roles' }
];

interface AdminSidebarProps {
  sidebarOpen: boolean;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ sidebarOpen }) => {
  const location = useLocation();

  return (
    <aside
      className={`bg-white border-r flex flex-col justify-between transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'w-64' : 'w-0 border-none'
      } overflow-hidden`}
    >
      <nav className="flex-1 mt-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              title={item.tooltip}
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="mr-3 flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
