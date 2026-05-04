/**
 * ─── LEADS CONTROLLER ─────────────────────────────────────────────────────────
 *
 * Handles public lead / inquiry submissions from non-authenticated visitors.
 * No auth required — anyone can send an inquiry to a provider.
 *
 * On receipt:
 *   1. Finds the ProviderProfile (and their userId) from the providerId.
 *   2. Sends an in-app notification to the provider (persisted to DB).
 *   3. Mocks email delivery to both provider and the lead (console.log).
 *   4. Returns 201. No Lead table needed — notification IS the record.
 */

import type { Request, Response } from 'express';
import prisma from '../prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { notificationService } from '../services/notification.service';

export const createLead = async (req: Request, res: Response): Promise<void> => {
  const {
    name, email, company, message, budget, providerId,
  } = req.body as {
    name: string; email: string; company?: string;
    message: string; budget?: string; providerId: string;
  };

  try {
    // Resolve the provider profile → get their user ID and name
    const profile = await prisma.providerProfile.findUnique({
      where: { id: providerId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!profile) {
      sendError(res, 'Provider not found', 404);
      return;
    }

    const providerDisplayName = profile.businessName || profile.user.name;
    const budgetLine          = budget ? `Budget: ${budget}` : '';
    const companyLine         = company ? `Company: ${company}` : '';

    const notifMessage = [
      `${name} (${email})`,
      companyLine,
      `sent an inquiry:`,
      `"${message.slice(0, 160)}${message.length > 160 ? '…' : ''}"`,
      budgetLine,
    ].filter(Boolean).join('  ·  ');

    // ── 1. In-app notification → provider sees it in bell + dashboard ─────────
    await notificationService.sendInApp({
      userId:  profile.userId,
      title:   `📩 New Lead from ${name}`,
      message: notifMessage,
      type:    'INFO',
      link:    '/provider',
    });

    // ── 2. Mock email to provider ──────────────────────────────────────────────
    await notificationService.sendEmail({
      to:      profile.user.email,
      subject: `New Lead Inquiry from ${name} — Equinox`,
      body: [
        `Hi ${providerDisplayName},`,
        ``,
        `You have a new lead inquiry submitted via Equinox:`,
        ``,
        `  Name    : ${name}`,
        `  Email   : ${email}`,
        companyLine ? `  Company : ${company}` : '',
        budgetLine  ? `  Budget  : ${budget}`  : '',
        ``,
        `  Message :`,
        `  ${message}`,
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `Log in to your Equinox provider dashboard to respond:`,
        `${process.env.CLIENT_URL ?? 'http://localhost:5173'}/provider`,
      ].filter(Boolean).join('\n'),
    });

    // ── 3. Mock confirmation email to the lead ─────────────────────────────────
    await notificationService.sendEmail({
      to:      email,
      subject: `Your inquiry to ${providerDisplayName} — Equinox`,
      body: [
        `Hi ${name},`,
        ``,
        `Your inquiry has been delivered to ${providerDisplayName} on Equinox.`,
        `They'll get back to you within 24 hours.`,
        ``,
        `─── YOUR INQUIRY ───────────────────`,
        `${message}`,
        `────────────────────────────────────`,
        ``,
        `Want to manage contracts, track deliverables, and pay securely?`,
        `Create your free Buyer account on Equinox:`,
        `${process.env.CLIENT_URL ?? 'http://localhost:5173'}/signup`,
      ].join('\n'),
    });

    console.log(
      `\n📩 [Lead] ${name} <${email}> → provider "${providerDisplayName}" (${profile.userId})\n`
    );

    sendSuccess(res, { providerName: providerDisplayName }, 'Inquiry submitted successfully', 201);
  } catch (err) {
    console.error('createLead error:', err);
    sendError(res, 'Failed to submit inquiry. Please try again.', 500);
  }
};
