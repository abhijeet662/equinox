import api from './api';

export const tasksService = {
  async list(params?: { page?: number; limit?: number; status?: string; priority?: string; contractId?: string }) {
    const { data } = await api.get('/tasks', { params });
    return data;
  },

  async summary() {
    const { data } = await api.get('/tasks/summary');
    return data.data;
  },

  async getById(id: string) {
    const { data } = await api.get(`/tasks/${id}`);
    return data.data;
  },

  async create(payload: { title: string; description?: string; priority?: string; assignedToId?: string; contractId?: string; dueDate?: string; tags?: string[]; slaHours?: number }) {
    const { data } = await api.post('/tasks', payload);
    return data.data;
  },

  async update(id: string, payload: Record<string, unknown>) {
    const { data } = await api.put(`/tasks/${id}`, payload);
    return data.data;
  },

  async remove(id: string) {
    await api.delete(`/tasks/${id}`);
  },

  /** §5.2 — Employee performance scorecard with SLA adherence per task */
  async getScorecard(months = 3) {
    const { data } = await api.get('/tasks/scorecard', { params: { months } });
    return data.data;
  },

  /** Blueprint §4.1.1 — Returns which task tiers the calling provider is certified for */
  async certEligibility(): Promise<{ canDoP0: boolean; canDoP1: boolean; certifiedTiers: string[] }> {
    const { data } = await api.get('/tasks/cert-eligibility');
    return data.data;
  },

  /** Module 3 — Check if an employee is on leave today + flag any active P0/P1 tasks */
  async capacityCheck(userId: string): Promise<{
    onLeave: boolean;
    leave?: { id: string; type: string; startDate: string; endDate: string };
    flaggedTasks: { id: string; title: string; priority: string; status: string }[];
  }> {
    const { data } = await api.get('/tasks/capacity-check', { params: { userId } });
    return data.data;
  },
};
