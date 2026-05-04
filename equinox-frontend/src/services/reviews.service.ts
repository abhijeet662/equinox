import api from './api';

export type ReviewStatus = 'PENDING_MODERATION' | 'PUBLISHED' | 'REJECTED' | 'FLAGGED';

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  buyerId: string;
  providerId: string;
  contractId: string | null;
  status: ReviewStatus;
  isPublic: boolean;
  moderatorNote: string | null;
  publishedAt: string | null;
  createdAt: string;
  buyer: { id: string; name: string; email?: string; avatar: string | null };
  provider: { id: string; businessName: string; category: string };
}

export const reviewsService = {
  async listForProvider(providerId: string) {
    const { data } = await api.get(`/reviews/provider/${providerId}`);
    return data;
  },

  async listAll(params?: { page?: number; limit?: number; status?: ReviewStatus }) {
    const { data } = await api.get('/reviews', { params });
    return data;
  },

  async getModerationQueue(params?: { page?: number; limit?: number }) {
    const { data } = await api.get('/reviews/admin/queue', { params });
    return data;
  },

  async create(payload: { providerId: string; rating: number; comment?: string; contractId?: string }) {
    const { data } = await api.post('/reviews', payload);
    return data.data;
  },

  async approve(id: string) {
    const { data } = await api.patch(`/reviews/${id}/approve`, {});
    return data.data;
  },

  async reject(id: string, reason?: string) {
    const { data } = await api.patch(`/reviews/${id}/reject`, { reason });
    return data.data;
  },

  async flag(id: string, payload: { editedComment?: string; moderatorNote?: string }) {
    const { data } = await api.patch(`/reviews/${id}/flag`, payload);
    return data.data;
  },

  async remove(id: string) {
    await api.delete(`/reviews/${id}`);
  },
};
