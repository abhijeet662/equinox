import api from './api';

export const kpiService = {
  async list(params?: { page?: number; limit?: number; period?: string }) {
    const { data } = await api.get('/kpi', { params });
    return data;
  },

  async teamDashboard(period?: string) {
    const { data } = await api.get('/kpi/team', { params: { period } });
    return data.data;
  },

  async create(payload: { metric: string; value: number; target?: number; unit?: string; period: string; userId?: string }) {
    const { data } = await api.post('/kpi', payload);
    return data.data;
  },

  async update(id: string, payload: Record<string, unknown>) {
    const { data } = await api.put(`/kpi/${id}`, payload);
    return data.data;
  },
};
