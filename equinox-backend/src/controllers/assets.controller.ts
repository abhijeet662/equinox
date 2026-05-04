import type { Response } from 'express';
import prisma from '../prisma/client';
import { sendSuccess, sendError, getPagination, buildPaginationMeta } from '../utils/response';
import type { AuthRequest } from '../types';
import type { AssetStatus, AssetType } from '@prisma/client';

// ─── LIST ASSETS ──────────────────────────────────────────────────────────────

export const listAssets = async (req: AuthRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20', status, category, assignedToId } = req.query as {
    page?: string; limit?: string; status?: AssetStatus; category?: string; assignedToId?: string;
  };

  const { skip, take } = getPagination(Number(page), Number(limit));

  const where = {
    ...(status && { status }),
    ...(category && { category }),
    ...(assignedToId && { assignedToId }),
  };

  try {
    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: { select: { id: true, name: true, email: true, role: true } },
          createdBy: { select: { id: true, name: true } },
        },
      }),
      prisma.asset.count({ where }),
    ]);

    sendSuccess(res, assets, 'Assets fetched', 200, buildPaginationMeta(total, Number(page), Number(limit)));
  } catch (err) {
    console.error('listAssets error:', err);
    sendError(res, 'Failed to fetch assets', 500);
  }
};

// ─── GET ASSET BY ID ──────────────────────────────────────────────────────────

export const getAssetById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;

  try {
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!asset) { sendError(res, 'Asset not found', 404); return; }
    sendSuccess(res, asset);
  } catch {
    sendError(res, 'Failed to fetch asset', 500);
  }
};

// ─── CREATE ASSET ─────────────────────────────────────────────────────────────

export const createAsset = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, type, category, serialNo, platform, description, status, assignedToId, notes } = req.body as {
    name: string; type: AssetType; category: string; serialNo?: string;
    platform?: string; description?: string; status?: AssetStatus;
    assignedToId?: string; notes?: string;
  };

  const createdById = req.user!.id;

  try {
    const asset = await prisma.asset.create({
      data: {
        name, type, category,
        serialNo, platform, description, notes,
        status: status || (assignedToId ? 'ASSIGNED' : 'AVAILABLE'),
        assignedToId,
        assignedAt: assignedToId ? new Date() : undefined,
        createdById,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    sendSuccess(res, asset, 'Asset created', 201);
  } catch (err) {
    console.error('createAsset error:', err);
    sendError(res, 'Failed to create asset', 500);
  }
};

// ─── UPDATE ASSET ─────────────────────────────────────────────────────────────

export const updateAsset = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;
  const { name, type, category, serialNo, platform, description, status, assignedToId, notes } = req.body as {
    name?: string; type?: AssetType; category?: string; serialNo?: string;
    platform?: string; description?: string; status?: AssetStatus;
    assignedToId?: string | null; notes?: string;
  };

  try {
    const existing = await prisma.asset.findUnique({ where: { id } });
    if (!existing) { sendError(res, 'Asset not found', 404); return; }

    // If a new assignee is being set, record assignedAt
    const isNewAssignment = assignedToId !== undefined && assignedToId !== existing.assignedToId;

    const asset = await prisma.asset.update({
      where: { id },
      data: {
        name, type, category, serialNo, platform, description, notes, status,
        assignedToId,
        ...(isNewAssignment && assignedToId && { assignedAt: new Date(), revokedAt: null, revokedById: null }),
        ...(isNewAssignment && !assignedToId && { assignedAt: null }),
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    sendSuccess(res, asset, 'Asset updated');
  } catch (err) {
    console.error('updateAsset error:', err);
    sendError(res, 'Failed to update asset', 500);
  }
};

// ─── DELETE ASSET ─────────────────────────────────────────────────────────────

export const deleteAsset = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params as Record<string, string>;

  try {
    await prisma.asset.delete({ where: { id } });
    sendSuccess(res, null, 'Asset deleted');
  } catch {
    sendError(res, 'Failed to delete asset', 500);
  }
};

// ─── OFFBOARD USER (Module 4 — Security Register) ────────────────────────────
// POST /api/assets/offboard/:userId
// Lists all assets assigned to the user, marks them REVOKED,
// and unlinks them from the employee. Returns revocation summary.

export const offboardUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params as Record<string, string>;
  const adminId = req.user!.id;

  try {
    // Fetch all currently assigned assets
    const assigned = await prisma.asset.findMany({
      where: { assignedToId: userId, status: { not: 'REVOKED' } },
      include: { assignedTo: { select: { id: true, name: true, email: true } } },
    });

    if (assigned.length === 0) {
      sendSuccess(res, { revokedCount: 0, assets: [] }, 'No assets assigned to this user — offboarding complete.');
      return;
    }

    // Revoke all assets in a single transaction
    await prisma.asset.updateMany({
      where: { assignedToId: userId, status: { not: 'REVOKED' } },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
        revokedById: adminId,
        assignedToId: null,
        assignedAt: null,
      },
    });

    // Re-fetch for the response
    const revokedAssets = await prisma.asset.findMany({
      where: {
        id: { in: assigned.map(a => a.id) },
      },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    sendSuccess(res, {
      revokedCount: revokedAssets.length,
      revokedAt: new Date(),
      revokedById: adminId,
      user: assigned[0].assignedTo,
      assets: revokedAssets,
    }, `${revokedAssets.length} asset(s) revoked. Offboarding complete.`);
  } catch (err) {
    console.error('offboardUser error:', err);
    sendError(res, 'Failed to offboard user', 500);
  }
};

// ─── GET USER'S ASSETS (for offboarding preview) ─────────────────────────────

export const getUserAssets = async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params as Record<string, string>;

  try {
    const assets = await prisma.asset.findMany({
      where: { assignedToId: userId },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { assignedAt: 'desc' },
    });

    const user = assets.length > 0 ? assets[0].assignedTo : null;

    sendSuccess(res, { user, assets, totalAssets: assets.length });
  } catch {
    sendError(res, 'Failed to fetch user assets', 500);
  }
};
