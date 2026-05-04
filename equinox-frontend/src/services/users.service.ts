import api from './api';

export const usersService = {
  async create(payload: { name: string; email: string; password: string; role: string; company?: string; phone?: string }) {
    const { data } = await api.post('/users', payload);
    return data.data;
  },

  async list(params?: { page?: number; limit?: number; role?: string; status?: string; search?: string }) {
    const { data } = await api.get('/users', { params });
    return data;
  },

  async getById(id: string) {
    const { data } = await api.get(`/users/${id}`);
    return data.data;
  },

  async updateProfile(payload: Record<string, unknown>) {
    const { data } = await api.put('/users/profile', payload);
    return data.data;
  },

  async updateStatus(id: string, status: string) {
    const { data } = await api.patch(`/users/${id}/status`, { status });
    return data.data;
  },

  async updateRole(id: string, role: string) {
    const { data } = await api.patch(`/users/${id}/role`, { role });
    return data.data;
  },

  async resetPassword(id: string, newPassword: string) {
    const { data } = await api.post(`/users/${id}/reset-password`, { newPassword });
    return data;
  },

  async remove(id: string) {
    await api.delete(`/users/${id}`);
  },

  async getStats() {
    const { data } = await api.get('/users/stats');
    return data.data;
  },

  /** §4.4 — All employees enriched with per-priority task load and leave status */
  async getWorkforce() {
    const { data } = await api.get('/users/workforce');
    return data.data as WorkforceEmployee[];
  },

  /** §5.1 — Active employees/providers not on approved leave today */
  async getAvailableAssignees() {
    const { data } = await api.get('/users/available-assignees');
    return data.data as AvailableAssignee[];
  },
};

export interface WorkforceEmployee {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  status: string;
  company: string | null;
  createdAt: string;
  employeeProfile: { department: string | null; jobTitle: string | null; employeeId: string | null } | null;
  load: {
    P0: { active: number; cap: number; pct: number };
    P1: { active: number; cap: number; pct: number };
    P2: { active: number; cap: number; pct: number };
    P3: { active: number; cap: number; pct: number };
  };
  totalActive: number;
  maxCapacityPct: number;
  isAtCapacity: boolean;
  isOnLeaveToday: boolean;
}

export interface AvailableAssignee {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  company: string | null;
  employeeProfile: { department: string | null; jobTitle: string | null } | null;
}
