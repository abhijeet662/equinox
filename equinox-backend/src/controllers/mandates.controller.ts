import type { Response } from 'express';
import prisma from '../prisma/client';
import { sendSuccess, sendError, getPagination, buildPaginationMeta } from '../utils/response';
import type { AuthRequest } from '../types';
import type { MandateStatus } from '@prisma/client';

// ─── LIST MANDATES ────────────────────────────────────────────────────────────

export const listMandates = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', status } = req.query as {
    page?: string; limit?: string; status?: MandateStatus;
  };

  const { skip, take } = getPagination(Number(page), Number(limit));
  const user = req.user!;

  // Admins see all; users see their own
  const where = {
    ...(user.role !== 'ADMIN' && { userId: user.id }),
    ...(status && { status }),
  };

  try {
    const [mandates, total] = await Promise.all([
      prisma.paymentMandate.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.paymentMandate.count({ where }),
    ]);

    sendSuccess(res, mandates, 'Mandates fetched', 200, buildPaginationMeta(total, Number(page), Number(limit)));
  } catch (err) {
    console.error('listMandates error:', err);
    sendError(res, 'Failed to fetch mandates', 500);
  }
};

// ─── GET MANDATE BY ID ────────────────────────────────────────────────────────

export const getMandateById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;

  try {
    const mandate = await prisma.paymentMandate.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!mandate) {
      sendError(res, 'Mandate not found', 404);
      return;
    }

    // Non-admin can only view their own
    if (req.user!.role !== 'ADMIN' && mandate.userId !== req.user!.id) {
      sendError(res, 'Forbidden', 403);
      return;
    }

    sendSuccess(res, mandate);
  } catch {
    sendError(res, 'Failed to fetch mandate', 500);
  }
};

// ─── CREATE MANDATE ───────────────────────────────────────────────────────────

export const createMandate = async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    bankName, accountNumber, ifscCode, accountHolder, maxAmount, frequency, nextDebitDate,
  } = req.body as {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountHolder: string;
    maxAmount: number;
    frequency?: string;
    nextDebitDate?: string;
  };

  const userId = req.user!.id;

  // Mask the account number — keep only last 4 digits
  const maskedAccount = accountNumber.replace(/.(?=.{4})/g, '*');

  try {
    // Only one active mandate per user
    const existing = await prisma.paymentMandate.findFirst({
      where: { userId, status: { in: ['ACTIVE', 'PENDING'] } },
    });

    if (existing) {
      sendError(res, 'You already have an active or pending mandate. Cancel it before creating a new one.', 409);
      return;
    }

    const mandate = await prisma.paymentMandate.create({
      data: {
        userId,
        bankName,
        accountNumber: maskedAccount,
        ifscCode: ifscCode.toUpperCase(),
        accountHolder,
        maxAmount,
        frequency: frequency || 'MONTHLY',
        nextDebitDate: nextDebitDate ? new Date(nextDebitDate) : undefined,
        status: 'PENDING',
      },
    });

    sendSuccess(res, mandate, 'Mandate created successfully', 201);
  } catch (err) {
    console.error('createMandate error:', err);
    sendError(res, 'Failed to create mandate', 500);
  }
};

// ─── UPDATE MANDATE STATUS (ADMIN) ───────────────────────────────────────────

export const updateMandateStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;
  const { status, mandateRef } = req.body as { status: MandateStatus; mandateRef?: string };

  try {
    const mandate = await prisma.paymentMandate.update({
      where: { id },
      data: {
        status,
        ...(mandateRef && { mandateRef }),
      },
    });

    sendSuccess(res, mandate, 'Mandate status updated');
  } catch {
    sendError(res, 'Failed to update mandate', 500);
  }
};

// ─── CANCEL MANDATE ───────────────────────────────────────────────────────────

export const cancelMandate = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;
  const userId = req.user!.id;

  try {
    const mandate = await prisma.paymentMandate.findUnique({ where: { id } });

    if (!mandate) {
      sendError(res, 'Mandate not found', 404);
      return;
    }

    // Only owner or admin can cancel
    if (req.user!.role !== 'ADMIN' && mandate.userId !== userId) {
      sendError(res, 'Forbidden', 403);
      return;
    }

    if (mandate.status === 'CANCELLED') {
      sendError(res, 'Mandate is already cancelled', 400);
      return;
    }

    const updated = await prisma.paymentMandate.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    sendSuccess(res, updated, 'Mandate cancelled');
  } catch {
    sendError(res, 'Failed to cancel mandate', 500);
  }
};

// ─── GET MY MANDATE ───────────────────────────────────────────────────────────

export const getMyMandate = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  try {
    const mandate = await prisma.paymentMandate.findFirst({
      where: { userId, status: { not: 'CANCELLED' } },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, mandate || null, mandate ? 'Mandate fetched' : 'No active mandate');
  } catch {
    sendError(res, 'Failed to fetch mandate', 500);
  }
};
