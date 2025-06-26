import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
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

// Response interceptor: Handle verification errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // SECURITY FIX: Handle verification errors
    if (error.response?.status === 403 && 
        error.response?.data?.error?.includes('verify your email')) {
      // Clear authentication data and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (userData: any) => api.post('/api/auth/register', userData),
  login: (email: string, password: string) => api.post('/api/auth/login', { email: email.trim(), password }),
  getCurrentUser: () => api.get('/api/user/profile'),
  verifyEmail: (email: string, verificationCode: string) => 
    api.post('/api/verify-email', { email, verification_code: verificationCode }),
  resendVerificationCode: (email: string) => api.post('/api/resend-verification', { email }),
  verifyPhone: (phone: string, verificationCode: string) => 
    api.post('/api/auth/verify', { phone, otp_code: verificationCode }),
  resendSmsVerificationCode: (phone: string) => api.post('/api/auth/resend-sms', { phone })
};

// User API calls
export const userAPI = {
  getProfile: () => api.get('/api/user/profile'),
  updateProfile: (data: any) => api.put('/api/user/profile', data),
  getUserStats: () => api.get('/api/dashboard/stats'),
  getAvailableGroups: () => api.get('/api/groups/available')
};

// Communication & Privacy
export const communicationAPI = {
  getPreferences: () => api.get('/api/user/communication'),
  updatePreferences: (data: any) => api.put('/api/user/communication', data),
};

export const privacyAPI = {
  getSettings: () => api.get('/api/user/privacy'),
  updateSettings: (data: any) => api.put('/api/user/privacy', data),
};

// Security
export const securityAPI = {
  changePassword: (data: any) => api.put('/api/user/security/password', data),
  toggle2FA: () => api.post('/api/user/security/2fa'),
  deleteAccount: () => api.delete('/api/user/account'),
  start2FA: (data: { method: 'email' | 'sms' }) => api.post('/api/user/security/2fa/start', data),
  verify2FA: (data: { otp_code: string }) => api.post('/api/user/security/2fa/verify', data),
  disable2FA: (data: { password: string }) => api.post('/api/user/security/2fa/disable', data),
};

// Stokvel API calls
export const stokvelAPI = {
  getStokvels: () => api.get('/api/groups/available'),
  createStokvel: (data: any) => api.post('/api/stokvel/register-group', data),
  getStokvelDetails: (id: string) => api.get(`/api/groups/${id}`),
  joinStokvel: (id: string) => api.post(`/api/stokvel/join-group`, { group_id: id })
};

// Admin API calls
export const adminAPI = {
  getStats: () => api.get('/api/dashboard/stats'),
  getGroups: () => api.get('/api/admin/groups'),
  createGroup: (data: any) => api.post('/api/admin/groups', data),
  updateGroup: (id: number, data: any) => api.put(`/api/admin/groups/${id}`, data),
  deleteGroup: (id: number) => api.delete(`/api/admin/groups/${id}`),
  getJoinRequests: () => api.get('/api/admin/join-requests'),
  approveJoinRequest: (id: number) => api.post(`/api/admin/join-requests/${id}/approve`),
  deleteJoinRequests: (ids: number[]) => api.post('/api/admin/join-requests/bulk-delete', { ids }),
  rejectJoinRequest: (id: number, data: { reason: string }) => api.post(`/api/admin/join-requests/${id}/reject`, data),
};

// Dashboard API calls
export const dashboardAPI = {
  getUsers: () => api.get('/api/dashboard/users'),
  manageGroups: () => api.get('/api/admin/groups'),
  getProfile: () => api.get('/api/user/profile'),
  updateProfile: (data: any) => api.put('/api/user/profile', data),
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
};

export default api; 