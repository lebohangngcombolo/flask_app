import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
import { adminAPI, dashboardAPI, stokvelAPI } from '../services/api';
import { newsAPI } from '../services/api';
import { toast } from 'react-toastify';
import { FaPlus } from "react-icons/fa";

const metrics = [
  { label: "Total Wallet Balance", value: "R12,500" },
  { label: "Active Groups", value: "5" },
  { label: "Total Members", value: "38" },
  { label: "Contributions (June)", value: "R4,200" },
];

const categories = ["Savings", "Burial", "Investment", "Business"];

const categoryTiers = {
  Savings: [
    { name: "Bronze", amount: "R200", color: "bg-blue-100 text-blue-800" },
    { name: "Silver", amount: "R500", color: "bg-blue-200 text-blue-900" },
    { name: "Gold", amount: "R1000", color: "bg-blue-300 text-blue-900" },
    { name: "Platinum", amount: "R2000", color: "bg-blue-400 text-white" },
  ],
  Burial: [
    { name: "Bronze", amount: "R150", color: "bg-gray-100 text-gray-800" },
    { name: "Silver", amount: "R400", color: "bg-gray-200 text-gray-900" },
    { name: "Gold", amount: "R900", color: "bg-gray-300 text-gray-900" },
    { name: "Platinum", amount: "R1800", color: "bg-gray-400 text-white" },
  ],
  Investment: [
    { name: "Bronze", amount: "R300", color: "bg-green-100 text-green-800" },
    { name: "Silver", amount: "R700", color: "bg-green-200 text-green-900" },
    { name: "Gold", amount: "R1500", color: "bg-green-300 text-green-900" },
    { name: "Platinum", amount: "R3000", color: "bg-green-400 text-white" },
  ],
  Business: [
    { name: "Bronze", amount: "R250", color: "bg-yellow-100 text-yellow-800" },
    { name: "Silver", amount: "R600", color: "bg-yellow-200 text-yellow-900" },
    { name: "Gold", amount: "R1200", color: "bg-yellow-300 text-yellow-900" },
    { name: "Platinum", amount: "R2500", color: "bg-yellow-400 text-white" },
  ],
};

// Define personalized info for each category and tier
const tierDetails: Record<string, Record<string, {
  amountRange: string;
  interest: string;
  access: string;
  description: string;
  support: string;
}>> = {
  Savings: {
    Bronze: {
      amountRange: "R200–R450",
      interest: "2.5% p.a.",
      access: "Anytime",
      description: "Perfect for individuals or small groups starting their savings journey. Flexible deposits and easy withdrawals.",
      support: "Basic support"
    },
    Silver: {
      amountRange: "R500–R950",
      interest: "3.2% p.a.",
      access: "Anytime",
      description: "Ideal for growing savings groups looking for better rates and more flexibility.",
      support: "Priority support"
    },
    Gold: {
      amountRange: "R1000–R1950",
      interest: "4.1% p.a.",
      access: "Anytime",
      description: "Best for established groups wanting higher limits and added perks.",
      support: "Premium support"
    },
    Platinum: {
      amountRange: "R2000+",
      interest: "5.0% p.a.",
      access: "Anytime",
      description: "Premium tier for large groups seeking maximum benefits and exclusive features.",
      support: "24/7 VIP support"
    }
  },
  Burial: {
    Bronze: {
      amountRange: "R100–R300",
      interest: "1.0% p.a.",
      access: "On claim",
      description: "Entry-level burial stokvel for basic funeral cover and support.",
      support: "Basic support"
    },
    Silver: {
      amountRange: "R350–R700",
      interest: "1.5% p.a.",
      access: "On claim",
      description: "Enhanced cover for families and small communities.",
      support: "Priority support"
    },
    Gold: {
      amountRange: "R750–R1500",
      interest: "2.0% p.a.",
      access: "On claim",
      description: "Comprehensive burial benefits for larger groups.",
      support: "Premium support"
    },
    Platinum: {
      amountRange: "R1600+",
      interest: "2.5% p.a.",
      access: "On claim",
      description: "Top-tier cover with additional family and community benefits.",
      support: "24/7 VIP support"
    }
  },
  Investment: {
    Bronze: {
      amountRange: "R500–R1000",
      interest: "4.0% p.a.",
      access: "Quarterly",
      description: "Start your investment journey with low minimums and steady returns.",
      support: "Basic support"
    },
    Silver: {
      amountRange: "R1100–R2500",
      interest: "5.0% p.a.",
      access: "Quarterly",
      description: "Better rates for groups with a medium-term investment horizon.",
      support: "Priority support"
    },
    Gold: {
      amountRange: "R2600–R5000",
      interest: "6.0% p.a.",
      access: "Bi-Annually",
      description: "Higher returns for committed investment stokvels.",
      support: "Premium support"
    },
    Platinum: {
      amountRange: "R5100+",
      interest: "7.0% p.a.",
      access: "Annually",
      description: "Maximum growth for long-term, high-value investment groups.",
      support: "24/7 VIP support"
    }
  },
  Business: {
    Bronze: {
      amountRange: "R1000–R2500",
      interest: "3.0% p.a.",
      access: "Monthly",
      description: "For small business stokvels pooling resources for growth.",
      support: "Basic support"
    },
    Silver: {
      amountRange: "R2600–R5000",
      interest: "3.8% p.a.",
      access: "Monthly",
      description: "Ideal for growing business collectives needing flexible access.",
      support: "Priority support"
    },
    Gold: {
      amountRange: "R5100–R10000",
      interest: "4.5% p.a.",
      access: "Quarterly",
      description: "Higher limits and returns for established business stokvels.",
      support: "Premium support"
    },
    Platinum: {
      amountRange: "R10100+",
      interest: "5.5% p.a.",
      access: "Quarterly",
      description: "Top-tier for large business groups with exclusive benefits.",
      support: "24/7 VIP support"
    }
  }
};

const AdminDashboard: React.FC = () => {
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Savings");

  const fetchGroups = async () => {
    try {
      const res = await adminAPI.getGroups();
      setGroups(res.data);
    } catch (err) {
      setGroups([]);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return (
    <div className="relative min-h-screen bg-gray-50 px-4 py-6">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Welcome, Admin</h1>
        <div className="flex items-center gap-4">
          <button className="relative">
            <span className="material-icons text-2xl">notifications</span>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">3</span>
          </button>
          <button>
            <span className="material-icons text-2xl">person</span>
          </button>
          <button>
            <span className="material-icons text-2xl">settings</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((m, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow p-6 flex flex-col justify-center items-start min-w-[180px]"
          >
            <div className="text-gray-500 text-sm mb-1">{m.label}</div>
            <div className="text-2xl font-bold">{m.value}</div>
          </div>
        ))}
      </div>

      {/* Groups Management */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">All Groups</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {groups.length === 0 ? (
            <div className="text-gray-400 col-span-4 text-center py-8">No groups available.</div>
          ) : (
            groups.map(group => {
              const details = tierDetails[group.category]?.[group.tier];
              if (!details) return null;
              return (
                <div
                  key={group.id}
                  className="flex flex-col items-center bg-white rounded-2xl shadow-lg border border-gray-100 p-7 min-h-[360px] w-full hover:shadow-2xl transition-all"
                >
                  {/* Badge/icon */}
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow
                      ${group.tier === "Bronze" ? "bg-yellow-400 text-white" : ""}
                      ${group.tier === "Silver" ? "bg-gray-300 text-gray-800" : ""}
                      ${group.tier === "Gold" ? "bg-yellow-500 text-white" : ""}
                      ${group.tier === "Platinum" ? "bg-gray-800 text-white" : ""}
                    `}
                  >
                    {group.tier[0]}
                  </div>
                  {/* Main info */}
                  <div className="flex-1 flex flex-col items-center text-center w-full">
                    <div className="font-bold text-2xl mb-1 tracking-wide">{group.name}</div>
                    <div className="text-gray-600 mb-1 text-lg font-semibold">
                      Amount: <span className="font-bold">{details.amountRange}</span>
                    </div>
                    <div className="text-gray-500 text-sm mb-1">
                      Category: {group.category}
                    </div>
                    <div className="text-gray-400 text-xs mb-2">
                      {details.description}
                    </div>
                  </div>
                  <div className="w-full border-t border-gray-100 my-3"></div>
                  <div className="flex flex-col gap-2 w-full text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Interest earned</span>
                      <span className="font-semibold text-blue-700">{details.interest}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Access to funds</span>
                      <span className="font-semibold text-green-600">{details.access}</span>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-col items-center w-full">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition text-sm w-full font-semibold">
                      Learn More
                    </button>
                    <div className="mt-2 text-xs text-gray-500 text-center w-full">
                      {details.support}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

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
    </div>
  );
};

export default AdminDashboard;
