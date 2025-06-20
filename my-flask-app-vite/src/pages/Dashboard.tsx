import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [availableGroups, setAvailableGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [userResponse, statsResponse, groupsResponse] = await Promise.all([
          api.get('/api/user/profile'),
          api.get('/api/dashboard/stats'),
          api.get('/api/groups/available')
        ]);
        
        setUser(userResponse.data);
        setUserStats(statsResponse.data);
        setAvailableGroups(groupsResponse.data);
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        if (err.response?.status === 401) {
          setError('Your session has expired. Please log in again.');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError(err.response?.data?.error || 'Failed to load dashboard data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen-minus-header">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4 mt-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
        <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Welcome, {user?.name || 'User'}
          </h1>
          <p className="text-gray-600">
            {user?.role === 'admin'
              ? 'Manage your platform and monitor user activities.'
                : 'Track your savings and manage your stokvel groups.'}
          </p>
        </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Wallet Balance</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  R{userStats?.walletBalance?.toFixed(2) || '0.00'}
                </h3>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Groups</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {userStats?.activeGroupsCount || 0}
                </h3>
              </div>
        </div>
      </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Contributions</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  R{userStats?.totalContributions?.toFixed(2) || '0.00'}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Available Groups */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Groups</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.isArray(availableGroups) ? (
                availableGroups.map((group) => (
                  <div key={group.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-medium text-gray-900">{group.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Contribution:</span>
                        <span className="font-medium">R{group.contributionAmount?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Frequency:</span>
                        <span className="font-medium">{group.contributionFrequency}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Members:</span>
                        <span className="font-medium">{group.memberCount}/{group.maxMembers || '∞'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/groups/${group.id}`)}
                      className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      View Details
                    </button>
                  </div>
                ))
              ) : (
                <div>Loading...</div>
              )}
        </div>
        </div>
    </div>
  );
};

export default Dashboard; 