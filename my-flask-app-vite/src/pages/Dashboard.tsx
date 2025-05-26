import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Layout from '../components/Layout';
import { getCurrentUser, logout } from '../utils/auth';
import api from '../services/api';

interface UserData {
  id: number;
  email: string;
  name: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('/auth/me');
        setUser(response.data);
      } catch (error: any) {
        setError(error.response?.data?.message || 'Failed to fetch user data');
        if (error.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            Welcome, {user?.name || 'User'} to i-STOKVEL
          </h1>
          <Button variant="secondary" onClick={handleLogout}>
            Logout
          </Button>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600">
            This is your dashboard. More features coming soon!
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard; 