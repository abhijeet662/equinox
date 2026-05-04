import React, { useState } from 'react';
import { DollarSign, TrendingUp, Clock, Wallet } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { walletService } from '../../services/wallet.service';
import { invoicesService } from '../../services/invoices.service';
import { formatCurrency } from '../../utils/helpers';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type Tab = 'wallets' | 'transactions' | 'invoices';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const AdminFinancePage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('wallets');

  const { data: walletsRes } = useApi(() => walletService.adminList(), []);
  const { data: invoicesRes } = useApi(() => invoicesService.list({ limit: 200 }), []);

  const wallets: Record<string, unknown>[] = walletsRes?.data || [];
  const invoices: Record<string, unknown>[] = invoicesRes?.data || [];

  const totalWalletBalance = wallets.reduce((s, w) => s + (w.balance as number || 0), 0);
  const totalInvoiced = invoices.reduce((s, i) => s + (i.total as number || 0), 0);
  const totalCollected = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + (i.total as number || 0), 0);
  const totalPending = invoices.filter(i => i.status === 'PENDING').reduce((s, i) => s + (i.total as number || 0), 0);

  // Monthly invoice breakdown
  const currentYear = new Date().getFullYear().toString();
  const monthlyMap: Record<string, { invoices: number; revenue: number }> = {};
  invoices.forEach(inv => {
    const d = new Date(inv.createdAt as string);
    if (d.getFullYear().toString() !== currentYear) return;
    const m = MONTHS[d.getMonth()];
    if (!monthlyMap[m]) monthlyMap[m] = { invoices: 0, revenue: 0 };
    monthlyMap[m].invoices += 1;
    if (inv.status === 'PAID') monthlyMap[m].revenue += (inv.total as number || 0);
  });
  const currentMonth = new Date().getMonth();
  const monthlyData = MONTHS.slice(0, currentMonth + 1).map((m, i) => ({
    month: m,
    invoices: monthlyMap[m]?.invoices || 0,
    revenue: monthlyMap[m]?.revenue || 0,
    growth: i > 0 && monthlyMap[MONTHS[i - 1]]?.revenue
      ? (((monthlyMap[m]?.revenue || 0) - (monthlyMap[MONTHS[i - 1]]?.revenue || 0)) / (monthlyMap[MONTHS[i - 1]]?.revenue || 1) * 100)
      : 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Finance Overview</h1>
        <p className="text-surface-500 text-sm mt-0.5">Platform-wide financial summary and wallet accounts.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <Wallet size={18} className="text-blue-600" />
            </div>
            <p className="text-sm text-surface-500">Total Wallet Balance</p>
          </div>
          <p className="text-2xl font-bold text-surface-900">{formatCurrency(totalWalletBalance)}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
              <TrendingUp size={18} className="text-purple-600" />
            </div>
            <p className="text-sm text-surface-500">Total Invoiced</p>
          </div>
          <p className="text-2xl font-bold text-surface-900">{formatCurrency(totalInvoiced)}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
              <DollarSign size={18} className="text-green-600" />
            </div>
            <p className="text-sm text-surface-500">Total Collected</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCollected)}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
              <Clock size={18} className="text-amber-600" />
            </div>
            <p className="text-sm text-surface-500">Pending</p>
          </div>
          <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalPending)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 p-1 rounded-xl w-fit">
        {([['wallets', 'Wallet Accounts'], ['transactions', 'Transactions Overview'], ['invoices', 'Invoices Summary']] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'wallets' && (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead className="bg-surface-50 border-b border-surface-200">
              <tr>
                <th className="table-th">User</th>
                <th className="table-th">Balance</th>
                <th className="table-th">Currency</th>
                <th className="table-th">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {wallets.map(w => {
                const u = w.user as Record<string, string> | null;
                return (
                  <tr key={w.id as string} className="hover:bg-surface-50 transition-colors">
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold text-sm">
                          {(u?.name || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-surface-800">{u?.name || '—'}</p>
                          <p className="text-xs text-surface-400">{u?.email || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-td">
                      <span className={`font-semibold text-sm ${(w.balance as number) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(w.balance as number || 0)}
                      </span>
                    </td>
                    <td className="table-td text-surface-600 text-sm">{(w.currency as string) || 'USD'}</td>
                    <td className="table-td text-surface-500 text-sm">
                      {w.updatedAt ? new Date(w.updatedAt as string).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                );
              })}
              {wallets.length === 0 && (
                <tr><td colSpan={4} className="text-center py-12 text-surface-400">No wallet accounts found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'transactions' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="font-bold text-surface-800 mb-5">Monthly Revenue ({new Date().getFullYear()})</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}k`} />
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
                  <th className="table-th">Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {monthlyData.map(row => (
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
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'invoices' && (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead className="bg-surface-50 border-b border-surface-200">
              <tr>
                <th className="table-th">Invoice #</th>
                <th className="table-th">Buyer</th>
                <th className="table-th">Amount</th>
                <th className="table-th">Status</th>
                <th className="table-th">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {invoices.slice(0, 50).map(inv => {
                const statusMap: Record<string, string> = {
                  PAID: 'bg-green-100 text-green-700',
                  PENDING: 'bg-amber-100 text-amber-700',
                  OVERDUE: 'bg-red-100 text-red-700',
                  CANCELLED: 'bg-surface-100 text-surface-500',
                };
                const buyer = inv.buyer as Record<string, string> | null;
                return (
                  <tr key={inv.id as string} className="hover:bg-surface-50">
                    <td className="table-td text-sm font-mono text-surface-600">#{(inv.id as string).slice(-8).toUpperCase()}</td>
                    <td className="table-td text-sm text-surface-700">{buyer?.name || '—'}</td>
                    <td className="table-td font-semibold text-surface-800">{formatCurrency(inv.total as number || 0)}</td>
                    <td className="table-td">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusMap[inv.status as string] || 'bg-surface-100 text-surface-600'}`}>
                        {inv.status as string}
                      </span>
                    </td>
                    <td className="table-td text-surface-500 text-sm">
                      {inv.createdAt ? new Date(inv.createdAt as string).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                );
              })}
              {invoices.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-surface-400">No invoices found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminFinancePage;
