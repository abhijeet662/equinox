import api from './api';

export const walletService = {
  async getMyWallet() {
    const { data } = await api.get('/wallet/me');
    return data.data;
  },

  async getTransactions(params?: { page?: number; limit?: number; type?: string }) {
    const { data } = await api.get('/wallet/me/transactions', { params });
    return data;
  },

  async topUp(amount: number, reference?: string) {
    const { data } = await api.post('/wallet/me/topup', { amount, reference });
    return data.data;
  },

  async withdraw(amount: number, reference?: string) {
    const { data } = await api.post('/wallet/me/withdraw', { amount, reference });
    return data.data;
  },

  async adminList() {
    const { data } = await api.get('/wallet');
    return data;
  },
};
