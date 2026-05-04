import type { Response } from 'express';
import prisma from '../prisma/client';
import { sendSuccess, sendError, getPagination, buildPaginationMeta } from '../utils/response';
import type { AuthRequest } from '../types';
import type { ComplaintStatus, ComplaintPriority } from '@prisma/client';

// ─── LIST COMPLAINTS ──────────────────────────────────────────────────────────

export const listComplaints = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', status, priority } = req.query as {
    page?: string; limit?: string; status?: ComplaintStatus; priority?: ComplaintPriority;
  };

  const { skip, take } = getPagination(Number(page), Number(limit));
  const user = req.user!;

  const roleFilter =
    user.role === 'BUYER' ? { raisedById: user.id } :
    user.role === 'PROVIDER' ? { againstId: user.id } : {};

  const where = {
    ...roleFilter,
    ...(status && { status }),
    ...(priority && { priority }),
  };

  try {
    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          raisedBy: { select: { id: true, name: true, avatar: true } },
          against: { select: { id: true, name: true, avatar: true } },
        },
      }),
      prisma.complaint.count({ where }),
    ]);

    sendSuccess(res, complaints, 'Complaints fetched', 200, buildPaginationMeta(total, Number(page), Number(limit)));
  } catch (err) {
    console.error('listComplaints error:', err);
    sendError(res, 'Failed to fetch complaints', 500);
  }
};

// ─── GET COMPLAINT BY ID ──────────────────────────────────────────────────────

export const getComplaintById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;

  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        raisedBy: { select: { id: true, name: true, avatar: true, email: true } },
        against: { select: { id: true, name: true, avatar: true, email: true } },
        contract: { select: { id: true, title: true } },
      },
    });

    if (!complaint) {
      sendError(res, 'Complaint not found', 404);
      return;
    }

    sendSuccess(res, complaint);
  } catch {
    sendError(res, 'Failed to fetch complaint', 500);
  }
};

// ─── CREATE COMPLAINT ─────────────────────────────────────────────────────────

export const createComplaint = async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, description, againstId, contractId, priority } = req.body as {
    title: string; description: string; againstId: string;
    contractId?: string; priority?: ComplaintPriority;
  };

  const raisedById = req.user!.id;

  try {
    const complaint = await prisma.complaint.create({
      data: {
        title,
        description,
        raisedById,
        againstId,
        contractId,
        priority: priority || 'MEDIUM',
        status: 'OPEN',
      },
      include: {
        raisedBy: { select: { id: true, name: true, avatar: true } },
        against: { select: { id: true, name: true, avatar: true } },
      },
    });

    sendSuccess(res, complaint, 'Complaint filed', 201);
  } catch (err) {
    console.error('createComplaint error:', err);
    sendError(res, 'Failed to file complaint', 500);
  }
};

// ─── ESCALATE COMPLAINT (BUYER SELF-SERVICE) ─────────────────────────────────

export const escalateComplaint = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;
  try {
    const complaint = await prisma.complaint.findFirst({ where: { id, raisedById: req.user!.id } });
    if (!complaint) { sendError(res, 'Complaint not found', 404); return; }
    if (!['OPEN', 'IN_REVIEW'].includes(complaint.status)) {
      sendError(res, 'Only OPEN or IN_REVIEW complaints can be escalated', 400); return;
    }
    const updated = await prisma.complaint.update({ where: { id }, data: { status: 'ESCALATED' } });
    sendSuccess(res, updated, 'Complaint escalated');
  } catch { sendError(res, 'Failed to escalate', 500); }
};

// ─── UPDATE COMPLAINT STATUS (ADMIN/EMPLOYEE) ─────────────────────────────────

export const updateComplaintStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;
  const { status, resolution } = req.body as { status: ComplaintStatus; resolution?: string };

  try {
    const complaint = await prisma.complaint.update({
      where: { id },
      data: {
        status,
        resolution,
        ...(status === 'RESOLVED' && { resolvedAt: new Date() }),
      },
    });

    sendSuccess(res, complaint, 'Complaint updated');
  } catch {
    sendError(res, 'Failed to update complaint', 500);
  }
};
