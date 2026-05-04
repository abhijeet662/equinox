import type { Response } from 'express';
import prisma from '../prisma/client';
import { sendSuccess, sendError, getPagination, buildPaginationMeta } from '../utils/response';
import type { AuthRequest } from '../types';

// ─── LIST KPI RECORDS ─────────────────────────────────────────────────────────

export const listKPIs = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', userId: targetUserId, period } = req.query as {
    page?: string; limit?: string; userId?: string; period?: string;
  };

  const { skip, take } = getPagination(Number(page), Number(limit));
  const user = req.user!;

  // Employees see own KPIs, admins can see any
  const recordUserId = user.role === 'ADMIN' && targetUserId ? targetUserId : user.id;

  const where = {
    userId: recordUserId,
    ...(period && { period }),
  };

  try {
    const [records, total] = await Promise.all([
      prisma.kPIRecord.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      }),
      prisma.kPIRecord.count({ where }),
    ]);

    sendSuccess(res, records, 'KPI records fetched', 200, buildPaginationMeta(total, Number(page), Number(limit)));
  } catch (err) {
    console.error('listKPIs error:', err);
    sendError(res, 'Failed to fetch KPI records', 500);
  }
};

// ─── CREATE KPI RECORD (ADMIN/EMPLOYEE) ──────────────────────────────────────

export const createKPI = async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId: targetUserId, metric, value, target, unit, period } = req.body as {
    userId?: string; metric: string; value: number;
    target?: number; unit?: string; period: string;
  };

  const user = req.user!;
  const recordUserId = user.role === 'ADMIN' && targetUserId ? targetUserId : user.id;

  try {
    const record = await prisma.kPIRecord.create({
      data: { userId: recordUserId, metric, value, target, unit, period },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    sendSuccess(res, record, 'KPI record created', 201);
  } catch (err) {
    console.error('createKPI error:', err);
    sendError(res, 'Failed to create KPI record', 500);
  }
};

// ─── UPDATE KPI RECORD ────────────────────────────────────────────────────────

export const updateKPI = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;
  const { value, target, unit, period, metric } = req.body as {
    value?: number; target?: number; unit?: string; period?: string; metric?: string;
  };

  try {
    const record = await prisma.kPIRecord.update({
      where: { id },
      data: { value, target, unit, period, metric },
    });

    sendSuccess(res, record, 'KPI record updated');
  } catch {
    sendError(res, 'Failed to update KPI record', 500);
  }
};

// ─── TEAM KPI DASHBOARD (ADMIN) ───────────────────────────────────────────────

export const teamKPIDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  const { period } = req.query as { period?: string };

  try {
    const records = await prisma.kPIRecord.findMany({
      where: period ? { period } : {},
      include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });

    // Aggregate by user
    type UserMetrics = { user: typeof records[0]['user']; metrics: { metric: string; value: number; target: number | null; unit: string | null }[] };
    const byUser = records.reduce((acc: Record<string, UserMetrics>, r) => {
      if (!acc[r.userId]) {
        acc[r.userId] = { user: r.user, metrics: [] };
      }
      acc[r.userId].metrics.push({ metric: r.metric, value: r.value, target: r.target, unit: r.unit });
      return acc;
    }, {} as Record<string, { user: typeof records[0]['user']; metrics: { metric: string; value: number; target: number | null; unit: string | null }[] }>);

    sendSuccess(res, Object.values(byUser));
  } catch {
    sendError(res, 'Failed to fetch team KPI dashboard', 500);
  }
};
