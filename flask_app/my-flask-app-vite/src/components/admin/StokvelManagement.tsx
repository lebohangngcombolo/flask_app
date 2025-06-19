import React, { useState, useEffect } from 'react';
import { Plus, Search, Users, DollarSign, Calendar, Settings } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { toast } from 'react-toastify';

interface StokvelGroup {
  id: number;
  name: string;
  description: string;
  contributionAmount: number;
  contributionFrequency: string;
  memberCount: number;
  maxMembers: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

const StokvelManagement: React.FC = () => {
  const [groups, setGroups] = useState<StokvelGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getGroups();
      setGroups(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load stokvel groups. Please try again.');
      toast.error('Failed to load stokvel groups');
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Stokvel Groups</h1>
        <p className="text-lg text-gray-600">
          View and manage all stokvel groups in the system
        </p>
      </div>

      {/* Search and Create Section */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search groups by name or description..."
              className="w-full pl-10 pr-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-6 w-6" />
          Create New Group
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
          <p className="text-lg">{error}</p>
        </div>
      )}

      {/* Groups Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{group.name}</h3>
              <p className="text-gray-600 mb-4">{group.description}</p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-700">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="text-lg">
                    R{group.contributionAmount} - {group.contributionFrequency}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-700">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="text-lg">
                    {group.memberCount} / {group.maxMembers} Members
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <span className="text-lg">
                    Created: {new Date(group.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {/* TODO: Implement view details */}}
                  className="flex-1 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-lg font-medium hover:bg-blue-100 transition-colors"
                >
                  View Details
                </button>
                <button
                  onClick={() => {/* TODO: Implement edit group */}}
                  className="flex-1 bg-gray-50 text-gray-600 px-4 py-2 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredGroups.length === 0 && (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600 mb-4">No stokvel groups found</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-6 w-6" />
            Create Your First Group
          </button>
        </div>
      )}

      {/* Create Group Modal - TODO: Implement */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-2xl font-bold mb-4">Create New Stokvel Group</h2>
            {/* TODO: Add form fields */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-2 text-lg text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {/* TODO: Implement create group */}}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StokvelManagement; 