import type { Response } from 'express';
import prisma from '../prisma/client';
import { sendSuccess, sendError, getPagination, buildPaginationMeta } from '../utils/response';
import type { AuthRequest } from '../types';
import type { MeetingStatus, MeetingType } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Lazy-init Gemini client (only used when GEMINI_API_KEY is set)
function getGeminiClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenerativeAI(key);
}

// ─── LIST MEETINGS ────────────────────────────────────────────────────────────

export const listMeetings = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', status, contractId } = req.query as {
    page?: string; limit?: string; status?: MeetingStatus; contractId?: string;
  };

  const { skip, take } = getPagination(Number(page), Number(limit));
  const userId = req.user!.id;

  // Show meetings where user is organizer OR attendee
  const where = {
    OR: [
      { organizerId: userId },
      { attendees: { some: { userId } } },
    ],
    ...(status && { status }),
    ...(contractId && { contractId }),
  };

  try {
    const [meetings, total] = await Promise.all([
      prisma.meeting.findMany({
        where,
        skip,
        take,
        orderBy: { scheduledAt: 'desc' },
        include: {
          organizer: { select: { id: true, name: true, avatar: true } },
          attendees: {
            include: { user: { select: { id: true, name: true, avatar: true } } },
          },
          contract: { select: { id: true, title: true } },
          actionItems: true,
        },
      }),
      prisma.meeting.count({ where }),
    ]);

    sendSuccess(res, meetings, 'Meetings fetched', 200, buildPaginationMeta(total, Number(page), Number(limit)));
  } catch (err) {
    console.error('listMeetings error:', err);
    sendError(res, 'Failed to fetch meetings', 500);
  }
};

// ─── GET MEETING BY ID ────────────────────────────────────────────────────────

export const getMeetingById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;

  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, name: true, avatar: true, email: true } },
        attendees: {
          include: { user: { select: { id: true, name: true, avatar: true, email: true } } },
        },
        contract: { select: { id: true, title: true } },
        actionItems: true,
      },
    });

    if (!meeting) {
      sendError(res, 'Meeting not found', 404);
      return;
    }

    sendSuccess(res, meeting);
  } catch {
    sendError(res, 'Failed to fetch meeting', 500);
  }
};

// ─── CREATE MEETING ───────────────────────────────────────────────────────────

export const createMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    title, type, scheduledAt, duration, location, agenda, contractId, attendeeIds,
  } = req.body as {
    title: string;
    type?: MeetingType;
    scheduledAt: string;
    duration?: number;
    location?: string;
    agenda?: string;
    contractId?: string;
    attendeeIds?: string[];
  };

  const organizerId = req.user!.id;

  try {
    const meeting = await prisma.meeting.create({
      data: {
        title,
        type: type || 'OTHER',
        status: 'SCHEDULED',
        scheduledAt: new Date(scheduledAt),
        duration: duration || 30,
        location,
        agenda,
        contractId,
        organizerId,
        attendees: attendeeIds?.length
          ? {
              create: attendeeIds.map((userId) => ({ userId })),
            }
          : undefined,
      },
      include: {
        organizer: { select: { id: true, name: true, avatar: true } },
        attendees: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
        },
        contract: { select: { id: true, title: true } },
        actionItems: true,
      },
    });

    sendSuccess(res, meeting, 'Meeting created', 201);
  } catch (err) {
    console.error('createMeeting error:', err);
    sendError(res, 'Failed to create meeting', 500);
  }
};

// ─── UPDATE MEETING ───────────────────────────────────────────────────────────

export const updateMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;
  const { title, type, status, scheduledAt, duration, location, agenda, mom } = req.body as {
    title?: string;
    type?: MeetingType;
    status?: MeetingStatus;
    scheduledAt?: string;
    duration?: number;
    location?: string;
    agenda?: string;
    mom?: string;
  };

  try {
    const meeting = await prisma.meeting.update({
      where: { id },
      data: {
        title,
        type,
        status,
        duration,
        location,
        agenda,
        mom,
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
        ...(mom !== undefined && { momGeneratedAt: new Date() }),
      },
      include: {
        organizer: { select: { id: true, name: true, avatar: true } },
        attendees: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
        },
        actionItems: true,
      },
    });

    sendSuccess(res, meeting, 'Meeting updated');
  } catch {
    sendError(res, 'Failed to update meeting', 500);
  }
};

// ─── DELETE MEETING ───────────────────────────────────────────────────────────

export const deleteMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;

  try {
    await prisma.meeting.delete({ where: { id } });
    sendSuccess(res, null, 'Meeting deleted');
  } catch {
    sendError(res, 'Failed to delete meeting', 500);
  }
};

// ─── GENERATE MOM (AI Minutes of Meeting via Gemini) ─────────────────────────

export const generateMom = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;

  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        organizer: { select: { name: true } },
        attendees: { include: { user: { select: { name: true, role: true } } } },
        actionItems: true,
        contract: { select: { title: true } },
      },
    });

    if (!meeting) { sendError(res, 'Meeting not found', 404); return; }

    const attendeeNames = meeting.attendees.map((a) => a.user.name).join(', ') || 'N/A';
    const actionSummary = meeting.actionItems.length > 0
      ? meeting.actionItems.map((item, i) =>
          `${i + 1}. ${item.description}${item.dueDate ? ` (Due: ${new Date(item.dueDate).toLocaleDateString()})` : ''}${item.done ? ' [Done]' : '[Pending]'}`
        ).join('\n')
      : 'No action items recorded.';

    let mom: string;

    const gemini = getGeminiClient();

    if (gemini) {
      // ── Gemini AI path ──────────────────────────────────────────────────────
      const model = gemini.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      });

      const prompt = `You are a professional meeting secretary for a B2B SaaS platform called Equinox.
Generate a detailed, professional "Minutes of Meeting" (MoM) document from the following meeting information.

MEETING DETAILS:
- Title: ${meeting.title}
- Type: ${meeting.type}
- Date: ${new Date(meeting.scheduledAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Time: ${new Date(meeting.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
- Duration: ${meeting.duration} minutes
- Location/Channel: ${meeting.location || 'Not specified'}
- Organizer: ${meeting.organizer.name}
- Attendees: ${attendeeNames}
${meeting.contract ? `- Related Contract: ${meeting.contract.title}` : ''}

AGENDA:
${meeting.agenda || 'No formal agenda was set for this meeting.'}

EXISTING ACTION ITEMS:
${actionSummary}

INSTRUCTIONS:
1. Write a complete, professional MoM document with these sections: Header, Attendees, Agenda Summary, Discussion Points (infer from agenda), Decisions Made, Action Items, Next Steps.
2. After the MoM, on a new line write "SUGGESTED_TASKS:" followed by a JSON array of suggested task objects. Each task must have: { "title": string, "priority": "P0"|"P1"|"P2"|"P3", "description": string }. Suggest 2-4 tasks based on the action items and discussion.
3. Keep the MoM professional, concise and structured.
4. Do not include any markdown formatting — use plain text only.`;

      const result = await model.generateContent(prompt);
      mom = result.response.text();

      // Extract suggested tasks JSON from AI response and persist as action items
      const taskMatch = mom.match(/SUGGESTED_TASKS:\s*(\[[\s\S]*?\])/);
      if (taskMatch) {
        mom = mom.replace(/SUGGESTED_TASKS:[\s\S]*$/, '').trim();
        try {
          const suggestedTasks: { title: string; priority: string; description: string }[] =
            JSON.parse(taskMatch[1]);

          // Create action items in DB for each suggested task
          if (suggestedTasks.length > 0) {
            await prisma.meetingActionItem.createMany({
              data: suggestedTasks.map(t => ({
                meetingId: id,
                description: `[AI Suggested] ${t.title} — ${t.description}`,
                done: false,
              })),
            });
          }
        } catch {
          // Ignore parse errors — MoM text is still valid
        }
      }
    } else {
      // ── Fallback: template-based MoM when no API key is set ────────────────
      mom = `MINUTES OF MEETING
==================
Meeting: ${meeting.title}
Type: ${meeting.type}
Date: ${new Date(meeting.scheduledAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Time: ${new Date(meeting.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
Duration: ${meeting.duration} minutes
Location: ${meeting.location || 'Not specified'}
Organizer: ${meeting.organizer.name}
Attendees: ${attendeeNames}

AGENDA
------
${meeting.agenda || 'No agenda provided.'}

ACTION ITEMS
------------
${actionSummary}

NOTE: Add your GEMINI_API_KEY environment variable to enable AI-powered MoM generation.
---
Minutes generated by Equinox on ${new Date().toLocaleDateString()}.`;
    }

    const updated = await prisma.meeting.update({
      where: { id },
      data: { mom, momGeneratedAt: new Date() },
      include: { actionItems: true },
    });

    sendSuccess(res, {
      mom: updated.mom,
      momGeneratedAt: updated.momGeneratedAt,
      actionItems: updated.actionItems,
      aiPowered: !!gemini,
    }, 'Minutes of Meeting generated');
  } catch (err: unknown) {
    const errMsg = String(err instanceof Error ? err.message : JSON.stringify(err));
    console.error('generateMom error:', errMsg);
    // Surface Gemini quota / rate-limit messages to the client
    const errObj = err as { status?: number; statusText?: string; errorDetails?: unknown[] };
    if (errObj?.status === 429 || errMsg.includes('429') || errMsg.includes('quota')) {
      const retryMatch = JSON.stringify(errObj).match(/"retryDelay":"([^"]+)"/);
      const retryIn = retryMatch ? ` Retry in ${retryMatch[1]}.` : '';
      sendError(res, `Gemini API quota exceeded.${retryIn} Switch GEMINI_MODEL env var to gemini-2.5-flash.`, 429);
      return;
    }
    if (errMsg.includes('404') || errMsg.includes('not found')) {
      sendError(res, `AI model not available: ${errMsg.slice(0, 120)}`, 503);
      return;
    }
    sendError(res, `Failed to generate MoM: ${errMsg.slice(0, 120)}`, 500);
  }
};

// ─── MARK ATTENDANCE ──────────────────────────────────────────────────────────

export const markAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;
  const { userId, attended } = req.body as { userId: string; attended: boolean };

  try {
    const attendee = await prisma.meetingAttendee.updateMany({
      where: { meetingId: id, userId },
      data: { attended },
    });

    if (attendee.count === 0) {
      sendError(res, 'Attendee not found for this meeting', 404);
      return;
    }

    sendSuccess(res, null, 'Attendance updated');
  } catch {
    sendError(res, 'Failed to update attendance', 500);
  }
};

// ─── ADD ACTION ITEM ──────────────────────────────────────────────────────────

export const addActionItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;
  const { description, assigneeId, dueDate } = req.body as {
    description: string;
    assigneeId?: string;
    dueDate?: string;
  };

  try {
    const item = await prisma.meetingActionItem.create({
      data: {
        meetingId: id,
        description,
        assigneeId,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      },
    });

    sendSuccess(res, item, 'Action item added', 201);
  } catch {
    sendError(res, 'Failed to add action item', 500);
  }
};

// ─── TOGGLE ACTION ITEM DONE ──────────────────────────────────────────────────

export const toggleActionItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const { itemId } = req.params as Record<string, string>;

  try {
    const item = await prisma.meetingActionItem.findUnique({ where: { id: itemId } });
    if (!item) { sendError(res, 'Action item not found', 404); return; }

    const updated = await prisma.meetingActionItem.update({
      where: { id: itemId },
      data: { done: !item.done },
    });

    sendSuccess(res, updated, 'Action item updated');
  } catch {
    sendError(res, 'Failed to update action item', 500);
  }
};
