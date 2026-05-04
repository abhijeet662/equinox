import type { Response } from 'express';
import prisma from '../prisma/client';
import { sendSuccess, sendError, getPagination, buildPaginationMeta } from '../utils/response';
import type { AuthRequest } from '../types';
import type { LeaveStatus, LeaveType } from '@prisma/client';

// ─── LIST LEAVE REQUESTS ──────────────────────────────────────────────────────

export const listLeaveRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', status, type } = req.query as {
    page?: string; limit?: string; status?: LeaveStatus; type?: LeaveType;
  };

  const { skip, take } = getPagination(Number(page), Number(limit));
  const user = req.user!;

  // Employees see own requests, admins see all
  const where = {
    ...(user.role !== 'ADMIN' && { userId: user.id }),
    ...(status && { status }),
    ...(type && { type }),
  };

  try {
    const [requests, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          approvedBy: { select: { id: true, name: true, avatar: true } },
        },
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    sendSuccess(res, requests, 'Leave requests fetched', 200, buildPaginationMeta(total, Number(page), Number(limit)));
  } catch (err) {
    console.error('listLeaveRequests error:', err);
    sendError(res, 'Failed to fetch leave requests', 500);
  }
};

// ─── CREATE LEAVE REQUEST ─────────────────────────────────────────────────────

export const createLeaveRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const { type, startDate, endDate, reason } = req.body as {
    type: LeaveType; startDate: string; endDate: string; reason?: string;
  };

  const userId = req.user!.id;

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      sendError(res, 'End date cannot be before start date', 400);
      return;
    }

    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const request = await prisma.leaveRequest.create({
      data: { userId, type, startDate: start, endDate: end, days, reason, status: 'PENDING' },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    sendSuccess(res, request, 'Leave request submitted', 201);
  } catch (err) {
    console.error('createLeaveRequest error:', err);
    sendError(res, 'Failed to submit leave request', 500);
  }
};

// ─── APPROVE/REJECT LEAVE REQUEST (ADMIN) ────────────────────────────────────

export const reviewLeaveRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;
  const { status, adminNote } = req.body as { status: 'APPROVED' | 'REJECTED'; adminNote?: string };
  const approvedById = req.user!.id;

  try {
    const request = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        adminNote,
        approvedById,
        reviewedAt: new Date(),
      },
    });

    sendSuccess(res, request, `Leave request ${status.toLowerCase()}`);
  } catch {
    sendError(res, 'Failed to update leave request', 500);
  }
};

// ─── CANCEL LEAVE REQUEST (EMPLOYEE) ─────────────────────────────────────────

export const cancelLeaveRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;
  const userId = req.user!.id;

  try {
    const request = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!request || request.userId !== userId) {
      sendError(res, 'Leave request not found', 404);
      return;
    }
    if (request.status !== 'PENDING') {
      sendError(res, 'Can only cancel pending requests', 400);
      return;
    }

    await prisma.leaveRequest.update({ where: { id }, data: { status: 'CANCELLED' } });
    sendSuccess(res, null, 'Leave request cancelled');
  } catch {
    sendError(res, 'Failed to cancel leave request', 500);
  }
};
