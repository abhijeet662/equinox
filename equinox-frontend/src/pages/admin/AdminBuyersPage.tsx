import React, { useState } from 'react';
import { Search, ShoppingBag, UserCheck, UserX } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { usersService } from '../../services/users.service';
import toast from 'react-hot-toast';

const STATUS_FILTERS = ['All', 'ACTIVE', 'SUSPENDED', 'PENDING'];

const AdminBuyersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const { data: buyersRes, refetch } = useApi(() => usersService.list({ role: 'BUYER', limit: 100 }), []);
  const buyers: Record<string, unknown>[] = buyersRes?.data || [];

  const filtered = buyers.filter(b => {
    const matchStatus = statusFilter === 'All' || b.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      ((b.name as string) || '').toLowerCase().includes(q) ||
      ((b.email as string) || '').toLowerCase().includes(q) ||
      ((b.company as string) || '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const total = buyers.length;
  const active = buyers.filter(b => b.status === 'ACTIVE').length;
  const suspended = buyers.filter(b => b.status === 'SUSPENDED').length;
  const pending = buyers.filter(b => b.status === 'PENDING').length;

  const handleStatus = async (id: string, status: string) => {
    try {
      await usersService.updateStatus(id, status);
      toast.success(`Buyer ${status === 'ACTIVE' ? 'activated' : 'suspended'}`);
      refetch();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-700',
      SUSPENDED: 'bg-red-100 text-red-700',
      PENDING: 'bg-amber-100 text-amber-700',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[status] || 'bg-surface-100 text-surface-600'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Buyer Management</h1>
        <p className="text-surface-500 text-sm mt-0.5">Manage buyers and their account statuses on the platform.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2">
            <ShoppingBag size={18} className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-surface-900">{total}</p>
          <p className="text-sm text-surface-500">Total Buyers</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">{active}</p>
          <p className="text-sm text-surface-500">Active</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-red-600">{suspended}</p>
          <p className="text-sm text-surface-500">Suspended</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-amber-600">{pending}</p>
          <p className="text-sm text-surface-500">Pending</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col md:flex-row gap-3">
        <div className="flex items-center gap-2 bg-surface-50 border border-surface-200 rounded-xl px-3 py-2 flex-1">
          <Search size={15} className="text-surface-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search buyers by name, email or company..."
            className="bg-transparent text-sm outline-none flex-1 placeholder-surface-400"
          />
        </div>
        <div className="flex gap-2">
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${statusFilter === f ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead className="bg-surface-50 border-b border-surface-200">
            <tr>
              <th className="table-th">Buyer</th>
              <th className="table-th">Company</th>
              <th className="table-th">Status</th>
              <th className="table-th">Joined</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {filtered.map(b => (
              <tr key={b.id as string} className="hover:bg-surface-50 transition-colors">
                <td className="table-td">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {((b.name as string) || 'B')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-surface-800">{b.name as string}</p>
                      <p className="text-xs text-surface-400">{b.email as string}</p>
                    </div>
                  </div>
                </td>
                <td className="table-td text-surface-600 text-sm">{(b.company as string) || '—'}</td>
                <td className="table-td">{statusBadge(b.status as string)}</td>
                <td className="table-td text-surface-500 text-sm">
                  {b.createdAt ? new Date(b.createdAt as string).toLocaleDateString() : '—'}
                </td>
                <td className="table-td">
                  <div className="flex items-center gap-2">
                    {b.status !== 'ACTIVE' && (
                      <button
                        onClick={() => handleStatus(b.id as string, 'ACTIVE')}
                        className="btn-primary text-sm flex items-center gap-1 py-1 px-2"
                      >
                        <UserCheck size={13} /> Activate
                      </button>
                    )}
                    {b.status !== 'SUSPENDED' && (
                      <button
                        onClick={() => handleStatus(b.id as string, 'SUSPENDED')}
                        className="btn-outline text-sm flex items-center gap-1 py-1 px-2 border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <UserX size={13} /> Suspend
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-12 text-surface-400">No buyers found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminBuyersPage;
