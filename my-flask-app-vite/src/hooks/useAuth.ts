import { useState, useEffect, useCallback } from 'react';
<<<<<<< HEAD
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout as authLogout, isAuthenticated } from '../utils/auth';
=======
import { getCurrentUser, isAuthenticated } from '../utils/auth';
>>>>>>> origin/master

interface User {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  // Add other user properties as needed
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
<<<<<<< HEAD
  const navigate = useNavigate();
=======
>>>>>>> origin/master

  const fetchUser = useCallback(async () => {
    try {
      if (isAuthenticated()) {
        const currentUser = getCurrentUser();
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = useCallback(() => {
<<<<<<< HEAD
    authLogout();
    navigate('/login');
  }, [navigate]);
=======
    // Clear any auth tokens from localStorage
    localStorage.removeItem('token');
    // Clear user state
    setUser(null);
  }, []);
>>>>>>> origin/master

  return {
    user,
    loading,
    isAuthenticated: !!user,
    fetchUser,
    logout
  };
}; 