import type { Response } from 'express';
import prisma from '../prisma/client';
import { sendSuccess, sendError, getPagination, buildPaginationMeta } from '../utils/response';
import { generateInvoiceNo } from '../utils/sla';
import type { AuthRequest } from '../types';
import type { InvoiceStatus } from '@prisma/client';

// ─── LIST INVOICES ────────────────────────────────────────────────────────────

export const listInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', status } = req.query as {
    page?: string; limit?: string; status?: InvoiceStatus;
  };

  const { skip, take } = getPagination(Number(page), Number(limit));
  const user = req.user!;

  const roleFilter =
    user.role === 'PROVIDER' ? { providerId: user.id } :
    user.role === 'BUYER' ? { buyerId: user.id } : {};

  const where = { ...roleFilter, ...(status && { status }) };

  try {
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          provider: { select: { id: true, name: true, company: true, avatar: true } },
          buyer: { select: { id: true, name: true, company: true, avatar: true } },
          contract: { select: { id: true, title: true } },
          items: true,
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    sendSuccess(res, invoices, 'Invoices fetched', 200, buildPaginationMeta(total, Number(page), Number(limit)));
  } catch (err) {
    console.error('listInvoices error:', err);
    sendError(res, 'Failed to fetch invoices', 500);
  }
};

// ─── GET INVOICE BY ID ────────────────────────────────────────────────────────

export const getInvoiceById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        provider: { select: { id: true, name: true, company: true, email: true, phone: true } },
        buyer: { select: { id: true, name: true, company: true, email: true } },
        contract: { select: { id: true, title: true } },
        items: true,
      },
    });

    if (!invoice) {
      sendError(res, 'Invoice not found', 404);
      return;
    }

    sendSuccess(res, invoice);
  } catch {
    sendError(res, 'Failed to fetch invoice', 500);
  }
};

// ─── CREATE INVOICE ───────────────────────────────────────────────────────────

export const createInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  const { buyerId, contractId, dueDate, currency, notes, items } = req.body as {
    buyerId: string;
    contractId?: string;
    dueDate?: string;
    currency?: string;
    notes?: string;
    items: { description: string; quantity: number; unitPrice: number }[];
  };

  const providerId = req.user!.id;

  try {
    // Verification guard: only VERIFIED providers may create invoices
    const providerProfile = await prisma.providerProfile.findUnique({
      where: { userId: providerId },
      select: { isVerified: true },
    });
    if (providerProfile && !providerProfile.isVerified) {
      sendError(res, 'Your provider account must be verified before you can issue invoices.', 403);
      return;
    }

    const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const taxRate = 0; // can be configurable
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo: generateInvoiceNo(),
        providerId,
        buyerId,
        contractId,
        status: 'PENDING',
        subtotal,
        tax,
        total,
        currency: currency || 'USD',
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes,
        items: {
          create: items.map((i) => ({
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            total: i.quantity * i.unitPrice,
          })),
        },
      },
      include: {
        items: true,
        buyer: { select: { id: true, name: true, company: true } },
        provider: { select: { id: true, name: true, company: true } },
      },
    });

    sendSuccess(res, invoice, 'Invoice created', 201);
  } catch (err) {
    console.error('createInvoice error:', err);
    sendError(res, 'Failed to create invoice', 500);
  }
};

// ─── UPDATE INVOICE STATUS ────────────────────────────────────────────────────

export const updateInvoiceStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;
  const { status } = req.body as { status: InvoiceStatus };

  try {
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        status,
        ...(status === 'PAID' && { paidAt: new Date() }),
      },
    });

    sendSuccess(res, invoice, 'Invoice status updated');
  } catch {
    sendError(res, 'Failed to update invoice', 500);
  }
};

// ─── PAY INVOICE (WALLET DEBIT) ───────────────────────────────────────────────

export const payInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;
  const buyerId = req.user!.id;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { provider: { select: { id: true } } },
    });

    if (!invoice) {
      sendError(res, 'Invoice not found', 404);
      return;
    }
    if (invoice.buyerId !== buyerId) {
      sendError(res, 'Not authorized to pay this invoice', 403);
      return;
    }
    if (invoice.status !== 'PENDING') {
      sendError(res, 'Invoice is not in a payable state', 400);
      return;
    }

    const wallet = await prisma.walletAccount.findUnique({ where: { userId: buyerId } });
    if (!wallet || wallet.balance < invoice.total) {
      sendError(res, 'Insufficient wallet balance', 400);
      return;
    }

    // Transactional: debit buyer, credit provider, mark invoice paid
    await prisma.$transaction([
      prisma.walletAccount.update({
        where: { userId: buyerId },
        data: { balance: { decrement: invoice.total } },
      }),
      prisma.walletAccount.upsert({
        where: { userId: invoice.providerId },
        update: { balance: { increment: invoice.total } },
        create: { userId: invoice.providerId, balance: invoice.total },
      }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: invoice.total,
          type: 'DEBIT',
          status: 'COMPLETED',
          reference: invoice.invoiceNo,
          description: `Payment for invoice ${invoice.invoiceNo}`,
        },
      }),
      prisma.invoice.update({
        where: { id },
        data: { status: 'PAID', paidAt: new Date() },
      }),
    ]);

    sendSuccess(res, null, 'Invoice paid successfully');
  } catch (err) {
    console.error('payInvoice error:', err);
    sendError(res, 'Payment failed', 500);
  }
};
