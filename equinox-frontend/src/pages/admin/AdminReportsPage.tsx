import React, { useState } from 'react';
import { Download, TrendingUp, Users, DollarSign, Target } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { invoicesService } from '../../services/invoices.service';
import { usersService } from '../../services/users.service';
import { contractsService } from '../../services/contracts.service';
import { formatCurrency } from '../../utils/helpers';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';

type Tab = 'revenue' | 'growth' | 'kpi';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const AdminReportsPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('revenue');

  const { data: invoicesRes } = useApi(() => invoicesService.list({ limit: 500 }), []);
  const { data: usersRes } = useApi(() => usersService.list({ limit: 500 }), []);
  const { data: userStats } = useApi(() => usersService.getStats(), []);
  const { data: contractsRes } = useApi(() => contractsService.list({ limit: 200 }), []);

  const invoices: Record<string, unknown>[] = invoicesRes?.data || [];
  const users: Record<string, unknown>[] = usersRes?.data || [];
  const contracts: Record<string, unknown>[] = contractsRes?.data || [];

  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();

  // ── REVENUE DATA ─────────────────────────────────────────────────────────────
  const monthlyRevMap: Record<string, { invoices: number; revenue: number }> = {};
  invoices.forEach(inv => {
    const d = new Date(inv.createdAt as string);
    if (d.getFullYear() !== currentYear) return;
    const m = MONTHS[d.getMonth()];
    if (!monthlyRevMap[m]) monthlyRevMap[m] = { invoices: 0, revenue: 0 };
    monthlyRevMap[m].invoices += 1;
    if (inv.status === 'PAID') monthlyRevMap[m].revenue += (inv.total as number || 0);
  });

  const revenueData = MONTHS.slice(0, currentMonthIdx + 1).map((m, i) => {
    const prev = i > 0 ? (monthlyRevMap[MONTHS[i - 1]]?.revenue || 0) : 0;
    const curr = monthlyRevMap[m]?.revenue || 0;
    const growth = prev > 0 ? ((curr - prev) / prev * 100) : 0;
    return { month: m, revenue: curr, invoices: monthlyRevMap[m]?.invoices || 0, growth };
  });

  const totalRevenueYTD = revenueData.reduce((s, d) => s + d.revenue, 0);
  const avgMonthlyRevenue = revenueData.length > 0 ? totalRevenueYTD / revenueData.length : 0;
  const bestMonth = revenueData.reduce((best, d) => d.revenue > best.revenue ? d : best, { month: '—', revenue: 0, invoices: 0, growth: 0 });

  // ── GROWTH DATA ───────────────────────────────────────────────────────────────
  const monthlyUserMap: Record<string, number> = {};
  users.forEach(u => {
    const d = new Date(u.createdAt as string);
    const m = MONTHS[d.getMonth()];
    monthlyUserMap[m] = (monthlyUserMap[m] || 0) + 1;
  });

  let cumulative = 0;
  const growthData = MONTHS.slice(0, currentMonthIdx + 1).map(m => {
    cumulative += monthlyUserMap[m] || 0;
    return { month: m, newUsers: monthlyUserMap[m] || 0, totalUsers: cumulative };
  });

  const totalUsersCount = userStats?.totalUsers || users.length;
  const providersCount = userStats?.providers || users.filter(u => u.role === 'PROVIDER').length;
  const buyersCount = userStats?.buyers || users.filter(u => u.role === 'BUYER').length;
  const newThisMonth = growthData[growthData.length - 1]?.newUsers || 0;

  // ── KPI DATA ──────────────────────────────────────────────────────────────────
  const revenuePerUser = totalUsersCount > 0 ? totalRevenueYTD / totalUsersCount : 0;
  const avgContractValue = contracts.length > 0
    ? contracts.reduce((s, c) => s + (c.value as number || 0), 0) / contracts.length
    : invoices.length > 0
      ? invoices.reduce((s, i) => s + (i.total as number || 0), 0) / invoices.length
      : 0;

  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(i => i.status === 'PAID').length;
  const collectionRate = totalInvoices > 0 ? (paidInvoices / totalInvoices * 100) : 0;
  const providerUtilization = providersCount > 0 && contracts.length > 0
    ? Math.min(100, (contracts.length / providersCount * 10))
    : 0;

  const kpis = [
    { label: 'Revenue per User', value: formatCurrency(revenuePerUser), sub: 'YTD revenue / total users', icon: <DollarSign size={18} className="text-green-600" />, bg: 'bg-green-50' },
    { label: 'Avg Contract Value', value: formatCurrency(avgContractValue), sub: 'From active contracts', icon: <Target size={18} className="text-blue-600" />, bg: 'bg-blue-50' },
    { label: 'Invoice Collection Rate', value: `${collectionRate.toFixed(1)}%`, sub: `${paidInvoices} of ${totalInvoices} invoices paid`, icon: <TrendingUp size={18} className="text-purple-600" />, bg: 'bg-purple-50' },
    { label: 'Provider Utilization', value: `${providerUtilization.toFixed(1)}%`, sub: `${contracts.length} contracts / ${providersCount} providers`, icon: <Users size={18} className="text-amber-600" />, bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Reports & Analytics</h1>
          <p className="text-surface-500 text-sm mt-0.5">Platform-wide performance metrics and growth analytics.</p>
        </div>
        <button
          onClick={() => toast('Export coming soon', { icon: '📊' })}
          className="btn-outline text-sm flex items-center gap-2"
        >
          <Download size={15} /> Export
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 p-1 rounded-xl w-fit">
        {([['revenue', 'Revenue'], ['growth', 'Growth'], ['kpi', 'KPI']] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── REVENUE TAB ── */}
      {tab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card text-center">
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenueYTD)}</p>
              <p className="text-sm text-surface-500">Total Revenue YTD</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-surface-900">{formatCurrency(avgMonthlyRevenue)}</p>
              <p className="text-sm text-surface-500">Avg Monthly</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-primary-600">{bestMonth.month}</p>
              <p className="text-sm text-surface-500">Best Month</p>
              <p className="text-xs text-surface-400">{formatCurrency(bestMonth.revenue)}</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-surface-900">{invoices.length}</p>
              <p className="text-sm text-surface-500">Total Invoices</p>
            </div>
          </div>

          <div className="card">
            <h2 className="font-bold text-surface-800 mb-5">Monthly Revenue ({currentYear})</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: unknown) => formatCurrency(v as number)} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="revenue" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card overflow-hidden p-0">
            <table className="w-full">
              <thead className="bg-surface-50 border-b border-surface-200">
                <tr>
                  <th className="table-th">Month</th>
                  <th className="table-th">Invoices</th>
                  <th className="table-th">Revenue</th>
                  <th className="table-th">Growth %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {revenueData.map(row => (
                  <tr key={row.month} className="hover:bg-surface-50">
                    <td className="table-td font-medium text-surface-800">{row.month}</td>
                    <td className="table-td text-surface-600">{row.invoices}</td>
                    <td className="table-td font-semibold text-green-700">{formatCurrency(row.revenue)}</td>
                    <td className="table-td">
                      <span className={`text-sm font-medium ${row.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {row.growth >= 0 ? '+' : ''}{row.growth.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
                {revenueData.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-8 text-surface-400">No revenue data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── GROWTH TAB ── */}
      {tab === 'growth' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card text-center">
              <p className="text-2xl font-bold text-surface-900">{totalUsersCount}</p>
              <p className="text-sm text-surface-500">Total Users</p>
            </div>
            <div className="card text-center">
              <div className="flex items-center justify-center gap-1">
                <p className="text-2xl font-bold text-green-600">+{newThisMonth}</p>
              </div>
              <p className="text-sm text-surface-500">New This Month</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-blue-600">{providersCount}</p>
              <p className="text-sm text-surface-500">Providers</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-emerald-600">{buyersCount}</p>
              <p className="text-sm text-surface-500">Buyers</p>
            </div>
          </div>

          <div className="card">
            <h2 className="font-bold text-surface-800 mb-5">Cumulative User Growth</h2>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Line type="monotone" dataKey="totalUsers" stroke="#7c3aed" strokeWidth={2.5} dot={false} name="Total Users" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 className="font-bold text-surface-800 mb-5">Monthly New Signups</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="newUsers" fill="#3b82f6" radius={[4, 4, 0, 0]} name="New Users" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── KPI TAB ── */}
      {tab === 'kpi' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            {kpis.map(kpi => (
              <div key={kpi.label} className="card flex items-start gap-4">
                <div className={`w-12 h-12 ${kpi.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  {kpi.icon}
                </div>
                <div>
                  <p className="text-sm text-surface-500 mb-1">{kpi.label}</p>
                  <p className="text-2xl font-bold text-surface-900">{kpi.value}</p>
                  <p className="text-xs text-surface-400 mt-0.5">{kpi.sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <h2 className="font-bold text-surface-800 mb-4">Platform Health Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Active Contracts', value: contracts.filter(c => c.status === 'ACTIVE').length, color: 'text-green-600' },
                { label: 'Pending Invoices', value: invoices.filter(i => i.status === 'PENDING').length, color: 'text-amber-600' },
                { label: 'Paid Invoices', value: paidInvoices, color: 'text-green-600' },
                { label: 'Total Contracts', value: contracts.length, color: 'text-blue-600' },
                { label: 'Collection Rate', value: `${collectionRate.toFixed(0)}%`, color: 'text-purple-600' },
                { label: 'Avg Invoice Value', value: formatCurrency(invoices.length > 0 ? invoices.reduce((s, i) => s + (i.total as number || 0), 0) / invoices.length : 0), color: 'text-surface-700' },
              ].map(item => (
                <div key={item.label} className="bg-surface-50 rounded-xl p-4">
                  <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                  <p className="text-xs text-surface-500 mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReportsPage;
