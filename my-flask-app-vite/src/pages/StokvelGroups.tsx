import React, { useState, useEffect } from "react";
import { Search, Filter } from "lucide-react";
import { toast } from "react-hot-toast";
import { groupService } from '../services/groupService';
const StokvelGroups: React.FC = () => {
  const [search, setSearch] = useState("");
  const [allGroups, setAllGroups] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTier, setLoadingTier] = useState<number | null>(null);

  // Fetch all groups and organize by category
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await groupService.getAvailableGroups();
        const groups = res.data;
        setAllGroups(groups);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(groups.map((group: any) => group.category))];
        setCategories(uniqueCategories);
        
        // Set first category as active
        if (uniqueCategories.length > 0 && !activeCategory) {
          setActiveCategory(uniqueCategories[0]);
        }
      } catch (err) {
        toast.error("Failed to load groups");
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  // Fetch user's join requests - This ensures data persists after refresh/logout
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch("/api/user/join-requests", {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setJoinRequests(
            data.map((req: any) => ({
              groupId: req.tier_id,
              status: req.status,
              reason: req.reason
            }))
          );
        }
      } catch (err) {
        console.error("Failed to fetch join requests:", err);
      }
    };

    fetchRequests();
  }, []);

  // Filter groups by active category
  const filteredGroups = allGroups.filter(group => 
    group.category === activeCategory &&
    group.name.toLowerCase().includes(search.toLowerCase())
  );

  // Handle join request
  const handleJoin = async (groupId: number) => {
    setLoadingTier(groupId);
    try {
      await groupService.joinGroup(groupId);
      // Add to local state immediately for instant feedback
      setJoinRequests(prev => [...prev, { groupId, status: "pending" }]);
      toast.success("Join request sent successfully!");
    } catch (err) {
      toast.error("Failed to submit join request.");
    } finally {
      setLoadingTier(null);
    }
  };

  // Get join request status for a group
  const getRequestStatus = (groupId: number) => {
    return joinRequests.find(req => req.groupId === groupId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text mb-2">Stokvel Groups</h1>
          <p className="text-gray-600 dark:text-gray-400">Join a group and start saving with others</p>
        </div>

        {/* Category Tabs - Horizontal */}
        <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeCategory === category
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-dark-card text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-dark-border"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-dark-card border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text"
            />
          </div>
        </div>

        {/* Groups Grid - Shows only tiers for selected category */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => {
            const request = getRequestStatus(group.id);
            
            return (
              <div key={group.id} className="bg-white dark:bg-dark-card rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text">{group.tier}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{group.category}</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-sm font-medium rounded-full">
                    R{group.amount}
                  </span>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-4">{group.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Rules:</span>
                    <span className="ml-2">{group.rules}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Frequency:</span>
                    <span className="ml-2">{group.frequency}</span>
                  </div>
                </div>

                {group.benefits && group.benefits.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Benefits:</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {group.benefits.map((benefit: string, index: number) => (
                        <li key={index} className="flex items-center">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Join Button or Status */}
                {request ? (
                  <div>
                    <button
                      className={`w-full px-4 py-2 rounded font-semibold ${
                        request.status === "pending"
                          ? "bg-yellow-100 text-yellow-700 cursor-not-allowed"
                          : request.status === "approved"
                          ? "bg-green-100 text-green-700 cursor-not-allowed"
                          : "bg-red-100 text-red-700 cursor-not-allowed"
                      }`}
                      disabled
                    >
                      {request.status === "pending" && "Request Pending"}
                      {request.status === "approved" && "Approved"}
                      {request.status === "rejected" && `Rejected${request.reason ? `: ${request.reason}` : ""}`}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleJoin(group.id)}
                    disabled={loadingTier === group.id}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingTier === group.id ? "Sending..." : "Request to Join"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Status Table - Always visible for better UX */}
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4 dark:text-dark-text">My Join Requests Status</h2>
          <div className="bg-white dark:bg-dark-card rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Group
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-border">
                {joinRequests.length > 0 ? (
                  joinRequests.map((request, index) => {
                    const group = allGroups.find(g => g.id === request.groupId);
                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-dark-text">
                          {group ? `${group.category} ${group.tier}` : `Group ${request.groupId}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            request.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                            request.status === "approved" ? "bg-green-100 text-green-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date().toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {request.reason || "-"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No join requests yet. Select a group above to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StokvelGroups;
