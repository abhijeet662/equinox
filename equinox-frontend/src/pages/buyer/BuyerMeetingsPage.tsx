import React, { useState } from 'react';
import { Calendar, Video, FileText, Clock, Users, Plus, X, CheckSquare } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import { formatDate } from '../../utils/helpers';
import { useApi } from '../../hooks/useApi';
import { contractsService } from '../../services/contracts.service';
import toast from 'react-hot-toast';

type Tab = 'upcoming' | 'past' | 'all';

interface MeetingForm {
  title: string;
  dateTime: string;
  provider: string;
  notes: string;
}

const EMPTY_FORM: MeetingForm = { title: '', dateTime: '', provider: '', notes: '' };

const BuyerMeetingsPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('upcoming');
  const [showSchedule, setShowSchedule] = useState(false);
  const [showNotes, setShowNotes] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<MeetingForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const { data: contractsRes } = useApi(() => contractsService.list({ limit: 50 }), []);
  const contracts: Record<string, unknown>[] = contractsRes?.data || [];

  const now = new Date();

  // Use contracts as meeting proxies — each contract = a scheduled engagement
  const upcoming = contracts.filter(c => {
    const d = c.startDate ? new Date(c.startDate as string) : null;
    return d && d > now && c.status !== 'CANCELLED';
  });

  const past = contracts.filter(c => {
    const d = c.startDate ? new Date(c.startDate as string) : null;
    return (d && d <= now) || c.status === 'COMPLETED';
  });

  const displayed = tab === 'upcoming' ? upcoming : tab === 'past' ? past : contracts;

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate API call — real meeting scheduling would go here
    await new Promise(r => setTimeout(r, 600));
    toast.success('Meeting request sent to provider');
    setShowSchedule(false);
    setForm(EMPTY_FORM);
    setSubmitting(false);
  };

  const handleJoin = () => {
    toast.info('Meeting link will be sent to your email');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Meetings & Calls</h1>
          <p className="text-surface-500 text-sm mt-0.5">Join calls and review meeting notes with your providers.</p>
        </div>
        <button onClick={() => setShowSchedule(true)} className="btn-primary text-sm">
          <Plus size={16} /> Schedule Meeting
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Calendar size={18} className="text-primary-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-surface-900">{contracts.length}</p>
            <p className="text-sm text-surface-500">Total Meetings</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Clock size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-surface-900">{upcoming.length}</p>
            <p className="text-sm text-surface-500">Upcoming</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 bg-surface-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckSquare size={18} className="text-surface-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-surface-900">{past.length}</p>
            <p className="text-sm text-surface-500">Completed</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-100 rounded-xl w-fit">
        {(['upcoming', 'past', 'all'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t ? 'bg-white shadow-sm text-primary-600' : 'text-surface-500 hover:text-surface-800'
            }`}
          >
            {t} {t === 'upcoming' ? `(${upcoming.length})` : t === 'past' ? `(${past.length})` : `(${contracts.length})`}
          </button>
        ))}
      </div>

      {/* Meeting list */}
      <div className="space-y-3">
        {displayed.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <Calendar size={40} className="text-surface-300 mb-3" />
            <p className="font-medium text-surface-600">No {tab === 'all' ? '' : tab} meetings</p>
            <p className="text-sm text-surface-400 mt-1">
              {tab === 'upcoming' ? 'Schedule a meeting with your provider below.' : 'Past meetings will appear here.'}
            </p>
          </div>
        ) : (
          displayed.map(contract => {
            const provider = contract.provider as Record<string, string> | null;
            const isUpcoming = contract.startDate && new Date(contract.startDate as string) > now;
            return (
              <div key={contract.id as string} className="card hover:shadow-md transition-all duration-200">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isUpcoming ? 'bg-primary-50' : 'bg-surface-100'
                  }`}>
                    <Video size={20} className={isUpcoming ? 'text-primary-600' : 'text-surface-400'} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-surface-900 truncate">{contract.title as string}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-surface-500">
                        <Users size={12} />
                        {provider?.name || provider?.company || 'Provider'}
                      </span>
                      {contract.startDate && (
                        <span className="flex items-center gap-1 text-xs text-surface-500">
                          <Clock size={12} />
                          {formatDate(contract.startDate as string)}
                        </span>
                      )}
                      <span className="text-xs bg-surface-100 text-surface-600 px-2 py-0.5 rounded">
                        {contract.type as string}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge label={(contract.status as string).toLowerCase()} />
                    <button
                      onClick={() => setShowNotes(contract)}
                      className="text-xs text-surface-600 border border-surface-200 hover:bg-surface-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <FileText size={12} /> Notes
                    </button>
                    {isUpcoming && (
                      <button
                        onClick={handleJoin}
                        className="btn-primary text-xs flex items-center gap-1"
                      >
                        <Video size={12} /> Join
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Meeting Notes Modal */}
      {showNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
              <div>
                <h2 className="font-bold text-surface-900">Meeting Notes</h2>
                <p className="text-xs text-surface-500 mt-0.5">{showNotes.title as string}</p>
              </div>
              <button onClick={() => setShowNotes(null)} className="w-8 h-8 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-400">
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5">
              {showNotes.description ? (
                <p className="text-sm text-surface-700 leading-relaxed whitespace-pre-wrap">{showNotes.description as string}</p>
              ) : (
                <div className="flex flex-col items-center py-8 text-center text-surface-400">
                  <FileText size={32} className="mb-2 opacity-30" />
                  <p className="text-sm">No notes available for this meeting.</p>
                </div>
              )}
              <div className="mt-5 pt-4 border-t border-surface-100">
                <div className="flex flex-wrap gap-3 text-xs text-surface-500">
                  {showNotes.type && <span className="bg-surface-100 px-2 py-1 rounded">Type: {showNotes.type as string}</span>}
                  {showNotes.startDate && <span className="bg-surface-100 px-2 py-1 rounded">Date: {formatDate(showNotes.startDate as string)}</span>}
                  {showNotes.endDate && <span className="bg-surface-100 px-2 py-1 rounded">End: {formatDate(showNotes.endDate as string)}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {showSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
              <h2 className="font-bold text-surface-900">Schedule a Meeting</h2>
              <button onClick={() => setShowSchedule(false)} className="w-8 h-8 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-400">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSchedule} className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-surface-600 mb-1.5 block">Meeting Title *</label>
                <input
                  required
                  className="input-field text-sm"
                  placeholder="e.g. Q2 Strategy Review"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-surface-600 mb-1.5 block">Date & Time *</label>
                <input
                  required
                  type="datetime-local"
                  className="input-field text-sm"
                  value={form.dateTime}
                  onChange={e => setForm({ ...form, dateTime: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-surface-600 mb-1.5 block">Provider</label>
                <select
                  className="input-field text-sm"
                  value={form.provider}
                  onChange={e => setForm({ ...form, provider: e.target.value })}
                >
                  <option value="">Select provider…</option>
                  {contracts.map(c => {
                    const p = c.provider as Record<string, string>;
                    return (
                      <option key={c.id as string} value={p?.id || ''}>
                        {p?.name || p?.company || 'Provider'}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-surface-600 mb-1.5 block">Agenda / Notes</label>
                <textarea
                  rows={3}
                  className="input-field text-sm resize-none"
                  placeholder="Topics to discuss, agenda items…"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowSchedule(false)} className="btn-outline flex-1 justify-center text-sm">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center text-sm disabled:opacity-60">
                  {submitting ? 'Sending…' : 'Request Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerMeetingsPage;
