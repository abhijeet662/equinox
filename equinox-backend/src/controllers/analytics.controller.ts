import prisma from '../prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import type { AuthRequest } from '../types';
import type { Response } from 'express';

// ─── MOCK DATA GENERATOR ──────────────────────────────────────────────────────

const PLATFORM_BASE: Record<string, { revenue: number; orders: number; views: number }> = {
  AMAZON:   { revenue: 800,  orders: 24, views: 3200 },
  SHOPIFY:  { revenue: 400,  orders: 12, views: 1600 },
  FLIPKART: { revenue: 600,  orders: 18, views: 2400 },
  MEESHO:   { revenue: 250,  orders: 30, views: 1800 },
  D2C:      { revenue: 300,  orders:  9, views:  900 },
};

// Anomaly days from the end of the 30-day window (days 7, 15, 22 from start)
const ANOMALY_DAYS: Record<number, { note: string; multiplier: number }> = {
  7:  { note: 'Platform algorithm change — organic ranking dropped 40%', multiplier: 0.35 },
  15: { note: 'Inventory stockout — top 3 SKUs unavailable for 18 hours', multiplier: 0.40 },
  22: { note: 'Competitor price war — forced 25% markdown across catalogue', multiplier: 0.55 },
};

// Deterministic pseudo-random: seeded per (connectionId + dayIndex)
function seededRand(seed: string, day: number): number {
  let h = 0;
  const str = `${seed}-${day}`;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  // Map int32 to [0.6, 1.4]
  const normalized = ((h >>> 0) / 0xffffffff); // 0–1
  return 0.6 + normalized * 0.8;
}

async function generate30DayHistory(connectionId: string, platform: string): Promise<void> {
  const base = PLATFORM_BASE[platform] ?? PLATFORM_BASE.SHOPIFY;
  const rows = [];

  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    date.setHours(0, 0, 0, 0);

    const dayIndex = i + 1; // 1-based
    const anomaly = ANOMALY_DAYS[dayIndex];
    const factor = anomaly
      ? anomaly.multiplier
      : seededRand(connectionId, dayIndex);

    rows.push({
      connectionId,
      date,
      platform,
      revenue:     Math.round(base.revenue  * factor * 100) / 100,
      orders:      Math.max(1, Math.round(base.orders  * factor)),
      glanceViews: Math.max(10, Math.round(base.views   * factor)),
      unitsSold:   Math.max(1, Math.round(base.orders  * factor * 1.3)),
      isAnomaly:   !!anomaly,
      anomalyNote: anomaly?.note ?? null,
    });
  }

  // Upsert to avoid duplicates on re-connect
  for (const row of rows) {
    await prisma.salesDataPoint.upsert({
      where: { connectionId_date: { connectionId: row.connectionId, date: row.date } },
      update: { revenue: row.revenue, orders: row.orders, glanceViews: row.glanceViews, unitsSold: row.unitsSold, isAnomaly: row.isAnomaly, anomalyNote: row.anomalyNote },
      create: row,
    });
  }
}

const PRICE_CHANGE_TEMPLATES: Record<string, Array<{ product: string; asin: string; oldPrice: number; newPrice: number }>> = {
  AMAZON: [
    { product: 'Premium Wireless Headphones',  asin: 'B08XYZ1234', oldPrice: 2999, newPrice: 2499 },
    { product: 'Stainless Steel Water Bottle', asin: 'B07ABC5678', oldPrice:  799, newPrice:  999 },
    { product: 'Organic Face Serum 30ml',      asin: 'B09DEF9012', oldPrice: 1499, newPrice: 1299 },
    { product: 'Bluetooth Smart Speaker',      asin: 'B06GHI3456', oldPrice: 3499, newPrice: 4199 },
  ],
  SHOPIFY: [
    { product: 'Linen Summer Dress',     asin: '', oldPrice:  1800, newPrice: 1500 },
    { product: 'Handmade Scented Candle', asin: '', oldPrice:   450, newPrice:  550 },
    { product: 'Bamboo Yoga Mat',         asin: '', oldPrice:  2200, newPrice: 1900 },
  ],
  FLIPKART: [
    { product: 'Cotton Kurta Set',              asin: '', oldPrice:  899, newPrice:  749 },
    { product: 'Non-stick Cookware Set 3pc',    asin: '', oldPrice: 1599, newPrice: 1899 },
    { product: "Running Shoes Men's Size 9",    asin: '', oldPrice: 2499, newPrice: 1999 },
  ],
  MEESHO: [
    { product: 'Floral Print Saree',     asin: '', oldPrice: 650, newPrice: 550 },
    { product: 'Resin Earrings Set',     asin: '', oldPrice: 199, newPrice: 249 },
  ],
  D2C: [
    { product: 'Whey Protein 1kg Chocolate', asin: '', oldPrice: 1999, newPrice: 1799 },
    { product: 'Resistance Band Set',         asin: '', oldPrice:  599, newPrice:  699 },
  ],
};

function classifySeverity(pct: number): string {
  const abs = Math.abs(pct);
  if (abs >= 20) return 'CRITICAL';
  if (abs >= 10) return 'HIGH';
  if (abs >= 5)  return 'MEDIUM';
  return 'LOW';
}

async function generatePriceChangeLogs(userId: string, platform: string): Promise<void> {
  const templates = PRICE_CHANGE_TEMPLATES[platform] ?? [];
  for (const t of templates) {
    const changePercent = Math.round(((t.newPrice - t.oldPrice) / t.oldPrice) * 10000) / 100;
    await prisma.priceChangeLog.create({
      data: {
        userId,
        platform,
        productName:   t.product,
        asin:          t.asin || null,
        oldPrice:      t.oldPrice,
        newPrice:      t.newPrice,
        changePercent,
        changeType:    t.newPrice > t.oldPrice ? 'INCREASE' : 'DECREASE',
        severity:      classifySeverity(changePercent),
        detectedAt:    new Date(Date.now() - Math.floor(Math.random() * 7 * 86400000)),
      },
    });
  }
}

// ─── CONTROLLERS ──────────────────────────────────────────────────────────────

/** GET /analytics/connections — list caller's marketplace connections */
export const listConnections = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const connections = await prisma.marketplaceConnection.findMany({
      where: { userId },
      orderBy: { platform: 'asc' },
    });
    sendSuccess(res, connections);
  } catch (err) {
    sendError(res, 'Failed to list connections', 500);
  }
};

/** POST /analytics/connections/:platform/connect */
export const connectPlatform = async (req: AuthRequest, res: Response) => {
  try {
    const userId  = req.user!.id;
    const platform = (req.params.platform as string).toUpperCase();

    if (!Object.keys(PLATFORM_BASE).includes(platform)) {
      return sendError(res, `Unknown platform: ${platform}`, 400);
    }

    const mockToken = `mock_${platform.toLowerCase()}_${userId.slice(0, 8)}_${Date.now()}`;
    const storeName = `${req.user!.name ?? 'My Store'} on ${platform}`;

    const connection = await prisma.marketplaceConnection.upsert({
      where: { userId_platform: { userId, platform } },
      update: { status: 'CONNECTED', mockToken, storeName, connectedAt: new Date() },
      create: { userId, platform, status: 'CONNECTED', mockToken, storeName, connectedAt: new Date() },
    });

    // Generate history + price intelligence in background (don't await for speed)
    generate30DayHistory(connection.id, platform).catch(console.error);
    generatePriceChangeLogs(userId, platform).catch(console.error);

    sendSuccess(res, connection, 'Platform connected successfully');
  } catch (err) {
    console.error(err);
    sendError(res, 'Failed to connect platform', 500);
  }
};

/** POST /analytics/connections/:platform/disconnect */
export const disconnectPlatform = async (req: AuthRequest, res: Response) => {
  try {
    const userId   = req.user!.id;
    const platform = (req.params.platform as string).toUpperCase();

    const connection = await prisma.marketplaceConnection.findUnique({
      where: { userId_platform: { userId, platform } },
    });
    if (!connection) return sendError(res, 'Connection not found', 404);

    await prisma.marketplaceConnection.update({
      where: { id: connection.id },
      data: { status: 'DISCONNECTED', mockToken: null },
    });

    sendSuccess(res, null, 'Platform disconnected');
  } catch (err) {
    sendError(res, 'Failed to disconnect platform', 500);
  }
};

/** GET /analytics/sales — 30-day history (buyers see own; providers see all client brand data) */
export const getSalesHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const role   = req.user!.role;

    let connectionIds: string[] = [];

    if (role === 'BUYER' || role === 'ADMIN') {
      const conns = await prisma.marketplaceConnection.findMany({
        where: { userId, status: 'CONNECTED' },
        select: { id: true },
      });
      connectionIds = conns.map(c => c.id);
    } else if (role === 'PROVIDER') {
      // Providers see sales for buyers whose contracts they service
      const contracts = await prisma.contract.findMany({
        where: { providerId: userId, status: 'ACTIVE' },
        select: { buyerId: true },
      });
      const buyerIds = [...new Set(contracts.map(c => c.buyerId))];
      const conns = await prisma.marketplaceConnection.findMany({
        where: { userId: { in: buyerIds }, status: 'CONNECTED' },
        select: { id: true },
      });
      connectionIds = conns.map(c => c.id);
    }

    if (connectionIds.length === 0) {
      return sendSuccess(res, []);
    }

    const since = new Date();
    since.setDate(since.getDate() - 29);
    since.setHours(0, 0, 0, 0);

    const data = await prisma.salesDataPoint.findMany({
      where: { connectionId: { in: connectionIds }, date: { gte: since } },
      orderBy: { date: 'asc' },
    });

    sendSuccess(res, data);
  } catch (err) {
    sendError(res, 'Failed to fetch sales history', 500);
  }
};

/** GET /analytics/sales/summary — per-platform aggregated totals */
export const getSalesSummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const conns = await prisma.marketplaceConnection.findMany({
      where: { userId, status: 'CONNECTED' },
      select: { id: true, platform: true, storeName: true, connectedAt: true },
    });

    if (conns.length === 0) {
      return sendSuccess(res, []);
    }

    const since = new Date();
    since.setDate(since.getDate() - 29);
    since.setHours(0, 0, 0, 0);

    const result = [];
    for (const conn of conns) {
      const agg = await prisma.salesDataPoint.aggregate({
        where: { connectionId: conn.id, date: { gte: since } },
        _sum:   { revenue: true, orders: true, unitsSold: true, glanceViews: true },
        _count: { isAnomaly: true },
      });

      const anomalyCount = await prisma.salesDataPoint.count({
        where: { connectionId: conn.id, isAnomaly: true, date: { gte: since } },
      });

      result.push({
        platform:    conn.platform,
        storeName:   conn.storeName,
        connectedAt: conn.connectedAt,
        revenue:     agg._sum.revenue    ?? 0,
        orders:      agg._sum.orders     ?? 0,
        unitsSold:   agg._sum.unitsSold  ?? 0,
        glanceViews: agg._sum.glanceViews ?? 0,
        anomalyCount,
      });
    }

    sendSuccess(res, result);
  } catch (err) {
    sendError(res, 'Failed to fetch sales summary', 500);
  }
};

/** GET /analytics/price-changes — price intelligence log */
export const getPriceChanges = async (req: AuthRequest, res: Response) => {
  try {
    const userId   = req.user!.id;
    const platform = req.query.platform as string | undefined;
    const severity = req.query.severity as string | undefined;

    const logs = await prisma.priceChangeLog.findMany({
      where: {
        userId,
        ...(platform && { platform: platform.toUpperCase() }),
        ...(severity  && { severity: severity.toUpperCase() }),
      },
      orderBy: { detectedAt: 'desc' },
      take: 100,
    });

    sendSuccess(res, logs);
  } catch (err) {
    sendError(res, 'Failed to fetch price changes', 500);
  }
};

/** GET /analytics/brand-sales — provider-specific: per-brand breakdown */
export const getBrandSales = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const role   = req.user!.role;

    if (role !== 'PROVIDER' && role !== 'ADMIN') {
      return sendError(res, 'Forbidden', 403);
    }

    const contracts = await prisma.contract.findMany({
      where: { providerId: userId, status: 'ACTIVE' },
      include: { buyer: { select: { id: true, name: true, email: true } } },
    });

    const buyerMap = new Map<string, { id: string; name: string | null; email: string }>();
    contracts.forEach(c => buyerMap.set(c.buyer.id, c.buyer));

    if (buyerMap.size === 0) {
      return sendSuccess(res, []);
    }

    const since = new Date();
    since.setDate(since.getDate() - 29);
    since.setHours(0, 0, 0, 0);

    const result = [];
    for (const [buyerId, buyer] of buyerMap) {
      const conns = await prisma.marketplaceConnection.findMany({
        where: { userId: buyerId, status: 'CONNECTED' },
        select: { id: true, platform: true },
      });

      const platformData = [];
      for (const conn of conns) {
        const agg = await prisma.salesDataPoint.aggregate({
          where: { connectionId: conn.id, date: { gte: since } },
          _sum: { revenue: true, orders: true, glanceViews: true },
        });
        platformData.push({
          platform:    conn.platform,
          revenue:     agg._sum.revenue     ?? 0,
          orders:      agg._sum.orders      ?? 0,
          glanceViews: agg._sum.glanceViews ?? 0,
        });
      }

      result.push({
        buyer,
        platforms: platformData,
        totalRevenue: platformData.reduce((s, p) => s + p.revenue, 0),
      });
    }

    // Sort by total revenue desc
    result.sort((a, b) => b.totalRevenue - a.totalRevenue);
    sendSuccess(res, result);
  } catch (err) {
    sendError(res, 'Failed to fetch brand sales', 500);
  }
};
