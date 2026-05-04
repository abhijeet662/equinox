/**
 * ─── NOTIFICATION SERVICE ─────────────────────────────────────────────────────
 *
 * Blueprint §8 — Notification & Communication Layer
 *
 * All three channels (Email, WhatsApp, In-App) currently operate in
 * "mock / development" mode:
 *   • They console.log the full message payload so you can verify the
 *     content in the server terminal.
 *   • They persist an in-app Notification record to the database so the
 *     front-end bell icon and notification drawer still work.
 *
 * Upgrading to real APIs later requires only replacing the TODO blocks
 * inside sendEmail() and sendWhatsApp(). The rest of the platform
 * (SLA watchdog, daily digest, controllers) calls this service and will
 * immediately benefit from live delivery without further changes.
 */

import prisma from '../prisma/client';
import type { NotificationType } from '@prisma/client';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface EmailPayload {
  to: string;           // recipient email address
  subject: string;
  body: string;         // plain-text body (HTML-ready when real API is wired)
  userId?: string;      // if set, an in-app notification is also saved
}

export interface WhatsAppPayload {
  to: string;           // E.164 phone number e.g. +971501234567
  message: string;
  userId?: string;      // if set, an in-app notification is also saved
}

export interface InAppPayload {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;        // deep-link route e.g. /tasks/abc-123
}

// ─── NOTIFICATION SERVICE ─────────────────────────────────────────────────────

class NotificationService {
  // ── Email ──────────────────────────────────────────────────────────────────

  async sendEmail(payload: EmailPayload): Promise<void> {
    const { to, subject, body, userId } = payload;

    // ── MOCK: console log ────────────────────────────────────────────────────
    console.log('\n📧 [EMAIL — MOCK]');
    console.log(`   To      : ${to}`);
    console.log(`   Subject : ${subject}`);
    console.log(`   Body    :\n${body.split('\n').map(l => `             ${l}`).join('\n')}`);
    console.log('');

    // TODO (production): replace block below with real transporter, e.g.:
    //   await nodemailer.createTransport({ ... }).sendMail({ from, to, subject, html: body });
    //   OR: await sendgrid.send({ to, from: process.env.FROM_EMAIL, subject, text: body });

    // ── Persist in-app notification (so FE bell still shows the alert) ───────
    if (userId) {
      await this.sendInApp({
        userId,
        title: subject,
        message: body.length > 200 ? `${body.slice(0, 197)}…` : body,
        type: 'INFO',
      });
    }
  }

  // ── WhatsApp ───────────────────────────────────────────────────────────────

  async sendWhatsApp(payload: WhatsAppPayload): Promise<void> {
    const { to, message, userId } = payload;

    // ── MOCK: console log ────────────────────────────────────────────────────
    console.log('\n💬 [WHATSAPP — MOCK]');
    console.log(`   To      : ${to}`);
    console.log(`   Message :\n${message.split('\n').map(l => `             ${l}`).join('\n')}`);
    console.log('');

    // TODO (production): replace block below with real provider, e.g.:
    //   Twilio:   await twilioClient.messages.create({ from: 'whatsapp:+14155238886', to: `whatsapp:${to}`, body: message });
    //   360dialog: await axios.post('https://waba.360dialog.io/v1/messages', { ... });

    // ── Persist in-app notification ───────────────────────────────────────────
    if (userId) {
      await this.sendInApp({
        userId,
        title: 'WhatsApp Notification',
        message: message.length > 200 ? `${message.slice(0, 197)}…` : message,
        type: 'INFO',
      });
    }
  }

  // ── In-App (primary channel — always persisted to DB) ─────────────────────

  async sendInApp(payload: InAppPayload): Promise<void> {
    const { userId, title, message, type = 'INFO', link } = payload;

    try {
      // Verify user exists before attempting insert
      const userExists = await prisma.user.count({ where: { id: userId } });
      if (!userExists) {
        console.warn(`[Notification] Skipped — userId "${userId}" not found in DB`);
        return;
      }

      await prisma.notification.create({
        data: { userId, title, message, type, link, read: false },
      });

      console.log(`🔔 [IN-APP] → ${userId} | [${type}] ${title}`);
    } catch (err) {
      // Never crash the calling service due to a notification failure
      console.error('[Notification] Failed to persist in-app notification:', err);
    }
  }

  // ── Broadcast to all ADMINs ────────────────────────────────────────────────

  async broadcastToAdmins(payload: Omit<InAppPayload, 'userId'>): Promise<void> {
    try {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true, email: true },
      });

      for (const admin of admins) {
        await this.sendInApp({ ...payload, userId: admin.id });
        await this.sendEmail({
          to: admin.email,
          subject: payload.title,
          body: payload.message,
          // intentionally no userId — we already persisted in-app above
        });
      }

      if (admins.length === 0) {
        console.warn('[Notification] broadcastToAdmins — no ADMIN users found');
      }
    } catch (err) {
      console.error('[Notification] broadcastToAdmins error:', err);
    }
  }
}

// Export a singleton so the whole backend shares one instance
export const notificationService = new NotificationService();
