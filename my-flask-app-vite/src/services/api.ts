import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Add request interceptor
api.interceptors.request.use((config) => {
  console.log('Making API request:', {
    url: config.url,
    method: config.method,
    data: config.data
  });
  
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('API response received:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Add this to handle network errors
    if (!error.response) {
      console.error('Network error:', error);
      return Promise.reject({
        response: {
          data: { error: 'Network error. Please check your connection.' }
        }
      });
    }
    
    return Promise.reject(error);
  }
);

// Auth API calls matching your Flask endpoints
export const authAPI = {
  register: (userData: {
    full_name: string;
    email: string;
    password: string;
    phone: string;
    confirm_password: string;
  }) => {
    console.log('API register request:', userData); // Debug log
    return api.post('/api/auth/register', userData);
  },
  
  login: (email: string, password: string) => {
    return api.post('/api/auth/login', { 
      email: email.trim(),
      password: password 
    });
  },
  
  getCurrentUser: () => api.get('/api/auth/me'),
};

// User API calls
export const userAPI = {
  getProfile: () => api.get('/api/auth/me'),
  updateProfile: (data: any) => api.put('/api/auth/me', data),
};

// Stokvel API calls
export const stokvelAPI = {
  getStokvels: () => api.get('/api/groups'),
  createStokvel: (data: any) => api.post('/api/groups', data),
  getStokvelDetails: (id: string) => api.get(`/api/groups/${id}`),
  joinStokvel: (id: string) => api.post(`/api/groups/${id}/join`),
};

// Admin API calls
export const adminAPI = {
  getStats: () => api.get('/api/admin/stats'),
  getGroups: () => api.get('/api/admin/groups'),
  createGroup: (data: any) => api.post('/api/admin/groups', data),
};

const getPolls = async () => {
  const response = await api.get('/api/polls');
  return response.data;
};

const createPoll = async (pollData: any) => {
  const response = await api.post('/api/polls', pollData);
  return response.data;
};

const getMeetings = async () => {
  const response = await api.get('/api/meetings');
  return response.data;
};

const createMeeting = async (meetingData: any) => {
  const response = await api.post('/api/meetings', meetingData);
  return response.data;
};

const getWithdrawals = async () => {
  const response = await api.get('/api/withdrawals');
  return response.data;
};

const createWithdrawal = async (withdrawalData: any) => {
  const response = await api.post('/api/withdrawals', withdrawalData);
  return response.data;
};

const approveWithdrawal = async (withdrawalId: number) => {
  const response = await api.post(`/api/withdrawals/${withdrawalId}/approve`);
  return response.data;
};

const rejectWithdrawal = async (withdrawalId: number) => {
  const response = await api.post(`/api/withdrawals/${withdrawalId}/reject`);
  return response.data;
};

export {
  getPolls,
  createPoll,
  getMeetings,
  createMeeting,
  getWithdrawals,
  createWithdrawal,
  approveWithdrawal,
  rejectWithdrawal
};

export const dashboardAPI = {
  getStats: () => api.get('/api/dashboard/stats'),
  getAvailableGroups: () => api.get('/api/groups/available'),
};

export default api; 