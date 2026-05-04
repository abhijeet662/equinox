import api from './api';

export const complaintsService = {
  async list(params?: { page?: number; limit?: number; status?: string; priority?: string }) {
    const { data } = await api.get('/complaints', { params });
    return data;
  },

  async getById(id: string) {
    const { data } = await api.get(`/complaints/${id}`);
    return data.data;
  },

  async create(payload: { title: string; description: string; againstId: string; contractId?: string; priority?: string }) {
    const { data } = await api.post('/complaints', payload);
    return data.data;
  },

  async updateStatus(id: string, status: string, resolution?: string) {
    const { data } = await api.patch(`/complaints/${id}/status`, { status, resolution });
    return data.data;
  },

  async escalate(id: string) {
    const { data } = await api.patch(`/complaints/${id}/escalate`, {});
    return data.data;
  },
};
