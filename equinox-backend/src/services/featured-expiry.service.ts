/**
 * Featured Expiry Service — Module: Time-Based Featured Status
 *
 * Rule: A provider is "Effectively Featured" when:
 *   (isFeatured === true  AND  daysSince(joinedDate) < 180)
 *   OR  subscriptionActive === true
 *
 * This service runs daily at 01:00 and:
 *  1. Finds providers whose free 180-day window has elapsed and isFeatured is still true.
 *  2. Sets isFeatured = false.
 *  3. Sends an in-app notification to each affected provider.
 */

import cron from 'node-cron';
import prisma from '../prisma/client';
import { notificationService } from './notification.service';

const FEATURED_DAYS = 180;

/** Compute effective featured status from DB fields — pure helper, no side-effects */
export function computeEffectiveFeatured(profile: {
  isFeatured: boolean;
  subscriptionActive: boolean;
  joinedDate: Date;
}): boolean {
  if (profile.subscriptionActive) return true;
  if (!profile.isFeatured) return false;
  const daysSinceJoined =
    (Date.now() - new Date(profile.joinedDate).getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceJoined < FEATURED_DAYS;
}

/** Returns days remaining in free featured window (0 if expired / subscription active) */
export function featuredDaysRemaining(profile: {
  isFeatured: boolean;
  subscriptionActive: boolean;
  joinedDate: Date;
}): number {
  if (profile.subscriptionActive) return Infinity;
  if (!profile.isFeatured) return 0;
  const elapsed = (Date.now() - new Date(profile.joinedDate).getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.floor(FEATURED_DAYS - elapsed));
}

/** Core scan — called by cron and by the admin trigger endpoint */
export async function runFeaturedExpiryScan(): Promise<{ expired: number; checked: number }> {
  const cutoff = new Date(Date.now() - FEATURED_DAYS * 24 * 60 * 60 * 1000);

  // Find providers whose free window expired and subscription is not active
  const expiredProfiles = await prisma.providerProfile.findMany({
    where: {
      isFeatured: true,
      subscriptionActive: false,
      joinedDate: { lt: cutoff },
    },
    select: { id: true, userId: true, businessName: true },
  });

  let expired = 0;

  for (const profile of expiredProfiles) {
    // Expire featured flag
    await prisma.providerProfile.update({
      where: { id: profile.id },
      data: { isFeatured: false },
    });

    // Notify the provider
    try {
      await notificationService.sendInApp({
        userId: profile.userId,
        type: 'SYSTEM',
        title: '⭐ Featured Period Ended',
        message:
          'Your 6-month free Featured Partner period has ended. ' +
          'You are still listed on the marketplace, but you can subscribe to regain your ' +
          'Top-Tier Featured Badge and appear at the top of search results.',
        link: '/provider/settings',
      });
    } catch {
      // Notification failure is non-fatal
    }

    expired++;
    console.log(`[FeaturedExpiry] Expired featured for provider: ${profile.businessName} (${profile.id})`);
  }

  const checked = await prisma.providerProfile.count({ where: { isFeatured: true, subscriptionActive: false } });

  console.log(`[FeaturedExpiry] Scan complete — ${checked} active free-tier | ${expired} expired`);
  return { expired, checked };
}

/** Start the daily cron (01:00 server time) */
export function startFeaturedExpiryService(): void {
  cron.schedule('0 1 * * *', () => {
    console.log('[FeaturedExpiry] Daily scan triggered');
    runFeaturedExpiryScan().catch(err =>
      console.error('[FeaturedExpiry] Scan error:', err)
    );
  });

  // Also run immediately on startup to catch any that expired while server was down
  runFeaturedExpiryScan().catch(err =>
    console.error('[FeaturedExpiry] Startup scan error:', err)
  );

  console.log('⭐ Featured Expiry service started (daily at 01:00)');
}
