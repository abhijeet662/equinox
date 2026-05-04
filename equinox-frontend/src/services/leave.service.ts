import api from './api';

export const leaveService = {
  async list(params?: { page?: number; limit?: number; status?: string }) {
    const { data } = await api.get('/leave', { params });
    return data;
  },

  async create(payload: { type: string; startDate: string; endDate: string; reason?: string }) {
    const { data } = await api.post('/leave', payload);
    return data.data;
  },

  async review(id: string, status: 'APPROVED' | 'REJECTED', adminNote?: string) {
    const { data } = await api.patch(`/leave/${id}/review`, { status, adminNote });
    return data.data;
  },

  async cancel(id: string) {
    await api.patch(`/leave/${id}/cancel`);
  },
};
