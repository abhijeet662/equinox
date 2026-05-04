import api from './api';
import type { UserRole } from '../types';

// Backend returns UPPERCASE roles; frontend uses lowercase
function normalizeRole(role: string): UserRole {
  return role.toLowerCase() as UserRole;
}

function normalizeUser(user: Record<string, unknown>) {
  return {
    id: user.id as string,
    name: user.name as string,
    email: user.email as string,
    role: normalizeRole(user.role as string),
    avatar: (user.avatar as string) || '',
    company: user.company as string | undefined,
    phone: user.phone as string | undefined,
    status: user.status as string,
  };
}

export const authService = {
  async login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password });
    const { user, accessToken, refreshToken } = data.data;
    localStorage.setItem('equinox_access', accessToken);
    localStorage.setItem('equinox_refresh', refreshToken);
    return normalizeUser(user);
  },

  async register(payload: { email: string; password: string; name: string; role?: string; company?: string; phone?: string }) {
    const { data } = await api.post('/auth/register', payload);
    const { user, accessToken, refreshToken } = data.data;
    localStorage.setItem('equinox_access', accessToken);
    localStorage.setItem('equinox_refresh', refreshToken);
    return normalizeUser(user);
  },

  async me() {
    const { data } = await api.get('/auth/me');
    return normalizeUser(data.data);
  },

  async logout() {
    const refreshToken = localStorage.getItem('equinox_refresh');
    await api.post('/auth/logout', { refreshToken }).catch(() => {});
    localStorage.removeItem('equinox_access');
    localStorage.removeItem('equinox_refresh');
  },

  async loginOrCreate(profile: { email: string; password: string; name: string; role: string; company?: string }) {
    try {
      // Happy path: user already exists (seeded or previously created)
      return await this.login(profile.email, profile.password);
    } catch {
      // Login failed — try to create the account
      try {
        return await this.register(profile);
      } catch (regErr: unknown) {
        // 409 = email already in use but login failed (e.g. different password in DB)
        // Try logging in once more as a last resort
        const status = (regErr as { response?: { status?: number } })?.response?.status;
        if (status === 409) {
          return await this.login(profile.email, profile.password);
        }
        throw regErr;
      }
    }
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const { data } = await api.put('/auth/change-password', { currentPassword, newPassword });
    return data;
  },
};
