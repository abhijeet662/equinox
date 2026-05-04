import React, { useState } from 'react';
import { Calendar, Plus } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { leaveService } from '../../services/leave.service';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

const LEAVE_TYPES = [
  { label: 'Annual Leave',           value: 'ANNUAL' },
  { label: 'Sick Leave',             value: 'SICK' },
  { label: 'Emergency Leave',        value: 'OTHER' },
  { label: 'Maternity Leave',        value: 'MATERNITY' },
  { label: 'Paternity Leave',        value: 'PATERNITY' },
  { label: 'Unpaid Leave',           value: 'UNPAID' },
];

const LeavePage: React.FC = () => {
  const [showApply, setShowApply] = useState(false);
  const [form, setForm] = useState({ type: 'ANNUAL', startDate: '', endDate: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  const { data: leaveRes, refetch } = useApi(() => leaveService.list(), []);
  const requests = leaveRes?.data || [];

  // Compute balance from history
  const approved = requests.filter((r: Record<string, unknown>) => r.status === 'APPROVED');
  const usedAnnual = approved.filter((r: Record<string, unknown>) => r.type === 'ANNUAL').reduce((s: number, r: Record<string, unknown>) => s + (r.days as number || 0), 0);
  const usedSick = approved.filter((r: Record<string, unknown>) => r.type === 'SICK').reduce((s: number, r: Record<string, unknown>) => s + (r.days as number || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate) { toast.error('Please set start and end dates'); return; }
    setSubmitting(true);
    try {
      await leaveService.create({ type: form.type, startDate: form.startDate, endDate: form.endDate, reason: form.reason });
      toast.success('Leave request submitted!');
      setShowApply(false);
      setForm({ type: 'ANNUAL', startDate: '', endDate: '', reason: '' });
      refetch();
    } catch {
      toast.error('Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await leaveService.cancel(id);
      toast.success('Leave request cancelled');
      refetch();
    } catch {
      toast.error('Failed to cancel request');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Leave Management</h1>
          <p className="text-surface-500 text-sm mt-0.5">View your leave balance and submit requests.</p>
        </div>
        <button onClick={() => setShowApply(true)} className="btn-primary text-sm">
          <Plus size={16} /> Apply for Leave
        </button>
      </div>

      {/* Leave Balance */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { type: 'Annual Leave',  total: 21, used: usedAnnual,  color: 'bg-blue-100 text-blue-700' },
          { type: 'Sick Leave',    total: 10, used: usedSick,    color: 'bg-red-100 text-red-700' },
          { type: 'Emergency',     total: 5,  used: 0,           color: 'bg-orange-100 text-orange-700' },
          { type: 'Unpaid',        total: 0,  used: 0,           color: 'bg-surface-100 text-surface-600', unlimited: true },
        ].map(l => (
          <div key={l.type} className="card text-center">
            <div className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold mb-2 ${l.color}`}>{l.type}</div>
            <p className="text-3xl font-bold text-surface-900">{l.unlimited ? '—' : l.total - l.used}</p>
            <p className="text-xs text-surface-500 mt-0.5">{l.unlimited ? 'on request' : 'days remaining'}</p>
            {!l.unlimited && <p className="text-xs text-surface-400 mt-1">{l.used} used of {l.total}</p>}
          </div>
        ))}
      </div>

      {/* History */}
      <div className="card">
        <h2 className="font-bold text-surface-800 mb-4">Leave History</h2>
        {requests.length === 0 && <p className="text-surface-400 text-sm text-center py-6">No leave requests yet</p>}
        <div className="space-y-3">
          {requests.map((lr: Record<string, unknown>) => (
            <div key={lr.id as string} className="flex items-start gap-4 p-4 bg-surface-50 rounded-xl border border-surface-100">
              <div className="w-10 h-10 bg-white border border-surface-200 rounded-xl flex items-center justify-center flex-shrink-0">
                <Calendar size={18} className="text-primary-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-surface-800">{(lr.type as string).replace('_', '/')}</p>
                  <Badge label={(lr.status as string).toLowerCase()} />
                </div>
                <p className="text-sm text-surface-600">
                  {new Date(lr.startDate as string).toLocaleDateString()} → {new Date(lr.endDate as string).toLocaleDateString()}
                  <span className="text-surface-400 ml-2">({lr.days as number} {(lr.days as number) === 1 ? 'day' : 'days'})</span>
                </p>
                {lr.reason && <p className="text-xs text-surface-400 mt-0.5 italic">"{lr.reason as string}"</p>}
                {lr.adminNote && <p className="text-xs text-surface-500 mt-0.5">Note: {lr.adminNote as string}</p>}
              </div>
              {lr.status === 'PENDING' && (
                <button onClick={() => handleCancel(lr.id as string)} className="text-xs text-red-500 hover:underline flex-shrink-0">Cancel</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Apply modal */}
      <Modal isOpen={showApply} onClose={() => setShowApply(false)} title="Apply for Leave">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">Leave Type</label>
            <select className="input-field text-sm" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              {LEAVE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Start Date *</label>
              <input required type="date" className="input-field text-sm" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">End Date *</label>
              <input required type="date" className="input-field text-sm" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">Reason</label>
            <textarea rows={3} className="input-field text-sm resize-none" placeholder="Optional reason" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowApply(false)} className="btn-secondary flex-1 justify-center text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center text-sm disabled:opacity-60">
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LeavePage;
