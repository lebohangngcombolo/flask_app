import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '../hooks/useAuth';
import ProfileDropdown from './ProfileDropdown';
import { Menu, Bell } from 'lucide-react';

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="text-gray-500 dark:text-gray-400 focus:outline-none"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1"></div> {/* Spacer */}
          <div className="flex items-center gap-4">
            <button className="relative text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">
              <Bell className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </button>
            <ProfileDropdown user={user} />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <Outlet /> {/* Renders the current page */}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 