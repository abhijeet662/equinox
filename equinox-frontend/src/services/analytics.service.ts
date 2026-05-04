import api from './api';

export interface MarketplaceConnection {
  id: string;
  userId: string;
  platform: string;
  status: 'CONNECTED' | 'DISCONNECTED';
  mockToken: string | null;
  storeName: string | null;
  connectedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SalesDataPoint {
  id: string;
  connectionId: string;
  date: string;
  platform: string;
  revenue: number;
  orders: number;
  glanceViews: number;
  unitsSold: number;
  isAnomaly: boolean;
  anomalyNote: string | null;
}

export interface SalesSummary {
  platform: string;
  storeName: string | null;
  connectedAt: string | null;
  revenue: number;
  orders: number;
  unitsSold: number;
  glanceViews: number;
  anomalyCount: number;
}

export interface PriceChangeLog {
  id: string;
  userId: string;
  platform: string;
  productName: string;
  asin: string | null;
  oldPrice: number;
  newPrice: number;
  changePercent: number;
  changeType: 'INCREASE' | 'DECREASE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detectedAt: string;
}

export interface BrandSales {
  buyer: { id: string; name: string | null; email: string };
  platforms: { platform: string; revenue: number; orders: number; glanceViews: number }[];
  totalRevenue: number;
}

export const analyticsService = {
  async listConnections(): Promise<MarketplaceConnection[]> {
    const { data } = await api.get('/analytics/connections');
    return data.data;
  },

  async connectPlatform(platform: string): Promise<MarketplaceConnection> {
    const { data } = await api.post(`/analytics/connections/${platform}/connect`);
    return data.data;
  },

  async disconnectPlatform(platform: string): Promise<void> {
    await api.post(`/analytics/connections/${platform}/disconnect`);
  },

  async getSalesHistory(): Promise<SalesDataPoint[]> {
    const { data } = await api.get('/analytics/sales');
    return data.data;
  },

  async getSalesSummary(): Promise<SalesSummary[]> {
    const { data } = await api.get('/analytics/sales/summary');
    return data.data;
  },

  async getPriceChanges(params?: { platform?: string; severity?: string }): Promise<PriceChangeLog[]> {
    const { data } = await api.get('/analytics/price-changes', { params });
    return data.data;
  },

  async getBrandSales(): Promise<BrandSales[]> {
    const { data } = await api.get('/analytics/brand-sales');
    return data.data;
  },
};
