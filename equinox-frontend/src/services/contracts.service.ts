import api from './api';

export const contractsService = {
  async list(params?: { page?: number; limit?: number; status?: string; type?: string }) {
    const { data } = await api.get('/contracts', { params });
    return data;
  },

  async getById(id: string) {
    const { data } = await api.get(`/contracts/${id}`);
    return data.data;
  },

  async create(payload: { title: string; providerId: string; type?: string; value?: number; currency?: string; startDate?: string; endDate?: string; description?: string; terms?: string }) {
    const { data } = await api.post('/contracts', payload);
    return data.data;
  },

  async update(id: string, payload: Record<string, unknown>) {
    const { data } = await api.put(`/contracts/${id}`, payload);
    return data.data;
  },

  async remove(id: string) {
    await api.delete(`/contracts/${id}`);
  },
};
