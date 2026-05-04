import api from './api';

export interface Meeting {
  id: string;
  title: string;
  type: string;
  status: string;
  scheduledAt: string;
  duration: number;
  location?: string;
  agenda?: string;
  mom?: string;
  momGeneratedAt?: string;
  contractId?: string;
  organizerId: string;
  organizer?: { id: string; name: string; avatar?: string };
  attendees?: { id: string; userId: string; attended: boolean; user: { id: string; name: string; avatar?: string } }[];
  actionItems?: MeetingActionItem[];
  contract?: { id: string; title: string };
  createdAt: string;
  updatedAt: string;
}

export interface MeetingActionItem {
  id: string;
  meetingId: string;
  description: string;
  assigneeId?: string;
  dueDate?: string;
  done: boolean;
  createdAt: string;
}

export interface CreateMeetingPayload {
  title: string;
  type?: string;
  scheduledAt: string;
  duration?: number;
  location?: string;
  agenda?: string;
  contractId?: string;
  attendeeIds?: string[];
}

export const meetingsService = {
  async list(params?: {
    page?: number;
    limit?: number;
    status?: string;
    contractId?: string;
  }): Promise<{ data: Meeting[]; meta?: unknown }> {
    const { data } = await api.get('/meetings', { params });
    return data;
  },

  async getById(id: string): Promise<Meeting> {
    const { data } = await api.get(`/meetings/${id}`);
    return data.data;
  },

  async create(payload: CreateMeetingPayload): Promise<Meeting> {
    const { data } = await api.post('/meetings', payload);
    return data.data;
  },

  async update(id: string, payload: Partial<CreateMeetingPayload> & { status?: string; mom?: string }): Promise<Meeting> {
    const { data } = await api.put(`/meetings/${id}`, payload);
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/meetings/${id}`);
  },

  async generateMom(id: string): Promise<{ mom: string; momGeneratedAt: string; actionItems: MeetingActionItem[]; aiPowered: boolean }> {
    const { data } = await api.post(`/meetings/${id}/mom`);
    return data.data;
  },

  async markAttendance(meetingId: string, userId: string, attended: boolean): Promise<void> {
    await api.patch(`/meetings/${meetingId}/attendance`, { userId, attended });
  },

  async addActionItem(meetingId: string, payload: { description: string; assigneeId?: string; dueDate?: string }): Promise<MeetingActionItem> {
    const { data } = await api.post(`/meetings/${meetingId}/action-items`, payload);
    return data.data;
  },

  async toggleActionItem(itemId: string): Promise<MeetingActionItem> {
    const { data } = await api.patch(`/meetings/action-items/${itemId}/toggle`);
    return data.data;
  },
};
