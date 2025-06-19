<<<<<<< HEAD
import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
=======
<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
=======
import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
>>>>>>> origin/master
>>>>>>> 03ccbce380626419915c5ff9484c34b37668a0ea
import {
  User as UserIcon, // Alias to avoid conflict if User is used elsewhere
  Shield,
  BellRing,
  Lock,
  Trash2,
  ChevronRight, // Use ChevronRight for the "View" button icon
  Mail, // for email notification toggle
  Bell, // for push notification toggle
  ShieldCheck,
  LogOut as LogoutIcon,
  Monitor,
  Download,
  FileText,
  ExternalLink,
  Key
} from 'lucide-react'; // Import necessary icons
import moment from 'moment'; // Import moment for date formatting
// Import navigation items from the new file
import { userNavItems, marketplaceNavItem } from '../navItems';
<<<<<<< HEAD
=======
<<<<<<< HEAD
import { authAPI } from '../services/api';

// Add to your API service (api.ts)
export const profileAPI = {
  getUserProfile: () => api.get('/api/profile'),
  updateUserProfile: (data: any) => api.put('/api/profile', data),
  getActiveSessions: () => api.get('/api/profile/sessions'),
=======
>>>>>>> 03ccbce380626419915c5ff9484c34b37668a0ea

// Mock user data (replace with fetching from your backend)
// This mock data is now only used for the read-only email
const mockUser = {
  name: 'Demo User', // This will not be used for initial state
  email: 'demo@example.com', // Used for read-only email display
  profilePicture: null,
  role: 'member',
  phone: '123-456-7890', // This will not be used for initial state
  dateOfBirth: '1990-01-01', // This will not be used for initial state
  gender: 'Male', // This will not be used for initial state
  // registrationDate: '2023-01-15', // We will display the current date
<<<<<<< HEAD
=======
>>>>>>> origin/master
>>>>>>> 03ccbce380626419915c5ff9484c34b37668a0ea
};

// Mock Active Sessions data
const mockSessions = [
  { id: 1, device: 'Windows 10 - Chrome', location: 'Cape Town, South Africa', time: '2023-10-27T10:00:00Z', current: true },
  { id: 2, device: 'Android Phone - Chrome', location: 'Johannesburg, South Africa', time: '2023-10-26T18:30:00Z', current: false },
];

// Define the tabs for the internal horizontal navigation
const userProfileTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'your-details', label: 'My details' },
  { id: 'account-security', label: 'Account & security' },
  { id: 'communication', label: 'Communication' },
  { id: 'privacy', label: 'Privacy' },
];

// Component for a single information card
interface InfoCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onClick: () => void;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon: Icon, title, description, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="bg-white shadow rounded-lg p-6 flex flex-col justify-between text-left w-full transition duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
    >
      <div className="flex-shrink-0 mb-4">
        <Icon className="w-8 h-8 text-blue-600" />
      </div>
      <div className="flex-grow mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <span className="self-start flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-800">
        View
        <ChevronRight className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:translate-x-1" />
      </span>
    </button>
  );
};

const UserProfile: React.FC = () => {
  // State to manage the active horizontal tab within UserProfile
  const [activeTab, setActiveTab] = useState('overview');

   // State to manage user details for editing - Initialized with empty strings
   const [userDetails, setUserDetails] = useState({
     name: '', // Start with empty string
     phone: '', // Start with empty string
     dateOfBirth: '', // Start with empty string
     gender: '', // Start with empty string
     employmentStatus: '', // Added employmentStatus
   });

    // State to manage account & security settings (placeholders)
   const [securitySettings, setSecuritySettings] = useState({
     twoFactorEnabled: false, // Placeholder for 2FA state
     currentPassword: '', // Added state for current password
     newPassword: '', // Added state for new password
   });

    // State to manage communication settings
   const [communicationSettings, setCommunicationSettings] = useState({
     emailAnnouncements: true,
     emailStokvelUpdates: true,
     emailMarketplaceOffers: false,
     pushAnnouncements: true,
     pushStokvelUpdates: true,
     pushMarketplaceOffers: false,
     // Add more categories as needed
   });

    // State to manage privacy settings
   const [privacySettings, setPrivacySettings] = useState({
     dataForPersonalization: true,
     dataForAnalytics: true,
     dataForThirdParties: false, // Be cautious with defaults for data sharing
   });

<<<<<<< HEAD
  // Get current date for registration date display
  const currentRegistrationDate = moment().format('YYYY-MM-DD');

=======
<<<<<<< HEAD
  const [userEmail, setUserEmail] = useState<string>('');

  // Get current date for registration date display
  const currentRegistrationDate = moment().format('YYYY-MM-DD');

  // Add useEffect to fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await authAPI.getCurrentUser();
        setUserEmail(response.data.email);
        setUserDetails(prev => ({
          ...prev,
          name: response.data.name || '',
          // Add other fields as needed
        }));
      } catch (err) {
        console.error('Error fetching user data:', err);
        // Handle error appropriately
      }
    };

    fetchUserData();
  }, []);
=======
  // Get current date for registration date display
  const currentRegistrationDate = moment().format('YYYY-MM-DD');

>>>>>>> origin/master
>>>>>>> 03ccbce380626419915c5ff9484c34b37668a0ea

  // Handlers for card actions (placeholders)
  const handleViewDetails = () => {
    setActiveTab('your-details'); // Switch to 'My details' tab
  };

  const handleViewAccountSecurity = () => {
     setActiveTab('account-security');
  };

  const handleViewCommunication = () => {
     setActiveTab('communication');
  };

  const handleViewPrivacy = () => {
     setActiveTab('privacy');
  };

   // Handler for input changes
   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
     const { name, value } = e.target;
     setUserDetails(prevDetails => ({
       ...prevDetails,
       [name]: value
     }));
   };

    // Handler for input changes in Account & Security
    const handleSecurityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
       const { name, value } = e.target;
       setSecuritySettings(prevSettings => ({
          ...prevSettings,
          [name]: value,
       }));
    };

     // Handler for communication toggle changes
    const handleCommunicationToggle = (settingName: keyof typeof communicationSettings) => {
       setCommunicationSettings(prevSettings => ({
          ...prevSettings,
          [settingName]: !prevSettings[settingName],
       }));
       console.log(`${settingName} toggled. New value: ${!communicationSettings[settingName]}`);
       // In a real app, you would send this update to your backend
    };

    // Handler for privacy toggle changes
    const handlePrivacyToggle = (settingName: keyof typeof privacySettings) => {
       setPrivacySettings(prevSettings => ({
          ...prevSettings,
          [settingName]: !prevSettings[settingName],
       }));
       console.log(`${settingName} toggled. New value: ${!privacySettings[settingName]}`);
       // In a real app, you would send this update to your backend
    };

    // Placeholder for saving profile changes
   const handleSaveDetails = () => {
      console.log('Saving details:', userDetails);
      alert('Save details functionality not implemented yet.');
      // Implement saving userDetails to backend
   };

    // Placeholder handler for changing password
   const handleChangePassword = () => {
     console.log('Changing password. Current:', securitySettings.currentPassword, 'New:', securitySettings.newPassword);
     alert('Change password functionality not implemented yet.');
     // Implement password change logic (e.g., open a modal or make API call)
      // Clear password fields after attempt (optional)
      setSecuritySettings(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
   };

    // Placeholder handler for toggling 2FA
   const handleToggleTwoFactor = () => {
     setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }));
     alert(`Two-Factor Authentication ${securitySettings.twoFactorEnabled ? 'disabled' : 'enabled'}. (Functionality not implemented yet)`);
     // Implement 2FA setup/disable logic
   };

    // Placeholder handler for logging out a specific session
   const handleLogoutSession = (sessionId: number) => {
     console.log('Logging out session:', sessionId);
     alert(`Logging out session ${sessionId}. (Functionality not implemented yet)`);
     // Implement session logout logic
   };

    // Placeholder handler for requesting data download
   const handleDownloadData = () => {
      alert('Request data download functionality not implemented yet.');
      // Implement data export/download logic
   };

    // Placeholder handler for deleting account
   const handleDeleteAccount = () => {
     const confirmDelete = confirm('Are you sure you want to delete your account? This action cannot be undone.');
     if (confirmDelete) {
       alert('Account deletion functionality not implemented yet.');
       // Implement account deletion process
     }
   };


  // Render content based on the active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoCard
              icon={UserIcon}
              title="My details"
              description="Your profile information"
              onClick={handleViewDetails}
            />
            <InfoCard
              icon={Lock}
              title="Account & security"
              description="Password and active sessions"
              onClick={handleViewAccountSecurity}
            />
             <InfoCard
              icon={Mail} // Using Mail for Communication as in the image
              title="Communication"
              description="Email and SMS communication"
              onClick={handleViewCommunication}
            />
             <InfoCard
              icon={Shield} // Using Shield for Privacy as in the image
              title="Privacy"
              description="T&Cs and your data"
              onClick={handleViewPrivacy}
            />
          </div>
        );
      case 'your-details': // This case handles the content for 'My details'
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">My Details</h2>
            <div className="bg-white p-6 rounded-lg shadow">
                 {/* Full Name */}
                <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={userDetails.name} // Controlled component
                      onChange={handleInputChange}
                      placeholder="Enter your full name" // Added placeholder
                    />
                 </div>

                 {/* Email Address (Read-only) */}
                 <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm bg-gray-100 cursor-not-allowed"
<<<<<<< HEAD
                      value={mockUser.email} // Display mock email (read-only) - replace with actual user email
=======
<<<<<<< HEAD
                      value={userEmail} // Use the real email from state
=======
                      value={mockUser.email} // Display mock email (read-only) - replace with actual user email
>>>>>>> origin/master
>>>>>>> 03ccbce380626419915c5ff9484c34b37668a0ea
                      readOnly
                    />
                 </div>

                {/* Phone Number */}
                <div className="mb-4">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                      type="text"
                      id="phone"
                      name="phone"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={userDetails.phone} // Controlled component
                      onChange={handleInputChange}
                      placeholder="Enter your phone number" // Added placeholder
                    />
                 </div>

                {/* Date of Birth */}
                <div className="mb-4">
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    <input
                      type="date"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={userDetails.dateOfBirth} // Controlled component
                      onChange={handleInputChange}
                      // Placeholder for date input is often handled by browser UI
                    />
                 </div>

                 {/* Gender */}
                <div className="mb-4">
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
                    {/* Using a select dropdown for Gender is common */}
                    <select
                      id="gender"
                      name="gender"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={userDetails.gender} // Controlled component
                      onChange={handleInputChange}
                    >
                      <option value="" disabled hidden>Select Gender</option> {/* Placeholder option */}
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                 </div>

                 {/* Employment Status - Added Field */}
                 <div className="mb-4">
                    <label htmlFor="employmentStatus" className="block text-sm font-medium text-gray-700">Employment Status</label>
                    <select
                      id="employmentStatus"
                      name="employmentStatus" // Added name attribute
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={userDetails.employmentStatus} // Controlled component
                      onChange={handleInputChange}
                    >
                       <option value="" disabled hidden>Select Employment Status</option> {/* Placeholder */}
                       <option value="Full time">Full time</option>
                       <option value="Part time">Part time</option>
                       <option value="Work at home">Work at home</option>
                       <option value="Self-employed">Self-employed</option>
                       <option value="Unemployed">Unemployed</option>
                       <option value="Retired">Retired</option>
                       <option value="Student">Student</option>
                    </select>
                 </div>

                 {/* Registration Date (Read-only) */}
                 <div className="mb-4">
                    <label htmlFor="registrationDate" className="block text-sm font-medium text-gray-700">Registration Date</label>
                    <input
                      type="text"
                      id="registrationDate"
                      name="registrationDate"
                       className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm bg-gray-100 cursor-not-allowed"
                      value={currentRegistrationDate} // Display the current date
                      readOnly
                    />
                 </div>

                 {/* Save Changes Button - Updated Styling */}
                 <div className="mt-6">
                    <button
                      onClick={handleSaveDetails}
                      className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200 ease-in-out transform hover:scale-105 active:scale-95"
                    >
                      Save Changes
                    </button>
                 </div>

            </div>
          </div>
        );
       case 'account-security':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Account & Security</h2>
             <div className="bg-white p-6 rounded-lg shadow space-y-6"> {/* Added spacing between sections */}

                 {/* Change Password Section - Updated Structure */}
                 <div>
                   <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                       <Key className="w-6 h-6 text-gray-600" />
                       <span>Change Password</span>
                    </h3>
                   <p className="text-gray-600 mb-4">Update your password to keep your account secure.</p>

                    {/* Current Password Field */}
                    <div className="mb-4">
                       <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Current Password</label>
                       <input
                         type="password" // Use type="password" for masking
                         id="currentPassword"
                         name="currentPassword"
                         className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                         value={securitySettings.currentPassword} // Controlled component
                         onChange={handleSecurityInputChange} // Use security input handler
                         placeholder="Enter your current password" // Added placeholder
                       />
                    </div>

                     {/* New Password Field */}
                    <div className="mb-6"> {/* Increased bottom margin */}
                       <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
                       <input
                         type="password" // Use type="password" for masking
                         id="newPassword"
                         name="newPassword"
                         className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          value={securitySettings.newPassword} // Controlled component
                         onChange={handleSecurityInputChange} // Use security input handler
                         placeholder="Enter your new password" // Added placeholder
                       />
                    </div>

                   {/* Change Password Button */}
                   <button
                     onClick={handleChangePassword}
                     className="px-6 py-2 bg-blue-600 text-white rounded-md font-semibold shadow-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transform hover:scale-105 active:scale-95"
                   >
                     Change Password
                   </button>
                 </div>

                 {/* Two-Factor Authentication (2FA) Section */}
                 <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                       <ShieldCheck className="w-6 h-6 text-gray-600" />
                       <span>Two-Factor Authentication (2FA)</span>
                    </h3>
                    <p className="text-gray-600 mb-4">Add an extra layer of security to your account.</p>
                    <div className="flex items-center justify-between">
                       <span>Status: <span className="font-semibold">{securitySettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}</span></span>
                       <button
                         onClick={handleToggleTwoFactor}
                         className={`px-6 py-2 rounded-md font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transform hover:scale-105 active:scale-95 ${
                           securitySettings.twoFactorEnabled ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-600 text-white hover:bg-green-700'
                         }`}
                       >
                         {securitySettings.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                       </button>
                    </div>
                 </div>

                 {/* Active Sessions Section */}
                 <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                       <Monitor className="w-6 h-6 text-gray-600" />
                       <span>Active Sessions</span>
                    </h3>
                    <p className="text-gray-600 mb-4">Review where you are currently logged in.</p>
                    {mockSessions.length > 0 ? (
                       <ul className="divide-y divide-gray-200">
                          {mockSessions.map(session => (
                             <li key={session.id} className="py-3 flex justify-between items-center">
                                <div>
                                   <p className="font-medium text-gray-800">{session.device} {session.current && <span className="text-blue-600">(Current Session)</span>}</p>
                                   <p className="text-sm text-gray-600">{session.location} - {moment(session.time).format('YYYY-MM-DD HH:mm')}</p>
                                </div>
                                {!session.current && (
                                   <button
                                     onClick={() => handleLogoutSession(session.id)}
                                     className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transform hover:scale-105 active:scale-95"
                                   >
                                     Logout
                                   </button>
                                )}
                             </li>
                          ))}
                       </ul>
                    ) : (
                       <p className="text-gray-600">No other active sessions.</p>
                    )}
                 </div>

                 {/* Account Deletion Section */}
                 <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                       <LogoutIcon className="w-6 h-6 text-red-600" />
                       <span>Delete Account</span>
                    </h3>
                    <p className="text-gray-600 mb-4">Permanently close your account and remove your data.</p>
                    <button
                      onClick={handleDeleteAccount}
                      className="px-6 py-2 bg-red-600 text-white rounded-md font-semibold shadow-md hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transform hover:scale-105 active:scale-95"
                    >
                      Delete Account
                    </button>
                 </div>

             </div>
          </div>
        );
        case 'communication':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Communication</h2>
             <div className="bg-white p-6 rounded-lg shadow space-y-6"> {/* Added spacing between sections */}

                 {/* Email Notifications Section */}
                 <div>
                   <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                      <Mail className="w-6 h-6 text-gray-600" />
                       <span>Email Notifications</span>
                    </h3>
                   <p className="text-gray-600 mb-4">Manage the types of emails you receive.</p>

                    {/* Email Notification Toggles */}
                    <div className="space-y-3">
                       <div className="flex items-center justify-between">
                          <span className="text-gray-700">General Announcements</span>
                          <label className="relative inline-flex items-center cursor-pointer transition-transform duration-200 hover:scale-105 focus-within:scale-105">
                            <input type="checkbox" className="sr-only peer"
                                   checked={communicationSettings.emailAnnouncements}
                                   onChange={() => handleCommunicationToggle('emailAnnouncements')} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                       </div>

                       <div className="flex items-center justify-between">
                          <span className="text-gray-700">Stokvel Updates</span>
                           <label className="relative inline-flex items-center cursor-pointer transition-transform duration-200 hover:scale-105 focus-within:scale-105">
                            <input type="checkbox" className="sr-only peer"
                                   checked={communicationSettings.emailStokvelUpdates}
                                   onChange={() => handleCommunicationToggle('emailStokvelUpdates')} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                       </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">Marketplace Offers</span>
                           <label className="relative inline-flex items-center cursor-pointer transition-transform duration-200 hover:scale-105 focus-within:scale-105">
                            <input type="checkbox" className="sr-only peer"
                                   checked={communicationSettings.emailMarketplaceOffers}
                                   onChange={() => handleCommunicationToggle('emailMarketplaceOffers')} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                       </div>
                    </div>
                 </div>

                 {/* Push Notifications Section */}
                 <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                       <Bell className="w-6 h-6 text-gray-600" />
                       <span>Push Notifications</span>
                    </h3>
                    <p className="text-gray-600 mb-4">Manage the types of push notifications you receive.</p>

                     {/* Push Notification Toggles */}
                    <div className="space-y-3">
                       <div className="flex items-center justify-between">
                          <span className="text-gray-700">General Announcements</span>
                          <label className="relative inline-flex items-center cursor-pointer transition-transform duration-200 hover:scale-105 focus-within:scale-105">
                            <input type="checkbox" className="sr-only peer"
                                   checked={communicationSettings.pushAnnouncements}
                                   onChange={() => handleCommunicationToggle('pushAnnouncements')} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                       </div>

                       <div className="flex items-center justify-between">
                          <span className="text-gray-700">Stokvel Updates</span>
                           <label className="relative inline-flex items-center cursor-pointer transition-transform duration-200 hover:scale-105 focus-within:scale-105">
                            <input type="checkbox" className="sr-only peer"
                                   checked={communicationSettings.pushStokvelUpdates}
                                   onChange={() => handleCommunicationToggle('pushStokvelUpdates')} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                       </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">Marketplace Offers</span>
                           <label className="relative inline-flex items-center cursor-pointer transition-transform duration-200 hover:scale-105 focus-within:scale-105">
                            <input type="checkbox" className="sr-only peer"
                                   checked={communicationSettings.pushMarketplaceOffers}
                                   onChange={() => handleCommunicationToggle('pushMarketplaceOffers')} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                       </div>
                    </div>
                 </div>

             </div>
          </div>
        );
         case 'privacy':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Privacy</h2>
             <div className="bg-white p-6 rounded-lg shadow space-y-6"> {/* Added spacing between sections */}

                 {/* Data Usage Preferences Section */}
                 <div>
                   <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                      <Shield className="w-6 h-6 text-gray-600" /> {/* Using Shield icon */}
                       <span>Data Usage Preferences</span>
                    </h3>
                   <p className="text-gray-600 mb-4">Control how your data is used to personalize your experience and improve our services.</p>

                    {/* Data Usage Toggles */}
                    <div className="space-y-3">
                       <div className="flex items-center justify-between">
                          <span className="text-gray-700">Use data for personalization (e.g., tailored offers)</span>
                          <label className="relative inline-flex items-center cursor-pointer transition-transform duration-200 hover:scale-105 focus-within:scale-105">
                            <input type="checkbox" className="sr-only peer"
                                   checked={privacySettings.dataForPersonalization}
                                   onChange={() => handlePrivacyToggle('dataForPersonalization')} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                       </div>

                       <div className="flex items-center justify-between">
                          <span className="text-gray-700">Use data for analytics and service improvement (anonymized)</span>
                           <label className="relative inline-flex items-center cursor-pointer transition-transform duration-200 hover:scale-105 focus-within:scale-105">
                            <input type="checkbox" className="sr-only peer"
                                   checked={privacySettings.dataForAnalytics}
                                   onChange={() => handlePrivacyToggle('dataForAnalytics')} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                       </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">Allow data sharing with select third parties</span> {/* Be very clear about what this means */}
                           <label className="relative inline-flex items-center cursor-pointer transition-transform duration-200 hover:scale-105 focus-within:scale-105">
                            <input type="checkbox" className="sr-only peer"
                                   checked={privacySettings.dataForThirdParties}
                                   onChange={() => handlePrivacyToggle('dataForThirdParties')} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          </label>
                       </div>
                    </div>
                 </div>

                 {/* Data Access Section */}
                 <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                       <Download className="w-6 h-6 text-gray-600" /> {/* Using Download icon */}
                       <span>Access Your Data</span>
                    </h3>
                    <p className="text-gray-600 mb-4">Request a copy of the personal data we hold about you.</p>
                    <button
                      onClick={handleDownloadData}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md font-semibold shadow-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transform hover:scale-105 active:scale-95"
                    >
                      Download Data
                    </button>
                 </div>

                 {/* Legal Documents Section */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                       <FileText className="w-6 h-6 text-gray-600" /> {/* Using FileText icon */}
                       <span>Legal Information</span>
                    </h3>
                    <p className="text-gray-600 mb-4">Review our policies and terms of service.</p>
                    <div className="space-y-2">
                       <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline hover:text-blue-800 transition-colors duration-200 space-x-1">
                         <span>Privacy Policy</span>
                         <ExternalLink className="w-4 h-4" /> {/* Using ExternalLink icon */}
                       </a>
                        <a href="/terms-of-service" target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline hover:text-blue-800 transition-colors duration-200 space-x-1">
                         <span>Terms of Service</span>
                         <ExternalLink className="w-4 h-4" />
                       </a>
                    </div>
                 </div>

             </div>
          </div>
        );
      default:
        return null;
    }
  };

<<<<<<< HEAD
=======
<<<<<<< HEAD
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-blue-100 to-yellow-100 p-6">
      <div className="container mx-auto px-4 py-6">
=======
>>>>>>> 03ccbce380626419915c5ff9484c34b37668a0ea

  return (
    <DashboardLayout
      user={mockUser}
      sidebarNavItems={userNavItems} // Pass the imported userNavItems
      marketplaceNavItem={marketplaceNavItem} // Pass the imported marketplaceNavItem
    >
      {/* User Profile Page Content */}
      {/* The main content area below the tabs will keep the light blue background */}
      <div className="container mx-auto px-4 py-6 bg-blue-50">
<<<<<<< HEAD
=======
>>>>>>> origin/master
>>>>>>> 03ccbce380626419915c5ff9484c34b37668a0ea
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Account</h1>

        {/* Internal Horizontal Navigation - Dark background */}
        <div className="mb-6 bg-gray-800 rounded-t-lg">
          <nav className="flex space-x-0">
            {userProfileTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-6 text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gray-700 font-bold text-white rounded-tl-lg'
                    : 'bg-gray-800 font-normal text-white hover:bg-gray-700'
                }`}
                style={{ borderBottom: activeTab === tab.id ? '2px solid transparent' : 'none' }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div>
          {renderContent()}
        </div>
      </div>
<<<<<<< HEAD
    </DashboardLayout>
=======
<<<<<<< HEAD
    </div>
=======
    </DashboardLayout>
>>>>>>> origin/master
>>>>>>> 03ccbce380626419915c5ff9484c34b37668a0ea
  );
};

export default UserProfile; 