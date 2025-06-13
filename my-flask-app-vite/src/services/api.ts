import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
<<<<<<< HEAD
  baseURL: 'http://localhost:5001',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: false
});

// Request interceptor: Attach token if present
api.interceptors.request.use(
  (config) => {
    // Use 'access_token' to match what your backend returns on login
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Optional, for logging or error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Optionally log or handle errors here
=======
  // Remove any baseURL to use relative URLs with the Vite proxy
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Add request interceptor with better logging
api.interceptors.request.use((config) => {
  // Log the full URL being requested
  const fullUrl = config.url;
  console.log('Making API request:', {
    url: fullUrl,
    method: config.method,
    data: config.data,
    headers: config.headers
  });
  
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor with better error logging
api.interceptors.response.use(
  (response) => {
    console.log('API response received:', {
      url: response.config.url,
      status: response.status,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  (error) => {
    console.error('API error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    } else if (error.response?.status === 403) {
      console.error('Access denied:', error.response.data.error);
    }
>>>>>>> origin/master
    return Promise.reject(error);
  }
);

<<<<<<< HEAD
// Auth API calls
export const authAPI = {
  register: (userData: any) => api.post('/api/auth/register', userData),
  login: (email: string, password: string) => api.post('/api/auth/login', { email: email.trim(), password }),
  getCurrentUser: () => api.get('/api/users/me'),
  verifyEmail: (email: string, verificationCode: string) => 
    api.post('/api/verify-email', { email, verification_code: verificationCode }),
  resendVerificationCode: (email: string) => api.post('/api/resend-verification', { email }),
  verifyPhone: (phone: string, verificationCode: string) => 
    api.post('/api/auth/verify-phone', { phone, verification_code: verificationCode }),
  resendSmsVerificationCode: (phone: string) => api.post('/api/auth/resend-sms', { phone })
=======
// Auth API calls matching your Flask endpoints
export const authAPI = {
  register: (userData: any) => {
    console.log('API register request:', userData); // Debug log
    return api.post('/api/auth/register', userData);
  },
  
  login: (email: string, password: string) => {
    return api.post('/api/auth/login', {
      email: email.trim(),
      password: password
    });
  },
  
  getCurrentUser: () => api.get('/api/auth/current-user'),
  
  verifyEmail: (email: string, verificationCode: string) => {
    return api.post('/api/verify-email', {
      email: email,
      verification_code: verificationCode
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  },
  
  resendVerificationCode: (email: string) =>
    api.post('/api/resend-verification', { email: email }),
>>>>>>> origin/master
};

// User API calls
export const userAPI = {
<<<<<<< HEAD
  getProfile: () => api.get('/api/users/me'),
  updateProfile: (data: any) => api.put('/api/users/me', data),
  getUserStats: () => api.get('/api/dashboard/stats'),
  getAvailableGroups: () => api.get('/api/groups/available')
=======
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/me', data),
  getUserStats: () => api.get('/api/user/stats'),
  getAvailableGroups: () => api.get('/api/user/groups'),
>>>>>>> origin/master
};

// Stokvel API calls
export const stokvelAPI = {
<<<<<<< HEAD
  getStokvels: () => api.get('/api/groups/available'),
  createStokvel: (data: any) => api.post('/api/stokvel/register-group', data),
  getStokvelDetails: (id: string) => api.get(`/api/groups/${id}`),
  joinStokvel: (id: string) => api.post(`/api/stokvel/join-group`, { group_id: id })
=======
  getStokvels: () => api.get('/groups'),
  createStokvel: (data: any) => api.post('/groups', data),
  getStokvelDetails: (id: string) => api.get(`/groups/${id}`),
  joinStokvel: (id: string) => api.post(`/groups/${id}/join`),
>>>>>>> origin/master
};

// Admin API calls
export const adminAPI = {
<<<<<<< HEAD
  getStats: () => api.get('/api/dashboard/stats'),
  getGroups: () => api.get('/api/admin/groups'),
  createGroup: (data: any) => api.post('/api/admin/groups', data)
};

// Dashboard API calls
export const dashboardAPI = {
  getUsers: () => api.get('/api/dashboard/users'),
  manageGroups: () => api.get('/api/admin/groups'),
  getProfile: () => api.get('/api/users/me'),
  updateProfile: (data: any) => api.put('/api/users/me', data),
  getMyGroups: () => api.get('/api/groups/available'),
  getContributions: () => api.get('/api/dashboard/contributions')
};

// Polls and Meetings
const getPolls = async () => api.get('/api/polls');
const createPoll = async (pollData: any) => api.post('/api/polls', pollData);
const getMeetings = async () => api.get('/api/meetings');
const createMeeting = async (meetingData: any) => api.post('/api/meetings', meetingData);

// Withdrawals
const getWithdrawals = async () => api.get('/api/withdrawals');
const createWithdrawal = async (withdrawalData: any) => api.post('/api/withdrawals', withdrawalData);
const approveWithdrawal = async (withdrawalId: number) => api.post(`/api/withdrawals/${withdrawalId}/approve`);
const rejectWithdrawal = async (withdrawalId: number) => api.post(`/api/withdrawals/${withdrawalId}/reject`);

// Wallet API calls
export const walletAPI = {
  getWalletData: () => api.get('/api/wallet'),
  getTransactions: () => api.get('/api/wallet/transactions'),
  getLinkedAccounts: () => api.get('/api/wallet/linked-accounts'),
  addLinkedAccount: (accountData: any) => api.post('/api/wallet/linked-accounts', accountData),
  removeLinkedAccount: (accountId: number) => api.delete(`/api/wallet/linked-accounts/${accountId}`)
};

export const marketplaceAPI = {
  getOffers: () => api.get('/api/marketplace/offers'),
  getOfferDetails: (id: number) => api.get(`/api/marketplace/offers/${id}`),
};

export const newsAPI = {
  getNews: () => api.get('/api/news'),
  getNewsArticle: (id: number) => api.get(`/api/news/${id}`),
=======
  getStats: () => api.get('/api/admin/stats'),
  getGroups: () => api.get('/api/admin/groups'),
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
  getUsers: () => api.get('/api/dashboard/users'),
  manageGroups: () => api.get('/dashboard/groups'),
  
  // Common endpoints (accessible by both roles)
  getProfile: () => api.get('/dashboard/profile'),
  updateProfile: (data: any) => api.put('/dashboard/profile', data),
  
  // Member endpoints
  getMyGroups: () => api.get('/dashboard/my-groups'),
  getContributions: () => api.get('/dashboard/contributions'),
>>>>>>> origin/master
};

export default api; 