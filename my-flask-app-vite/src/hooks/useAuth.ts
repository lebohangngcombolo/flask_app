import { useState, useEffect, useCallback } from 'react';
import { getCurrentUser, isAuthenticated } from '../utils/auth';

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
    // Clear any auth tokens from localStorage
    localStorage.removeItem('token');
    // Clear user state
    setUser(null);
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    fetchUser,
    logout
  };
}; 