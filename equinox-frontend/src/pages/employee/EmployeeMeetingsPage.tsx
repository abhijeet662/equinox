import React, { useState } from 'react';
import { Calendar, Video, Clock, Check, CheckSquare, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import { useApi } from '../../hooks/useApi';
import { tasksService } from '../../services/tasks.service';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

type Tab = 'upcoming' | 'past';

interface ActionItem { id: string; text: string; done: boolean; }
type ActionMap = Record<string, ActionItem[]>;

// Hardcoded recurring standups / meetings for demo realism
const FIXED_MEETINGS = [
  { id: 'mtg-1', title: 'Daily Standup', type: 'standup', date: new Date(Date.now() + 86400000).toISOString(), duration: '15 min', link: '#' },
  { id: 'mtg-2', title: 'Sprint Planning', type: 'planning', date: new Date(Date.now() + 3 * 86400000).toISOString(), duration: '1 hr', link: '#' },
  { id: 'mtg-3', title: 'Performance Review', type: 'review', date: new Date(Date.now() + 7 * 86400000).toISOString(), duration: '30 min', link: '#' },
  { id: 'mtg-4', title: 'Team Retrospective', type: 'retro', date: new Date(Date.now() - 86400000).toISOString(), duration: '45 min', link: '#' },
  { id: 'mtg-5', title: 'Product Demo', type: 'demo', date: new Date(Date.now() - 4 * 86400000).toISOString(), duration: '1 hr', link: '#' },
  { id: 'mtg-6', title: 'Onboarding Session', type: 'onboarding', date: new Date(Date.now() - 10 * 86400000).toISOString(), duration: '2 hrs', link: '#' },
];

const TYPE_COLOR: Record<string, string> = {
  standup: 'bg-primary-100 text-primary-700',
  planning: 'bg-blue-100 text-blue-700',
  review: 'bg-amber-100 text-amber-700',
  retro: 'bg-purple-100 text-purple-700',
  demo: 'bg-emerald-100 text-emerald-700',
  onboarding: 'bg-pink-100 text-pink-700',
};

const EmployeeMeetingsPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('upcoming');
  const [actions, setActions] = useState<ActionMap>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [newItem, setNewItem] = useState<Record<string, string>>({ mtg: '', text: '' });

  // Pull tasks assigned to employee to show as additional context
  const { data: tasksRes } = useApi(() => tasksService.list({ limit: 50 }), []);
  const tasks: Record<string, unknown>[] = tasksRes?.data || [];
  const taskMeetings = tasks
    .filter(t => (t.title as string).toLowerCase().includes('meeting') || (t.title as string).toLowerCase().includes('call') || (t.title as string).toLowerCase().includes('sync'))
    .map(t => ({
      id: t.id as string,
      title: t.title as string,
      type: 'task',
      date: (t.dueDate || new Date().toISOString()) as string,
      duration: '—',
      link: '#',
    }));

  const allMeetings = [...FIXED_MEETINGS, ...taskMeetings];
  const now = new Date();
  const upcoming = allMeetings.filter(m => new Date(m.date) > now);
  const past     = allMeetings.filter(m => new Date(m.date) <= now);
  const displayed = tab === 'upcoming' ? upcoming : past;

  const addActionItem = (meetingId: string) => {
    const text = newItem[meetingId]?.trim();
    if (!text) return;
    const item: ActionItem = { id: `ai-${Date.now()}`, text, done: false };
    setActions(prev => ({ ...prev, [meetingId]: [...(prev[meetingId] || []), item] }));
    setNewItem(prev => ({ ...prev, [meetingId]: '' }));
  };

  const toggleActionItem = (meetingId: string, itemId: string) => {
    setActions(prev => ({
      ...prev,
      [meetingId]: prev[meetingId].map(i => i.id === itemId ? { ...i, done: !i.done } : i),
    }));
  };

  const removeActionItem = (meetingId: string, itemId: string) => {
    setActions(prev => ({
      ...prev,
      [meetingId]: prev[meetingId].filter(i => i.id !== itemId),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Meetings & Calls</h1>
          <p className="text-surface-500 text-sm mt-0.5">View your scheduled meetings, join calls, and manage action items.</p>
        </div>
        <button onClick={() => setShowSchedule(true)} className="btn-primary text-sm">
          <Plus size={16} /> Request Meeting
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Calendar size={18} className="text-primary-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-surface-900">{upcoming.length}</p>
            <p className="text-xs text-surface-500">Upcoming</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 bg-surface-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckSquare size={18} className="text-surface-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-surface-900">{past.length}</p>
            <p className="text-xs text-surface-500">Completed</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckSquare size={18} className="text-amber-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-surface-900">
              {Object.values(actions).flat().filter(a => !a.done).length}
            </p>
            <p className="text-xs text-surface-500">Open Action Items</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-100 rounded-xl w-fit">
        {(['upcoming', 'past'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-white shadow-sm text-primary-600' : 'text-surface-500 hover:text-surface-800'}`}
          >
            {t} ({t === 'upcoming' ? upcoming.length : past.length})
          </button>
        ))}
      </div>

      {/* Meeting list */}
      <div className="space-y-3">
        {displayed.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <Calendar size={40} className="text-surface-300 mb-3" />
            <p className="font-medium text-surface-600">No {tab} meetings</p>
          </div>
        ) : displayed.map(meeting => {
          const isUpcoming = new Date(meeting.date) > now;
          const meetingActions = actions[meeting.id] || [];
          const isExpanded = expanded === meeting.id;

          return (
            <div key={meeting.id} className="card hover:shadow-md transition-all duration-200">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isUpcoming ? 'bg-primary-50' : 'bg-surface-100'}`}>
                  <Video size={20} className={isUpcoming ? 'text-primary-600' : 'text-surface-400'} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-surface-900">{meeting.title}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-surface-500">
                      <Clock size={12} /> {formatDate(meeting.date)}
                    </span>
                    <span className="text-xs text-surface-500">• {meeting.duration}</span>
                    <span className={`badge text-xs ${TYPE_COLOR[meeting.type] || 'bg-surface-100 text-surface-600'}`}>{meeting.type}</span>
                    {meetingActions.length > 0 && (
                      <span className="text-xs text-amber-600 font-medium">
                        {meetingActions.filter(a => !a.done).length}/{meetingActions.length} actions open
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : meeting.id)}
                    className="text-xs text-surface-600 border border-surface-200 hover:bg-surface-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <CheckSquare size={12} /> Actions
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  {isUpcoming && (
                    <button
                      onClick={() => toast.info('Meeting link will be sent to your email')}
                      className="btn-primary text-xs flex items-center gap-1"
                    >
                      <Video size={12} /> Join
                    </button>
                  )}
                </div>
              </div>

              {/* Action items panel */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-surface-100">
                  <p className="text-xs font-semibold text-surface-600 mb-3 uppercase tracking-wide">Action Items</p>

                  <div className="space-y-2 mb-3">
                    {meetingActions.length === 0 ? (
                      <p className="text-xs text-surface-400 py-2">No action items yet. Add one below.</p>
                    ) : meetingActions.map(item => (
                      <div key={item.id} className="flex items-center gap-2 group">
                        <button
                          onClick={() => toggleActionItem(meeting.id, item.id)}
                          className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${item.done ? 'bg-green-500 border-green-500' : 'border-surface-300 hover:border-green-400'}`}
                        >
                          {item.done && <Check size={10} className="text-white" />}
                        </button>
                        <span className={`text-sm flex-1 ${item.done ? 'line-through text-surface-400' : 'text-surface-700'}`}>{item.text}</span>
                        <button
                          onClick={() => removeActionItem(meeting.id, item.id)}
                          className="w-5 h-5 rounded flex items-center justify-center text-surface-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add action item…"
                      value={newItem[meeting.id] || ''}
                      onChange={e => setNewItem(prev => ({ ...prev, [meeting.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addActionItem(meeting.id)}
                      className="input-field text-sm flex-1"
                    />
                    <button
                      onClick={() => addActionItem(meeting.id)}
                      className="btn-primary text-xs px-3"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Request Meeting Modal */}
      {showSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
              <h2 className="font-bold text-surface-900">Request a Meeting</h2>
              <button onClick={() => setShowSchedule(false)} className="w-8 h-8 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-400">
                <X size={16} />
              </button>
            </div>
            <form
              onSubmit={e => { e.preventDefault(); toast.success('Meeting request sent to your manager'); setShowSchedule(false); }}
              className="px-6 py-5 space-y-4"
            >
              <div>
                <label className="text-xs font-medium text-surface-600 mb-1.5 block">Meeting Title *</label>
                <input required className="input-field text-sm" placeholder="e.g. 1:1 with Manager" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-surface-600 mb-1.5 block">Preferred Date *</label>
                  <input required type="date" className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-surface-600 mb-1.5 block">Duration</label>
                  <select className="input-field text-sm">
                    <option>15 min</option>
                    <option>30 min</option>
                    <option>45 min</option>
                    <option>1 hr</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-surface-600 mb-1.5 block">Agenda / Notes</label>
                <textarea rows={3} className="input-field text-sm resize-none" placeholder="Topics to discuss…" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowSchedule(false)} className="btn-outline flex-1 justify-center text-sm">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center text-sm">Send Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeMeetingsPage;
