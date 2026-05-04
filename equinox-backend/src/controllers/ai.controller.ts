import type { Response } from 'express';
import prisma from '../prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import type { AuthRequest } from '../types';

// ─── GET AI INSIGHTS ──────────────────────────────────────────────────────────

export const getInsights = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  try {
    const insights = await prisma.aIInsight.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    sendSuccess(res, insights);
  } catch {
    sendError(res, 'Failed to fetch insights', 500);
  }
};

// ─── AI COPILOT CHAT ──────────────────────────────────────────────────────────

export const copilotChat = async (req: AuthRequest, res: Response): Promise<void> => {
  const { message } = req.body as { message: string };
  const user = req.user!;

  if (!message?.trim()) {
    sendError(res, 'Message is required', 400);
    return;
  }

  try {
    // Gather context based on user role
    let context = {};

    if (user.role === 'BUYER') {
      const [contracts, invoices, tasks] = await Promise.all([
        prisma.contract.count({ where: { buyerId: user.id } }),
        prisma.invoice.count({ where: { buyerId: user.id, status: 'PENDING' } }),
        prisma.task.count({ where: { createdById: user.id, status: { not: 'DONE' } } }),
      ]);
      context = { activeContracts: contracts, pendingInvoices: invoices, openTasks: tasks };
    } else if (user.role === 'PROVIDER') {
      const [contracts, tasks, rating] = await Promise.all([
        prisma.contract.count({ where: { providerId: user.id, status: 'ACTIVE' } }),
        prisma.task.count({ where: { assignedToId: user.id, status: { not: 'DONE' } } }),
        prisma.providerProfile.findUnique({ where: { userId: user.id }, select: { rating: true } }),
      ]);
      context = { activeContracts: contracts, openTasks: tasks, rating: rating?.rating };
    } else if (user.role === 'EMPLOYEE') {
      const [tasks, leaves] = await Promise.all([
        prisma.task.count({ where: { assignedToId: user.id, status: { not: 'DONE' } } }),
        prisma.leaveRequest.count({ where: { userId: user.id, status: 'PENDING' } }),
      ]);
      context = { openTasks: tasks, pendingLeaves: leaves };
    }

    // Generate a rule-based response (placeholder for LLM integration)
    const response = generateCopilotResponse(message, user.role, context);

    // Persist AI interaction
    await prisma.aIInsight.create({
      data: {
        userId: user.id,
        type: 'CHAT',
        title: 'Copilot Interaction',
        content: message,
        metadata: { response, context },
      },
    });

    sendSuccess(res, { response, context });
  } catch (err) {
    console.error('copilotChat error:', err);
    sendError(res, 'Copilot unavailable', 500);
  }
};

// ─── GENERATE INVOICE SUMMARY (AI) ───────────────────────────────────────────

export const generateInvoiceSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  const { invoiceId } = req.params as Record<string, string>;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
        provider: { select: { name: true, company: true } },
        buyer: { select: { name: true, company: true } },
      },
    });

    if (!invoice) {
      sendError(res, 'Invoice not found', 404);
      return;
    }

    const summary = `Invoice ${invoice.invoiceNo} from ${invoice.provider.company || invoice.provider.name} to ${invoice.buyer.company || invoice.buyer.name}. ` +
      `Total: ${invoice.currency} ${invoice.total.toFixed(2)} for ${invoice.items.length} line items. ` +
      `Status: ${invoice.status}. ${invoice.dueDate ? `Due: ${invoice.dueDate.toLocaleDateString()}.` : ''}`;

    sendSuccess(res, { summary });
  } catch {
    sendError(res, 'Failed to generate summary', 500);
  }
};

// ─── DASHBOARD AI SUMMARY ─────────────────────────────────────────────────────

export const dashboardSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;

  try {
    let summary = '';
    let recommendations: string[] = [];

    if (user.role === 'BUYER') {
      const [contracts, pendingInvoices, complaints] = await Promise.all([
        prisma.contract.count({ where: { buyerId: user.id, status: 'ACTIVE' } }),
        prisma.invoice.findMany({ where: { buyerId: user.id, status: 'PENDING' }, select: { id: true, total: true } }),
        prisma.complaint.count({ where: { raisedById: user.id, status: 'OPEN' } }),
      ]);

      const totalDue = pendingInvoices.reduce((sum: number, i) => sum + i.total, 0);
      summary = `You have ${contracts} active contract(s) and ${pendingInvoices.length} pending invoice(s) totalling $${totalDue.toFixed(2)}.`;
      if (complaints > 0) recommendations.push(`You have ${complaints} open complaint(s) awaiting resolution.`);
      if (pendingInvoices.length > 3) recommendations.push('Consider reviewing and clearing pending invoices to maintain good provider relationships.');
    } else if (user.role === 'PROVIDER') {
      const [active, overdueInvoices] = await Promise.all([
        prisma.contract.count({ where: { providerId: user.id, status: 'ACTIVE' } }),
        prisma.invoice.count({ where: { providerId: user.id, status: 'PENDING', dueDate: { lt: new Date() } } }),
      ]);

      summary = `You have ${active} active contract(s).`;
      if (overdueInvoices > 0) recommendations.push(`${overdueInvoices} invoice(s) are overdue. Follow up with buyers.`);
    } else if (user.role === 'ADMIN') {
      const [users, contracts, openComplaints] = await Promise.all([
        prisma.user.count(),
        prisma.contract.count({ where: { status: 'ACTIVE' } }),
        prisma.complaint.count({ where: { status: 'OPEN' } }),
      ]);

      summary = `Platform has ${users} users and ${contracts} active contracts.`;
      if (openComplaints > 0) recommendations.push(`There are ${openComplaints} open complaint(s) requiring admin attention.`);
    }

    sendSuccess(res, { summary, recommendations });
  } catch {
    sendError(res, 'Failed to generate dashboard summary', 500);
  }
};

// ─── HELPER: Rule-based copilot responses ─────────────────────────────────────

function generateCopilotResponse(message: string, role: string, context: Record<string, unknown>): string {
  const msg = message.toLowerCase();

  if (msg.includes('invoice') || msg.includes('payment')) {
    const pending = context.pendingInvoices as number || 0;
    return pending > 0
      ? `You have ${pending} pending invoice(s). I recommend reviewing and processing them promptly to avoid late fees.`
      : 'All your invoices are up to date. Great financial discipline!';
  }

  if (msg.includes('task') || msg.includes('todo')) {
    const open = context.openTasks as number || 0;
    return open > 0
      ? `You have ${open} open task(s). Consider prioritizing by SLA deadline to avoid breaches.`
      : 'No open tasks! You are all caught up.';
  }

  if (msg.includes('contract')) {
    const active = context.activeContracts as number || 0;
    return `You currently have ${active} active contract(s). ${active > 5 ? 'You might want to review workload distribution.' : 'Workload looks manageable.'}`;
  }

  if (msg.includes('hello') || msg.includes('hi') || msg.includes('help')) {
    return `Hello! I'm your Equinox AI Copilot. I can help you with insights on your ${role.toLowerCase()} activities, contracts, tasks, invoices, and more. What would you like to know?`;
  }

  return `I understand you're asking about "${message}". As your AI assistant, I can provide insights on your contracts, tasks, invoices, and performance metrics. Could you be more specific about what you'd like to analyze?`;
}
