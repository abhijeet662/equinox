import api from './api';

export const aiService = {
  async getInsights() {
    const { data } = await api.get('/ai/insights');
    return data.data;
  },

  async getDashboardSummary() {
    const { data } = await api.get('/ai/dashboard-summary');
    return data.data;
  },

  async chat(message: string) {
    const { data } = await api.post('/ai/copilot', { message });
    return data.data;
  },

  async getInvoiceSummary(invoiceId: string) {
    const { data } = await api.get(`/ai/invoice-summary/${invoiceId}`);
    return data.data;
  },
};
