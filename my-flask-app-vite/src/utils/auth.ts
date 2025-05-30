import { authAPI } from '../services/api';

interface User {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  idNumber?: string;
  role?: string;
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
    console.log('Sending registration data:', userData);
    
    const response = await authAPI.register({
      full_name: userData.fullName,
      email: userData.email,
      password: userData.password,
      phone: userData.phoneNumber,
      confirm_password: userData.password
    });
    
    console.log('Registration response:', response.data);
    
    if (response.data && response.data.message === 'User registered successfully') {
      return { 
        success: true, 
        message: 'Account created successfully',
        user: response.data.user
      };
    }
    
    return {
      success: false,
      message: response.data?.error || 'Signup failed'
    };
  } catch (error: any) {
    console.error('Signup error details:', error.response?.data);
    return {
      success: false,
      message: error.response?.data?.error || 'Signup failed. Please try again.'
    };
  }
};

export const login = async (email: string, password: string) => {
  try {
    console.log('Login attempt started:', { email });
    
    const response = await authAPI.login(email, password);
    console.log('Login response:', response.data);
    
    if (response.data.token && response.data.user) {
      const userData = {
        ...response.data.user,
        role: response.data.user.role || 'member'
      };
      
      // Store auth data
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', response.data.token);
      
      // Use setTimeout to ensure state is updated before navigation
      setTimeout(() => {
        window.location.href = userData.role === 'admin' ? '/admin/dashboard' : '/dashboard';
      }, 100);
      
      return { 
        success: true, 
        user: userData
      };
    }
    
    return {
      success: false,
      message: 'Invalid response from server'
    };
  } catch (error: any) {
    console.error('Login error:', error);
    
    if (error.response?.status === 401) {
      return {
        success: false,
        message: 'Invalid email or password'
      };
    }
    
    return {
      success: false,
      message: error.response?.data?.error || 'Login failed. Please try again.'
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
  const token = localStorage.getItem('token');
  const user = getCurrentUser();
  return !!token && !!user;
};

export const getUserRole = () => {
  const user = getCurrentUser();
  return user?.role || 'member';
};
