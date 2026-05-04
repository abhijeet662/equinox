/**
 * ─── CONTACTS CONTROLLER ─────────────────────────────────────────────────────
 *
 * Handles the public contact / inquiry form at /contact.
 * No auth required. Routes the submission to the right admin notification
 * queue based on inquiryType.
 *
 * Data saved to: Notification table (one per admin, type SYSTEM).
 * Upgrade path: call notificationService.sendEmail() to forward to a real
 * CRM or support inbox with zero additional changes to this file.
 */

import type { Request, Response } from 'express';
import prisma from '../prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { notificationService } from '../services/notification.service';

const INQUIRY_LABELS: Record<string, string> = {
  provider:     'Become a Provider',
  partnership:  'Brand Partnerships',
  billing:      'Billing Support',
  technical:    'Technical Support',
  general:      'General Inquiry',
};

export const createContact = async (req: Request, res: Response): Promise<void> => {
  const {
    name, email, brandName, message, inquiryType = 'general',
  } = req.body as {
    name: string; email: string; brandName?: string;
    message: string; inquiryType?: string;
  };

  const label   = INQUIRY_LABELS[inquiryType] ?? 'General Inquiry';
  const subject = `[${label}] from ${name}${brandName ? ` (${brandName})` : ''}`;

  const notifMessage = [
    `Type: ${label}`,
    `From: ${name} <${email}>`,
    brandName ? `Brand: ${brandName}` : '',
    `Message: "${message.slice(0, 200)}${message.length > 200 ? '…' : ''}"`,
  ].filter(Boolean).join('  ·  ');

  try {
    // ── Broadcast in-app notification to all ADMINs ───────────────────────────
    await notificationService.broadcastToAdmins({
      title:   `📬 ${subject}`,
      message: notifMessage,
      type:    'INFO',
      link:    '/admin/notifications',
    });

    // ── Mock email to support inbox ───────────────────────────────────────────
    // In production: swap this for a real support mailbox (e.g. support@eqom.ai)
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { email: true, name: true },
      take: 1,
    });

    if (admins.length > 0) {
      await notificationService.sendEmail({
        to:      admins[0].email,
        subject: `[Equinox Contact] ${subject}`,
        body: [
          `New contact form submission on Equinox:`,
          ``,
          `  Inquiry Type : ${label}`,
          `  Name         : ${name}`,
          `  Email        : ${email}`,
          brandName ? `  Brand        : ${brandName}` : '',
          ``,
          `  Message:`,
          `  ${message}`,
          ``,
          `─────────────────────────────────────────`,
          `Respond via your admin panel:`,
          `${process.env.CLIENT_URL ?? 'http://localhost:5173'}/admin/notifications`,
        ].filter(Boolean).join('\n'),
      });
    }

    // ── Mock confirmation to the sender ──────────────────────────────────────
    await notificationService.sendEmail({
      to:      email,
      subject: `We received your message — Equinox`,
      body: [
        `Hi ${name},`,
        ``,
        `Thanks for reaching out to Equinox. Your inquiry has been received and`,
        `routed to our ${label} team. We typically respond within 24–48 hours.`,
        ``,
        `Your reference: ${label} · ${new Date().toLocaleDateString()}`,
        ``,
        `— The Equinox Team`,
        `https://eqom.ai`,
      ].join('\n'),
    });

    console.log(`\n📬 [Contact] ${label} from ${name} <${email}>${brandName ? ` (${brandName})` : ''}\n`);

    sendSuccess(res, null, 'Inquiry submitted. We\'ll be in touch within 24–48 hours.', 201);
  } catch (err) {
    console.error('createContact error:', err);
    sendError(res, 'Failed to submit your inquiry. Please try again.', 500);
  }
};
