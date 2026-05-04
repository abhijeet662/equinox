import type { Response } from 'express';
import prisma from '../prisma/client';
import { sendSuccess, sendError, getPagination, buildPaginationMeta } from '../utils/response';
import type { AuthRequest } from '../types';
import type { NotificationType } from '@prisma/client';

// ─── LIST MY NOTIFICATIONS ────────────────────────────────────────────────────

export const listNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', unreadOnly } = req.query as {
    page?: string; limit?: string; unreadOnly?: string;
  };

  const { skip, take } = getPagination(Number(page), Number(limit));
  const userId = req.user!.id;

  const where = {
    userId,
    ...(unreadOnly === 'true' && { read: false }),
  };

  try {
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);

    sendSuccess(res, { notifications, unreadCount }, 'Notifications fetched', 200, buildPaginationMeta(total, Number(page), Number(limit)));
  } catch {
    sendError(res, 'Failed to fetch notifications', 500);
  }
};

// ─── MARK AS READ ─────────────────────────────────────────────────────────────

export const markRead = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;
  const userId = req.user!.id;

  try {
    await prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });

    sendSuccess(res, null, 'Notification marked as read');
  } catch {
    sendError(res, 'Failed to mark notification', 500);
  }
};

// ─── MARK ALL AS READ ─────────────────────────────────────────────────────────

export const markAllRead = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  try {
    await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
    sendSuccess(res, null, 'All notifications marked as read');
  } catch {
    sendError(res, 'Failed to update notifications', 500);
  }
};

// ─── CREATE NOTIFICATION (INTERNAL HELPER — also exported for use by other controllers) ──

export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string
): Promise<void> => {
  await prisma.notification.create({ data: { userId, type, title, message, link } });
};

// ─── DELETE NOTIFICATION ──────────────────────────────────────────────────────

export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;
  const userId = req.user!.id;

  try {
    await prisma.notification.deleteMany({ where: { id, userId } });
    sendSuccess(res, null, 'Notification deleted');
  } catch {
    sendError(res, 'Failed to delete notification', 500);
  }
};
