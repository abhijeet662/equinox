import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, TrendingUp, FileText, BarChart2, Users, ShoppingBag, Globe } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { useApi } from '../../hooks/useApi';
import { invoicesService } from '../../services/invoices.service';
import { contractsService } from '../../services/contracts.service';
import { analyticsService, type BrandSales } from '../../services/analytics.service';
import Badge from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../utils/helpers';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

const PLATFORM_COLORS: Record<string, string> = {
  AMAZON:   '#F97316',
  SHOPIFY:  '#10B981',
  FLIPKART: '#3B82F6',
  MEESHO:   '#A855F7',
  D2C:      '#6366F1',
};

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

interface Invoice {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  buyer?: { name: string };
}

interface Contract {
  type: string;
  value: number;
}

// ─── Brand card ───────────────────────────────────────────────────────────────

function BrandCard({ brand }: { brand: BrandSales }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
          <Users size={16} className="text-indigo-600" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{brand.buyer.name || brand.buyer.email}</p>
          <p className="text-xs text-gray-400 truncate">{brand.buyer.email}</p>
        </div>
        <div className="ml-auto text-right flex-shrink-0">
          <p className="text-sm font-bold text-emerald-600">{formatCompact(brand.totalRevenue)}</p>
          <p className="text-xs text-gray-400">30-day rev</p>
        </div>
      </div>

      {brand.platforms.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-2">No connected platforms</p>
      ) : (
        <div className="space-y-2">
          {brand.platforms.map(p => (
            <div key={p.platform} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PLATFORM_COLORS[p.platform] ?? '#6366F1' }} />
              <span className="text-xs text-gray-600 flex-1">{p.platform}</span>
              <span className="text-xs font-semibold text-gray-900">{formatCompact(p.revenue)}</span>
              <span className="text-xs text-gray-400">{p.orders} orders</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const ProviderSalesPage: React.FC = () => {
  const { data: invoicesRes }  = useApi(() => invoicesService.list({ limit: 200 }), []);
  const { data: contractsRes } = useApi(() => contractsService.list({ limit: 100 }), []);

  const [brandSales,    setBrandSales]    = useState<BrandSales[]>([]);
  const [brandLoading,  setBrandLoading]  = useState(true);

  const loadBrandSales = useCallback(async () => {
    setBrandLoading(true);
    try {
      const data = await analyticsService.getBrandSales();
      setBrandSales(data);
    } catch { /* no active contracts yet */ } finally {
      setBrandLoading(false);
    }
  }, []);

  useEffect(() => { loadBrandSales(); }, [loadBrandSales]);

  const invoices:  Invoice[]  = invoicesRes?.data  || [];
  const contracts: Contract[] = contractsRes?.data || [];

  const paidInvoices = invoices.filter(inv => inv.status === 'PAID');
  const currentYear  = new Date().getFullYear();

  // Monthly revenue chart
  const monthlyRevMap: Record<string, number> = {};
  paidInvoices.forEach(inv => {
    const d = new Date(inv.createdAt);
    if (d.getFullYear() === currentYear) {
      const m = MONTHS[d.getMonth()];
      monthlyRevMap[m] = (monthlyRevMap[m] || 0) + (inv.total || 0);
    }
  });
  const revenueChartData = MONTHS.slice(0, new Date().getMonth() + 1).map(month => ({
    month, revenue: monthlyRevMap[month] || 0,
  }));

  const now              = new Date();
  const revenueThisMonth = paidInvoices
    .filter(inv => { const d = new Date(inv.createdAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
    .reduce((s, inv) => s + (inv.total || 0), 0);
  const revenueThisYear  = paidInvoices.filter(inv => new Date(inv.createdAt).getFullYear() === currentYear).reduce((s, inv) => s + (inv.total || 0), 0);
  const totalInvoiced    = invoices.reduce((s, inv) => s + (inv.total || 0), 0);
  const avgInvoice       = invoices.length > 0 ? totalInvoiced / invoices.length : 0;

  const typeMap: Record<string, number> = {};
  contracts.forEach(c => { const type = c.type || 'Other'; typeMap[type] = (typeMap[type] || 0) + 1; });
  const pieData = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

  const recentPaid = [...paidInvoices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Brand summary totals
  const totalBrandRevenue = brandSales.reduce((s, b) => s + b.totalRevenue, 0);
  const activeBrands      = brandSales.filter(b => b.platforms.length > 0).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Sales Dashboard</h1>
        <p className="text-surface-500 text-sm mt-1">Your revenue performance and client brand marketplace data</p>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Revenue This Month', value: formatCurrency(revenueThisMonth), icon: <DollarSign size={20} className="text-primary-600" />, bg: 'bg-primary-50' },
          { title: 'Revenue This Year',  value: formatCurrency(revenueThisYear),  icon: <TrendingUp size={20} className="text-emerald-600" />,  bg: 'bg-emerald-50' },
          { title: 'Total Invoiced',     value: formatCurrency(totalInvoiced),     icon: <FileText size={20} className="text-amber-600" />,      bg: 'bg-amber-50' },
          { title: 'Avg Invoice Value',  value: formatCurrency(avgInvoice),        icon: <BarChart2 size={20} className="text-purple-600" />,    bg: 'bg-purple-50' },
        ].map(s => (
          <div key={s.title} className="card flex items-center gap-4">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>{s.icon}</div>
            <div>
              <p className="text-lg font-bold text-surface-900">{s.value}</p>
              <p className="text-xs text-surface-500">{s.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h2 className="font-bold text-surface-800 mb-4">Monthly Revenue ({currentYear})</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v as number) / 1000}k`} />
              <Tooltip formatter={(v: unknown) => formatCurrency(v as number)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="font-bold text-surface-800 mb-4">Contract Types</h2>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: unknown) => `${v} contracts`} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {pieData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-surface-600">{item.name}</span>
                    </div>
                    <span className="font-semibold text-surface-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-surface-400 text-sm text-center py-8">No contracts yet</p>
          )}
        </div>
      </div>

      {/* ─── Client Brand Marketplace Performance ─────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ShoppingBag size={18} className="text-orange-500" />
          <h2 className="text-lg font-bold text-gray-900">Client Brand Marketplace Performance</h2>
          <span className="text-xs text-gray-400 ml-1">(30-day)</span>
        </div>

        {brandLoading ? (
          <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
            Loading brand data…
          </div>
        ) : brandSales.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center">
            <Globe size={28} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500">No brand data available</p>
            <p className="text-xs text-gray-400 mt-1">
              Brand marketplace data appears here once your clients connect their platforms and you have active contracts.
            </p>
          </div>
        ) : (
          <>
            {/* Summary strip */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              {[
                { label: 'Client Brands', value: brandSales.length, color: 'text-indigo-600' },
                { label: 'With Live Data', value: activeBrands, color: 'text-emerald-600' },
                { label: 'Combined 30-Day Rev', value: formatCompact(totalBrandRevenue), color: 'text-orange-600' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Brand cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {brandSales.map(b => <BrandCard key={b.buyer.id} brand={b} />)}
            </div>
          </>
        )}
      </div>

      {/* Recent paid invoices */}
      <div className="card">
        <h2 className="font-bold text-surface-800 mb-4">Recent Paid Invoices</h2>
        {recentPaid.length === 0 ? (
          <p className="text-surface-400 text-sm text-center py-8">No paid invoices yet</p>
        ) : (
          <div className="space-y-3">
            {recentPaid.map(inv => (
              <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-50 transition-colors">
                <div>
                  <p className="font-medium text-surface-900 text-sm">{inv.buyer?.name || 'Unknown buyer'}</p>
                  <p className="text-xs text-surface-400">{formatDate(inv.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-emerald-600">{formatCurrency(inv.total)}</span>
                  <Badge label="paid" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderSalesPage;
