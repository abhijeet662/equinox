import React, { useRef, useState, useEffect } from 'react';
import { Search, Upload, Paperclip, X, CheckSquare, Clock, AlertTriangle, Lock, BookOpen, CalendarOff } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import { priorityColor } from '../../utils/helpers';
import { useApi } from '../../hooks/useApi';
import { tasksService } from '../../services/tasks.service';
import { useAppSelector } from '../../hooks/useAppSelector';
import toast from 'react-hot-toast';

type Priority = 'P0' | 'P1' | 'P2' | 'P3';

const COLUMNS = [
  { key: 'TODO',        label: 'To Do',      color: 'bg-surface-100 text-surface-700', headerBg: 'bg-surface-100', textColor: 'text-surface-700' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100 text-blue-700',      headerBg: 'bg-blue-100',    textColor: 'text-blue-700' },
  { key: 'IN_REVIEW',   label: 'In Review',  color: 'bg-amber-100 text-amber-700',     headerBg: 'bg-amber-100',   textColor: 'text-amber-700' },
  { key: 'DONE',        label: 'Done',       color: 'bg-green-100 text-green-700',     headerBg: 'bg-green-100',   textColor: 'text-green-700' },
] as const;

const STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const ACCEPTANCE_STATUSES = new Set(['IN_PROGRESS', 'IN_REVIEW']);

interface UploadedFile { name: string; size: string; }
type FileMap = Record<string, UploadedFile[]>;

const EmployeeTaskBoardPage: React.FC = () => {
  const { user } = useAppSelector(s => s.auth);
  const [search, setSearch]         = useState('');
  const [filterPriority, setFilter] = useState('All');
  const [selectedTask, setSelected] = useState<Record<string, unknown> | null>(null);
  const [uploadedFiles, setFiles]   = useState<FileMap>({});
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Module 1: Cert gate ──────────────────────────────────────────────────────
  const [certGate, setCertGate] = useState({ canDoP0: false, canDoP1: false, certifiedTiers: [] as string[] });
  const [certLoaded, setCertLoaded] = useState(false);

  // ── Module 3: Leave status ───────────────────────────────────────────────────
  const [onLeave, setOnLeave] = useState(false);
  const [leaveInfo, setLeaveInfo] = useState<{ type: string; startDate: string; endDate: string } | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    tasksService.certEligibility()
      .then(data => { setCertGate(data); setCertLoaded(true); })
      .catch(() => setCertLoaded(true));

    tasksService.capacityCheck(user.id)
      .then(cap => { setOnLeave(cap.onLeave); setLeaveInfo(cap.leave ?? null); })
      .catch(() => {/* silently ignore */});
  }, [user?.id]);

  const { data: tasksRes, refetch } = useApi(() => tasksService.list({ limit: 100 }), []);
  const tasks: Record<string, unknown>[] = tasksRes?.data || [];

  const filtered = tasks.filter(t =>
    (filterPriority === 'All' || t.priority === filterPriority) &&
    (search === '' || (t.title as string).toLowerCase().includes(search.toLowerCase()))
  );

  const byStatus = (s: string) => filtered.filter(t => t.status === s);

  // Check if the employee can change a task to a given status
  const canChangeStatus = (task: Record<string, unknown>, toStatus: string): boolean => {
    if (!certLoaded) return true;
    if (!ACCEPTANCE_STATUSES.has(toStatus)) return true; // TODO / DONE always allowed
    const priority = task.priority as Priority;
    if (priority === 'P0') return certGate.canDoP0;
    if (priority === 'P1') return certGate.canDoP1;
    return true;
  };

  const handleStatusChange = async (id: string, task: Record<string, unknown>, newStatus: string) => {
    // Cert gate check
    if (!canChangeStatus(task, newStatus)) {
      toast.error(
        `Certification required for ${task.priority as string} tasks. Complete the required LMS course first.`,
        { duration: 5000 },
      );
      return;
    }
    // Leave check — block accepting P0/P1 if on leave
    if (onLeave && ACCEPTANCE_STATUSES.has(newStatus)) {
      const priority = task.priority as Priority;
      if (priority === 'P0' || priority === 'P1') {
        toast.error('You are currently on approved leave and cannot accept P0/P1 tasks.', { duration: 5000 });
        return;
      }
    }
    try {
      await tasksService.update(id, { status: newStatus });
      toast.success('Status updated');
      refetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to update');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedTask || !e.target.files) return;
    const id = selectedTask.id as string;
    const newFiles = Array.from(e.target.files).map(f => ({
      name: f.name,
      size: f.size > 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(1)} MB` : `${(f.size / 1024).toFixed(0)} KB`,
    }));
    setFiles(prev => ({ ...prev, [id]: [...(prev[id] || []), ...newFiles] }));
    toast.success(`${newFiles.length} file(s) uploaded`);
    e.target.value = '';
  };

  const removeFile = (taskId: string, idx: number) => {
    setFiles(prev => ({ ...prev, [taskId]: prev[taskId].filter((_, i) => i !== idx) }));
  };

  const totalFiles = Object.values(uploadedFiles).flat().length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">My Task Board</h1>
          <p className="text-surface-500 text-sm mt-0.5">Track progress, update status and attach files to your tasks.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-surface-500 bg-surface-50 border border-surface-200 rounded-xl px-3 py-2">
          <Paperclip size={13} /> {totalFiles} attachment{totalFiles !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Module 3: On-Leave Banner */}
      {onLeave && leaveInfo && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <CalendarOff size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-800">You Are Currently on Approved Leave</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Your <strong>{leaveInfo.type.toLowerCase().replace('_', ' ')}</strong> leave runs until{' '}
              <strong>{new Date(leaveInfo.endDate).toLocaleDateString()}</strong>.
              You are marked <span className="font-bold">Unavailable</span> — P0 and P1 tasks cannot be accepted during this period.
            </p>
          </div>
        </div>
      )}

      {/* Module 1: Cert Missing Banner */}
      {certLoaded && !certGate.canDoP1 && !onLeave && (
        <div className="flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-sm">
          <BookOpen size={16} className="text-amber-600 shrink-0" />
          <p className="text-amber-800">
            <span className="font-semibold">Skill Certification Missing —</span>{' '}
            P0 and P1 priority tasks are locked until you complete the required training.{' '}
            <a href="/employee/learning" className="underline font-medium">Complete Training →</a>
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {COLUMNS.map(col => (
          <div key={col.key} className="card text-center">
            <p className="text-xl font-bold text-surface-900">{byStatus(col.key).length}</p>
            <span className={`badge text-xs mt-1 ${col.color}`}>{col.label}</span>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="card p-4 flex flex-col md:flex-row gap-3">
        <div className="flex items-center gap-2 bg-surface-50 border border-surface-200 rounded-xl px-3 py-2 flex-1">
          <Search size={15} className="text-surface-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="bg-transparent text-sm outline-none flex-1 placeholder-surface-400"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['All', 'P0', 'P1', 'P2', 'P3'].map(p => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${filterPriority === p ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map(col => (
          <div key={col.key} className="min-w-[220px]">
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3 ${col.headerBg}`}>
              <span className={`text-sm font-semibold ${col.textColor}`}>{col.label}</span>
              <span className="ml-auto bg-white rounded-full px-2 py-0.5 text-xs font-bold text-surface-600">{byStatus(col.key).length}</span>
            </div>
            <div className="space-y-3">
              {byStatus(col.key).map(task => {
                const tid = task.id as string;
                const files = uploadedFiles[tid] || [];
                const priority = task.priority as Priority;
                const isOverdue = task.dueDate && new Date(task.dueDate as string) < new Date() && task.status !== 'DONE';
                const isHighPriority = priority === 'P0' || priority === 'P1';
                const certLocked = certLoaded && isHighPriority && !canChangeStatus(task, 'IN_PROGRESS');
                const leaveLocked = onLeave && isHighPriority;
                const locked = certLocked || leaveLocked;

                return (
                  <div
                    key={tid}
                    onClick={() => setSelected(task)}
                    className={`bg-white rounded-xl border p-4 hover:shadow-md transition-all duration-200 cursor-pointer
                      ${locked ? 'border-amber-200 bg-amber-50/30' : 'border-surface-200'}`}
                  >
                    <div className="flex items-center justify-between mb-2 gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`badge text-xs font-bold ${priorityColor[priority] || 'bg-surface-100 text-surface-600'}`}>
                          {priority}
                        </span>
                        {locked && (
                          <span
                            title={leaveLocked ? 'You are on leave — unavailable for P0/P1 tasks' : 'Certification required for this priority'}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded cursor-help"
                          >
                            {leaveLocked ? <CalendarOff size={9} /> : <Lock size={9} />}
                            {leaveLocked ? 'On Leave' : 'Cert Required'}
                          </span>
                        )}
                      </div>
                      {isOverdue && <AlertTriangle size={12} className="text-red-500 shrink-0" />}
                    </div>
                    <h3 className="text-sm font-semibold text-surface-800 mb-2 line-clamp-2">{task.title as string}</h3>

                    {/* Status selector — greyed out when locked */}
                    {locked ? (
                      <div
                        title={leaveLocked ? 'Cannot accept tasks while on approved leave' : 'Complete the required LMS certification to change this task\'s status.'}
                        className="flex items-center gap-1 w-full text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1.5 rounded-lg cursor-not-allowed mb-2"
                      >
                        {leaveLocked ? <CalendarOff size={11} /> : <Lock size={11} />}
                        <span className="font-medium">{(task.status as string).replace('_', ' ')}</span>
                      </div>
                    ) : (
                      <select
                        value={task.status as string}
                        onChange={e => { e.stopPropagation(); handleStatusChange(tid, task, e.target.value); }}
                        onClick={e => e.stopPropagation()}
                        className="w-full text-xs border border-surface-200 rounded-lg px-2 py-1.5 text-surface-600 focus:outline-none focus:border-primary-300 mb-2"
                      >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                      </select>
                    )}

                    <div className="flex items-center justify-between text-xs text-surface-400">
                      {task.dueDate && (
                        <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-medium' : ''}`}>
                          <Clock size={10} />
                          {new Date(task.dueDate as string).toLocaleDateString()}
                        </span>
                      )}
                      {files.length > 0 && (
                        <span className="flex items-center gap-1 text-primary-600">
                          <Paperclip size={10} /> {files.length}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {byStatus(col.key).length === 0 && (
                <div className="rounded-xl border-2 border-dashed border-surface-200 p-6 flex items-center justify-center">
                  <CheckSquare size={20} className="text-surface-300" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Task Detail / File Upload Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
              <div className="flex-1 min-w-0 pr-4">
                <h2 className="font-bold text-surface-900 truncate">{selectedTask.title as string}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`badge text-xs font-bold ${priorityColor[selectedTask.priority as Priority] || ''}`}>{selectedTask.priority as string}</span>
                  <Badge label={(selectedTask.status as string).replace('_', ' ').toLowerCase()} />
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-400 flex-shrink-0">
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {selectedTask.description && (
                <div>
                  <p className="text-xs font-medium text-surface-500 mb-1">Description</p>
                  <p className="text-sm text-surface-700 leading-relaxed whitespace-pre-wrap">{selectedTask.description as string}</p>
                </div>
              )}
              {selectedTask.dueDate && (
                <div className="flex items-center gap-2 text-sm text-surface-600">
                  <Clock size={14} className="text-surface-400" />
                  Due: {new Date(selectedTask.dueDate as string).toLocaleDateString()}
                </div>
              )}

              {/* File Upload */}
              <div>
                <p className="text-xs font-medium text-surface-500 mb-2">Attachments</p>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-surface-200 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-colors"
                >
                  <Upload size={18} className="text-surface-400" />
                  <span className="text-xs text-surface-500">Click to upload files</span>
                </div>
                <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
                {(uploadedFiles[selectedTask.id as string] || []).length > 0 && (
                  <div className="mt-3 space-y-2">
                    {(uploadedFiles[selectedTask.id as string] || []).map((f, i) => (
                      <div key={i} className="flex items-center justify-between bg-surface-50 rounded-xl px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Paperclip size={13} className="text-surface-400 flex-shrink-0" />
                          <span className="text-xs text-surface-700 truncate">{f.name}</span>
                          <span className="text-xs text-surface-400 flex-shrink-0">{f.size}</span>
                        </div>
                        <button
                          onClick={() => removeFile(selectedTask.id as string, i)}
                          className="w-6 h-6 rounded-md hover:bg-red-100 flex items-center justify-center text-surface-400 hover:text-red-500 flex-shrink-0 ml-2"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeTaskBoardPage;
