import type { Response } from 'express';
import prisma from '../prisma/client';
import { sendSuccess, sendError, getPagination, buildPaginationMeta } from '../utils/response';
import type { AuthRequest } from '../types';
import type { TransactionType } from '@prisma/client';

// ─── GET MY WALLET ────────────────────────────────────────────────────────────

export const getMyWallet = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  try {
    // Auto-create wallet on first access so existing users never hit 404
    const wallet = await prisma.walletAccount.upsert({
      where: { userId },
      update: {},
      create: { userId, balance: 0, currency: 'USD' },
    });

    sendSuccess(res, wallet);
  } catch {
    sendError(res, 'Failed to fetch wallet', 500);
  }
};

// ─── LIST TRANSACTIONS ────────────────────────────────────────────────────────

export const listTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', type } = req.query as {
    page?: string; limit?: string; type?: TransactionType;
  };

  const { skip, take } = getPagination(Number(page), Number(limit));
  const userId = req.user!.id;

  try {
    // Auto-create wallet so transaction list never fails for new users
    const wallet = await prisma.walletAccount.upsert({
      where: { userId },
      update: {},
      create: { userId, balance: 0, currency: 'USD' },
    });

    const where = { walletId: wallet.id, ...(type && { type }) };

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.walletTransaction.count({ where }),
    ]);

    sendSuccess(res, transactions, 'Transactions fetched', 200, buildPaginationMeta(total, Number(page), Number(limit)));
  } catch {
    sendError(res, 'Failed to fetch transactions', 500);
  }
};

// ─── TOP UP WALLET ────────────────────────────────────────────────────────────

export const topUp = async (req: AuthRequest, res: Response): Promise<void> => {
  const { amount, reference } = req.body as { amount: number; reference?: string };
  const userId = req.user!.id;

  if (amount <= 0) {
    sendError(res, 'Amount must be positive', 400);
    return;
  }

  try {
    // Auto-create wallet if not exists (covers legacy users without a wallet row)
    const wallet = await prisma.walletAccount.upsert({
      where: { userId },
      update: {},
      create: { userId, balance: 0, currency: 'USD' },
    });

    const [updatedWallet, transaction] = await prisma.$transaction([
      prisma.walletAccount.update({
        where: { userId },
        data: { balance: { increment: amount } },
      }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: 'CREDIT',
          status: 'COMPLETED',
          reference: reference || `TOPUP-${Date.now()}`,
          description: 'Wallet top-up',
        },
      }),
    ]);

    sendSuccess(res, { wallet: updatedWallet, transaction }, 'Wallet topped up');
  } catch {
    sendError(res, 'Top-up failed', 500);
  }
};

// ─── WITHDRAW ─────────────────────────────────────────────────────────────────

export const withdraw = async (req: AuthRequest, res: Response): Promise<void> => {
  const { amount, reference } = req.body as { amount: number; reference?: string };
  const userId = req.user!.id;

  if (amount <= 0) {
    sendError(res, 'Amount must be positive', 400);
    return;
  }

  try {
    // Auto-create wallet if not exists
    const wallet = await prisma.walletAccount.upsert({
      where: { userId },
      update: {},
      create: { userId, balance: 0, currency: 'USD' },
    });
    if (wallet.balance < amount) {
      sendError(res, 'Insufficient balance', 400);
      return;
    }

    const [updatedWallet, transaction] = await prisma.$transaction([
      prisma.walletAccount.update({
        where: { userId },
        data: { balance: { decrement: amount } },
      }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: 'DEBIT',
          status: 'COMPLETED',
          reference: reference || `WITHDRAW-${Date.now()}`,
          description: 'Withdrawal',
        },
      }),
    ]);

    sendSuccess(res, { wallet: updatedWallet, transaction }, 'Withdrawal successful');
  } catch {
    sendError(res, 'Withdrawal failed', 500);
  }
};

// ─── ADMIN: LIST ALL WALLETS ──────────────────────────────────────────────────

export const adminListWallets = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20' } = req.query as { page?: string; limit?: string };
  const { skip, take } = getPagination(Number(page), Number(limit));

  try {
    const [wallets, total] = await Promise.all([
      prisma.walletAccount.findMany({
        skip,
        take,
        orderBy: { balance: 'desc' },
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      }),
      prisma.walletAccount.count(),
    ]);

    sendSuccess(res, wallets, 'Wallets fetched', 200, buildPaginationMeta(total, Number(page), Number(limit)));
  } catch {
    sendError(res, 'Failed to fetch wallets', 500);
  }
};
