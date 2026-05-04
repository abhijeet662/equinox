import React, { useState } from 'react';
import { DollarSign, Clock, AlertCircle, TrendingUp, CreditCard } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { useApi } from '../../hooks/useApi';
import { invoicesService } from '../../services/invoices.service';
import toast from 'react-hot-toast';

const FILTERS = ['All', 'Paid', 'Pending', 'Overdue'];

const AdminPaymentsPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);

  const { data: invoicesRes, refetch } = useApi(() => invoicesService.list({ limit: 200 }), []);

  const handleMarkPaid = async (id: string, invoiceNo: string) => {
    if (!confirm(`Mark invoice ${invoiceNo} as PAID?`)) return;
    setMarkingPaid(id);
    try {
      await invoicesService.updateStatus(id, 'PAID');
      toast.success('Invoice marked as paid');
      refetch();
    } catch {
      toast.error('Failed to update invoice');
    } finally {
      setMarkingPaid(null);
    }
  };
  const invoices: Record<string, unknown>[] = invoicesRes?.data || [];

  const paid = invoices.filter(i => i.status === 'PAID');
  const pending = invoices.filter(i => i.status === 'PENDING');
  const overdue = invoices.filter(i => i.status === 'OVERDUE');

  const totalCollected = paid.reduce((s, i) => s + (i.total as number || 0), 0);
  const totalPending = pending.reduce((s, i) => s + (i.total as number || 0), 0);
  const collectionBase = paid.length + pending.length + overdue.length;
  const collectionRate = collectionBase > 0 ? Math.round((paid.length / collectionBase) * 100) : 0;

  const filtered = invoices.filter(i => {
    if (activeFilter === 'All') return true;
    return (i.status as string).toUpperCase() === activeFilter.toUpperCase();
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Payment Management</h1>
        <p className="text-surface-500 text-sm mt-0.5">Platform-wide payment tracking and collection overview.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <DollarSign size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totalCollected)}</p>
              <p className="text-sm text-surface-500">Total Collected</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <Clock size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-amber-600">{formatCurrency(totalPending)}</p>
              <p className="text-sm text-surface-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <AlertCircle size={18} className="text-red-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-red-600">{overdue.length}</p>
              <p className="text-sm text-surface-500">Overdue</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
              <TrendingUp size={18} className="text-primary-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-primary-600">{collectionRate}%</p>
              <p className="text-sm text-surface-500">Collection Rate</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4 flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${activeFilter === f ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead className="bg-surface-50 border-b border-surface-200">
            <tr>
              <th className="table-th">Invoice #</th>
              <th className="table-th">Buyer</th>
              <th className="table-th">Amount</th>
              <th className="table-th">Due Date</th>
              <th className="table-th">Status</th>
              <th className="table-th">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {filtered.map(inv => (
              <tr key={inv.id as string} className="hover:bg-surface-50 transition-colors">
                <td className="table-td font-mono text-xs font-medium text-surface-700">
                  {(inv.id as string).slice(0, 8).toUpperCase()}
                </td>
                <td className="table-td font-medium text-surface-800">
                  {(inv.buyer as Record<string, string>)?.name || '—'}
                </td>
                <td className="table-td font-semibold text-surface-900">
                  {formatCurrency(inv.total as number || 0)}
                </td>
                <td className="table-td text-surface-500">
                  {inv.dueDate ? formatDate(inv.dueDate as string) : '—'}
                </td>
                <td className="table-td">
                  <Badge label={(inv.status as string).toLowerCase()} />
                </td>
                <td className="table-td">
                  {inv.status === 'PENDING' && (
                    <button
                      onClick={() => handleMarkPaid(inv.id as string, (inv.invoiceNo as string) || (inv.id as string).slice(0, 8).toUpperCase())}
                      disabled={markingPaid === (inv.id as string)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <CreditCard size={12} /> {markingPaid === (inv.id as string) ? 'Saving…' : 'Mark Paid'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-surface-400">No invoices found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPaymentsPage;
