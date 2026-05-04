import api from './api';

export const leadsService = {
  /**
   * Submit a public lead inquiry to a provider — no auth required.
   * Backed by POST /api/leads which persists an in-app notification
   * to the provider and sends mock emails to both parties.
   */
  async create(payload: {
    name: string;
    email: string;
    company?: string;
    message: string;
    budget?: string;
    providerId: string;
  }): Promise<{ providerName: string }> {
    const { data } = await api.post('/leads', payload);
    return data.data as { providerName: string };
  },
};
