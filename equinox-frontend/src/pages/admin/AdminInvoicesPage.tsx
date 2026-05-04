import React, { useState } from 'react';
import { Search, Download, Eye } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { useApi } from '../../hooks/useApi';
import { invoicesService } from '../../services/invoices.service';

const STATUSES = ['All', 'PAID', 'PENDING', 'OVERDUE', 'DRAFT'];

const AdminInvoicesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const { data: invoicesRes } = useApi(() => invoicesService.list({ limit: 100 }), []);
  const invoices: Record<string, unknown>[] = invoicesRes?.data || [];

  const filtered = invoices.filter(i =>
    (filter === 'All' || i.status === filter) &&
    (search === '' ||
      ((i.buyer as Record<string, string>)?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.id as string).toLowerCase().includes(search.toLowerCase()))
  );

  const totalRevenue = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + (i.total as number || 0), 0);
  const pendingRevenue = invoices.filter(i => i.status === 'PENDING').reduce((s, i) => s + (i.total as number || 0), 0);
  const overdueRevenue = invoices.filter(i => i.status === 'OVERDUE').reduce((s, i) => s + (i.total as number || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Invoice Management</h1>
        <p className="text-surface-500 text-sm mt-0.5">Platform-wide invoice tracking and management.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card"><p className="text-xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p><p className="text-sm text-surface-500 mt-0.5">Collected</p></div>
        <div className="card"><p className="text-xl font-bold text-amber-600">{formatCurrency(pendingRevenue)}</p><p className="text-sm text-surface-500 mt-0.5">Pending</p></div>
        <div className="card"><p className="text-xl font-bold text-red-600">{formatCurrency(overdueRevenue)}</p><p className="text-sm text-surface-500 mt-0.5">Overdue</p></div>
      </div>

      <div className="card p-4 flex flex-col md:flex-row gap-3">
        <div className="flex items-center gap-2 bg-surface-50 border border-surface-200 rounded-xl px-3 py-2 flex-1">
          <Search size={15} className="text-surface-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices..." className="bg-transparent text-sm outline-none flex-1 placeholder-surface-400" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors ${filter === s ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}>{s.toLowerCase()}</button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead className="bg-surface-50 border-b border-surface-200">
            <tr>
              <th className="table-th">Invoice #</th>
              <th className="table-th">Client</th>
              <th className="table-th">Provider</th>
              <th className="table-th">Amount</th>
              <th className="table-th">Issued</th>
              <th className="table-th">Due Date</th>
              <th className="table-th">Status</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {filtered.map(inv => (
              <tr key={inv.id as string} className="hover:bg-surface-50 transition-colors">
                <td className="table-td font-mono text-xs font-medium text-surface-700">{(inv.id as string).slice(0, 8).toUpperCase()}</td>
                <td className="table-td font-medium text-surface-800">{(inv.buyer as Record<string, string>)?.name || '—'}</td>
                <td className="table-td text-surface-600">{(inv.provider as Record<string, string>)?.companyName || (inv.provider as Record<string, string>)?.name || '—'}</td>
                <td className="table-td font-semibold text-surface-900">{formatCurrency(inv.total as number || 0)}</td>
                <td className="table-td text-surface-500">{formatDate(inv.createdAt as string)}</td>
                <td className="table-td text-surface-500">{inv.dueDate ? formatDate(inv.dueDate as string) : '—'}</td>
                <td className="table-td"><Badge label={(inv.status as string).toLowerCase()} /></td>
                <td className="table-td">
                  <div className="flex gap-1">
                    <button className="w-7 h-7 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-400 hover:text-primary-600 transition-colors"><Eye size={14} /></button>
                    <button className="w-7 h-7 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-400 hover:text-surface-700 transition-colors"><Download size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center py-12 text-surface-400">No invoices found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminInvoicesPage;
