import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import AdminSidebar from '../components/AdminSidebar';
import AdminNavbar from '../components/AdminNavbar';
import {
  Users,
  CreditCard,
  Calendar,
  Bell,
  MessageSquare,
  Settings,
  ChevronDown,
  Plus,
  BarChart2,
  FileText,
  UserPlus,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Folder,
  Briefcase,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { adminAPI } from '../services/api';
import CreateStokvelGroup from '../components/CreateStokvelGroup';
import { toast } from 'react-toastify';

const adminNavItems = [
  { label: 'Dashboard', icon: <BarChart2 />, path: '/admin/dashboard' },
  { label: 'Manage Users', icon: <Users />, path: '/admin/users' },
  { label: 'Manage Groups', icon: <Folder />, path: '/admin/groups' },
  { label: 'Contribution Analytics', icon: <BarChart2 />, path: '/admin/analytics' },
  { label: 'KYC Approvals', icon: <ShieldCheck />, path: '/admin/kyc' },
  { label: 'Reports', icon: <FileText />, path: '/admin/reports' },
  { label: 'Notifications', icon: <Bell />, path: '/admin/notifications' },
  { label: 'Settings', icon: <ShieldCheck />, path: '/admin/settings' },
  { label: 'Admin Team', icon: <UserCheck />, path: '/admin/team' },
];

const adminCards = [
  { label: 'Users', icon: <Users size={32} />, path: '/admin/users' },
  { label: 'Groups', icon: <Folder size={32} />, path: '/admin/groups' },
  { label: 'Analytics', icon: <BarChart2 size={32} />, path: '/admin/analytics' },
  { label: 'Withdrawals', icon: <Briefcase size={32} />, path: '/admin/withdrawals' },
  { label: 'Reports', icon: <FileText size={32} />, path: '/admin/reports' },
  { label: 'Notifications', icon: <Bell size={32} />, path: '/admin/notifications' },
  { label: 'Team Roles', icon: <UserCheck size={32} />, path: '/admin/team' },
];

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalContributions: 0,
    monthlyGoal: 0,
    goalProgress: 0,
    recentTransactions: [],
    upcomingEvents: [],
    notifications: []
  });
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, groupsResponse] = await Promise.all([
          adminAPI.getStats(),
          adminAPI.getGroups()
        ]);
        
        setStats(statsResponse.data);
        setGroups(groupsResponse.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');
      }
    };

    fetchData();
  }, []);

  // Mock chart data
  const chartData = [
    { name: 'Jan', value: 12000 },
    { name: 'Feb', value: 19000 },
    { name: 'Mar', value: 15000 },
    { name: 'Apr', value: 25000 },
    { name: 'May', value: 22000 },
    { name: 'Jun', value: 30000 }
  ];

  const handleCreateGroup = async (data: any) => {
    try {
      await adminAPI.createGroup(data);
      toast.success('Group created successfully!');
      setShowCreateGroup(false);
      // Optionally, refresh group list here
    } catch (error) {
      toast.error('Failed to create group');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Use AdminSidebar component */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 ml-64"> {/* Add margin-left to account for fixed sidebar */}
        <AdminNavbar />
        <main className="p-10 pt-20"> {/* Add padding-top to account for fixed navbar */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Welcome, Admin</h1>
              <p className="text-gray-600 mt-1">
                Monitor, manage, and support all stokvel group activities with full control.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-700">Admin</span>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
            {adminCards.map((card) => (
              <a
                key={card.label}
                href={card.path}
                className="flex flex-col items-center justify-center bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
              >
                {card.icon}
                <span className="mt-3 font-semibold text-gray-800">{card.label}</span>
              </a>
            ))}
          </div>

          {/* Contributions & Usage Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Contributions & Usage Overview</h2>
            {/* Replace this with your actual chart component */}
            <div className="h-32 flex items-end gap-2">
              <div className="w-8 h-16 bg-blue-200 rounded"></div>
              <div className="w-8 h-24 bg-blue-400 rounded"></div>
              <div className="w-8 h-20 bg-blue-300 rounded"></div>
              <div className="w-8 h-28 bg-blue-500 rounded"></div>
              <div className="w-8 h-12 bg-blue-200 rounded"></div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-lg mb-6"
              onClick={() => setShowCreateGroup(true)}
            >
              + Create Group
            </button>
          </div>
          {showCreateGroup && (
            <CreateStokvelGroup
              onSubmit={handleCreateGroup}
              onCancel={() => setShowCreateGroup(false)}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
