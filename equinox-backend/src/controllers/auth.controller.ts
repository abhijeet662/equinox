import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../prisma/client';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/response';
import type { AuthRequest } from '../types';
import type { UserRole } from '@prisma/client';

// ─── REGISTER ─────────────────────────────────────────────────────────────────

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, name, role, company, phone } = req.body as {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    company?: string;
    phone?: string;
  };

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      sendError(res, 'Email already registered', 409);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'BUYER',
        company,
        phone,
        avatar: initials,
      },
    });

    // Auto-create wallet for buyers and providers
    if (user.role === 'BUYER' || user.role === 'PROVIDER') {
      await prisma.walletAccount.create({ data: { userId: user.id, balance: 0 } });
    }

    // Auto-create provider profile
    if (user.role === 'PROVIDER') {
      await prisma.providerProfile.create({
        data: {
          userId: user.id,
          businessName: company || name,
          category: 'General',
          services: [],
          logoInitials: initials,
        },
      });
    }

    // Auto-create employee profile
    if (user.role === 'EMPLOYEE') {
      await prisma.employeeProfile.create({ data: { userId: user.id } });
    }

    const tokenPayload = { id: user.id, email: user.email, role: user.role, name: user.name };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    // Persist refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const { password: _, ...safeUser } = user;
    sendSuccess(res, { user: safeUser, accessToken, refreshToken }, 'Registered successfully', 201);
  } catch (err) {
    console.error('Register error:', err);
    sendError(res, 'Registration failed', 500);
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }

    if (user.status !== 'ACTIVE') {
      sendError(res, 'Account is not active', 403);
      return;
    }

    const tokenPayload = { id: user.id, email: user.email, role: user.role, name: user.name };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const { password: _, ...safeUser } = user;
    sendSuccess(res, { user: safeUser, accessToken, refreshToken }, 'Login successful');
  } catch (err) {
    console.error('Login error:', err);
    sendError(res, 'Login failed', 500);
  }
};

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body as { refreshToken: string };

  if (!refreshToken) {
    sendError(res, 'Refresh token required', 400);
    return;
  }

  try {
    const payload = verifyRefreshToken(refreshToken);

    // Check it's in DB and not expired
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
      sendError(res, 'Refresh token invalid or expired', 401);
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || user.status !== 'ACTIVE') {
      sendError(res, 'User not found or inactive', 401);
      return;
    }

    // Rotate: delete old, issue new tokens
    await prisma.refreshToken.delete({ where: { token: refreshToken } });

    const tokenPayload = { id: user.id, email: user.email, role: user.role, name: user.name };
    const newAccessToken = signAccessToken(tokenPayload);
    const newRefreshToken = signRefreshToken(tokenPayload);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    sendSuccess(res, { accessToken: newAccessToken, refreshToken: newRefreshToken }, 'Token refreshed');
  } catch {
    sendError(res, 'Invalid refresh token', 401);
  }
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────────

export const logout = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body as { refreshToken?: string };

  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } }).catch(() => {});
  }

  sendSuccess(res, null, 'Logged out');
};

// ─── ME ───────────────────────────────────────────────────────────────────────

export const me = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, role: true,
        status: true, avatar: true, phone: true, company: true,
        timezone: true, language: true, createdAt: true,
        providerProfile: true,
        employeeProfile: { select: { id: true, department: true, jobTitle: true } },
        walletAccount: { select: { id: true, balance: true, currency: true } },
      },
    });

    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    sendSuccess(res, user);
  } catch (err) {
    sendError(res, 'Failed to fetch profile', 500);
  }
};

// ─── CHANGE PASSWORD ──────────────────────────────────────────────────────────

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
  const userId = req.user!.id;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      sendError(res, 'Current password is incorrect', 400);
      return;
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

    // Invalidate all refresh tokens
    await prisma.refreshToken.deleteMany({ where: { userId } });

    sendSuccess(res, null, 'Password changed successfully');
  } catch {
    sendError(res, 'Failed to change password', 500);
  }
};
