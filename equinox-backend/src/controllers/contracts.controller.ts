import type { Response } from 'express';
import prisma from '../prisma/client';
import { sendSuccess, sendError, getPagination, buildPaginationMeta } from '../utils/response';
import type { AuthRequest } from '../types';
import type { ContractStatus, ContractType } from '@prisma/client';

// ─── LIST CONTRACTS ───────────────────────────────────────────────────────────

export const listContracts = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', status, type } = req.query as {
    page?: string; limit?: string; status?: ContractStatus; type?: ContractType;
  };

  const { skip, take } = getPagination(Number(page), Number(limit));
  const user = req.user!;

  const roleFilter =
    user.role === 'PROVIDER' ? { providerId: user.id } :
    user.role === 'BUYER' ? { buyerId: user.id } : {};

  const where = {
    ...roleFilter,
    ...(status && { status }),
    ...(type && { type }),
  };

  try {
    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          provider: { select: { id: true, name: true, avatar: true, company: true } },
          buyer: { select: { id: true, name: true, avatar: true, company: true } },
          _count: { select: { tasks: true, invoices: true } },
        },
      }),
      prisma.contract.count({ where }),
    ]);

    sendSuccess(res, contracts, 'Contracts fetched', 200, buildPaginationMeta(total, Number(page), Number(limit)));
  } catch (err) {
    console.error('listContracts error:', err);
    sendError(res, 'Failed to fetch contracts', 500);
  }
};

// ─── GET CONTRACT BY ID ───────────────────────────────────────────────────────

export const getContractById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;

  try {
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        provider: { select: { id: true, name: true, avatar: true, company: true, email: true } },
        buyer: { select: { id: true, name: true, avatar: true, company: true, email: true } },
        tasks: { orderBy: { createdAt: 'desc' } },
        invoices: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!contract) {
      sendError(res, 'Contract not found', 404);
      return;
    }

    sendSuccess(res, contract);
  } catch {
    sendError(res, 'Failed to fetch contract', 500);
  }
};

// ─── CREATE CONTRACT ──────────────────────────────────────────────────────────

export const createContract = async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    title, description, providerId, type, value, currency,
    startDate, endDate, terms
  } = req.body as {
    title: string; description?: string; providerId: string;
    type?: ContractType; value?: number; currency?: string;
    startDate?: string; endDate?: string; terms?: string;
  };

  const buyerId = req.user!.id;

  try {
    const contract = await prisma.contract.create({
      data: {
        title,
        description,
        buyerId,
        providerId,
        type: type || 'PROJECT',
        status: 'DRAFT',
        value: value || 0,
        currency: currency || 'USD',
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        terms,
      },
      include: {
        provider: { select: { id: true, name: true, avatar: true, company: true } },
        buyer: { select: { id: true, name: true, avatar: true, company: true } },
      },
    });

    sendSuccess(res, contract, 'Contract created', 201);
  } catch (err) {
    console.error('createContract error:', err);
    sendError(res, 'Failed to create contract', 500);
  }
};

// ─── UPDATE CONTRACT ──────────────────────────────────────────────────────────

export const updateContract = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;
  const { title, description, type, value, currency, startDate, endDate, terms, status } = req.body as {
    title?: string; description?: string; type?: ContractType;
    value?: number; currency?: string; startDate?: string;
    endDate?: string; terms?: string; status?: ContractStatus;
  };

  try {
    const contract = await prisma.contract.update({
      where: { id },
      data: {
        title, description, type, value, currency, terms, status,
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      },
      include: {
        provider: { select: { id: true, name: true, avatar: true, company: true } },
        buyer: { select: { id: true, name: true, avatar: true, company: true } },
      },
    });

    sendSuccess(res, contract, 'Contract updated');
  } catch {
    sendError(res, 'Failed to update contract', 500);
  }
};

// ─── DELETE CONTRACT ──────────────────────────────────────────────────────────

export const deleteContract = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;

  try {
    const contract = await prisma.contract.findUnique({ where: { id } });
    if (!contract) {
      sendError(res, 'Contract not found', 404);
      return;
    }
    if (contract.status === 'ACTIVE') {
      sendError(res, 'Cannot delete an active contract', 400);
      return;
    }

    await prisma.contract.delete({ where: { id } });
    sendSuccess(res, null, 'Contract deleted');
  } catch {
    sendError(res, 'Failed to delete contract', 500);
  }
};
