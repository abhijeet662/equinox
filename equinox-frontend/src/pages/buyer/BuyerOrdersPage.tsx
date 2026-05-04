import React from 'react';
import { FileText, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { useApi } from '../../hooks/useApi';
import { contractsService } from '../../services/contracts.service';
import { formatCurrency, formatDate } from '../../utils/helpers';

const BuyerOrdersPage: React.FC = () => {
  const { data: contractsRes, loading } = useApi(() => contractsService.list({ limit: 50 }), []);
  const contracts: Record<string, unknown>[] = contractsRes?.data || [];

  const total = contracts.length;
  const active = contracts.filter(c => c.status === 'ACTIVE').length;
  const pending = contracts.filter(c => c.status === 'PENDING' || c.status === 'DRAFT').length;
  const completed = contracts.filter(c => c.status === 'COMPLETED' || c.status === 'EXPIRED').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">My Orders</h1>
        <p className="text-surface-500 text-sm mt-0.5">All service contracts and orders with your providers.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Orders" value={total} icon={<FileText size={20} className="text-primary-600" />} iconBg="bg-primary-50" />
        <StatCard title="Active" value={active} icon={<FileText size={20} className="text-emerald-600" />} iconBg="bg-emerald-50" />
        <StatCard title="Pending" value={pending} icon={<FileText size={20} className="text-amber-500" />} iconBg="bg-amber-50" />
        <StatCard title="Completed" value={completed} icon={<FileText size={20} className="text-surface-400" />} iconBg="bg-surface-100" />
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-surface-400 text-sm">Loading orders...</div>
        ) : contracts.length === 0 ? (
          <EmptyState
            title="No orders yet"
            message="When you purchase services from providers, your contracts will appear here."
            icon={<FileText size={24} />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100">
                  <th className="table-th">Provider</th>
                  <th className="table-th">Service</th>
                  <th className="table-th">Type</th>
                  <th className="table-th">Value</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Start Date</th>
                  <th className="table-th">Action</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => {
                  const provider = c.provider as Record<string, string> | null;
                  return (
                    <tr key={c.id as string} className="border-b border-surface-50 hover:bg-surface-50 transition-colors">
                      <td className="table-td">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {(provider?.name || provider?.businessName || 'P')[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-surface-800 truncate max-w-[120px]">
                            {provider?.name || provider?.businessName || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="table-td">
                        <span className="text-surface-700 truncate max-w-[160px] block">{c.title as string || '—'}</span>
                      </td>
                      <td className="table-td">
                        <span className="text-surface-500 capitalize">{(c.type as string || '—').toLowerCase()}</span>
                      </td>
                      <td className="table-td font-semibold text-surface-800">
                        {c.value ? formatCurrency(c.value as number) : '—'}
                      </td>
                      <td className="table-td">
                        <Badge label={(c.status as string).toLowerCase()} />
                      </td>
                      <td className="table-td text-surface-500">
                        {c.startDate ? formatDate(c.startDate as string) : '—'}
                      </td>
                      <td className="table-td">
                        <Link
                          to={`/buyer/orders/${c.id as string}`}
                          className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium text-xs"
                        >
                          <Eye size={13} /> View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyerOrdersPage;
