import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Important for CORS with credentials
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
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
  }) => api.post('/auth/register', userData),
  
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  
  getCurrentUser: () => api.get('/auth/me'),
};

// User API calls
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data: any) => api.put('/user/profile', data),
};

// Stokvel API calls
export const stokvelAPI = {
  getStokvels: () => api.get('/stokvels'),
  createStokvel: (data: any) => api.post('/stokvels', data),
  getStokvelDetails: (id: string) => api.get(`/stokvels/${id}`),
  joinStokvel: (id: string) => api.post(`/stokvels/${id}/join`),
};

export default api; 