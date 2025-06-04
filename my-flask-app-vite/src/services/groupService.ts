import axios from 'axios';

export interface GroupData {
  name: string;
  description: string;
  contribution_amount: number;
  frequency: string;
  max_members: number;
}

export interface Group {
  id: number;
  name: string;
  description: string;
  contribution_amount: number;
  frequency: string;
  max_members: number;
  member_count: number;
  group_code: string;
  admin_id: number;
  created_at: string;
}

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const groupService = {
  createGroup: async (groupData: GroupData): Promise<{ group: Group; group_code: string }> => {
    const response = await apiClient.post('/stokvel/register-group', groupData);
    return response.data;
  },

  getGroupByCode: async (groupCode: string): Promise<{ group: Group }> => {
    const response = await apiClient.get(`/stokvel/group/${groupCode}`);
    return response.data;
  },

  joinGroup: async (groupCode: string): Promise<{ message: string; group: Group }> => {
    const response = await apiClient.post('/stokvel/join-group', { group_code: groupCode });
    return response.data;
  },

  getUserGroups: async (): Promise<Group[]> => {
    const response = await apiClient.get('/dashboard/stats');
    return response.data.activeGroups;
  }
};
