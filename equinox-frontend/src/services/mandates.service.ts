import api from './api';

export interface PaymentMandate {
  id: string;
  userId: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolder: string;
  maxAmount: number;
  frequency: string;
  nextDebitDate?: string;
  status: 'PENDING' | 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'FAILED';
  mandateRef?: string;
  user?: { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateMandatePayload {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolder: string;
  maxAmount: number;
  frequency?: 'MONTHLY' | 'WEEKLY' | 'QUARTERLY';
  nextDebitDate?: string;
}

export const mandatesService = {
  async getMyMandate(): Promise<PaymentMandate | null> {
    const { data } = await api.get('/mandates/my');
    return data.data;
  },

  async list(params?: { page?: number; limit?: number; status?: string }): Promise<{ data: PaymentMandate[]; meta?: unknown }> {
    const { data } = await api.get('/mandates', { params });
    return data;
  },

  async getById(id: string): Promise<PaymentMandate> {
    const { data } = await api.get(`/mandates/${id}`);
    return data.data;
  },

  async create(payload: CreateMandatePayload): Promise<PaymentMandate> {
    const { data } = await api.post('/mandates', payload);
    return data.data;
  },

  async updateStatus(id: string, status: PaymentMandate['status'], mandateRef?: string): Promise<PaymentMandate> {
    const { data } = await api.patch(`/mandates/${id}/status`, { status, mandateRef });
    return data.data;
  },

  async cancel(id: string): Promise<PaymentMandate> {
    const { data } = await api.patch(`/mandates/${id}/cancel`);
    return data.data;
  },
};
