/**
 * ─── DAILY DIGEST SERVICE ─────────────────────────────────────────────────────
 *
 * Blueprint §4.1 — Automated Daily Report for Providers
 *
 * Runs once per day at 07:00 AM server-local time (configurable via
 * DAILY_DIGEST_CRON env var).
 *
 * For each PROVIDER user on the platform it compiles:
 *   • Tasks completed today
 *   • Tasks currently open (with any SLA-breached count)
 *   • Invoices raised today & their total value
 *   • Current wallet balance
 *   • Active contract count
 *
 * Currently operates in mock mode:
 *   • Logs the full report to the console (easy to inspect in dev)
 *   • Saves a Notification record to the DB (visible in the front-end bell)
 *   • Saves an AIInsight record (visible on the AI Insights dashboard)
 *
 * Upgrading to live email delivery requires only calling
 * notificationService.sendEmail() inside the loop — the data-gathering
 * logic needs zero changes.
 */

import cron from 'node-cron';
import prisma from '../prisma/client';
import { notificationService } from './notification.service';
import { DEFAULT_SLA_HOURS } from '../utils/sla';
import type { TaskPriority } from '@prisma/client';

// ─── CONFIG ───────────────────────────────────────────────────────────────────

/** Default: 07:00 every day. Override with DAILY_DIGEST_CRON env var. */
const CRON_SCHEDULE = process.env.DAILY_DIGEST_CRON ?? '0 7 * * *';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface ProviderDigest {
  userId: string;
  name: string;
  email: string;
  tasksCompletedToday: number;
  tasksOpen: number;
  tasksBreachingSlaNow: number;
  invoicesToday: number;
  invoiceTotalToday: number;
  walletBalance: number;
  walletCurrency: string;
  activeContracts: number;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSlaBreached(createdAt: Date, priority: TaskPriority, slaHours: number | null): boolean {
  const hours = slaHours ?? DEFAULT_SLA_HOURS[priority];
  const deadline = new Date(createdAt.getTime() + hours * 60 * 60 * 1000);
  return new Date() > deadline;
}

function formatCurrency(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function buildReportText(d: ProviderDigest): string {
  const lines = [
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `  EQUINOX DAILY DIGEST — ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
    `  Provider : ${d.name} <${d.email}>`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `  📋 TASKS`,
    `     Completed today   : ${d.tasksCompletedToday}`,
    `     Currently open    : ${d.tasksOpen}`,
    `     Breaching SLA now : ${d.tasksBreachingSlaNow}${d.tasksBreachingSlaNow > 0 ? ' ⚠️  ACTION REQUIRED' : ''}`,
    ``,
    `  🧾 INVOICES (today)`,
    `     Count             : ${d.invoicesToday}`,
    `     Total value       : ${formatCurrency(d.invoiceTotalToday, d.walletCurrency)}`,
    ``,
    `  💰 WALLET`,
    `     Balance           : ${formatCurrency(d.walletBalance, d.walletCurrency)}`,
    ``,
    `  📄 CONTRACTS`,
    `     Active            : ${d.activeContracts}`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
  ];
  return lines.join('\n');
}

// ─── CORE DIGEST RUNNER ───────────────────────────────────────────────────────

async function runDailyDigest(): Promise<void> {
  console.log(`\n📊 [Daily Digest] Starting — ${new Date().toISOString()}`);

  try {
    const today = startOfToday();

    // Fetch every PROVIDER user
    const providers = await prisma.user.findMany({
      where: { role: 'PROVIDER' },
      select: { id: true, name: true, email: true },
    });

    console.log(`   Processing digest for ${providers.length} provider(s)…`);

    for (const provider of providers) {
      try {
        // ── Gather data in parallel for speed ──────────────────────────────
        const [
          tasksCompletedToday,
          openTasks,
          invoicesTodayResult,
          wallet,
          activeContracts,
        ] = await Promise.all([
          // Tasks completed today
          prisma.task.count({
            where: {
              createdById: provider.id,
              status:      'DONE',
              completedAt: { gte: today },
            },
          }),

          // All open tasks (to evaluate SLA)
          prisma.task.findMany({
            where: {
              createdById: provider.id,
              status:      { not: 'DONE' },
            },
            select: { id: true, priority: true, slaHours: true, createdAt: true },
          }),

          // Invoices created today + their total
          prisma.invoice.aggregate({
            where: {
              providerId: provider.id,
              createdAt:  { gte: today },
            },
            _count: { id: true },
            _sum:   { total: true },
          }),

          // Wallet balance (auto-safe — may not exist yet)
          prisma.walletAccount.findUnique({
            where:  { userId: provider.id },
            select: { balance: true, currency: true },
          }),

          // Active contracts
          prisma.contract.count({
            where: { providerId: provider.id, status: 'ACTIVE' },
          }),
        ]);

        // Evaluate SLA breaches among open tasks
        const tasksBreachingSlaNow = openTasks.filter((t) =>
          isSlaBreached(t.createdAt, t.priority, t.slaHours)
        ).length;

        const digest: ProviderDigest = {
          userId:              provider.id,
          name:                provider.name,
          email:               provider.email,
          tasksCompletedToday,
          tasksOpen:           openTasks.length,
          tasksBreachingSlaNow,
          invoicesToday:       invoicesTodayResult._count.id,
          invoiceTotalToday:   invoicesTodayResult._sum.total ?? 0,
          walletBalance:       wallet?.balance ?? 0,
          walletCurrency:      wallet?.currency ?? 'USD',
          activeContracts,
        };

        const reportText = buildReportText(digest);

        // ── MOCK: Log the full report to the server console ─────────────────
        console.log(reportText);

        // ── TODO (production): send real email ───────────────────────────────
        // await notificationService.sendEmail({
        //   to:      provider.email,
        //   subject: `Equinox Daily Digest — ${new Date().toLocaleDateString()}`,
        //   body:    reportText,
        //   userId:  provider.id,
        // });

        // ── Persist in-app notification (visible in FE bell) ─────────────────
        const inAppMessage = [
          `📋 Tasks: ${digest.tasksCompletedToday} completed today, ${digest.tasksOpen} open.`,
          digest.tasksBreachingSlaNow > 0
            ? `⚠️  ${digest.tasksBreachingSlaNow} task(s) breaching SLA.`
            : '✅ All tasks within SLA.',
          `💰 Wallet: ${formatCurrency(digest.walletBalance, digest.walletCurrency)}.`,
          `📄 ${digest.activeContracts} active contract(s).`,
        ].join('  ');

        await notificationService.sendInApp({
          userId:  provider.id,
          title:   `Daily Digest — ${new Date().toLocaleDateString()}`,
          message: inAppMessage,
          type:    digest.tasksBreachingSlaNow > 0 ? 'WARNING' : 'INFO',
          link:    '/tasks',
        });

        // ── Persist as AIInsight (visible on AI dashboard) ────────────────────
        await prisma.aIInsight.create({
          data: {
            userId:  provider.id,
            type:    'DAILY_DIGEST',
            title:   `Daily Report — ${new Date().toLocaleDateString()}`,
            content: reportText,
            isActive: true,
            metadata: {
              tasksCompletedToday,
              tasksOpen:           openTasks.length,
              tasksBreachingSlaNow,
              invoicesToday:       digest.invoicesToday,
              invoiceTotalToday:   digest.invoiceTotalToday,
              walletBalance:       digest.walletBalance,
              activeContracts,
              generatedAt:         new Date().toISOString(),
            },
          },
        });

      } catch (providerErr) {
        console.error(`[Daily Digest] Error for provider ${provider.name}:`, providerErr);
        // Continue processing remaining providers even if one fails
      }
    }

    // ── Admin summary notification ─────────────────────────────────────────
    if (providers.length > 0) {
      await notificationService.broadcastToAdmins({
        title:   'Daily Digest Sent',
        message: `Daily digest generated for ${providers.length} provider(s) on ${new Date().toLocaleDateString()}.`,
        type:    'SYSTEM',
        link:    '/admin',
      });
    }

    console.log(`   ✅ Daily Digest complete — ${providers.length} provider(s) processed.\n`);

  } catch (err) {
    console.error('[Daily Digest] Fatal error during run:', err);
  }
}

// ─── START ────────────────────────────────────────────────────────────────────

export function startDailyDigest(): void {
  console.log(`📊 Daily Digest scheduled — runs at: ${CRON_SCHEDULE}`);

  cron.schedule(CRON_SCHEDULE, () => {
    void runDailyDigest();
  });
}

// ─── MANUAL TRIGGER (for testing / admin API) ─────────────────────────────────

export async function triggerDailyDigestNow(): Promise<{ message: string }> {
  await runDailyDigest();
  return { message: 'Daily digest generated successfully' };
}
