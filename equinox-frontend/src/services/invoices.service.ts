import api from './api';

export const invoicesService = {
  async list(params?: { page?: number; limit?: number; status?: string }) {
    const { data } = await api.get('/invoices', { params });
    return data;
  },

  async getById(id: string) {
    const { data } = await api.get(`/invoices/${id}`);
    return data.data;
  },

  async create(payload: { buyerId: string; contractId?: string; dueDate?: string; currency?: string; notes?: string; items: { description: string; quantity: number; unitPrice: number }[] }) {
    const { data } = await api.post('/invoices', payload);
    return data.data;
  },

  async updateStatus(id: string, status: string) {
    const { data } = await api.patch(`/invoices/${id}/status`, { status });
    return data.data;
  },

  async pay(id: string) {
    const { data } = await api.post(`/invoices/${id}/pay`);
    return data;
  },
};
