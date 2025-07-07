import React, { useState, useEffect } from 'react';
import { 
  Eye, Search, Filter, Download, RefreshCw, MessageSquare, 
  CheckCircle, Ban, User, Mail, Phone, Calendar, TrendingUp,
  Users, Crown, Clock, AlertTriangle, Shield, Star, Zap,
  ChevronRight, Target, Activity, Award, Sparkles
} from 'lucide-react';
import { dashboardAPI } from '../services/api';

interface UserData {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'member';
  is_verified: boolean;
  is_suspended: boolean;
  created_at: string;
  last_activity?: string;
  total_contributions?: number;
  engagement_level?: 'high' | 'medium' | 'low';
}

interface UserSegment {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  criteria: string;
  userCount: number;
  growth?: number;
  priority: 'high' | 'medium' | 'low';
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showBulkMessage, setShowBulkMessage] = useState(false);
  const [bulkMessage, setBulkMessage] = useState({ subject: '', message: '' });
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

  // Fetch users (limit to 20 for development)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await dashboardAPI.getUsers();
        const limitedUsers = response.data.slice(0, 20);
        setUsers(limitedUsers);
        setError(null);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again later.');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Elegant User Segments with subtle colors
  const userSegments: UserSegment[] = [
    {
      id: 'high_value',
      name: 'High Value Users',
      description: 'Users with significant contributions',
      icon: <Crown className="w-5 h-5" />,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      criteria: 'Contributions > R5,000',
      userCount: users.filter(u => (u.total_contributions || 0) > 5000).length,
      growth: 12,
      priority: 'high'
    },
    {
      id: 'new_members',
      name: 'New Members',
      description: 'Recently joined users',
      icon: <Sparkles className="w-5 h-5" />,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      criteria: 'Joined < 30 days',
      userCount: users.filter(u => {
        const userDate = new Date(u.created_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return userDate > thirtyDaysAgo;
      }).length,
      growth: 25,
      priority: 'high'
    },
    {
      id: 'engaged',
      name: 'Highly Engaged',
      description: 'Active and engaged users',
      icon: <Zap className="w-5 h-5" />,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      criteria: 'Recent activity + high engagement',
      userCount: users.filter(u => u.engagement_level === 'high').length,
      growth: 8,
      priority: 'medium'
    },
    {
      id: 'pending_kyc',
      name: 'Pending KYC',
      description: 'Awaiting verification',
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'text-orange-700',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      criteria: 'KYC not verified',
      userCount: users.filter(u => !u.is_verified).length,
      growth: -5,
      priority: 'high'
    },
    {
      id: 'inactive',
      name: 'Inactive Users',
      description: 'No recent activity',
      icon: <Clock className="w-5 h-5" />,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      criteria: 'No activity > 7 days',
      userCount: users.filter(u => {
        if (!u.last_activity) return true;
        const lastActivity = new Date(u.last_activity);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return lastActivity < sevenDaysAgo;
      }).length,
      growth: -2,
      priority: 'medium'
    },
    {
      id: 'suspended',
      name: 'Suspended Users',
      description: 'Account suspended',
      icon: <Ban className="w-5 h-5" />,
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      criteria: 'Account suspended',
      userCount: users.filter(u => u.is_suspended).length,
      growth: 0,
      priority: 'low'
    }
  ];

  // Filter users based on selected segment
  const getSegmentUsers = (segmentId: string) => {
    switch (segmentId) {
      case 'high_value':
        return users.filter(u => (u.total_contributions || 0) > 5000);
      case 'new_members':
        return users.filter(u => {
          const userDate = new Date(u.created_at);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return userDate > thirtyDaysAgo;
        });
      case 'engaged':
        return users.filter(u => u.engagement_level === 'high');
      case 'pending_kyc':
        return users.filter(u => !u.is_verified);
      case 'inactive':
        return users.filter(u => {
          if (!u.last_activity) return true;
          const lastActivity = new Date(u.last_activity);
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return lastActivity < sevenDaysAgo;
        });
      case 'suspended':
        return users.filter(u => u.is_suspended);
      default:
        return users;
    }
  };

  // Filter and display users
  const displayUsers = selectedSegment ? getSegmentUsers(selectedSegment) : users;
  const filteredUsers = displayUsers.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && !user.is_suspended) ||
                         (statusFilter === 'suspended' && user.is_suspended) ||
                         (statusFilter === 'verified' && user.is_verified) ||
                         (statusFilter === 'unverified' && !user.is_verified);
    
    return matchesSearch && matchesStatus;
  });

  // Enhanced stats
  const stats = {
    total: users.length,
    active: users.filter(u => !u.is_suspended).length,
    verified: users.filter(u => u.is_verified).length,
    pending: users.filter(u => !u.is_verified).length,
    highValue: users.filter(u => (u.total_contributions || 0) > 5000).length,
    engaged: users.filter(u => u.engagement_level === 'high').length
  };

  // Actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const handleBulkVerify = async () => {
    if (selectedUsers.length === 0) return;
    console.log('Bulk verify users:', selectedUsers);
    setSelectedUsers([]);
  };

  const handleBulkSuspend = async () => {
    if (selectedUsers.length === 0) return;
    console.log('Bulk suspend users:', selectedUsers);
    setSelectedUsers([]);
  };

  const handleSendBulkMessage = async () => {
    if (!bulkMessage.subject || !bulkMessage.message || selectedUsers.length === 0) return;
    console.log('Sending message to:', selectedUsers);
    setShowBulkMessage(false);
    setBulkMessage({ subject: '', message: '' });
    setSelectedUsers([]);
  };

  const handleSuspendUser = async (userId: number) => console.log('Suspend user:', userId);
  const handleVerifyKyc = async (userId: number) => console.log('Verify KYC for user:', userId);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 p-8 space-y-8 mt-16 ml-16">
        {/* Clean Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage and segment your users</p>
          </div>
          
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2 text-gray-700">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setShowBulkMessage(true)}
              disabled={selectedUsers.length === 0}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors duration-200 flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Message ({selectedUsers.length})
            </button>
          </div>
        </div>

        {/* Elegant User Segments */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">User Segments</h2>
            <button 
              onClick={() => setSelectedSegment(null)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                selectedSegment === null 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              View All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userSegments.map(segment => (
              <div
                key={segment.id}
                onClick={() => setSelectedSegment(selectedSegment === segment.id ? null : segment.id)}
                className={`group cursor-pointer transition-all duration-200 ${
                  selectedSegment === segment.id 
                    ? 'ring-2 ring-gray-900 ring-offset-2' 
                    : 'hover:shadow-md'
                }`}
              >
                <div className={`${segment.bgColor} ${segment.borderColor} border rounded-lg p-6 hover:shadow-lg transition-all duration-200`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 ${segment.bgColor} rounded-lg`}>
                      <div className={segment.color}>
                        {segment.icon}
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-md text-xs font-medium ${
                      segment.priority === 'high' ? 'bg-red-100 text-red-700' :
                      segment.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {segment.priority.toUpperCase()}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{segment.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{segment.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-gray-900">{segment.userCount}</div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">{segment.criteria}</div>
                      {segment.growth !== undefined && (
                        <div className={`text-xs font-medium ${
                          segment.growth > 0 ? 'text-green-600' : 
                          segment.growth < 0 ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {segment.growth > 0 ? '+' : ''}{segment.growth}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Clean Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow duration-200">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Users className="w-4 h-4 text-gray-600" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-xl font-semibold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow duration-200">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-xl font-semibold text-gray-900">{stats.active}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow duration-200">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="w-4 h-4 text-blue-600" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-xl font-semibold text-gray-900">{stats.verified}</div>
            <div className="text-sm text-gray-600">Verified</div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow duration-200">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
              </div>
              <TrendingUp className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-xl font-semibold text-gray-900">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending KYC</div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow duration-200">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Crown className="w-4 h-4 text-amber-600" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-xl font-semibold text-gray-900">{stats.highValue}</div>
            <div className="text-sm text-gray-600">High Value</div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow duration-200">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Zap className="w-4 h-4 text-emerald-600" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-xl font-semibold text-gray-900">{stats.engaged}</div>
            <div className="text-sm text-gray-600">Engaged</div>
          </div>
        </div>

        {/* Clean Search and Filter */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
          type="text"
                  placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200"
            >
              <option value="all">All Users</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">
                  {selectedUsers.length} user(s) selected
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleBulkVerify}
                    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center gap-2 text-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Verify Selected
                  </button>
                  <button
                    onClick={handleBulkSuspend}
                    className="px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors duration-200 flex items-center gap-2 text-sm"
                  >
                    <Ban className="w-4 h-4" />
                    Suspend Selected
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading & Error States */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">Error: {error}</p>
          </div>
        )}

        {/* Clean User Table */}
        {!loading && !error && filteredUsers.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    KYC
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Join Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                        className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                      />
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {user.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.phone && <div className="text-xs text-gray-400">{user.phone}</div>}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-md ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.is_suspended ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-md bg-yellow-100 text-yellow-800">
                          Suspended
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-md bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </td>
                    
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.is_verified ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-md bg-green-100 text-green-800">
                          Verified
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-md bg-red-100 text-red-800">
                          Pending
                        </span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setSelectedUser(user)} 
                          className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors duration-200"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                      </button>
                       {!user.is_suspended && (
                          <button 
                            onClick={() => handleSuspendUser(user.id)} 
                            className="p-1 text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 rounded transition-colors duration-200"
                            title="Suspend User"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                       )}
                       {!user.is_verified && (
                          <button 
                            onClick={() => handleVerifyKyc(user.id)} 
                            className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors duration-200"
                            title="Verify KYC"
                          >
                            <CheckCircle className="w-4 h-4" />
                           </button>
                       )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && filteredUsers.length === 0 && (
          <div className="text-center text-gray-600 py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium">No users found</p>
            <p className="text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'No users in the system yet.'}
            </p>
          </div>
        )}

        {/* Modals (same as before but with clean styling) */}
        {/* Bulk Message Modal */}
        {showBulkMessage && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Send Message to {selectedUsers.length} Users</h3>
                <button
                  onClick={() => setShowBulkMessage(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={bulkMessage.subject}
                    onChange={(e) => setBulkMessage({...bulkMessage, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter message subject"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message *
                  </label>
                  <textarea
                    value={bulkMessage.message}
                    onChange={(e) => setBulkMessage({...bulkMessage, message: e.target.value})}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your message here..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowBulkMessage(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendBulkMessage}
                  disabled={!bulkMessage.subject || !bulkMessage.message}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Send Message
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Details Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">User Details: {selectedUser.full_name}</h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
                </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-xl font-medium text-gray-700">
                      {selectedUser.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">{selectedUser.full_name}</h4>
                    <p className="text-gray-600">{selectedUser.role}</p>
                 </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-sm text-gray-900">{selectedUser.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <p className="text-sm text-gray-900">
                      {selectedUser.is_suspended ? 'Suspended' : 'Active'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">KYC Status</label>
                    <p className="text-sm text-gray-900">
                      {selectedUser.is_verified ? 'Verified' : 'Pending'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Join Date</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedUser.created_at)}</p>
                 </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Activity</label>
                    <p className="text-sm text-gray-900">
                      {selectedUser.last_activity ? formatDate(selectedUser.last_activity) : 'No activity'}
                    </p>
                    </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement; 