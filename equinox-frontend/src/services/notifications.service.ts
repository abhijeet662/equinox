import api from './api';

export const notificationsService = {
  async list(params?: { page?: number; limit?: number; unreadOnly?: boolean }) {
    const { data } = await api.get('/notifications', { params });
    // Controller returns { data: { notifications: [], unreadCount: N }, pagination }
    // Normalize to standard { data: [], pagination } shape for useApi consumers
    if (data?.data?.notifications !== undefined) {
      return { ...data, data: data.data.notifications, unreadCount: data.data.unreadCount };
    }
    return data;
  },

  async markRead(id: string) {
    await api.put(`/notifications/${id}/read`);
  },

  async markAllRead() {
    await api.put('/notifications/read-all');
  },

  async remove(id: string) {
    await api.delete(`/notifications/${id}`);
  },
};
