import React, { useState } from 'react';
import { FileText, Plus, Search, Eye } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { useApi } from '../../hooks/useApi';
import { contractsService } from '../../services/contracts.service';

const STATUSES = ['All', 'ACTIVE', 'PENDING', 'COMPLETED', 'CANCELLED'];

const ContractsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const { data: contractsRes } = useApi(() => contractsService.list({ limit: 100 }), []);
  const contracts: Record<string, unknown>[] = contractsRes?.data || [];

  const filtered = contracts.filter(c =>
    (filter === 'All' || c.status === filter) &&
    (search === '' || (c.title as string).toLowerCase().includes(search.toLowerCase()) ||
      ((c.buyer as Record<string, string>)?.name || '').toLowerCase().includes(search.toLowerCase()))
  );

  const activeValue = contracts
    .filter(c => c.status === 'ACTIVE')
    .reduce((s, c) => s + (c.value as number || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Contracts</h1>
          <p className="text-surface-500 text-sm mt-0.5">Manage all your client contracts and agreements.</p>
        </div>
        <button className="btn-primary text-sm"><Plus size={16} /> New Contract</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Value', value: formatCurrency(activeValue), color: 'text-primary-600' },
          { label: 'Active', value: contracts.filter(c => c.status === 'ACTIVE').length.toString(), color: 'text-green-600' },
          { label: 'Pending', value: contracts.filter(c => c.status === 'PENDING').length.toString(), color: 'text-amber-600' },
          { label: 'Total', value: contracts.length.toString(), color: 'text-surface-700' },
        ].map(item => (
          <div key={item.label} className="card">
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-sm text-surface-500 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="card p-4 flex flex-col md:flex-row gap-3">
        <div className="flex items-center gap-2 bg-surface-50 border border-surface-200 rounded-xl px-3 py-2 flex-1">
          <Search size={15} className="text-surface-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title or client..." className="bg-transparent text-sm outline-none flex-1 text-surface-700 placeholder-surface-400" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors ${filter === s ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}>{s.toLowerCase()}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead className="bg-surface-50 border-b border-surface-200">
            <tr>
              <th className="table-th">Contract</th>
              <th className="table-th">Type</th>
              <th className="table-th">Value</th>
              <th className="table-th">Start Date</th>
              <th className="table-th">End Date</th>
              <th className="table-th">Status</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {filtered.map(contract => (
              <tr key={contract.id as string} className="hover:bg-surface-50 transition-colors">
                <td className="table-td">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-surface-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText size={16} className="text-surface-400" />
                    </div>
                    <div>
                      <p className="font-medium text-surface-800">{contract.title as string}</p>
                      <p className="text-xs text-surface-400">{(contract.buyer as Record<string, string>)?.name || '—'}</p>
                    </div>
                  </div>
                </td>
                <td className="table-td">
                  <span className="bg-surface-100 text-surface-600 px-2 py-0.5 rounded text-xs font-medium">{contract.type as string}</span>
                </td>
                <td className="table-td font-semibold text-surface-800">{formatCurrency(contract.value as number || 0)}</td>
                <td className="table-td text-surface-500">{contract.startDate ? formatDate(contract.startDate as string) : '—'}</td>
                <td className="table-td text-surface-500">{contract.endDate ? formatDate(contract.endDate as string) : '—'}</td>
                <td className="table-td"><Badge label={(contract.status as string).toLowerCase()} /></td>
                <td className="table-td">
                  <button className="w-7 h-7 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-400 hover:text-surface-700 transition-colors">
                    <Eye size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-surface-400">No contracts found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContractsPage;
