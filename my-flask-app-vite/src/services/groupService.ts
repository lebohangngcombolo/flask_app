import api from './api';  // Import the shared API instance

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

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const groupService = {
  createGroup: async (groupData: GroupData): Promise<{ group: Group; group_code: string }> => {
    const response = await api.post('/api/stokvel/register-group', groupData);
    return response.data;
  },

  getGroupByCode: async (groupCode: string): Promise<{ group: Group }> => {
    const response = await api.get(`/api/stokvel/group/${groupCode}`);
    return response.data;
  },

  joinGroup: async (groupCode: string): Promise<{ message: string; group: Group }> => {
    const response = await api.post('/api/stokvel/join-group', { group_code: groupCode });
    return response.data;
  },

  getUserGroups: async (): Promise<Group[]> => {
    const response = await api.get('/api/dashboard/stats');
    return response.data.activeGroups;
  }
};
