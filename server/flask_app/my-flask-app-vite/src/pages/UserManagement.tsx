import React, { useState, useEffect } from 'react';
import { Banknote, CreditCard, Building2, User, CheckCircle, Ban, Eye, Search, Filter } from 'lucide-react';
import { dashboardAPI } from '../services/api'; // Assuming dashboardAPI exists and has getUsers

// Define a type for the user data expected from the API
interface UserData {
  id: number;
  full_name: string; // Use full_name based on backend response
  email: string;
  role: 'admin' | 'member';
  is_verified: boolean; // Assuming KYC status is boolean is_verified
  is_suspended: boolean; // Assuming a suspended status field
  group?: string; // Assuming group name or identifier might be here
  total_contributions?: number; // Assuming total contributions
  bankDetails?: { // Assuming nested bank details
    bankName: string;
    accountNumber: string;
    accountType: string;
  };
  created_at: string; // Assuming a creation date
  // Add other fields as needed from your backend User model
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        // Correct the API call: use dashboardAPI.getUsers()
        const response = await dashboardAPI.getUsers(); // Call getUsers from dashboardAPI
        setUsers(response.data); // Assuming the list of users is in response.data
        setError(null);
      } catch (err) {
        console.error('Error fetching users:', err);
        // It's helpful to log the error response data if available
        console.error('Error response data:', err.response?.data);
        setError('Failed to load users. Please try again later.');
        setUsers([]); // Clear users on error
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []); // Empty dependency array means this effect runs once on mount

  const handleUserSelect = (user: UserData) => {
    setSelectedUser(user);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
  };

  // Placeholder handlers for actions - implement actual API calls here
  const handleSuspendUser = async (userId: number) => {
    console.log('Suspend user:', userId);
    // TODO: Implement API call to suspend user using appropriate API object/method
    // Example: await adminAPI.suspendUser(userId); // You'll need to add this method
    // Refresh users list after action
  };

  const handleVerifyKyc = async (userId: number) => {
    console.log('Verify KYC for user:', userId);
    // TODO: Implement API call to verify KYC using appropriate API object/method
     // Example: await adminAPI.verifyKyc(userId); // You'll need to add this method
    // Refresh users list after action
  };

  // Basic filtering/searching (can be expanded)
  // const [searchTerm, setSearchTerm] = useState('');
  // const filteredUsers = users.filter(user =>
  //   user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   user.email.toLowerCase().includes(searchTerm.toLowerCase())
  // );


  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Add AdminSidebar and AdminNavbar if this page is not rendered within AdminDashboard */}
      {/* Assuming this page is accessed via the /admin route which includes the sidebar and navbar */}
      {/* If not, you might need to wrap this component with a layout similar to AdminDashboard */}

      {/* Main Content Area */}
      <div className="flex-1 p-8 space-y-6 mt-16 ml-16"> {/* Added margin-top and margin-left for fixed header/sidebar */}
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600">View and manage all users in the i-Stokvel platform.</p>

        {/* Add Search/Filter controls here later */}
        {/* <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4 p-2 border rounded"
        /> */}

        {loading && <div className="text-center">Loading users...</div>}
        {error && <div className="text-red-600">Error: {error}</div>}

        {!loading && !error && users.length > 0 && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    KYC Verified
                  </th>
                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Groups
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.full_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.is_verified ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Yes
                        </span>
                      ) : (
                         <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          No
                        </span>
                      )}
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                       {user.is_suspended ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Suspended
                        </span>
                      ) : (
                         <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {/* Display joined groups count or list */}
                      {/* Assuming user object might contain group info */}
                      {user.group || 'N/A'} {/* Placeholder */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button onClick={() => handleUserSelect(user)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                        <Eye className="w-5 h-5 inline-block" /> View
                      </button>
                       {!user.is_suspended && (
                          <button onClick={() => handleSuspendUser(user.id)} className="text-yellow-600 hover:text-yellow-900 mr-3">
                            <Ban className="w-5 h-5 inline-block" /> Suspend
                          </button>
                       )}
                       {!user.is_verified && (
                          <button onClick={() => handleVerifyKyc(user.id)} className="text-green-600 hover:text-green-900">
                             <CheckCircle className="w-5 h-5 inline-block" /> Verify KYC
                           </button>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

         {!loading && !error && users.length === 0 && (
            <div className="text-center text-gray-600">No users found.</div>
         )}


        {/* User Details Modal (simplified - you can use a dedicated modal component) */}
        {selectedUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" id="my-modal">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">User Details: {selectedUser.full_name}</h3>
              <div className="space-y-6">
                {/* User Info */}
                <div className="space-y-2">
                  <h4 className="text-lg font-semibold text-gray-800">Basic Information</h4>
                  <p className="text-sm text-gray-700"><strong>Email:</strong> {selectedUser.email}</p>
                  <p className="text-sm text-gray-700"><strong>Role:</strong> {selectedUser.role}</p>
                   <p className="text-sm text-gray-700"><strong>Account Status:</strong> {selectedUser.is_suspended ? 'Suspended' : 'Active'}</p>
                  <p className="text-sm text-gray-700"><strong>Member Since:</strong> {new Date(selectedUser.created_at).toLocaleDateString()}</p>
                </div>

                {/* KYC Status */}
                 <div className="space-y-2">
                  <h4 className="text-lg font-semibold text-gray-800">KYC Verification</h4>
                   <p className="text-sm text-gray-700"><strong>Status:</strong> {selectedUser.is_verified ? 'Verified' : 'Pending Verification'}</p>
                   {/* Add more KYC details here if available in user data */}
                 </div>

                {/* Group Info */}
                <div className="space-y-2">
                  <h4 className="text-lg font-semibold text-gray-800">Group Information</h4>
                  {/* You'll likely need to fetch detailed group info for the user here */}
                  <p className="text-sm text-gray-700"><strong>Group:</strong> {selectedUser.group || 'Not in a group yet'}</p>
                   {/* Add a list of groups if a user can be in multiple */}
                </div>

                {/* Contributions Summary */}
                 <div className="space-y-2">
                  <h4 className="text-lg font-semibold text-gray-800">Contributions Summary</h4>
                  {/* You'll likely need to fetch a summary of contributions for the user */}
                  <p className="text-sm text-gray-700"><strong>Total Contributed:</strong> R{selectedUser.total_contributions?.toFixed(2) || '0.00'}</p>
                   {/* Add links or summaries of recent transactions */}
                 </div>


                {/* Bank Details */}
                <div className="space-y-2">
                  <h4 className="text-lg font-semibold text-gray-800">Bank Details</h4>
                  {selectedUser.bankDetails ? (
                    <div className="space-y-1 text-sm text-gray-700">
                      <p><strong>Bank Name:</strong> {selectedUser.bankDetails.bankName}</p>
                      <p><strong>Account Number:</strong> {selectedUser.bankDetails.accountNumber}</p>
                      <p><strong>Account Type:</strong> {selectedUser.bankDetails.accountType}</p>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No bank details provided.</div>
                  )}
                </div>

                 {/* Add more sections for Transactions, Activity Log, etc. */}

              </div>
              <div className="flex justify-end mt-6">
                <button onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
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