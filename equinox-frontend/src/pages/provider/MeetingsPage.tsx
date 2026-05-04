import React, { useState } from 'react';
import {
  Calendar, Plus, Clock, CheckSquare, Users, Sparkles,
  FileText, ChevronRight, X, CheckCircle2, ListTodo,
} from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { useApi } from '../../hooks/useApi';
import { meetingsService } from '../../services/meetings.service';
import type { Meeting } from '../../services/meetings.service';
import { useAppSelector } from '../../hooks/useAppSelector';
import toast from 'react-hot-toast';

const MEETING_TYPES = ['STANDUP', 'PLANNING', 'REVIEW', 'RETROSPECTIVE', 'CLIENT', 'ONE_ON_ONE', 'OTHER'];

const TYPE_COLOR: Record<string, string> = {
  STANDUP: 'bg-blue-100 text-blue-700',
  PLANNING: 'bg-purple-100 text-purple-700',
  REVIEW: 'bg-amber-100 text-amber-700',
  RETROSPECTIVE: 'bg-indigo-100 text-indigo-700',
  CLIENT: 'bg-emerald-100 text-emerald-700',
  ONE_ON_ONE: 'bg-rose-100 text-rose-700',
  OTHER: 'bg-surface-100 text-surface-600',
};

const STATUS_COLOR: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const MeetingsPage: React.FC = () => {
  const { user } = useAppSelector(s => s.auth);
  const { data: meetingsRes, refetch } = useApi(() => meetingsService.list({ limit: 50 }), []);
  const meetings: Meeting[] = (meetingsRes?.data as Meeting[]) || [];

  const [showCreate, setShowCreate] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showMom, setShowMom] = useState(false);
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);

  // ── Create form state ─────────────────────────────────────────────────────
  const [form, setForm] = useState({
    title: '', type: 'OTHER', scheduledAt: '', duration: 30, location: '', agenda: '',
  });

  const now = new Date();
  const upcoming = meetings.filter(m => new Date(m.scheduledAt) >= now && m.status === 'SCHEDULED');
  const completed = meetings.filter(m => m.status === 'COMPLETED');
  const totalActionItems = meetings.reduce((s, m) => s + (m.actionItems?.length || 0), 0);

  // ── Create meeting ────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.scheduledAt) { toast.error('Title and date/time are required'); return; }
    setCreating(true);
    try {
      await meetingsService.create({
        title: form.title,
        type: form.type as Meeting['type'],
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        duration: form.duration,
        location: form.location || undefined,
        agenda: form.agenda || undefined,
        attendeeIds: [],
      });
      toast.success('Meeting scheduled');
      setShowCreate(false);
      setForm({ title: '', type: 'OTHER', scheduledAt: '', duration: 30, location: '', agenda: '' });
      refetch();
    } catch {
      toast.error('Failed to schedule meeting');
    } finally {
      setCreating(false);
    }
  };

  // ── AI Summarize (MoM) ────────────────────────────────────────────────────
  const handleGenerateMom = async (meeting: Meeting) => {
    setGenerating(true);
    try {
      const result = await meetingsService.generateMom(meeting.id);
      // Update the selected meeting locally with fresh MoM
      setSelectedMeeting(prev => prev ? { ...prev, mom: result.mom, momGeneratedAt: result.momGeneratedAt, actionItems: result.actionItems } : null);
      toast.success(result.aiPowered ? '✨ AI-generated MoM ready' : 'MoM generated (template mode — add GEMINI_API_KEY for AI)');
      refetch();
    } catch {
      toast.error('Failed to generate MoM');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Meetings & Calendar</h1>
          <p className="text-surface-500 text-sm mt-0.5">Schedule meetings, track attendance and generate AI-powered minutes.</p>
        </div>
        <button className="btn-primary text-sm flex items-center gap-2" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Schedule Meeting
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Meetings', value: meetings.length, icon: <Calendar size={18} className="text-primary-600" />, bg: 'bg-primary-50' },
          { label: 'Upcoming', value: upcoming.length, icon: <Clock size={18} className="text-blue-600" />, bg: 'bg-blue-50' },
          { label: 'Completed', value: completed.length, icon: <CheckCircle2 size={18} className="text-green-600" />, bg: 'bg-green-50' },
          { label: 'Action Items', value: totalActionItems, icon: <ListTodo size={18} className="text-amber-600" />, bg: 'bg-amber-50' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center`}>{s.icon}</div>
              <div>
                <p className="text-2xl font-bold text-surface-900">{s.value}</p>
                <p className="text-sm text-surface-500">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Meeting List */}
      <div className="space-y-3">
        {meetings.length === 0 && (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <Calendar size={40} className="text-surface-300 mb-3" />
            <p className="font-medium text-surface-600">No meetings found</p>
            <p className="text-sm text-surface-400 mt-1">Schedule your first meeting to get started.</p>
            <button className="btn-primary text-sm mt-4" onClick={() => setShowCreate(true)}>
              <Plus size={15} /> Schedule Meeting
            </button>
          </div>
        )}

        {meetings.map(meeting => (
          <div
            key={meeting.id}
            className="card flex flex-col md:flex-row md:items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => { setSelectedMeeting(meeting); setShowMom(false); }}
          >
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar size={18} className="text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-surface-900 truncate">{meeting.title}</p>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-xs text-surface-500">
                  <Clock size={12} /> {new Date(meeting.scheduledAt).toLocaleString()}
                </span>
                <span className="flex items-center gap-1 text-xs text-surface-500">
                  <Users size={12} /> {meeting.attendees?.length || 0} attendee{(meeting.attendees?.length || 0) !== 1 ? 's' : ''}
                </span>
                {meeting.actionItems && meeting.actionItems.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-surface-500">
                    <CheckSquare size={12} /> {meeting.actionItems.length} action{meeting.actionItems.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`badge text-xs font-medium ${TYPE_COLOR[meeting.type] || TYPE_COLOR.OTHER}`}>
                {meeting.type.replace('_', ' ')}
              </span>
              <span className={`badge text-xs font-medium ${STATUS_COLOR[meeting.status] || 'bg-surface-100 text-surface-600'}`}>
                {meeting.status.replace('_', ' ')}
              </span>
              {meeting.mom && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded">
                  <Sparkles size={9} /> MoM
                </span>
              )}
              <ChevronRight size={16} className="text-surface-400" />
            </div>
          </div>
        ))}
      </div>

      {/* ── Schedule Meeting Modal ── */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Schedule Meeting" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">Meeting Title *</label>
            <input required className="input-field text-sm" placeholder="e.g. Q4 Planning Session"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Type</label>
              <select className="input-field text-sm" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {MEETING_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Duration (min)</label>
              <input type="number" min={5} max={480} className="input-field text-sm"
                value={form.duration} onChange={e => setForm({ ...form, duration: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">Date & Time *</label>
            <input required type="datetime-local" className="input-field text-sm"
              value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">Location / Video Link</label>
            <input className="input-field text-sm" placeholder="https://meet.google.com/... or Room 3B"
              value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">Agenda / Notes</label>
            <textarea rows={3} className="input-field text-sm resize-none" placeholder="Meeting agenda or discussion points..."
              value={form.agenda} onChange={e => setForm({ ...form, agenda: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" className="btn-secondary flex-1 justify-center text-sm" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" disabled={creating} className="btn-primary flex-1 justify-center text-sm disabled:opacity-60">
              {creating ? 'Scheduling...' : 'Schedule Meeting'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Meeting Detail Drawer ── */}
      {selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/40"
          onClick={() => setSelectedMeeting(null)}>
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            {/* Drawer header */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-surface-200 flex-shrink-0">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="font-bold text-surface-900 text-lg">{selectedMeeting.title}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className={`badge text-xs font-medium ${TYPE_COLOR[selectedMeeting.type] || TYPE_COLOR.OTHER}`}>
                    {selectedMeeting.type.replace('_', ' ')}
                  </span>
                  <span className={`badge text-xs font-medium ${STATUS_COLOR[selectedMeeting.status] || 'bg-surface-100 text-surface-600'}`}>
                    {selectedMeeting.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-surface-500 flex items-center gap-1">
                    <Clock size={11} /> {new Date(selectedMeeting.scheduledAt).toLocaleString()} · {selectedMeeting.duration} min
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedMeeting(null)} className="w-8 h-8 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-400">
                <X size={16} />
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {selectedMeeting.location && (
                <div className="text-sm text-surface-600 bg-surface-50 rounded-xl px-3 py-2">
                  📍 {selectedMeeting.location}
                </div>
              )}

              {selectedMeeting.agenda && (
                <div>
                  <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">Agenda</p>
                  <p className="text-sm text-surface-700 whitespace-pre-wrap leading-relaxed">{selectedMeeting.agenda}</p>
                </div>
              )}

              {/* Action Items */}
              {(selectedMeeting.actionItems || []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">Action Items</p>
                  <div className="space-y-2">
                    {(selectedMeeting.actionItems || []).map(item => (
                      <div key={item.id} className="flex items-start gap-2 text-sm">
                        <div className={`w-4 h-4 rounded-full flex-shrink-0 mt-0.5 ${item.done ? 'bg-green-500' : 'bg-surface-200'}`} />
                        <span className={item.done ? 'line-through text-surface-400' : 'text-surface-700'}>
                          {item.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Summarize section */}
              <div className="border border-violet-200 bg-violet-50/50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-violet-600" />
                    <span className="font-semibold text-surface-800 text-sm">AI Minutes of Meeting</span>
                  </div>
                  <button
                    onClick={() => handleGenerateMom(selectedMeeting)}
                    disabled={generating}
                    className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
                  >
                    <Sparkles size={13} />
                    {generating ? 'Generating...' : selectedMeeting.mom ? 'Regenerate MoM' : 'AI Summarize'}
                  </button>
                </div>

                {selectedMeeting.mom ? (
                  <div>
                    {selectedMeeting.momGeneratedAt && (
                      <p className="text-[11px] text-violet-500 mb-2">
                        Generated {new Date(selectedMeeting.momGeneratedAt).toLocaleString()}
                      </p>
                    )}
                    {showMom ? (
                      <div className="relative">
                        <pre className="text-xs text-surface-700 whitespace-pre-wrap leading-relaxed bg-white border border-violet-100 rounded-xl p-3 max-h-64 overflow-y-auto font-sans">
                          {selectedMeeting.mom}
                        </pre>
                        <button
                          onClick={() => setShowMom(false)}
                          className="mt-2 text-xs text-violet-600 hover:underline"
                        >
                          Hide
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowMom(true)}
                        className="flex items-center gap-1.5 text-xs font-medium text-violet-700 hover:underline"
                      >
                        <FileText size={12} /> View Minutes of Meeting
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-surface-500">
                    Click <strong>AI Summarize</strong> to generate professional minutes from your meeting agenda and action items using Gemini AI.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingsPage;
