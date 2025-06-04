import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5001/api',
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

// Add response interceptor for better error handling
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
      // Handle unauthorized access
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // Insufficient permissions
      console.error('Access denied:', error.response.data.error);
      // You might want to show a notification or redirect to a "not authorized" page
    }
    return Promise.reject(error);
  }
);

// Auth API calls matching your Flask endpoints
export const authAPI = {
  register: (userData: any) => {
    console.log('API register request:', userData); // Debug log
    return api.post('/auth/register', userData);
  },
  
  login: (email: string, password: string) => {
    return api.post('/auth/login', { 
      email: email.trim(),
      password: password 
    });
  },
  
  getCurrentUser: () => api.get('/auth/me'),
  
  verifyEmail: (email: string, verificationCode: string) =>
    api.post('/api/verify-email', {
      email: email,
      verification_code: verificationCode
    }),
  
  resendVerificationCode: (email: string) =>
    api.post('/api/resend-verification', { email: email }),
};

// User API calls
export const userAPI = {
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/me', data),
};

// Stokvel API calls
export const stokvelAPI = {
  getStokvels: () => api.get('/groups'),
  createStokvel: (data: any) => api.post('/groups', data),
  getStokvelDetails: (id: string) => api.get(`/groups/${id}`),
  joinStokvel: (id: string) => api.post(`/groups/${id}/join`),
};

// Admin API calls
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getGroups: () => api.get('/admin/groups'),
  createGroup: (data: any) => api.post('/admin/groups', data),
};

const getPolls = async () => {
  const response = await api.get('/polls');
  return response.data;
};

const createPoll = async (pollData: any) => {
  const response = await api.post('/polls', pollData);
  return response.data;
};

const getMeetings = async () => {
  const response = await api.get('/meetings');
  return response.data;
};

const createMeeting = async (meetingData: any) => {
  const response = await api.post('/meetings', meetingData);
  return response.data;
};

const getWithdrawals = async () => {
  const response = await api.get('/withdrawals');
  return response.data;
};

const createWithdrawal = async (withdrawalData: any) => {
  const response = await api.post('/withdrawals', withdrawalData);
  return response.data;
};

const approveWithdrawal = async (withdrawalId: number) => {
  const response = await api.post(`/withdrawals/${withdrawalId}/approve`);
  return response.data;
};

const rejectWithdrawal = async (withdrawalId: number) => {
  const response = await api.post(`/withdrawals/${withdrawalId}/reject`);
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
  // Admin endpoints
  getUsers: () => api.get('/dashboard/users'),
  manageGroups: () => api.get('/dashboard/groups'),
  
  // Common endpoints (accessible by both roles)
  getProfile: () => api.get('/dashboard/profile'),
  updateProfile: (data: any) => api.put('/dashboard/profile', data),
  
  // Member endpoints
  getMyGroups: () => api.get('/dashboard/my-groups'),
  getContributions: () => api.get('/dashboard/contributions'),
};

export default api; 