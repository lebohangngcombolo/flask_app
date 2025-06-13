<<<<<<< HEAD
import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const DigitalWallet: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [activeTab, setActiveTab] = useState<'marketplace' | 'history' | 'payment'>('marketplace');
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Mock user data (replace with real user data from your auth system)
  const user = {
    name: "Leonardo C",
    email: "leonardoc@gmail.com",
    role: "member" as const,
    profilePicture: "https://i.pravatar.cc/100"
  };

  // Mock data (replace with API calls later)
  const [walletData] = useState({
    balance: 3500.00,
    cardNumber: '**** **** **** 1234',
    cardExpiry: '12/25',
    cardHolder: 'Leonardo C',
    earning: 21500,
    earningChange: '+12%',
    spending: 5392,
    spendingChange: '-8%',
    totalBalance: 81910,
    totalBalanceChange: '+12.81%',
    transactions: [
        {
          id: 1,
          type: 'credit',
        amount: 1500.00,
        description: 'Monthly Contribution',
          date: '2024-03-15',
        status: 'Completed'
        },
        {
          id: 2,
          type: 'debit',
        amount: 1200.00,
        description: 'Group Payment',
          date: '2024-03-10',
        status: 'Completed'
      },
      {
        id: 3,
        type: 'credit',
        amount: 1300.00,
        description: 'Member Payment',
        date: '2024-03-05',
        status: 'Completed'
      },
      {
        id: 4,
        type: 'debit',
        amount: 1150.00,
        description: 'Emergency Fund',
        date: '2024-03-01',
        status: 'Completed'
      }
    ],
    monthlyPayments: [
      {
        id: 1,
        name: 'Monthly Contribution',
        amount: 1500.00,
        dueDate: '2024-04-01'
      },
      {
        id: 2,
        name: 'Emergency Fund',
        amount: 1100.00,
        dueDate: '2024-04-01'
      },
      {
        id: 3,
        name: 'Social Fund',
        amount: 1050.00,
        dueDate: '2024-04-01'
        }
      ],
      linkedAccounts: [
      { id: 1, type: 'card', name: 'Capitec Card', lastFour: '1890' },
      { id: 2, type: 'bank', name: 'FNB Bank', lastFour: '1234' },
    ],
    notifications: [
      { id: 1, message: 'Josep Akbar sent you R930,000', time: 'Just now' },
      { id: 2, message: 'Water bill (R15.00)', time: 'Due', action: 'Pay now' },
    ],
    quickTransfer: [
      { id: 1, name: 'Alice', avatar: 'https://i.pravatar.cc/40?img=1' },
      { id: 2, name: 'Bob', avatar: 'https://i.pravatar.cc/40?img=2' },
      { id: 3, name: 'Carol', avatar: 'https://i.pravatar.cc/40?img=3' },
      { id: 4, name: 'Dave', avatar: 'https://i.pravatar.cc/40?img=4' },
      { id: 5, name: 'Eve', avatar: 'https://i.pravatar.cc/40?img=5' },
    ],
    user: {
      name: 'Leonardo C',
      email: 'leonardoc@gmail.com',
      avatar: 'https://i.pravatar.cc/100',
    },
    statistics: {
      weekly: {
        earning: 21500,
        spending: 5392,
        change: '+12%'
      },
      monthly: {
        earning: 85600,
        spending: 21500,
        change: '+8%'
      },
      yearly: {
        earning: 1027200,
        spending: 258000,
        change: '+15%'
      }
    },
    marketplaces: [
    {
      id: 1,
        name: 'Takealot',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Takealot_logo.svg/1200px-Takealot_logo.svg.png',
        category: 'Retail'
    },
    {
      id: 2,
        name: 'Amazon',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/1200px-Amazon_logo.svg.png',
        category: 'Retail'
    },
    {
      id: 3,
        name: 'Woolworths',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Woolworths_Logo.svg/1200px-Woolworths_Logo.svg.png',
        category: 'Grocery'
      },
      {
        id: 4,
        name: 'Checkers',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Checkers_Logo.svg/1200px-Checkers_Logo.svg.png',
        category: 'Grocery'
      },
      {
        id: 5,
        name: 'Pick n Pay',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Pick_n_Pay_logo.svg/1200px-Pick_n_Pay_logo.svg.png',
        category: 'Grocery'
      },
      {
        id: 6,
        name: 'Shoprite',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Shoprite_Logo.svg/1200px-Shoprite_Logo.svg.png',
        category: 'Grocery'
      },
      {
        id: 7,
        name: 'Makro',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Makro_Logo.svg/1200px-Makro_Logo.svg.png',
        category: 'Wholesale'
      },
      {
        id: 8,
        name: 'Game',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Game_Logo.svg/1200px-Game_Logo.svg.png',
        category: 'Retail'
      }
    ]
  });

  // Chart data configuration
  const chartData = {
    weekly: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      earning: [1200, 1900, 1500, 2100, 1800, 2300, 2100],
      spending: [800, 1200, 900, 1500, 1100, 1800, 1400]
    },
    monthly: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      earning: [8500, 9200, 8800, 9100],
      spending: [5200, 5800, 5100, 5400]
    },
    yearly: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      earning: [85000, 92000, 88000, 91000, 95000, 89000, 92000, 94000, 91000, 93000, 96000, 98000],
      spending: [52000, 58000, 51000, 54000, 56000, 53000, 55000, 57000, 54000, 56000, 58000, 59000]
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#6B7280'
        }
      },
      y: {
        grid: {
          color: '#E5E7EB',
          drawBorder: false
        },
        ticks: {
          color: '#6B7280',
          callback: (value: number) => `R${value.toLocaleString()}`
        }
      }
    },
    elements: {
      line: {
        tension: 0.4
      },
      point: {
        radius: 0
      }
    }
  };

  const data = {
    labels: chartData[selectedPeriod].labels,
    datasets: [
      {
        label: 'Earning',
        data: chartData[selectedPeriod].earning,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        borderWidth: 2
      },
      {
        label: 'Spending',
        data: chartData[selectedPeriod].spending,
        borderColor: '#EC4899',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        fill: true,
        borderWidth: 2
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-green-100 to-yellow-100 p-6">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Digital Wallet</h1>
        <div className="max-w-5xl mx-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* LEFT COLUMN */}
            <div className="flex flex-col gap-6">
              {/* Earning & Spending */}
          <div className="bg-white rounded-3xl shadow-lg p-6 flex flex-col gap-6">
            <div className="flex gap-4">
              <div className="flex-1 bg-blue-50 rounded-xl p-4">
                <p className="text-gray-500">Earning</p>
                <p className="text-2xl font-bold text-blue-700">R{walletData.earning.toLocaleString()}</p>
                <p className="text-xs text-blue-400 mt-1">{walletData.earningChange}</p>
              </div>
              <div className="flex-1 bg-pink-50 rounded-xl p-4">
                <p className="text-gray-500">Spending</p>
                <p className="text-2xl font-bold text-pink-700">R{walletData.spending.toLocaleString()}</p>
                <p className="text-xs text-pink-400 mt-1">{walletData.spendingChange}</p>
              </div>
            </div>
                {/* Statistic */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="font-semibold">Statistic</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedPeriod('weekly')}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      selectedPeriod === 'weekly' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Weekly
                  </button>
                  <button 
                    onClick={() => setSelectedPeriod('monthly')}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      selectedPeriod === 'monthly' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Monthly
                  </button>
                  <button 
                    onClick={() => setSelectedPeriod('yearly')}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      selectedPeriod === 'yearly' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Yearly
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-gray-500 text-sm">Earning</p>
                    <p className="text-xl font-bold text-blue-700">
                      R{walletData.statistics[selectedPeriod].earning.toLocaleString()}
                    </p>
                  </div>
              <div>
                    <p className="text-gray-500 text-sm">Spending</p>
                    <p className="text-xl font-bold text-pink-700">
                      R{walletData.statistics[selectedPeriod].spending.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="h-64">
                  <Line data={data} options={chartOptions} />
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-gray-600">Earning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                    <span className="text-sm text-gray-600">Spending</span>
                  </div>
                  <div className="text-sm text-blue-500 font-medium">
                    {walletData.statistics[selectedPeriod].change}
                  </div>
                </div>
              </div>
            </div>
            {/* Monthly Payment */}
            <div>
              <p className="font-semibold mb-2">Monthly payment</p>
              <div className="flex flex-col gap-2">
                {walletData.monthlyPayments.map((pay) => (
                  <div key={pay.id} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                    <span>{pay.name}</span>
                    <span className="font-bold">R{pay.amount.toFixed(2)}</span>
                    <button className="bg-blue-500 text-white px-3 py-1 rounded-lg text-xs">Pay now</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
            </div>
            {/* MIDDLE COLUMN */}
            <div className="flex flex-col gap-6">
          <div className="bg-gradient-to-br from-blue-400 via-pink-300 to-yellow-200 rounded-3xl shadow-xl p-6 flex flex-col gap-6">
            {/* Card */}
            <div className="bg-white bg-opacity-30 rounded-2xl p-6 shadow-lg relative">
              <div className="absolute top-4 right-4 text-gray-400">Visa</div>
              <p className="text-lg text-white font-semibold">Card balance</p>
              <p className="text-3xl font-bold text-white">R{walletData.balance.toLocaleString()}</p>
              <p className="text-white mt-4 tracking-widest">{walletData.cardNumber}</p>
              <div className="flex justify-between text-white text-xs mt-2">
                <span>{walletData.cardExpiry}</span>
                <span>{walletData.cardHolder}</span>
              </div>
            </div>
            {/* Card Info */}
            <div className="bg-white rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <p className="font-semibold">Card information</p>
                <button className="text-blue-500 text-sm">Edit</button>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{walletData.cardHolder}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Card No:</span>
                  <span className="font-medium">{walletData.cardNumber.slice(-4)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Valid until:</span>
                  <span className="font-medium">{walletData.cardExpiry}</span>
                </div>
              </div>
            </div>
            {/* Tabs */}
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab('marketplace')}
                className={`flex-1 px-3 py-1.5 rounded-lg text-sm ${
                  activeTab === 'marketplace' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white bg-opacity-20 text-white'
                } font-medium`}
              >
                Marketplace
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`flex-1 px-3 py-1.5 rounded-lg text-sm ${
                  activeTab === 'history' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white bg-opacity-20 text-white'
                } font-medium`}
              >
                History
              </button>
              <button 
                onClick={() => setActiveTab('payment')}
                className={`flex-1 px-3 py-1.5 rounded-lg text-sm ${
                  activeTab === 'payment' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white bg-opacity-20 text-white'
                } font-medium`}
              >
                Payment
              </button>
            </div>
            {/* Tab Content */}
            {activeTab === 'marketplace' && (
              <div className="space-y-2">
                    {walletData.marketplaces.map((marketplace) => (
                      <div 
                        key={marketplace.id}
                        className="bg-white bg-opacity-30 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-opacity-40 transition-all"
                      >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                      <img 
                              src={marketplace.logo} 
                              alt={marketplace.name} 
                        className="w-8 h-8 object-contain"
                      />
                    </div>
                    <div>
                            <p className="font-medium text-white">{marketplace.name}</p>
                            <p className="text-xs text-white text-opacity-70">{marketplace.category}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsConnecting(true)}
                    className="px-3 py-1 bg-white bg-opacity-20 rounded-lg text-white text-sm hover:bg-opacity-30"
                  >
                    Connect
                  </button>
                </div>
                    ))}
              </div>
            )}
            {activeTab === 'history' && (
              <div className="space-y-2">
                {walletData.transactions.map((transaction) => (
                  <div 
                    key={transaction.id}
                    className="bg-white bg-opacity-30 rounded-xl p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        transaction.type === 'credit' ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        <span className="text-white text-sm">
                          {transaction.type === 'credit' ? '+' : '-'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">{transaction.description}</p>
                        <p className="text-xs text-white text-opacity-70">{transaction.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium text-sm ${
                        transaction.type === 'credit' ? 'text-green-500' : 'text-red-500'
                      }`}>
                        R{transaction.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-white text-opacity-70">{transaction.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'payment' && (
              <div className="space-y-4">
                {walletData.monthlyPayments.map((payment) => (
                  <div 
                    key={payment.id}
                    className="bg-white bg-opacity-30 rounded-xl p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-white text-lg">{payment.name}</p>
                        <p className="text-sm text-white text-opacity-70">Due: {payment.dueDate}</p>
                      </div>
                      <p className="font-bold text-white text-xl">R{payment.amount.toLocaleString()}</p>
                    </div>
                    <div className="flex justify-end">
                      <button className="px-4 py-2 bg-white bg-opacity-20 rounded-lg text-white text-sm hover:bg-opacity-30 transition-all">
                        Pay Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Connection Modal */}
            {isConnecting && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-6 w-96">
                  <h3 className="text-xl font-bold mb-4">Connect Card</h3>
                  <p className="text-gray-600 mb-4">Enter your card details to connect with the marketplace</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                      <input 
                        type="text" 
                        className="w-full p-2 border rounded-lg"
                        placeholder="**** **** **** ****"
                      />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                        <input 
                          type="text" 
                          className="w-full p-2 border rounded-lg"
                          placeholder="MM/YY"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                        <input 
                          type="text" 
                          className="w-full p-2 border rounded-lg"
                          placeholder="***"
                        />
                      </div>
        </div>
                    <div className="flex gap-3 mt-6">
                      <button 
                        onClick={() => setIsConnecting(false)}
                        className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => setIsConnecting(false)}
                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        Connect
                      </button>
                    </div>
                  </div>
                </div>
            </div>
            )}
        </div>
            </div>
            {/* RIGHT COLUMN */}
            <div className="flex flex-col gap-6">
          <div className="bg-white rounded-3xl shadow-lg p-6 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <img src={walletData.user.avatar} alt="Profile" className="w-14 h-14 rounded-full" />
              <div>
                <p className="font-bold text-lg">{walletData.user.name}</p>
                <p className="text-gray-500 text-sm">{walletData.user.email}</p>
              </div>
            </div>
            {/* Total Balance */}
            <div>
              <p className="text-gray-500">Total balance</p>
              <p className="text-3xl font-bold text-blue-700">R{walletData.totalBalance.toLocaleString()}</p>
              <p className="text-xs text-blue-400 mt-1">{walletData.totalBalanceChange}</p>
            </div>
            {/* Send/Receive */}
            <div className="flex gap-2">
              <button className="flex-1 bg-black text-white py-2 rounded-lg">Send</button>
              <button className="flex-1 bg-black text-white py-2 rounded-lg">Receive</button>
            </div>
            {/* Quick Transfer */}
            <div>
              <p className="font-semibold mb-2">Quick transfer</p>
              <div className="flex gap-2">
                {walletData.quickTransfer.map((person) => (
                  <img key={person.id} src={person.avatar} alt={person.name} className="w-10 h-10 rounded-full border-2 border-white" />
                ))}
                <button className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold">+</button>
        </div>
            </div>
            {/* Notifications */}
            <div>
              <p className="font-semibold mb-2">Notifications</p>
              <div className="flex flex-col gap-2">
                {walletData.notifications.map((note) => (
                  <div key={note.id} className="flex items-center justify-between bg-yellow-50 rounded-lg p-3">
                    <span>{note.message}</span>
                    {note.action ? (
                      <button className="bg-blue-500 text-white px-3 py-1 rounded-lg text-xs">{note.action}</button>
                    ) : (
                      <span className="text-xs text-gray-400">{note.time}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalWallet;
=======
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
>>>>>>> origin/master
