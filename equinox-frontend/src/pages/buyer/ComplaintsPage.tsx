import React, { useState } from 'react';
import { Plus, AlertCircle, Search } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { useApi } from '../../hooks/useApi';
import { complaintsService } from '../../services/complaints.service';
import toast from 'react-hot-toast';

const STATUSES = ['All', 'OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED'];

const PRIORITY_COLOR: Record<string, string> = {
  LOW: 'text-surface-400',
  MEDIUM: 'text-amber-500',
  HIGH: 'text-red-500',
  CRITICAL: 'text-red-700',
};

const ComplaintsPage: React.FC = () => {
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', againstId: '', priority: 'MEDIUM' });

  const { data: complaintsRes, refetch } = useApi(() => complaintsService.list({ limit: 100 }), []);
  const complaints: Record<string, unknown>[] = complaintsRes?.data || [];

  const handleEscalate = async (id: string) => {
    try {
      await complaintsService.escalate(id);
      toast.success('Complaint escalated to admin');
      refetch();
    } catch { toast.error('Failed to escalate'); }
  };

  const filtered = complaints.filter(c =>
    (filter === 'All' || c.status === filter) &&
    (search === '' ||
      (c.title as string).toLowerCase().includes(search.toLowerCase()) ||
      ((c.against as Record<string, string>)?.name || '').toLowerCase().includes(search.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await complaintsService.create({
        title: form.title,
        description: form.description,
        againstId: form.againstId || 'placeholder',
        priority: form.priority,
      });
      setSubmitted(true);
      refetch();
    } catch {
      toast.error('Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Complaints & Issues</h1>
          <p className="text-surface-500 text-sm mt-0.5">Submit and track issues with your service providers.</p>
        </div>
        <button onClick={() => { setShowAdd(true); setSubmitted(false); setForm({ title: '', description: '', againstId: '', priority: 'MEDIUM' }); }} className="btn-primary text-sm">
          <Plus size={16} /> New Complaint
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED'].map(s => {
          const count = complaints.filter(c => c.status === s).length;
          return (
            <div key={s} className="card text-center">
              <p className="text-2xl font-bold text-surface-900">{count}</p>
              <p className="text-sm text-surface-500 capitalize mt-0.5">{s.replace('_', ' ').toLowerCase()}</p>
            </div>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="card p-4 flex flex-col md:flex-row gap-3">
        <div className="flex items-center gap-2 bg-surface-50 border border-surface-200 rounded-xl px-3 py-2 flex-1">
          <Search size={15} className="text-surface-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search complaints..." className="bg-transparent text-sm outline-none flex-1 placeholder-surface-400" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors ${filter === s ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}>{s.replace('_', ' ').toLowerCase()}</button>
          ))}
        </div>
      </div>

      {/* Complaints list */}
      <div className="space-y-3">
        {filtered.map(c => (
          <div key={c.id as string} className="card hover:shadow-md transition-all duration-200">
            <div className="flex items-start gap-4">
              <AlertCircle size={20} className={`flex-shrink-0 mt-0.5 ${PRIORITY_COLOR[c.priority as string] || 'text-surface-400'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h3 className="font-semibold text-surface-800">{c.title as string}</h3>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge label={(c.status as string).replace('_', ' ').toLowerCase()} />
                    {(c.status === 'OPEN' || c.status === 'IN_REVIEW') && (
                      <button
                        onClick={() => handleEscalate(c.id as string)}
                        className="text-xs text-orange-600 border border-orange-200 bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded transition-colors"
                      >
                        Escalate
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-surface-600 mb-3">{c.description as string}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-surface-400">
                  {c.against && (
                    <span className="bg-surface-100 px-2 py-0.5 rounded font-medium text-surface-600">
                      {(c.against as Record<string, string>).name}
                    </span>
                  )}
                  <span className={`font-medium capitalize ${PRIORITY_COLOR[c.priority as string] || 'text-surface-400'}`}>
                    {(c.priority as string).toLowerCase()} priority
                  </span>
                  <span>Submitted {new Date(c.createdAt as string).toLocaleDateString()}</span>
                </div>
                {c.resolution && (
                  <p className="text-xs text-surface-500 mt-2 italic">Resolution: {c.resolution as string}</p>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-surface-400">
            <AlertCircle size={32} className="mx-auto mb-3 opacity-30" />
            <p>No complaints found.</p>
          </div>
        )}
      </div>

      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); setSubmitted(false); }} title="Submit a Complaint">
        {submitted ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="font-bold text-surface-900 text-lg mb-2">Complaint Submitted</h3>
            <p className="text-surface-500 text-sm">We'll investigate and respond within 48 hours.</p>
            <button onClick={() => { setShowAdd(false); setSubmitted(false); }} className="btn-primary mt-5 text-sm">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Title *</label>
              <input required className="input-field text-sm" placeholder="Brief description of the issue" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Priority</label>
              <select className="input-field text-sm" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Description *</label>
              <textarea required rows={4} className="input-field text-sm resize-none" placeholder="Describe the issue in detail..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary flex-1 justify-center text-sm">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center text-sm disabled:opacity-60">{submitting ? 'Submitting...' : 'Submit'}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default ComplaintsPage;
