import type { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma/client';
import { sendSuccess, sendError, getPagination, buildPaginationMeta } from '../utils/response';
import type { AuthRequest } from '../types';
import type { UserRole, UserStatus } from '@prisma/client';

// ─── LIST USERS (ADMIN) ───────────────────────────────────────────────────────

export const listUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', role, status, search } = req.query as {
    page?: string; limit?: string; role?: UserRole; status?: UserStatus; search?: string;
  };

  const { skip, take } = getPagination(Number(page), Number(limit));

  const where = {
    ...(role && { role }),
    ...(status && { status }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { company: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  };

  try {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, name: true, role: true, status: true,
          avatar: true, phone: true, company: true, createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    sendSuccess(res, users, 'Users fetched', 200, buildPaginationMeta(total, Number(page), Number(limit)));
  } catch (err) {
    console.error('listUsers error:', err);
    sendError(res, 'Failed to fetch users', 500);
  }
};

// ─── CREATE USER (ADMIN) ─────────────────────────────────────────────────────

export const adminCreateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, email, password, role, company, phone } = req.body as {
    name: string; email: string; password: string;
    role: string; company?: string; phone?: string;
  };

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      sendError(res, 'Email already in use', 409);
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    const avatar = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

    const user = await prisma.user.create({
      data: {
        name, email, password: hashed,
        role: role as UserRole,
        company, phone, avatar,
        status: 'ACTIVE',
      },
      select: {
        id: true, email: true, name: true, role: true,
        status: true, avatar: true, phone: true, company: true, createdAt: true,
      },
    });

    sendSuccess(res, user, 'User created', 201);
  } catch (err) {
    console.error('adminCreateUser error:', err);
    sendError(res, 'Failed to create user', 500);
  }
};

// ─── GET USER BY ID ───────────────────────────────────────────────────────────

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, name: true, role: true, status: true,
        avatar: true, phone: true, company: true, timezone: true,
        language: true, createdAt: true, updatedAt: true,
        providerProfile: true,
        employeeProfile: true,
        walletAccount: { select: { id: true, balance: true, currency: true } },
      },
    });

    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    sendSuccess(res, user);
  } catch (err) {
    sendError(res, 'Failed to fetch user', 500);
  }
};

// ─── UPDATE PROFILE (SELF) ────────────────────────────────────────────────────

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { name, phone, company, timezone, language, avatar } = req.body as {
    name?: string; phone?: string; company?: string;
    timezone?: string; language?: string; avatar?: string;
  };

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, phone, company, timezone, language, avatar },
      select: {
        id: true, email: true, name: true, role: true, status: true,
        avatar: true, phone: true, company: true, timezone: true, language: true,
      },
    });

    sendSuccess(res, user, 'Profile updated');
  } catch (err) {
    sendError(res, 'Failed to update profile', 500);
  }
};

// ─── UPDATE USER ROLE (ADMIN) ────────────────────────────────────────────────

export const adminUpdateRole = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;
  const { role } = req.body as { role: UserRole };

  if (id === req.user!.id) {
    sendError(res, 'Cannot change your own role', 400);
    return;
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, name: true, role: true, status: true },
    });
    sendSuccess(res, user, 'User role updated');
  } catch {
    sendError(res, 'Failed to update user role', 500);
  }
};

// ─── UPDATE USER STATUS (ADMIN) ───────────────────────────────────────────────

export const updateUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;
  const { status } = req.body as { status: UserStatus };

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, email: true, name: true, role: true, status: true },
    });

    sendSuccess(res, user, 'User status updated');
  } catch {
    sendError(res, 'Failed to update user status', 500);
  }
};

// ─── ADMIN: RESET USER PASSWORD ───────────────────────────────────────────────

export const adminResetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;
  const { newPassword } = req.body as { newPassword: string };

  try {
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id }, data: { password: hashed } });
    await prisma.refreshToken.deleteMany({ where: { userId: id } });

    sendSuccess(res, null, 'Password reset successfully');
  } catch {
    sendError(res, 'Failed to reset password', 500);
  }
};

// ─── DELETE USER (ADMIN) ──────────────────────────────────────────────────────

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;

  if (id === req.user!.id) {
    sendError(res, 'Cannot delete your own account', 400);
    return;
  }

  try {
    await prisma.user.delete({ where: { id } });
    sendSuccess(res, null, 'User deleted');
  } catch {
    sendError(res, 'Failed to delete user', 500);
  }
};

// ─── WORKFORCE VIEW WITH TASK LOAD (ADMIN §4.4) ───────────────────────────────
// Returns all employees enriched with:
//   • active task count per priority vs max cap
//   • highest capacity percentage across priorities
//   • whether the employee is on approved leave today

export const getWorkforce = async (_req: AuthRequest, res: Response): Promise<void> => {
  const CAPS: Record<string, number> = { P0: 2, P1: 4, P2: 8, P3: 10 };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    const employees = await prisma.user.findMany({
      where: { role: 'EMPLOYEE' },
      select: {
        id: true, name: true, email: true, avatar: true,
        status: true, company: true, createdAt: true,
        employeeProfile: {
          select: { department: true, jobTitle: true, employeeId: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const enriched = await Promise.all(employees.map(async (emp) => {
      // Task counts per priority (active = not DONE)
      const [p0, p1, p2, p3, onLeaveToday] = await Promise.all([
        prisma.task.count({ where: { assignedToId: emp.id, priority: 'P0', status: { not: 'DONE' } } }),
        prisma.task.count({ where: { assignedToId: emp.id, priority: 'P1', status: { not: 'DONE' } } }),
        prisma.task.count({ where: { assignedToId: emp.id, priority: 'P2', status: { not: 'DONE' } } }),
        prisma.task.count({ where: { assignedToId: emp.id, priority: 'P3', status: { not: 'DONE' } } }),
        prisma.leaveRequest.count({
          where: {
            userId: emp.id,
            status:    'APPROVED',
            startDate: { lte: tomorrow },
            endDate:   { gte: today },
          },
        }),
      ]);

      const load = {
        P0: { active: p0, cap: CAPS.P0, pct: Math.round((p0 / CAPS.P0) * 100) },
        P1: { active: p1, cap: CAPS.P1, pct: Math.round((p1 / CAPS.P1) * 100) },
        P2: { active: p2, cap: CAPS.P2, pct: Math.round((p2 / CAPS.P2) * 100) },
        P3: { active: p3, cap: CAPS.P3, pct: Math.round((p3 / CAPS.P3) * 100) },
      };

      const maxCapacityPct = Math.max(load.P0.pct, load.P1.pct, load.P2.pct, load.P3.pct);
      const totalActive    = p0 + p1 + p2 + p3;

      return {
        ...emp,
        load,
        totalActive,
        maxCapacityPct,
        isAtCapacity: maxCapacityPct >= 100,
        isOnLeaveToday: onLeaveToday > 0,
      };
    }));

    sendSuccess(res, enriched, 'Workforce fetched');
  } catch (err) {
    console.error('getWorkforce error:', err);
    sendError(res, 'Failed to fetch workforce', 500);
  }
};

// ─── AVAILABLE ASSIGNEES — filtered out employees on leave today (§5.1) ───────
// Used by the Task Engine's "Assign To" dropdown.
// Returns ACTIVE employees (and optionally providers) who are NOT on
// APPROVED leave covering today.

export const getAvailableAssignees = async (_req: AuthRequest, res: Response): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    // IDs of employees on leave today
    const onLeave = await prisma.leaveRequest.findMany({
      where: {
        status:    'APPROVED',
        startDate: { lte: tomorrow },
        endDate:   { gte: today },
      },
      select: { userId: true },
    });

    const onLeaveIds = onLeave.map((l) => l.userId);

    const assignees = await prisma.user.findMany({
      where: {
        role:   { in: ['EMPLOYEE', 'PROVIDER'] },
        status: 'ACTIVE',
        id:     { notIn: onLeaveIds.length ? onLeaveIds : ['__none__'] },
      },
      select: {
        id: true, name: true, email: true, avatar: true, role: true, company: true,
        employeeProfile: { select: { department: true, jobTitle: true } },
      },
      orderBy: { name: 'asc' },
    });

    sendSuccess(res, assignees, `${assignees.length} available assignee(s)`);
  } catch (err) {
    console.error('getAvailableAssignees error:', err);
    sendError(res, 'Failed to fetch assignees', 500);
  }
};

// ─── GET DASHBOARD STATS (ADMIN) ──────────────────────────────────────────────

export const adminStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalUsers, buyers, providers, employees, activeUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'BUYER' } }),
      prisma.user.count({ where: { role: 'PROVIDER' } }),
      prisma.user.count({ where: { role: 'EMPLOYEE' } }),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
    ]);

    sendSuccess(res, { totalUsers, buyers, providers, employees, activeUsers });
  } catch {
    sendError(res, 'Failed to fetch stats', 500);
  }
};
