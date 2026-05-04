import type { Response } from 'express';
import prisma from '../prisma/client';
import { sendSuccess, sendError, getPagination, buildPaginationMeta } from '../utils/response';
import { checkSlaBreached, getSlaRemainingHours, MAX_ACTIVE_TASKS } from '../utils/sla';
import type { AuthRequest } from '../types';
import type { TaskPriority, TaskStatus } from '@prisma/client';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Module 1 — Skill Gate: P0/P1 tasks require an LMS certification.
 * Applies to PROVIDER and EMPLOYEE roles.
 * P0 cert covers P0+P1; P1 cert covers P1 only.
 * Returns true if allowed, false + sends 403 if blocked.
 */
async function assertCertGate(
  assignedToId: string,
  priority: TaskPriority,
  res: Response,
): Promise<boolean> {
  if (priority !== 'P0' && priority !== 'P1') return true;

  const assignee = await prisma.user.findUnique({
    where: { id: assignedToId },
    select: { role: true },
  });
  // Only gate PROVIDER and EMPLOYEE roles
  if (assignee?.role !== 'PROVIDER' && assignee?.role !== 'EMPLOYEE') return true;

  // P0 cert grants access to P0+P1. P1 cert grants P1 only.
  const requiredTiers = priority === 'P0' ? ['P0'] : ['P0', 'P1'];

  const cert = await prisma.lMSCertification.findFirst({
    where: {
      userId: assignedToId,
      course: { requiredForTier: { in: requiredTiers } },
    },
  });

  if (!cert) {
    sendError(
      res,
      'Certification required for P0/P1 tasks. Complete the required LMS course to accept this task.',
      403,
    );
    return false;
  }
  return true;
}

/**
 * Module 3 — HR & Task Capacity Sync.
 * Returns leave info if the given user has an APPROVED leave covering today.
 */
async function getActiveLeave(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return prisma.leaveRequest.findFirst({
    where: {
      userId,
      status: 'APPROVED',
      startDate: { lte: tomorrow },
      endDate:   { gte: today },
    },
    select: { id: true, type: true, startDate: true, endDate: true },
  });
}

/**
 * Module 3 — Checks if an employee on approved leave has active P0/P1 tasks;
 * returns those tasks so the admin can be notified to reassign.
 */
export const getFlaggedCapacityTasks = async (userId: string) => {
  const leave = await getActiveLeave(userId);
  if (!leave) return { onLeave: false, flaggedTasks: [] };

  const flagged = await prisma.task.findMany({
    where: {
      assignedToId: userId,
      priority: { in: ['P0', 'P1'] },
      status: { not: 'DONE' },
    },
    select: {
      id: true, title: true, priority: true, status: true,
      createdBy: { select: { id: true, name: true } },
    },
  });

  return { onLeave: true, leave, flaggedTasks: flagged };
};

function enrichTask(task: {
  createdAt: Date;
  priority: TaskPriority;
  slaHours: number | null;
  status: TaskStatus;
  [key: string]: unknown;
}) {
  return {
    ...task,
    slaBreached: task.status !== 'DONE' ? checkSlaBreached(task.createdAt, task.priority, task.slaHours ?? undefined) : false,
    slaRemainingHours: task.status !== 'DONE' ? getSlaRemainingHours(task.createdAt, task.priority, task.slaHours ?? undefined) : null,
  };
}

// ─── LIST TASKS ───────────────────────────────────────────────────────────────

export const listTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', status, priority, assignedToId, contractId } = req.query as {
    page?: string; limit?: string; status?: TaskStatus; priority?: TaskPriority;
    assignedToId?: string; contractId?: string;
  };

  const { skip, take } = getPagination(Number(page), Number(limit));

  const user = req.user!;
  const roleFilter =
    user.role === 'PROVIDER' ? { createdById: user.id } :
    user.role === 'BUYER' ? { createdById: user.id } :
    user.role === 'EMPLOYEE' ? { assignedToId: user.id } : {};

  const where = {
    ...roleFilter,
    ...(status && { status }),
    ...(priority && { priority }),
    ...(assignedToId && user.role === 'ADMIN' && { assignedToId }),
    ...(contractId && { contractId }),
  };

  try {
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: { select: { id: true, name: true, avatar: true } },
          createdBy: { select: { id: true, name: true, avatar: true } },
          contract: { select: { id: true, title: true } },
        },
      }),
      prisma.task.count({ where }),
    ]);

    const enriched = tasks.map(enrichTask);
    sendSuccess(res, enriched, 'Tasks fetched', 200, buildPaginationMeta(total, Number(page), Number(limit)));
  } catch (err) {
    console.error('listTasks error:', err);
    sendError(res, 'Failed to fetch tasks', 500);
  }
};

// ─── GET TASK BY ID ───────────────────────────────────────────────────────────

export const getTaskById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;

  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, avatar: true, email: true } },
        createdBy: { select: { id: true, name: true, avatar: true } },
        contract: { select: { id: true, title: true } },
      },
    });

    if (!task) {
      sendError(res, 'Task not found', 404);
      return;
    }

    sendSuccess(res, enrichTask(task));
  } catch {
    sendError(res, 'Failed to fetch task', 500);
  }
};

// ─── CREATE TASK ──────────────────────────────────────────────────────────────

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    title, description, priority, assignedToId, contractId, dueDate, tags, slaHours
  } = req.body as {
    title: string; description?: string; priority?: TaskPriority;
    assignedToId?: string; contractId?: string; dueDate?: string;
    tags?: string[]; slaHours?: number;
  };

  const userId = req.user!.id;
  const effectivePriority: TaskPriority = priority || 'P2';

  try {
    // ── Gate 1: identity — block unverified providers ─────────────────────────
    if (assignedToId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assignedToId },
        select: { role: true, providerProfile: { select: { isVerified: true } } },
      });
      if (assignee?.role === 'PROVIDER' && !assignee.providerProfile?.isVerified) {
        sendError(res, 'Tasks cannot be assigned to a provider whose account is not yet verified.', 403);
        return;
      }
    }

    // ── Gate 2: skill — P0/P1 require LMS certification ──────────────────────
    if (assignedToId) {
      const passed = await assertCertGate(assignedToId, effectivePriority, res);
      if (!passed) return;
    }

    // ── Gate 3: leave-capacity — block P0/P1 assignment to employees on leave ─
    if (assignedToId && (effectivePriority === 'P0' || effectivePriority === 'P1')) {
      const leave = await getActiveLeave(assignedToId);
      if (leave) {
        sendError(
          res,
          `Assignee is on approved ${leave.type} leave until ${new Date(leave.endDate).toLocaleDateString()} and is marked Unavailable. P0/P1 tasks cannot be assigned to an unavailable employee.`,
          422,
        );
        return;
      }
    }

    // ── Blueprint §4.1.1: enforce max active tasks per priority per assignee ──
    if (assignedToId) {
      const activeCount = await prisma.task.count({
        where: {
          assignedToId,
          priority: effectivePriority,
          status: { not: 'DONE' },
        },
      });
      const cap = MAX_ACTIVE_TASKS[effectivePriority];
      if (activeCount >= cap) {
        sendError(
          res,
          `Assignee already has ${activeCount} active ${effectivePriority} tasks. Max allowed: ${cap}. Resolve existing tasks first.`,
          422
        );
        return;
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: effectivePriority,
        status: 'TODO',
        createdById: userId,
        assignedToId,
        contractId,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        tags: tags || [],
        slaHours,
      },
      include: {
        assignedTo: { select: { id: true, name: true, avatar: true } },
        createdBy: { select: { id: true, name: true, avatar: true } },
      },
    });

    sendSuccess(res, enrichTask(task), 'Task created', 201);
  } catch (err) {
    console.error('createTask error:', err);
    sendError(res, 'Failed to create task', 500);
  }
};

// ─── UPDATE TASK ──────────────────────────────────────────────────────────────

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;
  const { title, description, priority, status, assignedToId, dueDate, tags, slaHours } = req.body as {
    title?: string; description?: string; priority?: TaskPriority; status?: TaskStatus;
    assignedToId?: string; dueDate?: string; tags?: string[]; slaHours?: number;
  };

  try {
    const existing = await prisma.task.findUnique({ where: { id } });

    if (existing) {
      const targetAssignee = assignedToId ?? existing.assignedToId;
      const targetPriority: TaskPriority = priority ?? existing.priority;
      const newStatus = status ?? existing.status;

      // ── Gate 2: skill — cert check when assigning/re-prioritising ────────
      // Also fires when a provider changes their own status (accepting P0/P1 work).
      if (targetAssignee) {
        const certCheckNeeded =
          assignedToId !== undefined ||              // new assignee being set
          priority !== undefined ||                  // priority being changed
          (                                          // provider accepting their own P0/P1 task
            status !== undefined &&
            status !== 'TODO' &&
            req.user!.role === 'PROVIDER' &&
            req.user!.id === existing.assignedToId &&
            (existing.priority === 'P0' || existing.priority === 'P1')
          );

        if (certCheckNeeded) {
          const passed = await assertCertGate(targetAssignee, targetPriority, res);
          if (!passed) return;
        }
      }

      // ── Gate 3: leave-capacity — block P0/P1 re-assign to employee on leave ─
      if (
        assignedToId &&
        (targetPriority === 'P0' || targetPriority === 'P1') &&
        newStatus !== 'DONE'
      ) {
        const leave = await getActiveLeave(targetAssignee!);
        if (leave) {
          sendError(
            res,
            `Assignee is on approved ${leave.type} leave until ${new Date(leave.endDate).toLocaleDateString()} and is marked Unavailable. P0/P1 tasks cannot be assigned to an unavailable employee.`,
            422,
          );
          return;
        }
      }

      // ── Re-check task cap when reassigning or changing priority ───────────
      if ((assignedToId || priority) && targetAssignee && newStatus !== 'DONE') {
        const activeCount = await prisma.task.count({
          where: {
            assignedToId: targetAssignee,
            priority: targetPriority,
            status: { not: 'DONE' },
            id: { not: id },
          },
        });
        const cap = MAX_ACTIVE_TASKS[targetPriority];
        if (activeCount >= cap) {
          sendError(
            res,
            `Assignee already has ${activeCount} active ${targetPriority} tasks. Max allowed: ${cap}.`,
            422,
          );
          return;
        }
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        priority,
        status,
        assignedToId,
        tags,
        slaHours,
        ...(status === 'DONE' && { completedAt: new Date() }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      },
      include: {
        assignedTo: { select: { id: true, name: true, avatar: true } },
        createdBy: { select: { id: true, name: true, avatar: true } },
      },
    });

    sendSuccess(res, enrichTask(task), 'Task updated');
  } catch {
    sendError(res, 'Failed to update task', 500);
  }
};

// ─── DELETE TASK ──────────────────────────────────────────────────────────────

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;

  try {
    await prisma.task.delete({ where: { id } });
    sendSuccess(res, null, 'Task deleted');
  } catch {
    sendError(res, 'Failed to delete task', 500);
  }
};

// ─── PERFORMANCE SCORECARD (§5.2) ────────────────────────────────────────────
// Formula: (tasks completed within SLA / total tasks assigned) * 100
// A task is "On-Time" when (completedAt - createdAt) <= SLA hours for its priority.

export const getScorecardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { months = '3' } = req.query as { months?: string };

  // Default window: last N calendar months
  const since = new Date();
  since.setMonth(since.getMonth() - Math.max(1, Math.min(12, Number(months))));
  since.setHours(0, 0, 0, 0);

  try {
    const tasks = await prisma.task.findMany({
      where: {
        assignedToId: userId,
        createdAt: { gte: since },
      },
      select: {
        id: true, title: true, priority: true, status: true,
        createdAt: true, completedAt: true, slaHours: true, dueDate: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const SLA_MS: Record<string, number> = {
      P0: 4   * 3_600_000,
      P1: 8   * 3_600_000,
      P2: 48  * 3_600_000,
      P3: 96  * 3_600_000,
    };

    let totalAssigned = tasks.length;
    let completedOnTime = 0;
    let completedLate   = 0;
    let stillOpen       = 0;

    const taskDetails = tasks.map(t => {
      const allowedMs = t.slaHours ? t.slaHours * 3_600_000 : SLA_MS[t.priority];

      if (t.status === 'DONE' && t.completedAt) {
        const takenMs = t.completedAt.getTime() - t.createdAt.getTime();
        const onTime  = takenMs <= allowedMs;
        if (onTime) completedOnTime++; else completedLate++;
        return {
          ...t,
          slaAllowedHours:  Math.round(allowedMs / 3_600_000),
          takenHours:       Math.round(takenMs   / 3_600_000),
          onTime,
          breached: !onTime,
        };
      } else {
        stillOpen++;
        const nowOverdue = Date.now() - t.createdAt.getTime() > allowedMs;
        return {
          ...t,
          slaAllowedHours: Math.round(allowedMs / 3_600_000),
          takenHours:      null,
          onTime:          null,
          breached:        nowOverdue,
        };
      }
    });

    const completedTotal    = completedOnTime + completedLate;
    const productivityScore = totalAssigned > 0
      ? Math.round((completedOnTime / totalAssigned) * 100)
      : 0;
    const slaAdherenceRate  = completedTotal > 0
      ? Math.round((completedOnTime / completedTotal) * 100)
      : 0;

    // Group by month for trend chart
    const byMonth: Record<string, { onTime: number; late: number }> = {};
    tasks.forEach(t => {
      if (t.status !== 'DONE' || !t.completedAt) return;
      const key = `${t.completedAt.getFullYear()}-${String(t.completedAt.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = { onTime: 0, late: 0 };
      const allowedMs = t.slaHours ? t.slaHours * 3_600_000 : SLA_MS[t.priority];
      const takenMs   = t.completedAt.getTime() - t.createdAt.getTime();
      if (takenMs <= allowedMs) byMonth[key].onTime++; else byMonth[key].late++;
    });

    const monthlyTrend = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, counts]) => ({
        month,
        onTime:   counts.onTime,
        late:     counts.late,
        total:    counts.onTime + counts.late,
        score:    counts.onTime + counts.late > 0
          ? Math.round((counts.onTime / (counts.onTime + counts.late)) * 100)
          : 0,
      }));

    sendSuccess(res, {
      summary: {
        totalAssigned,
        completedOnTime,
        completedLate,
        stillOpen,
        productivityScore,
        slaAdherenceRate,
        windowMonths: Number(months),
      },
      monthlyTrend,
      tasks: taskDetails,
    }, 'Scorecard fetched');
  } catch (err) {
    console.error('getScorecardStats error:', err);
    sendError(res, 'Failed to fetch scorecard', 500);
  }
};

// ─── CERT ELIGIBILITY (provider self-check) ──────────────────────────────────
// Returns which priority tiers the calling provider is certified for.
// Used by the frontend to gate the status dropdown and create modal.

export const certEligibility = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  try {
    const certs = await prisma.lMSCertification.findMany({
      where: { userId },
      include: { course: { select: { requiredForTier: true } } },
    });

    const tiers = new Set(certs.map(c => c.course.requiredForTier).filter(Boolean));

    sendSuccess(res, {
      canDoP0: tiers.has('P0'),
      // P0 cert also grants P1 access
      canDoP1: tiers.has('P0') || tiers.has('P1'),
      certifiedTiers: Array.from(tiers),
    });
  } catch {
    sendError(res, 'Failed to fetch cert eligibility', 500);
  }
};

// ─── TASK SUMMARY (KANBAN COUNTS) ─────────────────────────────────────────────

export const taskSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const roleFilter =
    user.role === 'PROVIDER' ? { createdById: user.id } :
    user.role === 'EMPLOYEE' ? { assignedToId: user.id } :
    user.role === 'BUYER' ? { createdById: user.id } : {};

  try {
    const counts = await prisma.task.groupBy({
      by: ['status'],
      where: roleFilter,
      _count: { status: true },
    });

    const slaBreached = await prisma.task.count({
      where: {
        ...roleFilter,
        status: { not: 'DONE' },
        createdAt: {
          lt: new Date(Date.now() - 72 * 60 * 60 * 1000), // P2 default
        },
      },
    });

    const summary = counts.reduce((acc: Record<string, number>, c) => {
      acc[c.status] = c._count.status;
      return acc;
    }, {});

    sendSuccess(res, { ...summary, slaBreached });
  } catch {
    sendError(res, 'Failed to fetch task summary', 500);
  }
};

// ─── CAPACITY CHECK (Module 3) ────────────────────────────────────────────────
// GET /api/tasks/capacity-check?userId=xxx
// Returns whether the user is on leave today + any flagged P0/P1 tasks.
// Used by frontend when selecting an assignee.

export const capacityCheck = async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.query as { userId?: string };
  if (!userId) { sendError(res, 'userId query param required', 400); return; }

  try {
    const result = await getFlaggedCapacityTasks(userId);
    sendSuccess(res, result);
  } catch (err) {
    console.error('capacityCheck error:', err);
    sendError(res, 'Failed to check capacity', 500);
  }
};
