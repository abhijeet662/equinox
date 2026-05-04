import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, FileText, CreditCard, BarChart2,
  ShoppingBag, AlertTriangle, ArrowUpRight, ArrowDownRight,
  TrendingDown, Zap, Link2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { useApi } from '../../hooks/useApi';
import { walletService } from '../../services/wallet.service';
import { invoicesService } from '../../services/invoices.service';
import { contractsService } from '../../services/contracts.service';
import {
  analyticsService,
  type SalesDataPoint,
  type SalesSummary,
  type PriceChangeLog,
} from '../../services/analytics.service';
import { formatCurrency, formatDate } from '../../utils/helpers';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PLATFORM_COLORS: Record<string, string> = {
  AMAZON: '#F97316',
  SHOPIFY: '#10B981',
  FLIPKART: '#3B82F6',
  MEESHO: '#A855F7',
  D2C: '#6366F1',
};

const SEVERITY_STYLE: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-700 border-red-200',
  HIGH:     'bg-orange-100 text-orange-700 border-orange-200',
  MEDIUM:   'bg-amber-100 text-amber-700 border-amber-200',
  LOW:      'bg-gray-100 text-gray-600 border-gray-200',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

// ─── Platform summary card ────────────────────────────────────────────────────

function PlatformSummaryCard({ s }: { s: SalesSummary }) {
  const color = PLATFORM_COLORS[s.platform] ?? '#6366F1';
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
          <span className="font-semibold text-gray-900 text-sm">{s.platform}</span>
        </div>
        {s.anomalyCount > 0 && (
          <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-medium">
            {s.anomalyCount} alert{s.anomalyCount > 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xs text-gray-400">Revenue</p>
          <p className="font-bold text-gray-900 text-sm">{formatCompact(s.revenue)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xs text-gray-400">Orders</p>
          <p className="font-bold text-gray-900 text-sm">{s.orders.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xs text-gray-400">Units Sold</p>
          <p className="font-bold text-gray-900 text-sm">{s.unitsSold.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xs text-gray-400">Glance Views</p>
          <p className="font-bold text-gray-900 text-sm">{(s.glanceViews / 1000).toFixed(1)}K</p>
        </div>
      </div>
    </div>
  );
}

// ─── Anomaly alert row ────────────────────────────────────────────────────────

function AnomalyRow({ point }: { point: SalesDataPoint }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
      <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-red-700">{point.platform}</span>
          <span className="text-xs text-red-500">
            {new Date(point.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
        </div>
        <p className="text-xs text-red-600 mt-0.5 truncate">{point.anomalyNote}</p>
        <p className="text-xs text-red-400 mt-0.5">
          Revenue: {formatCompact(point.revenue)} · Orders: {point.orders}
        </p>
      </div>
    </div>
  );
}

// ─── Price change row ─────────────────────────────────────────────────────────

function PriceChangeRow({ log }: { log: PriceChangeLog }) {
  const isIncrease = log.changeType === 'INCREASE';
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className={`p-1.5 rounded-lg ${isIncrease ? 'bg-green-50' : 'bg-red-50'}`}>
        {isIncrease
          ? <ArrowUpRight size={14} className="text-green-600" />
          : <ArrowDownRight size={14} className="text-red-600" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-900 truncate">{log.productName}</p>
        <p className="text-xs text-gray-400">
          {log.platform} · {new Date(log.detectedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-xs font-bold ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
          {isIncrease ? '+' : ''}{log.changePercent.toFixed(1)}%
        </p>
        <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${SEVERITY_STYLE[log.severity]}`}>
          {log.severity}
        </span>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const BuyerAnalyticsPage: React.FC = () => {
  // Existing ERP data
  const { data: txRes }        = useApi(() => walletService.getTransactions({ limit: 200 }), []);
  const { data: invoicesRes }  = useApi(() => invoicesService.list({ limit: 200 }), []);
  const { data: contractsRes } = useApi(() => contractsService.list({ status: 'ACTIVE', limit: 200 }), []);

  // Marketplace data
  const [salesHistory,   setSalesHistory]   = useState<SalesDataPoint[]>([]);
  const [salesSummary,   setSalesSummary]   = useState<SalesSummary[]>([]);
  const [priceChanges,   setPriceChanges]   = useState<PriceChangeLog[]>([]);
  const [marketLoading,  setMarketLoading]  = useState(true);

  const loadMarketplace = useCallback(async () => {
    setMarketLoading(true);
    try {
      const [history, summary, prices] = await Promise.all([
        analyticsService.getSalesHistory(),
        analyticsService.getSalesSummary(),
        analyticsService.getPriceChanges(),
      ]);
      setSalesHistory(history);
      setSalesSummary(summary);
      setPriceChanges(prices);
    } catch { /* no connections yet */ } finally {
      setMarketLoading(false);
    }
  }, []);

  useEffect(() => { loadMarketplace(); }, [loadMarketplace]);

  // ERP computations
  const transactions: Record<string, unknown>[] = txRes?.data || [];
  const invoices:     Record<string, unknown>[] = invoicesRes?.data || [];
  const activeContracts: Record<string, unknown>[] = contractsRes?.data || [];

  const debits       = transactions.filter(tx => tx.type === 'DEBIT');
  const totalSpent   = debits.reduce((sum, tx) => sum + (tx.amount as number || 0), 0);
  const pendingInvoices = invoices.filter(i => i.status === 'PENDING');
  const pendingTotal = pendingInvoices.reduce((sum, i) => sum + (i.totalAmount as number || i.amount as number || 0), 0);
  const paidInvoices    = invoices.filter(i => i.status === 'PAID');
  const overdueInvoices = invoices.filter(i => i.status === 'OVERDUE');
  const avgInvoice   = invoices.length > 0
    ? invoices.reduce((sum, i) => sum + (i.totalAmount as number || i.amount as number || 0), 0) / invoices.length
    : 0;

  const currentYear  = new Date().getFullYear().toString();
  const monthlySpendMap: Record<string, number> = {};
  debits.forEach(tx => {
    const d = new Date(tx.createdAt as string);
    if (d.getFullYear().toString() === currentYear) {
      const m = MONTHS[d.getMonth()];
      monthlySpendMap[m] = (monthlySpendMap[m] || 0) + (tx.amount as number || 0);
    }
  });
  const spendData = MONTHS.slice(0, new Date().getMonth() + 1).map(month => ({
    month, spend: monthlySpendMap[month] || 0,
  }));
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime())
    .slice(0, 10);

  // Marketplace chart — aggregate daily revenue per platform
  const platforms = [...new Set(salesHistory.map(d => d.platform))];
  const dateKeys  = [...new Set(salesHistory.map(d => d.date.slice(0, 10)))].sort();
  const revenueChartData = dateKeys.map(date => {
    const row: Record<string, string | number> = {
      date: new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    };
    for (const p of platforms) {
      const point = salesHistory.find(d => d.platform === p && d.date.slice(0, 10) === date);
      row[p] = point?.revenue ?? 0;
    }
    return row;
  });

  const anomalies = salesHistory.filter(d => d.isAnomaly).slice(0, 6);
  const hasMarketData = salesSummary.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Analytics & Insights</h1>
        <p className="text-surface-500 text-sm mt-0.5">
          Track your spending, invoices, contract activity, and marketplace performance.
        </p>
      </div>

      {/* ERP stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Spent"       value={formatCurrency(totalSpent)}  icon={<TrendingUp size={20} className="text-emerald-600" />} iconBg="bg-emerald-50" />
        <StatCard title="Pending Payments"  value={formatCurrency(pendingTotal)} icon={<CreditCard size={20} className="text-amber-500" />}   iconBg="bg-amber-50" />
        <StatCard title="Active Contracts"  value={activeContracts.length}       icon={<FileText size={20} className="text-primary-600" />}    iconBg="bg-primary-50" />
        <StatCard title="Avg Invoice"       value={formatCurrency(avgInvoice)}   icon={<BarChart2 size={20} className="text-purple-600" />}    iconBg="bg-purple-50" />
      </div>

      {/* ERP charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-surface-800">Monthly Spend</h2>
            <span className="text-xs text-surface-400 bg-surface-100 px-3 py-1 rounded-full">{currentYear}</span>
          </div>
          {spendData.every(d => d.spend === 0) ? (
            <div className="flex items-center justify-center h-[220px] text-surface-400 text-sm">No spend data for this year</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={spendData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v >= 1000 ? `${v / 1000}k` : v}`} />
                <Tooltip formatter={(v: unknown) => [formatCurrency(v as number), 'Spend']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="spend" fill="#6366f1" radius={[6, 6, 0, 0]} name="Spend" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h2 className="font-bold text-surface-800 mb-5">Invoice Breakdown</h2>
          <div className="space-y-4">
            {[
              { label: 'Paid',    count: paidInvoices.length,    badge: 'paid',    color: 'text-emerald-600' },
              { label: 'Pending', count: pendingInvoices.length,  badge: 'pending', color: 'text-amber-600' },
              { label: 'Overdue', count: overdueInvoices.length,  badge: 'overdue', color: 'text-red-600' },
            ].map(({ label, count, badge, color }) => (
              <div key={label} className="flex items-center justify-between py-3 border-b border-surface-100 last:border-0">
                <div className="flex items-center gap-3">
                  <Badge label={badge} />
                  <span className="text-sm text-surface-600">{label}</span>
                </div>
                <span className={`text-xl font-bold ${color}`}>{count}</span>
              </div>
            ))}
            <div className="pt-1 flex items-center justify-between">
              <span className="text-sm text-surface-500">Total Invoices</span>
              <span className="text-xl font-bold text-surface-900">{invoices.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Marketplace Intelligence ─────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag size={20} className="text-orange-500" />
              Marketplace Intelligence
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">30-day sales performance across connected platforms</p>
          </div>
          {!hasMarketData && !marketLoading && (
            <a
              href="/buyer/integrations"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Link2 size={13} />
              Connect platforms
            </a>
          )}
        </div>

        {marketLoading ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
            Loading marketplace data…
          </div>
        ) : !hasMarketData ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
            <TrendingDown size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500">No marketplace data yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Connect Amazon, Shopify, or Flipkart from the{' '}
              <a href="/buyer/integrations" className="text-indigo-500 hover:underline">Integrations</a> page
              to see 30-day sales analytics here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Platform summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {salesSummary.map(s => <PlatformSummaryCard key={s.platform} s={s} />)}
            </div>

            {/* 30-day revenue line chart */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4 text-sm">30-Day Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    interval={4}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`}
                  />
                  <Tooltip
                    formatter={(v: unknown, name: unknown) => [formatCompact(v as number), name as string]}
                    contentStyle={{ borderRadius: 10, fontSize: 11 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {platforms.map(p => (
                    <Line
                      key={p}
                      type="monotone"
                      dataKey={p}
                      stroke={PLATFORM_COLORS[p] ?? '#6366F1'}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Anomaly alerts + price intelligence */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Anomalies */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle size={16} className="text-red-500" />
                  <h3 className="font-semibold text-gray-900 text-sm">Anomaly Alerts</h3>
                  {anomalies.length > 0 && (
                    <span className="ml-auto text-xs bg-red-100 text-red-600 font-medium px-2 py-0.5 rounded-full">
                      {anomalies.length} detected
                    </span>
                  )}
                </div>
                {anomalies.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No anomalies detected in the last 30 days</p>
                ) : (
                  <div className="space-y-2">
                    {anomalies.map(a => <AnomalyRow key={a.id} point={a} />)}
                  </div>
                )}
              </div>

              {/* Price intelligence */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={16} className="text-amber-500" />
                  <h3 className="font-semibold text-gray-900 text-sm">Price Intelligence</h3>
                  {priceChanges.length > 0 && (
                    <span className="ml-auto text-xs bg-amber-50 text-amber-600 font-medium px-2 py-0.5 rounded-full border border-amber-200">
                      {priceChanges.length} signals
                    </span>
                  )}
                </div>
                {priceChanges.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No price changes detected recently</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {priceChanges.slice(0, 8).map(log => <PriceChangeRow key={log.id} log={log} />)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent invoices table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-100">
          <h2 className="font-bold text-surface-800">Recent Invoices</h2>
        </div>
        {recentInvoices.length === 0 ? (
          <EmptyState title="No invoices yet" message="Your invoices will appear here once generated." icon={<FileText size={24} />} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100">
                  <th className="table-th">Date</th>
                  <th className="table-th">Description</th>
                  <th className="table-th">Amount</th>
                  <th className="table-th">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map(inv => (
                  <tr key={inv.id as string} className="border-b border-surface-50 hover:bg-surface-50 transition-colors">
                    <td className="table-td text-surface-500">{formatDate(inv.createdAt as string)}</td>
                    <td className="table-td text-surface-700">
                      {inv.notes as string || inv.description as string || `Invoice #${(inv.id as string).slice(0, 8)}`}
                    </td>
                    <td className="table-td font-semibold text-surface-900">
                      {formatCurrency(inv.totalAmount as number || inv.amount as number || 0)}
                    </td>
                    <td className="table-td">
                      <Badge label={(inv.status as string).toLowerCase()} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyerAnalyticsPage;
