import type { Response } from 'express';
import prisma from '../prisma/client';
import { sendSuccess, sendError, getPagination, buildPaginationMeta } from '../utils/response';
import { notificationService } from '../services/notification.service';
import type { AuthRequest } from '../types';
import type { ReviewStatus } from '@prisma/client';

// ─── HELPER: recalculate provider rating from PUBLISHED reviews only ──────────

async function recalcProviderRating(providerId: string) {
  const stats = await prisma.review.aggregate({
    where: { providerId, isPublic: true },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.providerProfile.update({
    where: { id: providerId },
    data: {
      rating: Math.round((stats._avg.rating || 0) * 10) / 10,
      reviewCount: stats._count.rating,
    },
  });
}

// ─── LIST PUBLISHED REVIEWS FOR A PROVIDER (public) ──────────────────────────

export const listReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  const { providerId } = req.params as Record<string, string>;
  const { page = '1', limit = '10' } = req.query as { page?: string; limit?: string };
  const { skip, take } = getPagination(Number(page), Number(limit));

  try {
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { providerId, isPublic: true },
        skip, take,
        orderBy: { publishedAt: 'desc' },
        include: { buyer: { select: { id: true, name: true, avatar: true } } },
      }),
      prisma.review.count({ where: { providerId, isPublic: true } }),
    ]);

    sendSuccess(res, reviews, 'Reviews fetched', 200, buildPaginationMeta(total, Number(page), Number(limit)));
  } catch {
    sendError(res, 'Failed to fetch reviews', 500);
  }
};

// ─── CREATE REVIEW (submitted as PENDING_MODERATION) ─────────────────────────

export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  const { providerId, contractId, rating, comment } = req.body as {
    providerId: string; contractId?: string; rating: number; comment?: string;
  };

  const buyerId = req.user!.id;

  if (rating < 1 || rating > 5) {
    sendError(res, 'Rating must be between 1 and 5', 400);
    return;
  }

  try {
    if (contractId) {
      const existing = await prisma.review.findFirst({ where: { buyerId, contractId } });
      if (existing) {
        sendError(res, 'You have already reviewed this contract', 409);
        return;
      }
    }

    const review = await prisma.review.create({
      data: {
        providerId, buyerId, contractId, rating, comment,
        status: 'PENDING_MODERATION',
        isPublic: false,
      },
      include: { buyer: { select: { id: true, name: true, avatar: true } } },
    });

    // Notify admins a new review needs moderation
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
    await Promise.all(admins.map(admin =>
      notificationService.sendInApp({
        userId: admin.id,
        title: '⭐ New Review Pending Moderation',
        message: `A ${rating}-star review has been submitted and is awaiting your approval.`,
        type: 'INFO',
        link: '/admin/reviews',
      })
    ));

    sendSuccess(res, review, 'Review submitted and pending moderation', 201);
  } catch (err) {
    console.error('createReview error:', err);
    sendError(res, 'Failed to submit review', 500);
  }
};

// ─── ADMIN: MODERATION QUEUE ──────────────────────────────────────────────────

export const getModerationQueue = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '50', status } = req.query as {
    page?: string; limit?: string; status?: ReviewStatus;
  };
  const { skip, take } = getPagination(Number(page), Number(limit));

  const where = status ? { status } : { status: { in: ['PENDING_MODERATION', 'FLAGGED'] as ReviewStatus[] } };

  try {
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        include: {
          buyer: { select: { id: true, name: true, email: true, avatar: true } },
          provider: { select: { id: true, businessName: true, category: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);

    sendSuccess(res, reviews, 'Moderation queue fetched', 200, buildPaginationMeta(total, Number(page), Number(limit)));
  } catch {
    sendError(res, 'Failed to fetch moderation queue', 500);
  }
};

// ─── ADMIN: LIST ALL REVIEWS ──────────────────────────────────────────────────

export const listAllReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '50', status } = req.query as {
    page?: string; limit?: string; status?: ReviewStatus;
  };
  const { skip, take } = getPagination(Number(page), Number(limit));
  const where = status ? { status } : {};

  try {
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        include: {
          buyer: { select: { id: true, name: true, email: true, avatar: true } },
          provider: { select: { id: true, businessName: true, category: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);

    sendSuccess(res, reviews, 'Reviews fetched', 200, buildPaginationMeta(total, Number(page), Number(limit)));
  } catch {
    sendError(res, 'Failed to fetch reviews', 500);
  }
};

// ─── ADMIN: APPROVE REVIEW ────────────────────────────────────────────────────

export const approveReview = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;

  try {
    const review = await prisma.review.update({
      where: { id },
      data: { status: 'PUBLISHED', isPublic: true, publishedAt: new Date() },
      include: {
        buyer: { select: { id: true, name: true } },
        provider: { select: { id: true, businessName: true, userId: true } },
      },
    });

    await recalcProviderRating(review.providerId);

    // Notify the reviewer
    await notificationService.sendInApp({
      userId: review.buyerId,
      title: '✅ Your Review is Now Live',
      message: `Your feedback for ${review.provider.businessName} has been verified and is now public.`,
      type: 'SUCCESS',
      link: `/providers/${review.providerId}`,
    });

    sendSuccess(res, review, 'Review approved and published');
  } catch {
    sendError(res, 'Failed to approve review', 500);
  }
};

// ─── ADMIN: REJECT REVIEW ─────────────────────────────────────────────────────

export const rejectReview = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;
  const { reason } = req.body as { reason?: string };

  try {
    const review = await prisma.review.update({
      where: { id },
      data: {
        status: 'REJECTED',
        isPublic: false,
        moderatorNote: reason || 'Does not meet community guidelines',
      },
      include: { buyer: { select: { id: true, name: true } } },
    });

    // Recalc in case it was previously published and is now being un-published
    const full = await prisma.review.findUnique({ where: { id }, select: { providerId: true } });
    if (full) await recalcProviderRating(full.providerId);

    await notificationService.sendInApp({
      userId: review.buyerId,
      title: 'Review Not Published',
      message: `Your review could not be published. Reason: ${review.moderatorNote}`,
      type: 'WARNING',
      link: '/buyer',
    });

    sendSuccess(res, review, 'Review rejected');
  } catch {
    sendError(res, 'Failed to reject review', 500);
  }
};

// ─── ADMIN: FLAG REVIEW (edit comment before publishing) ─────────────────────

export const flagReview = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;
  const { editedComment, moderatorNote } = req.body as {
    editedComment?: string;
    moderatorNote?: string;
  };

  try {
    const review = await prisma.review.update({
      where: { id },
      data: {
        status: 'FLAGGED',
        ...(editedComment !== undefined && { comment: editedComment }),
        moderatorNote: moderatorNote || 'Flagged for review',
      },
    });

    sendSuccess(res, review, 'Review flagged');
  } catch {
    sendError(res, 'Failed to flag review', 500);
  }
};

// ─── ADMIN: DELETE REVIEW ─────────────────────────────────────────────────────

export const deleteReview = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;
  try {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) { sendError(res, 'Review not found', 404); return; }
    await prisma.review.delete({ where: { id } });
    await recalcProviderRating(review.providerId);
    sendSuccess(res, null, 'Review deleted');
  } catch {
    sendError(res, 'Failed to delete review', 500);
  }
};
