import api from './api';

export interface Asset {
  id: string;
  name: string;
  type: string;
  category: 'HARDWARE' | 'SOFTWARE';
  serialNo?: string;
  platform?: string;
  description?: string;
  status: 'AVAILABLE' | 'ASSIGNED' | 'MAINTENANCE' | 'REVOKED' | 'RETIRED' | 'LOST';
  assignedToId?: string;
  assignedTo?: { id: string; name: string; email: string; role: string } | null;
  assignedAt?: string;
  revokedAt?: string;
  notes?: string;
  createdById: string;
  createdBy?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface OffboardResult {
  revokedCount: number;
  revokedAt: string;
  revokedById: string;
  user: { id: string; name: string; email: string } | null;
  assets: Asset[];
}

export const assetsService = {
  async list(params?: { page?: number; limit?: number; status?: string; category?: string; assignedToId?: string }) {
    const { data } = await api.get('/assets', { params });
    return data;
  },

  async getById(id: string): Promise<Asset> {
    const { data } = await api.get(`/assets/${id}`);
    return data.data;
  },

  async create(payload: {
    name: string;
    type: string;
    category: 'HARDWARE' | 'SOFTWARE';
    serialNo?: string;
    platform?: string;
    description?: string;
    status?: string;
    assignedToId?: string;
    notes?: string;
  }): Promise<Asset> {
    const { data } = await api.post('/assets', payload);
    return data.data;
  },

  async update(id: string, payload: Partial<{
    name: string;
    type: string;
    category: string;
    serialNo: string;
    platform: string;
    description: string;
    status: string;
    assignedToId: string | null;
    notes: string;
  }>): Promise<Asset> {
    const { data } = await api.put(`/assets/${id}`, payload);
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/assets/${id}`);
  },

  async getUserAssets(userId: string): Promise<{ user: Asset['assignedTo']; assets: Asset[]; totalAssets: number }> {
    const { data } = await api.get(`/assets/user/${userId}`);
    return data.data;
  },

  async offboardUser(userId: string): Promise<OffboardResult> {
    const { data } = await api.post(`/assets/offboard/${userId}`);
    return data.data;
  },
};
