import React, { useState, useEffect } from 'react';
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
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

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
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [activeTab, setActiveTab] = useState<'marketplace' | 'history' | 'payment'>('marketplace');
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletData, setWalletData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await api.get('/api/wallet');
        setWalletData(res.data);
      } catch (err) {
        // Handle error
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!walletData) return <div>No wallet data found.</div>;

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
