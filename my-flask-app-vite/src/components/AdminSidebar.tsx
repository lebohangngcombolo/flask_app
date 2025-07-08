import React, { useState } from 'react';
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
  UserCheck,
  ChevronDown,
  ChevronRight,
  DollarSign
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType;
  tooltip: string;
  subItems?: { label: string; path: string }[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, tooltip: 'Overview and platform stats' },
  { name: 'Manage Users', path: '/admin/users', icon: Users, tooltip: 'View, edit, and manage all users', subItems: [
    { label: 'View all', path: '/admin/users' }
  ] },
  { name: 'Manage Groups', path: '/admin/groups', icon: Folder, tooltip: 'Create, edit, and manage all stokvel groups', subItems: [
    { label: 'Group Management', path: '/admin/groups' }
  ] },
  { name: 'Analytics', path: '/admin/analytics', icon: BarChart2, tooltip: 'View and analyze contributions', subItems: [
    { label: 'Contributions', path: '/admin/analytics/contributions' },
    {
      label: 'Reports',
      path: '/admin/analytics/reports',
      subItems: [
        { label: 'Monthly', path: '/admin/analytics/reports/monthly' },
        { label: 'Yearly', path: '/admin/analytics/reports/yearly' }
      ]
    }
  ] },
  { name: 'KYC Approvals', path: '/admin/kyc-management', icon: ShieldCheck, tooltip: 'Approve or reject KYC submissions', subItems: [
    { label: 'KYC Management', path: '/admin/kyc-management' },
  ] },
  { name: 'Support', path: '/admin/support', icon: FileText, tooltip: 'FAQ, customer concerns, and notifications', subItems: [
    { label: 'FAQ', path: '/admin/support/faq' },
    { label: 'Customer Concerns', path: '/admin/support/concerns' },
    { label: 'Notifications', path: '/admin/support/notifications' }
  ] },
  {
    name: 'Admin Team',
    path: '/admin/team',
    icon: UserCheck,
    tooltip: 'Manage admin team and roles',
    subItems: [
      { label: 'View Admins', path: '/admin/team' },
      { label: 'Add Admin', path: '/admin/team/add' },
      { label: 'Roles & Permissions', path: '/admin/team/roles' },
      // { label: 'Activity Logs', path: '/admin/team/logs' }, // optional
    ]
  },
  {
    name: 'Payout Requests',
    path: '/admin/payout-requests',
    icon: DollarSign,
    tooltip: 'Approve or reject payout requests'
  }
];

interface AdminSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});
  const location = useLocation();

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside className="bg-[#23295A] min-h-screen w-64 flex flex-col py-6 px-2 transition-all duration-300 ease-in-out h-full">
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const hasSubItems = !!item.subItems;
          const isSubItemActive = hasSubItems && item.subItems!.some(sub => location.pathname === sub.path);
          const isActive = location.pathname.startsWith(item.path) || isSubItemActive;

          return (
            <div key={item.name}>
              <button
                className={`flex items-center w-full gap-3 px-4 py-2 rounded-lg transition
                  ${isActive ? 'bg-[#3B4CCA] text-white font-semibold shadow' : 'text-white'}`}
                onClick={() => hasSubItems ? toggleMenu(item.name) : undefined}
                title={item.tooltip}
                style={{ background: isActive ? undefined : 'transparent', border: 'none', boxShadow: isActive ? undefined : 'none' }}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
                {hasSubItems && (
                  openMenus[item.name] ? <ChevronDown className="w-4 h-4 ml-auto" /> : <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </button>
              {hasSubItems && openMenus[item.name] && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.subItems!.map((sub) => (
                    <Link
                      key={sub.path}
                      to={sub.path}
                      className={`block px-4 py-2 rounded-lg transition text-white`}
                      style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
