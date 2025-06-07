import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  Plus,
  Wallet,
  Send,
  Link as LinkIcon,
  ChevronRight,
  Search,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Activity,
  BarChart2,
  Briefcase,
  Calendar,
  MessageSquare,
  Home,
  FileText,
  UserPlus,
  ArrowLeft as ArrowLeftIcon,
  Search as SearchIcon,
  Filter as FilterIcon,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  ShieldPlus,
  Users,
  ShoppingBag,
  Heart,
  Building2,
  Fingerprint,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { userNavItems, marketplaceNavItem } from '../navItems';

interface Transaction {
  id: number;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

interface WalletData {
  balance: number;
  recentTransactions: Transaction[];
  linkedAccounts: {
    id: number;
    type: 'bank' | 'card';
    name: string;
    lastFour: string;
  }[];
}

const groupColors: Record<string, string> = {
  Grocery: "bg-green-100 text-green-700",
  Burial: "bg-red-100 text-red-700",
  Savings: "bg-blue-100 text-blue-700",
};

const DigitalWallet: React.FC = () => {
  const [walletData, setWalletData] = useState<WalletData>({
    balance: 0,
    recentTransactions: [],
    linkedAccounts: []
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch wallet data from API
    // For now using mock data
    setWalletData({
      balance: 5000.75,
      recentTransactions: [
        {
          id: 1,
          type: 'credit',
          amount: 1000.00,
          description: 'Monthly contribution',
          date: '2024-03-15',
          status: 'completed'
        },
        {
          id: 2,
          type: 'debit',
          amount: 500.00,
          description: 'Group payout',
          date: '2024-03-10',
          status: 'completed'
        }
      ],
      linkedAccounts: [
        {
          id: 1,
          type: 'bank',
          name: 'Standard Bank',
          lastFour: '1234'
        }
      ]
    });
    setIsLoading(false);
  }, []);

  // Placeholder data
  const user = { name: "Thabo Mokoena" };
  const balance = 5230.75;
  const transactions = [
    {
      id: 1,
      type: "income",
      title: "Contribution",
      amount: 1000,
      date: "2024-06-01",
      icon: <ArrowDownLeft className="text-green-500" />,
    },
    {
      id: 2,
      type: "expense",
      title: "Withdrawal",
      amount: -500,
      date: "2024-06-03",
      icon: <ArrowUpRight className="text-red-500" />,
    },
    {
      id: 3,
      type: "income",
      title: "Contribution",
      amount: 800,
      date: "2024-06-10",
      icon: <ArrowDownLeft className="text-green-500" />,
    },
  ];
  const groupBalances = [
    {
      name: "Grocery",
      balance: 2500,
      icon: <ShoppingBag className="w-6 h-6" />,
    },
    {
      name: "Burial",
      balance: 1200,
      icon: <Heart className="w-6 h-6" />,
    },
    {
      name: "Savings",
      balance: 1530.75,
      icon: <Users className="w-6 h-6" />,
    },
  ];
  const [pinEnabled, setPinEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // Insights
  const insights = [
    {
      label: "Contributions",
      value: "R1,800",
      icon: <BarChart2 className="w-5 h-5 text-blue-500" />,
    },
    {
      label: "Withdrawals",
      value: "R500",
      icon: <BarChart2 className="w-5 h-5 text-red-500" />,
    },
    {
      label: "Transfers",
      value: "2",
      icon: <BarChart2 className="w-5 h-5 text-green-500" />,
    },
  ];

  return (
    <DashboardLayout
      user={{
        name: "User",
        email: "user@example.com",
        role: "member"
      }}
      sidebarNavItems={userNavItems}
      marketplaceNavItem={marketplaceNavItem}
    >
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-gray-900">Digital Wallet</h1>
          <p className="text-gray-600">Welcome, {user.name}</p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Balance Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Available Balance</h2>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  R {balance.toLocaleString()}
                </p>
              </div>
              <div className="flex space-x-3">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Funds
                </button>
                <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center">
                  <Send className="w-4 h-4 mr-2" />
                  Transfer Funds
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <button className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-center">
                <CreditCard className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <span className="text-sm text-gray-600">Add Card</span>
              </button>
              <button className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm text-gray-600">Link Bank</span>
              </button>
              <button className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-center">
                <History className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <span className="text-sm text-gray-600">History</span>
              </button>
            </div>

            {/* Recent Transactions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center">
                      <div className="bg-gray-100 rounded-full p-2">
                        {tx.icon}
                      </div>
                      <div className="ml-4">
                        <p className="font-medium text-gray-900">{tx.title}</p>
                        <p className="text-sm text-gray-500">{tx.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        tx.type === "income" ? "text-green-600" : "text-red-600"
                      }`}>
                        {tx.type === "income" ? "+" : ""}
                        R{Math.abs(tx.amount).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">{tx.type === "income" ? "Income" : "Expense"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Linked Accounts */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Linked Accounts</h3>
            <div className="space-y-4">
              {walletData.linkedAccounts.map((account) => (
                <div
                  key={account.id}
                  className="p-4 bg-gray-50 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-900">{account.name}</p>
                      <p className="text-sm text-gray-500">****{account.lastFour}</p>
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700">
                    <Shield className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <button className="w-full p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-center text-blue-600 font-medium">
                + Add New Account
              </button>
            </div>
          </motion.div>
        </div>

        {/* Group Balances */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {groupBalances.map((group) => (
            <div
              key={group.name}
              className={`rounded-xl p-4 flex flex-col items-center shadow ${groupColors[group.name] || "bg-gray-100 text-gray-700"}`}
            >
              {group.icon}
              <div className="mt-2 font-semibold">{group.name}</div>
              <div className="text-lg font-bold">R{group.balance.toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* Insights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {insights.map((insight) => (
            <div key={insight.label} className="bg-white rounded-xl p-4 flex items-center gap-3 shadow">
              {insight.icon}
              <div>
                <div className="text-xs text-gray-500">{insight.label}</div>
                <div className="font-bold">{insight.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Security Settings */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Security Settings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center bg-white rounded-xl p-4 shadow">
              <Shield className="w-6 h-6 text-blue-500 mr-3" />
              <span className="flex-1">Enable Wallet PIN</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={pinEnabled}
                  onChange={() => setPinEnabled((v) => !v)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 transition"></div>
                <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition peer-checked:translate-x-5"></div>
              </label>
            </div>
            <div className="flex items-center bg-white rounded-xl p-4 shadow">
              <Fingerprint className="w-6 h-6 text-emerald-500 mr-3" />
              <span className="flex-1">Enable Biometric Authentication</span>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={biometricEnabled}
                  onChange={() => setBiometricEnabled((v) => !v)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-emerald-600 transition"></div>
                <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition peer-checked:translate-x-5"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Linked Bank Account */}
        <div className="bg-white rounded-xl p-4 flex items-center gap-4 shadow">
          <Building2 className="w-8 h-8 text-blue-500" />
          <div>
            <div className="text-xs text-gray-500">Linked Bank Account</div>
            <div className="font-bold">Capitec Bank •••• 1234</div>
          </div>
          <button className="ml-auto text-blue-600 hover:underline text-sm">Manage</button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DigitalWallet;
