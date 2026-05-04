import api from './api';

export type InquiryType = 'provider' | 'partnership' | 'billing' | 'technical' | 'general';

export const contactsService = {
  async submit(payload: {
    name: string;
    email: string;
    brandName?: string;
    message: string;
    inquiryType?: InquiryType;
  }): Promise<void> {
    await api.post('/contacts', payload);
  },
};
