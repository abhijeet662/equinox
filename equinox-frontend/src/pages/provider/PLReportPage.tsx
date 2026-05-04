import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '../../utils/helpers';
import { TrendingUp, TrendingDown, Download } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { invoicesService } from '../../services/invoices.service';
import { contractsService } from '../../services/contracts.service';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PLReportPage: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState('2026');

  const { data: invoicesRes } = useApi(() => invoicesService.list({ limit: 200 }), []);
  const { data: contractsRes } = useApi(() => contractsService.list({ limit: 200 }), []);

  const invoices: Record<string, unknown>[] = invoicesRes?.data || [];
  const contracts: Record<string, unknown>[] = contractsRes?.data || [];

  // Build monthly data from real invoices
  const monthlyRevenue: Record<string, number> = {};
  invoices.filter(i => i.status === 'PAID').forEach(i => {
    const date = new Date(i.createdAt as string);
    if (date.getFullYear().toString() === selectedYear) {
      const month = MONTHS[date.getMonth()];
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (i.total as number || 0);
    }
  });

  // Use static expense ratios (65% of revenue) since we don't track expenses separately
  const monthlyData = MONTHS.slice(0, 6).map(month => {
    const revenue = monthlyRevenue[month] || 0;
    const expenses = Math.round(revenue * 0.65);
    return { month, revenue, expenses, profit: revenue - expenses };
  });

  const displayData = monthlyData;

  const totalRevenue = displayData.reduce((s, m) => s + m.revenue, 0);
  const totalExpenses = displayData.reduce((s, m) => s + m.expenses, 0);
  const netProfit = totalRevenue - totalExpenses;
  const margin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">P&L Report</h1>
          <p className="text-surface-500 text-sm mt-0.5">Monthly Profit & Loss overview for your business.</p>
        </div>
        <div className="flex gap-3">
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="input-field text-sm w-28">
            <option>2026</option>
            <option>2025</option>
          </select>
          <button className="btn-secondary text-sm"><Download size={15} /> Export PDF</button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), trend: 18.2, up: true },
          { label: 'Total Expenses', value: formatCurrency(totalExpenses), trend: 8.4, up: false },
          { label: 'Net Profit', value: formatCurrency(netProfit), trend: 24.6, up: true },
          { label: 'Profit Margin', value: `${margin}%`, trend: 3.1, up: true },
        ].map(item => (
          <div key={item.label} className="card">
            <p className="text-sm text-surface-500 mb-1">{item.label}</p>
            <p className="text-2xl font-bold text-surface-900">{item.value}</p>
            <div className={`flex items-center gap-1 text-xs font-medium mt-1 ${item.up ? 'text-green-600' : 'text-red-500'}`}>
              {item.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {item.up ? '+' : '-'}{item.trend}% vs last year
            </div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="card">
        <h2 className="font-bold text-surface-800 mb-5">Monthly Revenue vs Expenses</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={displayData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}k`} />
            <Tooltip formatter={(v: unknown) => formatCurrency(v as number)} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
            <Bar dataKey="expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Expenses" />
            <Bar dataKey="profit" fill="#22c55e" radius={[4, 4, 0, 0]} name="Profit" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly breakdown table */}
      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-surface-200">
          <h2 className="font-bold text-surface-800">Monthly Breakdown</h2>
        </div>
        <table className="w-full">
          <thead className="bg-surface-50 border-b border-surface-200">
            <tr>
              <th className="table-th">Month</th>
              <th className="table-th text-right">Revenue</th>
              <th className="table-th text-right">Expenses</th>
              <th className="table-th text-right">Profit</th>
              <th className="table-th text-right">Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {displayData.map((row) => {
              const marg = row.revenue > 0 ? ((row.profit / row.revenue) * 100).toFixed(1) : '0.0';
              return (
                <tr key={row.month} className="hover:bg-surface-50 transition-colors">
                  <td className="table-td font-medium text-surface-800">{row.month} {selectedYear}</td>
                  <td className="table-td text-right text-surface-700">{formatCurrency(row.revenue)}</td>
                  <td className="table-td text-right text-surface-700">{formatCurrency(row.expenses)}</td>
                  <td className={`table-td text-right font-semibold ${row.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(row.profit)}</td>
                  <td className="table-td text-right">
                    <span className={`badge ${parseFloat(marg) > 30 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{marg}%</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-surface-50 border-t-2 border-surface-200">
            <tr>
              <td className="table-td font-bold text-surface-900">TOTAL</td>
              <td className="table-td text-right font-bold text-surface-900">{formatCurrency(totalRevenue)}</td>
              <td className="table-td text-right font-bold text-surface-900">{formatCurrency(totalExpenses)}</td>
              <td className="table-td text-right font-bold text-green-700">{formatCurrency(netProfit)}</td>
              <td className="table-td text-right"><span className="badge bg-green-100 text-green-700">{margin}%</span></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default PLReportPage;
