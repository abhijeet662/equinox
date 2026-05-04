import React, { useState } from 'react';
import { MessageSquare, Eye, X } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import { formatDate } from '../../utils/helpers';
import { useApi } from '../../hooks/useApi';
import { complaintsService } from '../../services/complaints.service';
import toast from 'react-hot-toast';

const FILTERS = ['All', 'Open', 'In Review', 'Escalated', 'Resolved'];

const STATUS_OPTIONS = ['OPEN', 'IN_REVIEW', 'ESCALATED', 'RESOLVED'];

const priorityBadge: Record<string, string> = {
  HIGH:   'bg-red-100 text-red-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  LOW:    'bg-green-100 text-green-700',
};

const AdminComplaintsPage: React.FC = () => {
  const [activeFilter, setActiveFilter]   = useState('All');
  const [selected, setSelected]           = useState<Record<string, unknown> | null>(null);
  const [newStatus, setNewStatus]         = useState('');
  const [resolution, setResolution]       = useState('');
  const [updating, setUpdating]           = useState(false);

  const { data: complaintsRes, refetch } = useApi(() => complaintsService.list({ limit: 200 }), []);
  const complaints: Record<string, unknown>[] = complaintsRes?.data || [];

  const open      = complaints.filter(c => c.status === 'OPEN');
  const inReview  = complaints.filter(c => c.status === 'IN_REVIEW');
  const escalated = complaints.filter(c => c.status === 'ESCALATED');
  const resolved  = complaints.filter(c => c.status === 'RESOLVED');

  const filtered = complaints.filter(c => {
    if (activeFilter === 'All')        return true;
    if (activeFilter === 'Open')       return c.status === 'OPEN';
    if (activeFilter === 'In Review')  return c.status === 'IN_REVIEW';
    if (activeFilter === 'Escalated')  return c.status === 'ESCALATED';
    if (activeFilter === 'Resolved')   return c.status === 'RESOLVED';
    return true;
  });

  const openDetail = (c: Record<string, unknown>) => {
    setSelected(c);
    setNewStatus(c.status as string);
    setResolution((c.resolution as string) || '');
  };

  const handleUpdateStatus = async () => {
    if (!selected) return;
    setUpdating(true);
    try {
      await complaintsService.updateStatus(selected.id as string, newStatus, resolution || undefined);
      toast.success(`Complaint updated to ${newStatus.replace('_', ' ').toLowerCase()}`);
      setSelected(null);
      refetch();
    } catch {
      toast.error('Failed to update complaint');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Complaints Management</h1>
        <p className="text-surface-500 text-sm mt-0.5">Review and resolve platform-wide complaints.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total',      value: complaints.length, color: 'text-surface-900', bg: 'bg-surface-50' },
          { label: 'Open',       value: open.length,       color: 'text-red-600',     bg: 'bg-red-50' },
          { label: 'Escalated',  value: escalated.length,  color: 'text-orange-600',  bg: 'bg-orange-50' },
          { label: 'Resolved',   value: resolved.length,   color: 'text-green-600',   bg: 'bg-green-50' },
        ].map(stat => (
          <div key={stat.label} className="card">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center`}>
                <MessageSquare size={18} className={stat.color} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-sm text-surface-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="card p-4 flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${activeFilter === f ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}
          >
            {f}
            <span className="ml-1 opacity-60">
              ({f === 'All' ? complaints.length : f === 'Open' ? open.length : f === 'In Review' ? inReview.length : f === 'Escalated' ? escalated.length : resolved.length})
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead className="bg-surface-50 border-b border-surface-200">
            <tr>
              <th className="table-th">ID</th>
              <th className="table-th">Title</th>
              <th className="table-th">Buyer</th>
              <th className="table-th">Provider</th>
              <th className="table-th">Priority</th>
              <th className="table-th">Status</th>
              <th className="table-th">Date</th>
              <th className="table-th">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {filtered.map(c => {
              const priority = (c.priority as string) || 'LOW';
              return (
                <tr key={c.id as string} className="hover:bg-surface-50 transition-colors">
                  <td className="table-td font-mono text-xs text-surface-500">
                    {(c.id as string).slice(0, 8).toUpperCase()}
                  </td>
                  <td className="table-td font-medium text-surface-800 max-w-[180px] truncate">
                    {c.title as string}
                  </td>
                  <td className="table-td text-surface-600">
                    {(c.raisedBy as Record<string, string>)?.name || (c.complainant as Record<string, string>)?.name || (c.buyer as Record<string, string>)?.name || '—'}
                  </td>
                  <td className="table-td text-surface-600">
                    {(c.against as Record<string, string>)?.businessName || (c.against as Record<string, string>)?.companyName || (c.against as Record<string, string>)?.name || (c.provider as Record<string, string>)?.businessName || '—'}
                  </td>
                  <td className="table-td">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${priorityBadge[priority] || priorityBadge.LOW}`}>
                      {priority}
                    </span>
                  </td>
                  <td className="table-td">
                    <Badge label={(c.status as string).toLowerCase().replace('_', ' ')} />
                  </td>
                  <td className="table-td text-surface-500">
                    {c.createdAt ? formatDate(c.createdAt as string) : '—'}
                  </td>
                  <td className="table-td">
                    <button
                      onClick={() => openDetail(c)}
                      className="w-7 h-7 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-400 hover:text-primary-600 transition-colors"
                      title="View & update"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-12 text-surface-400">No complaints found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail / Update Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
              <div>
                <h2 className="font-bold text-surface-900">Complaint Details</h2>
                <p className="text-xs text-surface-500 font-mono mt-0.5">{(selected.id as string).slice(0, 8).toUpperCase()}</p>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-400">
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-xs font-medium text-surface-500 mb-1">Title</p>
                <p className="font-semibold text-surface-900">{selected.title as string}</p>
              </div>

              {selected.description && (
                <div>
                  <p className="text-xs font-medium text-surface-500 mb-1">Description</p>
                  <p className="text-sm text-surface-700 leading-relaxed whitespace-pre-wrap">{selected.description as string}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-medium text-surface-500 mb-1">Raised By</p>
                  <p className="text-surface-800">
                    {(selected.raisedBy as Record<string, string>)?.name || (selected.complainant as Record<string, string>)?.name || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-surface-500 mb-1">Against</p>
                  <p className="text-surface-800">
                    {(selected.against as Record<string, string>)?.businessName || (selected.against as Record<string, string>)?.name || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-surface-500 mb-1">Priority</p>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${priorityBadge[(selected.priority as string) || 'LOW']}`}>
                    {(selected.priority as string) || 'LOW'}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-surface-500 mb-1">Date Filed</p>
                  <p className="text-surface-700">{selected.createdAt ? formatDate(selected.createdAt as string) : '—'}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-surface-500 mb-1.5 block">Update Status</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className="input-field text-sm"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              {newStatus === 'RESOLVED' && (
                <div>
                  <label className="text-xs font-medium text-surface-500 mb-1.5 block">Resolution Note</label>
                  <textarea
                    rows={3}
                    className="input-field text-sm resize-none"
                    placeholder="Describe how this was resolved…"
                    value={resolution}
                    onChange={e => setResolution(e.target.value)}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setSelected(null)} className="btn-outline flex-1 justify-center text-sm">Cancel</button>
                <button
                  onClick={handleUpdateStatus}
                  disabled={updating || newStatus === selected.status}
                  className="btn-primary flex-1 justify-center text-sm disabled:opacity-60"
                >
                  {updating ? 'Saving…' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminComplaintsPage;
