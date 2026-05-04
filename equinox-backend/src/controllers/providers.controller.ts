import type { Response } from 'express';
import prisma from '../prisma/client';
import { sendSuccess, sendError, getPagination, buildPaginationMeta } from '../utils/response';
import type { AuthRequest } from '../types';
import { notificationService } from '../services/notification.service';
import { computeEffectiveFeatured, featuredDaysRemaining } from '../services/featured-expiry.service';

// ─── LIST PROVIDERS (PUBLIC MARKETPLACE) ─────────────────────────────────────

export const listProviders = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', category, search, minRating } = req.query as {
    page?: string; limit?: string; category?: string; search?: string; minRating?: string;
  };

  const { skip, take } = getPagination(Number(page), Number(limit));

  const where = {
    isVerified: true,   // public marketplace: only admin-approved providers
    ...(category && { category }),
    ...(search && {
      OR: [
        { businessName: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
    ...(minRating && { rating: { gte: Number(minRating) } }),
  };

  try {
    const [profiles, total] = await Promise.all([
      prisma.providerProfile.findMany({
        where,
        skip,
        take,
        orderBy: { rating: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true, status: true } },
        },
      }),
      prisma.providerProfile.count({ where }),
    ]);

    // Compute effective featured status and inject it into each profile
    const enriched = profiles.map(p => ({
      ...p,
      effectiveFeatured: computeEffectiveFeatured(p),
      featuredDaysLeft: featuredDaysRemaining(p),
    }));

    // Sort: featured providers bubble to the top, then by rating
    enriched.sort((a, b) => {
      if (a.effectiveFeatured && !b.effectiveFeatured) return -1;
      if (!a.effectiveFeatured && b.effectiveFeatured) return 1;
      return b.rating - a.rating;
    });

    sendSuccess(res, enriched, 'Providers fetched', 200, buildPaginationMeta(total, Number(page), Number(limit)));
  } catch (err) {
    console.error('listProviders error:', err);
    sendError(res, 'Failed to fetch providers', 500);
  }
};

// ─── GET PROVIDER BY ID ───────────────────────────────────────────────────────

export const getProviderById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;

  try {
    const profile = await prisma.providerProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true, phone: true, company: true } },
        reviews: {
          where: { isPublic: true },
          orderBy: { publishedAt: 'desc' },
          take: 10,
          include: { buyer: { select: { id: true, name: true, avatar: true } } },
        },
      },
    });

    if (!profile) {
      sendError(res, 'Provider not found', 404);
      return;
    }

    sendSuccess(res, profile);
  } catch {
    sendError(res, 'Failed to fetch provider', 500);
  }
};

// ─── GET MY PROVIDER PROFILE ──────────────────────────────────────────────────

export const getMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  try {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true, phone: true, company: true } },
      },
    });

    if (!profile) {
      sendError(res, 'Provider profile not found', 404);
      return;
    }

    sendSuccess(res, profile);
  } catch {
    sendError(res, 'Failed to fetch profile', 500);
  }
};

// ─── UPDATE MY PROVIDER PROFILE ───────────────────────────────────────────────

export const updateMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { businessName, description, category, services, website, address, logoInitials } = req.body as {
    businessName?: string; description?: string; category?: string;
    services?: string[]; website?: string; address?: string; logoInitials?: string;
  };

  try {
    const profile = await prisma.providerProfile.update({
      where: { userId },
      data: { businessName, description, category, services, website, address, logoInitials },
    });

    sendSuccess(res, profile, 'Profile updated');
  } catch {
    sendError(res, 'Failed to update profile', 500);
  }
};

// ─── GET PROVIDER STATS ───────────────────────────────────────────────────────

export const getProviderStats = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  try {
    const profile = await prisma.providerProfile.findUnique({ where: { userId } });
    if (!profile) {
      sendError(res, 'Provider profile not found', 404);
      return;
    }

    const [totalContracts, activeContracts, totalInvoices, pendingInvoices, taskStats] = await Promise.all([
      prisma.contract.count({ where: { providerId: userId } }),
      prisma.contract.count({ where: { providerId: userId, status: 'ACTIVE' } }),
      prisma.invoice.count({ where: { providerId: userId } }),
      prisma.invoice.count({ where: { providerId: userId, status: 'PENDING' } }),
      prisma.task.groupBy({
        by: ['status'],
        where: { assignedToId: userId },
        _count: true,
      }),
    ]);

    sendSuccess(res, { totalContracts, activeContracts, totalInvoices, pendingInvoices, taskStats });
  } catch {
    sendError(res, 'Failed to fetch stats', 500);
  }
};

// ─── ADMIN: LIST ALL PROVIDERS (no verification filter) ──────────────────────

export const listAllProvidersAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '100', search, category } = req.query as {
    page?: string; limit?: string; search?: string; category?: string;
  };
  const { skip, take } = getPagination(Number(page), Number(limit));
  const where = {
    ...(category && { category }),
    ...(search && {
      OR: [
        { businessName: { contains: search, mode: 'insensitive' as const } },
        { category: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  };
  try {
    const [profiles, total] = await Promise.all([
      prisma.providerProfile.findMany({
        where, skip, take, orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true, avatar: true, status: true } } },
      }),
      prisma.providerProfile.count({ where }),
    ]);
    sendSuccess(res, profiles, 'All providers fetched', 200, buildPaginationMeta(total, Number(page), Number(limit)));
  } catch (err) {
    console.error('listAllProvidersAdmin error:', err);
    sendError(res, 'Failed to fetch providers', 500);
  }
};

// ─── PROVIDER: APPLY FOR VERIFICATION ────────────────────────────────────────

export const applyForVerification = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { documentUrls } = req.body as { documentUrls?: string[] };

  try {
    const existing = await prisma.providerProfile.findUnique({ where: { userId } });
    if (!existing) { sendError(res, 'Provider profile not found', 404); return; }

    if (existing.verificationStatus === 'VERIFIED') {
      sendError(res, 'Your account is already verified.', 400);
      return;
    }
    if (existing.verificationStatus === 'PENDING') {
      sendError(res, 'A verification request is already under review.', 400);
      return;
    }

    const profile = await prisma.providerProfile.update({
      where: { userId },
      data: {
        verificationStatus: 'PENDING',
        documentUrls: documentUrls || existing.documentUrls,
        rejectionReason: null,
      },
    });

    // Notify admins
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
    await Promise.all(admins.map(admin =>
      notificationService.sendInApp({
        userId: admin.id,
        title: '📋 New Verification Request',
        message: `${existing.businessName} has submitted a verification request and is awaiting your review.`,
        type: 'INFO',
        link: '/admin/providers',
      })
    ));

    sendSuccess(res, profile, 'Verification request submitted successfully');
  } catch (err) {
    console.error('applyForVerification error:', err);
    sendError(res, 'Failed to submit verification request', 500);
  }
};

// ─── ADMIN: GET PENDING PROVIDERS ────────────────────────────────────────────

export const getPendingProviders = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profiles = await prisma.providerProfile.findMany({
      where: { isVerified: false },   // all unverified: both UNVERIFIED (not applied) and PENDING (applied)
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, company: true, status: true, createdAt: true } },
      },
      orderBy: [
        { verificationStatus: 'asc' },  // PENDING first (applied), then UNVERIFIED
        { createdAt: 'asc' },
      ],
    });
    sendSuccess(res, profiles);
  } catch {
    sendError(res, 'Failed to fetch pending providers', 500);
  }
};

// ─── ADMIN: APPROVE PROVIDER ──────────────────────────────────────────────────

export const approveProvider = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;
  try {
    const profile = await prisma.providerProfile.update({
      where: { id },
      data: {
        verificationStatus: 'VERIFIED',
        verified: true,
        isVerified: true,
        verifiedAt: new Date(),
        rejectionReason: null,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    await notificationService.sendInApp({
      userId: profile.userId,
      title: '🎉 Account Approved!',
      message: 'Your provider account has been verified by our team. You now appear in the Equinox marketplace.',
      type: 'SUCCESS',
      link: '/provider',
    });

    await notificationService.sendEmail({
      to: profile.user.email,
      subject: 'Welcome to Equinox — Your Account is Verified!',
      body: `Hi ${profile.user.name},\n\nGreat news! Your provider account for "${profile.businessName}" has been approved.\n\nYou are now visible in the Equinox marketplace. Brands can find and contract you directly.\n\nLog in to complete your profile and start receiving proposals.\n\nThe Equinox Team`,
      userId: profile.userId,
    });

    sendSuccess(res, profile, 'Provider approved successfully');
  } catch {
    sendError(res, 'Failed to approve provider', 500);
  }
};

// ─── ADMIN: REJECT PROVIDER ───────────────────────────────────────────────────

export const rejectProvider = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;
  const { reason } = req.body as { reason: string };

  if (!reason?.trim()) {
    sendError(res, 'A rejection reason is required', 400);
    return;
  }

  try {
    const profile = await prisma.providerProfile.update({
      where: { id },
      data: {
        verificationStatus: 'REJECTED',
        verified: false,
        isVerified: false,
        rejectionReason: reason.trim(),
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    await notificationService.sendInApp({
      userId: profile.userId,
      title: 'Application Not Approved',
      message: `Your provider application was not approved. Reason: ${reason}. You may resubmit after addressing the issue.`,
      type: 'WARNING',
      link: '/provider/settings',
    });

    await notificationService.sendEmail({
      to: profile.user.email,
      subject: 'Equinox — Provider Application Update',
      body: `Hi ${profile.user.name},\n\nThank you for applying to join the Equinox provider network.\n\nAfter reviewing your application for "${profile.businessName}", we are unable to approve it at this time.\n\nReason: ${reason}\n\nYou may resubmit your application after addressing the above. If you have questions, contact us at support@equinox.ai.\n\nThe Equinox Team`,
      userId: profile.userId,
    });

    sendSuccess(res, profile, 'Provider application rejected');
  } catch {
    sendError(res, 'Failed to reject provider', 500);
  }
};

// ─── ADMIN: VERIFY PROVIDER (legacy quick-verify — also sets verificationStatus) ──

export const verifyProvider = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;
  try {
    const updated = await prisma.providerProfile.update({
      where: { id },
      data: { verified: true, isVerified: true, verificationStatus: 'VERIFIED', verifiedAt: new Date() },
    });
    sendSuccess(res, updated, 'Provider verified');
  } catch {
    sendError(res, 'Failed to verify provider', 500);
  }
};

// ─── ADMIN: FORCE-FEATURE PROVIDER (resets 180-day window) ───────────────────

export const featureProvider = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;
  try {
    const current = await prisma.providerProfile.findUnique({ where: { id } });
    if (!current) { sendError(res, 'Not found', 404); return; }

    const nowFeatured = !current.featured;
    const updated = await prisma.providerProfile.update({
      where: { id },
      data: {
        featured: nowFeatured,
        // When force-featuring, also refresh isFeatured + reset joinedDate so
        // the 180-day free window starts from today.
        ...(nowFeatured && {
          isFeatured: true,
          joinedDate: new Date(),
        }),
      },
    });

    sendSuccess(
      res,
      { ...updated, effectiveFeatured: computeEffectiveFeatured(updated), featuredDaysLeft: featuredDaysRemaining(updated) },
      updated.featured ? 'Provider force-featured (180-day window reset)' : 'Provider unfeatured',
    );
  } catch {
    sendError(res, 'Failed to update provider', 500);
  }
};

// ─── ADMIN: TOGGLE SUBSCRIPTION ───────────────────────────────────────────────

export const setProviderSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;
  const { subscriptionActive } = req.body as { subscriptionActive?: boolean };
  try {
    const current = await prisma.providerProfile.findUnique({ where: { id } });
    if (!current) { sendError(res, 'Not found', 404); return; }

    const newState = subscriptionActive !== undefined ? subscriptionActive : !current.subscriptionActive;

    const updated = await prisma.providerProfile.update({
      where: { id },
      data: { subscriptionActive: newState },
    });

    // Notify provider when subscription is manually activated by admin
    if (newState) {
      try {
        await notificationService.sendInApp({
          userId: current.userId,
          type: 'SYSTEM',
          title: '⭐ Subscription Activated',
          message:
            'Your Featured Partner subscription has been activated by the platform team. ' +
            'You will appear at the top of Marketplace search results with the Featured Partner badge.',
          link: '/provider',
        });
      } catch { /* non-fatal */ }
    }

    sendSuccess(
      res,
      { ...updated, effectiveFeatured: computeEffectiveFeatured(updated), featuredDaysLeft: featuredDaysRemaining(updated) },
      newState ? 'Subscription activated' : 'Subscription deactivated',
    );
  } catch {
    sendError(res, 'Failed to update subscription', 500);
  }
};

// ─── PROVIDER: GET MY FEATURED STATUS ────────────────────────────────────────

export const getMyFeaturedStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  try {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      select: { isFeatured: true, subscriptionActive: true, joinedDate: true },
    });
    if (!profile) { sendError(res, 'Provider profile not found', 404); return; }

    const effectiveFeatured = computeEffectiveFeatured(profile);
    const daysLeft = featuredDaysRemaining(profile);
    const freePeriodExpired = !profile.subscriptionActive && !effectiveFeatured;

    sendSuccess(res, {
      isFeatured: profile.isFeatured,
      subscriptionActive: profile.subscriptionActive,
      joinedDate: profile.joinedDate,
      effectiveFeatured,
      daysLeft: daysLeft === Infinity ? null : daysLeft,
      freePeriodExpired,
    });
  } catch {
    sendError(res, 'Failed to fetch featured status', 500);
  }
};

// ─── ADMIN: SUSPEND PROVIDER ──────────────────────────────────────────────────

export const suspendProvider = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;
  try {
    const profile = await prisma.providerProfile.findUnique({ where: { id } });
    if (!profile) { sendError(res, 'Not found', 404); return; }
    await prisma.user.update({ where: { id: profile.userId }, data: { status: 'SUSPENDED' } });
    sendSuccess(res, null, 'Provider suspended');
  } catch {
    sendError(res, 'Failed to suspend provider', 500);
  }
};

// ─── ADMIN: COMPREHENSIVE PROVIDER DETAIL ─────────────────────────────────────
// Single endpoint that aggregates everything an admin needs about a provider.

export const getProviderAdminDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>; // ProviderProfile.id

  try {
    // 1. Core profile + user + wallet
    const profile = await prisma.providerProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true, name: true, email: true, avatar: true,
            phone: true, company: true, status: true, createdAt: true,
            walletAccount: {
              select: {
                balance: true, currency: true,
                transactions: {
                  orderBy: { createdAt: 'desc' },
                  take: 15,
                  select: { id: true, type: true, amount: true, description: true, reference: true, status: true, createdAt: true },
                },
              },
            },
          },
        },
      },
    });

    if (!profile) { sendError(res, 'Provider not found', 404); return; }

    const userId = profile.userId;

    // 2. Parallel aggregation queries
    const [tasks, contracts, invoices, reviews, lmsEnrollments] = await Promise.all([
      prisma.task.findMany({
        where: { assignedToId: userId },
        include: {
          contract: { select: { title: true, buyer: { select: { name: true, company: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.contract.findMany({
        where: { providerId: userId },
        include: { buyer: { select: { id: true, name: true, company: true, email: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.invoice.findMany({
        where: { providerId: userId },
        include: { buyer: { select: { name: true, company: true } }, items: true },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.review.findMany({
        where: { providerId: id },   // admin sees all statuses
        include: { buyer: { select: { name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.lMSEnrollment.findMany({
        where: { userId },
        include: { course: { select: { title: true, category: true, level: true, duration: true } } },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    // 3. SLA success rate (completed tasks only)
    const doneTasks = tasks.filter(t => t.status === 'DONE');
    const slaTracked = doneTasks.filter(t => t.completedAt && t.dueDate);
    const slaOnTime  = slaTracked.filter(t => new Date(t.completedAt!) <= new Date(t.dueDate!));
    const slaSuccessRate = slaTracked.length > 0
      ? Math.round((slaOnTime.length / slaTracked.length) * 100)
      : null;

    // 4. Active task load by priority (capacity caps: P0=2, P1=4, P2=8, P3=10)
    const activeTasks = tasks.filter(t => t.status !== 'DONE');
    const taskLoad = {
      P0: { active: activeTasks.filter(t => t.priority === 'P0').length, cap: 2 },
      P1: { active: activeTasks.filter(t => t.priority === 'P1').length, cap: 4 },
      P2: { active: activeTasks.filter(t => t.priority === 'P2').length, cap: 8 },
      P3: { active: activeTasks.filter(t => t.priority === 'P3').length, cap: 10 },
    };

    // 5. Financial summary
    const totalRevenue   = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.total, 0);
    const pendingRevenue = invoices.filter(i => i.status === 'PENDING').reduce((s, i) => s + i.total, 0);

    sendSuccess(res, {
      profile,
      slaSuccessRate,
      taskLoad,
      tasks,
      contracts,
      invoices,
      reviews,
      lmsEnrollments,
      financials: { totalRevenue, pendingRevenue },
    });
  } catch (err) {
    console.error('getProviderAdminDetail error:', err);
    sendError(res, 'Failed to fetch provider detail', 500);
  }
};

// ─── LIST PROVIDER CATEGORIES ─────────────────────────────────────────────────

export const listCategories = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const categories = await prisma.providerProfile.groupBy({
      by: ['category'],
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
    });

    sendSuccess(res, categories);
  } catch {
    sendError(res, 'Failed to fetch categories', 500);
  }
};
