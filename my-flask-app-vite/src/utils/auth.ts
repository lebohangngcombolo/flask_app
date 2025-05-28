import { authAPI } from '../services/api';

interface User {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  idNumber?: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}

export const signup = async (userData: {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
}) => {
  try {
    const response = await authAPI.register({
      full_name: userData.fullName,
      email: userData.email,
      password: userData.password,
      phone: userData.phoneNumber,
      confirm_password: userData.password
    });
    return { success: true, message: 'Account created successfully' };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Signup failed',
    };
  }
};

export const login = async (email: string, password: string) => {
  try {
    const response = await authAPI.login(email, password);
    const { token } = response.data;
    
    // Store token
    localStorage.setItem('token', token);
    
    // Get user data
    const userResponse = await authAPI.getCurrentUser();
    const user = userResponse.data;
    localStorage.setItem('user', JSON.stringify(user));
    
    return { success: true, user };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Login failed',
    };
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};
