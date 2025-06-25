import React, { useState } from 'react';
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
import { adminAPI, dashboardAPI } from '../services/api';
import { newsAPI } from '../services/api';
import CreateStokvelGroup from '../components/CreateStokvelGroup';
import { toast } from 'react-toastify';

const AdminDashboard: React.FC = () => {
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleCreateGroup = (data: any) => {
    toast.success('Group created (mock)!');
    setShowCreateGroup(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 flex-col">
      <AdminNavbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar sidebarOpen={sidebarOpen} />
        <main className="flex-1 p-10 overflow-y-auto">
          {/* Welcome & Stats */}
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

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-sm text-gray-600">Total Wallet Balance</p>
              <h3 className="text-2xl font-bold text-gray-900">--</h3>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-sm text-gray-600">Active Groups</p>
              <h3 className="text-2xl font-bold text-gray-900">--</h3>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-sm text-gray-600">Total Contributions</p>
              <h3 className="text-2xl font-bold text-gray-900">--</h3>
            </div>
          </div>

          {/* Groups Management */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">All Groups</h2>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                onClick={() => setShowCreateGroup(true)}
              >
                + Create Group
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* No groups to display */}
              <div className="text-gray-400 col-span-3 text-center py-8">No groups available.</div>
            </div>
          </div>
          {showCreateGroup && (
            <CreateStokvelGroup
              onSubmit={handleCreateGroup}
              onCancel={() => setShowCreateGroup(false)}
            />
          )}

          {/* Users Management */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">All Users</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Role</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* No users to display */}
                  <tr>
                    <td colSpan={5} className="text-gray-400 text-center py-8">No users available.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Withdrawals */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Withdrawals</h2>
            <ul>
              {/* No withdrawals to display */}
              <li className="text-gray-400 text-center py-8">No pending withdrawals.</li>
            </ul>
          </div>

          {/* Announcements Management */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Announcements</h2>
            <ul>
              {/* No announcements to display */}
              <li className="text-gray-400 text-center py-8">No announcements available.</li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
