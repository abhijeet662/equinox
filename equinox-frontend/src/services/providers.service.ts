import api from './api';

export const providersService = {
  async list(params?: { page?: number; limit?: number; category?: string; search?: string; minRating?: number }) {
    const { data } = await api.get('/providers', { params });
    return data;
  },

  async getById(id: string) {
    const { data } = await api.get(`/providers/${id}`);
    return data.data;
  },

  async getMyProfile() {
    const { data } = await api.get('/providers/me/profile');
    return data.data;
  },

  async updateMyProfile(payload: Record<string, unknown>) {
    const { data } = await api.put('/providers/me/profile', payload);
    return data.data;
  },

  async getMyStats() {
    const { data } = await api.get('/providers/me/stats');
    return data.data;
  },

  async listCategories(): Promise<{ name: string; count: number }[]> {
    const { data } = await api.get('/providers/categories');
    // Backend returns [{ category: "...", _count: { category: N } }]
    const raw = data.data as { category: string; _count: { category: number } }[];
    return raw.filter(c => c.category).map(c => ({ name: c.category, count: c._count?.category || 0 }));
  },

  async verify(id: string) {
    const { data } = await api.patch(`/providers/${id}/verify`, {});
    return data.data;
  },

  async feature(id: string) {
    const { data } = await api.patch(`/providers/${id}/feature`, {});
    return data.data;
  },

  async suspend(id: string) {
    const { data } = await api.patch(`/providers/${id}/suspend`, {});
    return data.data;
  },

  async listAll(params?: { page?: number; limit?: number; search?: string; category?: string }) {
    const { data } = await api.get('/providers/admin/all', { params });
    return data;
  },

  async getAdminDetail(id: string) {
    const { data } = await api.get(`/providers/${id}/admin-detail`);
    return data.data as ProviderAdminDetail;
  },

  async reactivate(userId: string) {
    const { data } = await api.patch(`/users/${userId}/status`, { status: 'ACTIVE' });
    return data.data;
  },

  async getPending(): Promise<PendingProvider[]> {
    const { data } = await api.get('/providers/admin/pending');
    return data.data as PendingProvider[];
  },

  async approve(id: string) {
    const { data } = await api.post(`/providers/${id}/approve`, {});
    return data.data;
  },

  async reject(id: string, reason: string) {
    const { data } = await api.post(`/providers/${id}/reject`, { reason });
    return data.data;
  },

  async applyForVerification(documentUrls: string[]) {
    const { data } = await api.post('/providers/me/apply-verification', { documentUrls });
    return data.data;
  },

  async getMyFeaturedStatus(): Promise<FeaturedStatus> {
    const { data } = await api.get('/providers/me/featured-status');
    return data.data as FeaturedStatus;
  },

  async setSubscription(id: string, subscriptionActive?: boolean) {
    const { data } = await api.patch(`/providers/${id}/subscription`, { subscriptionActive });
    return data.data;
  },
};

// ─── Featured status types ─────────────────────────────────────────────────────

export interface FeaturedStatus {
  isFeatured: boolean;
  subscriptionActive: boolean;
  joinedDate: string;
  effectiveFeatured: boolean;
  daysLeft: number;
  freePeriodExpired: boolean;
}

// ─── Admin detail types ────────────────────────────────────────────────────────

export interface ProviderAdminDetail {
  profile: {
    id: string; userId: string; businessName: string; description: string | null;
    category: string; services: string[]; location: string | null; address: string | null;
    website: string | null; logoInitials: string | null; rating: number; reviewCount: number;
    completedJobs: number; verified: boolean; featured: boolean;
    isFeatured: boolean; subscriptionActive: boolean; joinedDate: string;
    effectiveFeatured: boolean; featuredDaysLeft: number;
    createdAt: string;
    user: {
      id: string; name: string; email: string; avatar: string | null; phone: string | null;
      company: string | null; status: string; createdAt: string;
      walletAccount: {
        balance: number; currency: string;
        transactions: WalletTx[];
      } | null;
    };
  };
  slaSuccessRate: number | null;
  taskLoad: Record<'P0'|'P1'|'P2'|'P3', { active: number; cap: number }>;
  tasks: ProviderTask[];
  contracts: ProviderContract[];
  invoices: ProviderInvoice[];
  reviews: ProviderReview[];
  lmsEnrollments: LmsEnrollment[];
  financials: { totalRevenue: number; pendingRevenue: number };
}

export interface WalletTx {
  id: string; type: string; amount: number; description: string | null;
  reference: string | null; status: string; createdAt: string;
}
export interface ProviderTask {
  id: string; title: string; priority: string; status: string;
  dueDate: string | null; completedAt: string | null; createdAt: string;
  contract: { title: string; buyer: { name: string; company: string | null } } | null;
}
export interface ProviderContract {
  id: string; title: string; status: string; type: string; value: number | null;
  currency: string; startDate: string | null; endDate: string | null; createdAt: string;
  buyer: { id: string; name: string; company: string | null; email: string; avatar: string | null };
}
export interface ProviderInvoice {
  id: string; invoiceNo: string; status: string; subtotal: number; tax: number;
  total: number; currency: string; dueDate: string | null; paidAt: string | null; createdAt: string;
  buyer: { name: string; company: string | null };
}
export interface ProviderReview {
  id: string; rating: number; comment: string | null; contractId: string | null; createdAt: string;
  buyer: { name: string; avatar: string | null };
}
export interface LmsEnrollment {
  id: string; status: string; progress: number; completedAt: string | null; enrolledAt: string;
  course: { title: string; category: string; level: string; duration: number | null };
}

export interface PendingProvider {
  id: string;
  userId: string;
  businessName: string;
  description: string | null;
  category: string;
  services: string[];
  location: string | null;
  website: string | null;
  documentUrls: string[];
  isVerified: boolean;
  verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejectionReason: string | null;
  createdAt: string;
  user: {
    id: string; name: string; email: string;
    phone: string | null; company: string | null;
    status: string; createdAt: string;
  };
}
