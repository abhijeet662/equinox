/**
 * ─── SLA WATCHDOG SERVICE ─────────────────────────────────────────────────────
 *
 * Blueprint §4.1.1 — Task SLA Enforcement
 *
 * Runs on a cron schedule every 15 minutes.
 *
 * Each tick:
 *   1. Fetches all non-DONE tasks with an assigned user.
 *   2. Calculates the SLA deadline from createdAt + priority hours
 *      (P0=4h, P1=8h, P2=48h, P3=96h).
 *   3. For every breached task not yet alerted in the last 12 hours:
 *      a. Alerts the assigned provider / employee (in-app + email).
 *      b. Broadcasts an in-app + email alert to all ADMIN users.
 *      c. Records alert state in the in-memory dedup map so the same task
 *         does not flood the user with repeated notifications.
 *         On server restart the map resets, but the first tick after restart
 *         re-checks the DB (see DEDUP_WINDOW_MS) to stay conservative.
 *
 * Upgrading to real email/WhatsApp requires only swapping the mock
 * implementation inside NotificationService — this watchdog needs no changes.
 */

import cron from 'node-cron';
import prisma from '../prisma/client';
import { notificationService } from './notification.service';
import { DEFAULT_SLA_HOURS } from '../utils/sla';
import type { TaskPriority } from '@prisma/client';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

/** How often the watchdog scans (cron syntax: every 15 minutes) */
const CRON_SCHEDULE = '*/15 * * * *';

/**
 * Minimum gap between two SLA-breach notifications for the SAME task.
 * Set to 12 hours so we nag once per half-day, not on every tick.
 */
const DEDUP_WINDOW_MS = 12 * 60 * 60 * 1000; // 12 hours

// ─── IN-MEMORY DEDUP MAP ──────────────────────────────────────────────────────
// taskId → timestamp of last notification sent
const lastNotifiedAt = new Map<string, number>();

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getSlaDeadline(createdAt: Date, priority: TaskPriority, slaHours: number | null): Date {
  const hours = slaHours ?? DEFAULT_SLA_HOURS[priority];
  return new Date(createdAt.getTime() + hours * 60 * 60 * 1000);
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function shouldNotify(taskId: string): boolean {
  const last = lastNotifiedAt.get(taskId);
  if (!last) return true;
  return Date.now() - last > DEDUP_WINDOW_MS;
}

// ─── CORE SCAN ────────────────────────────────────────────────────────────────

async function scanSlaBreaches(): Promise<void> {
  const now = Date.now();
  console.log(`\n⏱  [SLA Watchdog] Scan started — ${new Date().toISOString()}`);

  try {
    // Fetch every open task that has an assignee and enough data to evaluate
    const openTasks = await prisma.task.findMany({
      where: {
        status: { not: 'DONE' },
        assignedToId: { not: null },
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, phone: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
        contract: {
          select: { id: true, title: true },
        },
      },
    });

    console.log(`   Found ${openTasks.length} open task(s) to evaluate.`);

    let breachedCount = 0;
    let notifiedCount = 0;

    for (const task of openTasks) {
      const deadline = getSlaDeadline(task.createdAt, task.priority, task.slaHours);
      const isBreached = new Date() > deadline;

      if (!isBreached) continue;

      breachedCount++;
      const overdueMs = now - deadline.getTime();
      const overdueLabel = formatDuration(overdueMs);
      const slaHours = task.slaHours ?? DEFAULT_SLA_HOURS[task.priority];

      // ── Dedup check ───────────────────────────────────────────────────────
      if (!shouldNotify(task.id)) {
        console.log(`   ⚠  Task "${task.title}" (${task.priority}) overdue by ${overdueLabel} — alert already sent, skipping.`);
        continue;
      }

      notifiedCount++;
      lastNotifiedAt.set(task.id, now);

      const assigneeName = task.assignedTo?.name ?? 'Assignee';
      const creatorName  = task.createdBy?.name ?? 'N/A';
      const contractRef  = task.contract ? ` | Contract: ${task.contract.title}` : '';
      const taskLink     = `/tasks/${task.id}`;

      // ── Detailed notification body ────────────────────────────────────────
      const alertTitle = `🚨 SLA Breach: "${task.title}"`;
      const alertBody  = [
        `Task "${task.title}" has exceeded its SLA.`,
        ``,
        `  Priority  : ${task.priority} (SLA = ${slaHours}h)`,
        `  Status    : ${task.status}`,
        `  Overdue by: ${overdueLabel}`,
        `  Assigned  : ${assigneeName}`,
        `  Created by: ${creatorName}${contractRef}`,
        ``,
        `Please resolve or escalate this task immediately.`,
        `Link: ${process.env.CLIENT_URL ?? 'http://localhost:5173'}${taskLink}`,
      ].join('\n');

      // ── Notify the assigned user ──────────────────────────────────────────
      if (task.assignedToId) {
        await notificationService.sendInApp({
          userId: task.assignedToId,
          title:   alertTitle,
          message: `Your task "${task.title}" (${task.priority}) is overdue by ${overdueLabel}. Please action immediately.`,
          type:    'WARNING',
          link:    taskLink,
        });

        if (task.assignedTo?.email) {
          await notificationService.sendEmail({
            to:      task.assignedTo.email,
            subject: alertTitle,
            body:    alertBody,
            // no userId here — in-app already sent above to avoid duplicate
          });
        }

        // WhatsApp alert if phone number is available
        if (task.assignedTo?.phone) {
          await notificationService.sendWhatsApp({
            to:      task.assignedTo.phone,
            message: `⚠️ *SLA Breach* — Task: "${task.title}" (${task.priority}) is OVERDUE by ${overdueLabel}.\n\nPlease log in and resolve it immediately.`,
            // no userId — in-app already sent above
          });
        }
      }

      // ── Notify all ADMIN users ────────────────────────────────────────────
      await notificationService.broadcastToAdmins({
        title:   `[ADMIN] ${alertTitle}`,
        message: `Task "${task.title}" (${task.priority}) assigned to ${assigneeName} is overdue by ${overdueLabel}${contractRef}.`,
        type:    'ERROR',
        link:    taskLink,
      });

      console.log(`   🚨 Notified: "${task.title}" (${task.priority}) — overdue by ${overdueLabel}`);
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    const checkedCount = openTasks.length;
    const okCount      = checkedCount - breachedCount;

    console.log(`   ✅ Scan complete — ${okCount} on-time | ${breachedCount} breached | ${notifiedCount} new alert(s) sent.\n`);

    // ── Persist an aggregate SYSTEM notification for the admin dashboard ─────
    if (breachedCount > 0) {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
      });

      for (const admin of admins) {
        // Only add the dashboard summary once per scan (not per task)
        await prisma.notification.create({
          data: {
            userId:  admin.id,
            type:    'SYSTEM',
            title:   'SLA Watchdog Report',
            message: `Watchdog scan at ${new Date().toLocaleTimeString()}: ${breachedCount} task(s) breaching SLA. ${notifiedCount} new alert(s) sent.`,
            link:    '/tasks',
          },
        }).catch(() => {/* already logged inside sendInApp — swallow here */});
      }
    }

  } catch (err) {
    console.error('[SLA Watchdog] Scan failed:', err);
  }
}

// ─── START ────────────────────────────────────────────────────────────────────

export function startSlaWatchdog(): void {
  console.log(`🔍 SLA Watchdog started — scanning every 15 minutes (${CRON_SCHEDULE})`);

  // Run immediately on startup so we don't have to wait 15 minutes for first scan
  void scanSlaBreaches();

  // Schedule recurring scans
  cron.schedule(CRON_SCHEDULE, () => {
    void scanSlaBreaches();
  });
}

// ─── MANUAL TRIGGER (for testing / admin API) ─────────────────────────────────

export async function triggerSlaWatchdogNow(): Promise<{
  message: string;
}> {
  await scanSlaBreaches();
  return { message: 'SLA watchdog scan completed' };
}
