import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout as authLogout, isAuthenticated, getCurrentUser } from '../utils/auth';
import { authAPI } from '../services/api';

interface User {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  is_verified?: boolean;
  // Add other user properties as needed
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUser = useCallback(async () => {
    try {
      // First check if we have a token
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Check if we have cached user data
      const cachedUser = getCurrentUser();
      if (cachedUser) {
        setUser(cachedUser);
        setLoading(false);
        return;
      }

      // If no cached user, try to fetch from backend
      if (isAuthenticated()) {
        try {
          const response = await authAPI.getCurrentUser();
          const user = response.data;
          const mappedUser = {
            ...user,
            profilePicture: user.profile_picture,
          };
          setUser(mappedUser);
          localStorage.setItem('user', JSON.stringify(mappedUser));
        } catch (error) {
          console.error('Error fetching user from API:', error);
          // If API call fails, but we have a valid token, use cached data
          const cachedUser = getCurrentUser();
          if (cachedUser) {
            setUser(cachedUser);
          } else {
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error in fetchUser:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = useCallback(() => {
    authLogout();
    navigate('/login');
  }, [navigate]);

  return {
    user,
    loading,
    // FIXED: Don't require verification for basic authentication
    isAuthenticated: !!user,
    fetchUser,
    logout
  };
}; 