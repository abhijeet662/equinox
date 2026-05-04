import React, { useState, useEffect } from 'react';
import { Plus, Search, Lock, ShieldAlert, BookOpen } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { priorityColor } from '../../utils/helpers';
import { useApi } from '../../hooks/useApi';
import { tasksService } from '../../services/tasks.service';
import { usersService } from '../../services/users.service';
import { useAppSelector } from '../../hooks/useAppSelector';
import toast from 'react-hot-toast';

type Priority = 'P0' | 'P1' | 'P2' | 'P3';

const PRIORITIES = ['All', 'P0', 'P1', 'P2', 'P3'];

const COLUMNS = [
  { key: 'TODO',        label: 'To Do',      color: 'bg-surface-100' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100' },
  { key: 'IN_REVIEW',   label: 'In Review',  color: 'bg-amber-100' },
  { key: 'DONE',        label: 'Done',       color: 'bg-green-100' },
] as const;

const STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

// Which status transitions are considered "accepting" work (not just bookkeeping)
const ACCEPTANCE_STATUSES = new Set(['IN_PROGRESS', 'IN_REVIEW']);

// ─── CERT LOCK TOOLTIP ───────────────────────────────────────────────────────

function CertLockBadge({ priority }: { priority: string }) {
  return (
    <span
      title={`Certification required: complete the ${priority} LMS course to accept this task.`}
      className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded cursor-help"
    >
      <Lock size={9} /> Cert Required
    </span>
  );
}

// ─── CERT GATE BANNER (inside create modal) ───────────────────────────────────

function CertGateBanner({ priority }: { priority: Priority }) {
  const isGated = priority === 'P0' || priority === 'P1';
  if (!isGated) return null;
  return (
    <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
      <ShieldAlert size={16} className="text-amber-600 mt-0.5 shrink-0" />
      <div>
        <p className="font-semibold text-amber-800">Certification Required</p>
        <p className="text-amber-700 text-xs mt-0.5">
          {priority} tasks require a valid LMS certification. Without it, the server will reject the
          assignment.{' '}
          <a href="/provider/training" className="underline font-medium">
            Go to Training →
          </a>
        </p>
      </div>
    </div>
  );
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

const TasksPage: React.FC = () => {
  const { user } = useAppSelector(s => s.auth);
  const isProvider = user?.role === 'provider';

  const [view, setView] = useState<'board' | 'list'>('board');
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '', priority: 'P1' as Priority, dueDate: '', description: '', assignedToId: '',
  });

  // Cert eligibility — loaded only for providers
  const [certGate, setCertGate] = useState({ canDoP0: false, canDoP1: false, certifiedTiers: [] as string[] });
  const [certLoaded, setCertLoaded] = useState(false);

  useEffect(() => {
    if (!isProvider) { setCertLoaded(true); return; }
    tasksService.certEligibility()
      .then(data => { setCertGate(data); setCertLoaded(true); })
      .catch(() => setCertLoaded(true));
  }, [isProvider]);

  const { data: tasksRes, refetch } = useApi(() => tasksService.list({ limit: 100 }), []);
  const { data: employeesRes } = useApi(() => usersService.list({ role: 'EMPLOYEE', limit: 50 }), []);
  const employees: Record<string, unknown>[] = employeesRes?.data || [];
  const tasks: Record<string, unknown>[] = tasksRes?.data || [];

  const filtered = tasks.filter(t =>
    (filterPriority === 'All' || t.priority === filterPriority) &&
    (search === '' || (t.title as string).toLowerCase().includes(search.toLowerCase())),
  );

  const tasksByStatus = (status: string) => filtered.filter(t => t.status === status);

  // Check whether a provider can change status for a given task
  const canChangeStatus = (task: Record<string, unknown>, toStatus: string): boolean => {
    if (!isProvider || !certLoaded) return true;
    const priority = task.priority as Priority;
    if (!ACCEPTANCE_STATUSES.has(toStatus)) return true; // TODO / DONE are fine
    if (priority === 'P0') return certGate.canDoP0;
    if (priority === 'P1') return certGate.canDoP1;
    return true;
  };

  // Check whether a provider can CREATE a P0/P1 task
  const canCreateWithPriority = (priority: Priority): boolean => {
    if (!isProvider) return true;
    if (priority === 'P0') return certGate.canDoP0;
    if (priority === 'P1') return certGate.canDoP1;
    return true;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await tasksService.create({
        title: newTask.title,
        priority: newTask.priority,
        dueDate: newTask.dueDate || undefined,
        description: newTask.description || undefined,
        assignedToId: newTask.assignedToId || undefined,
      });
      toast.success('Task created');
      setShowAddModal(false);
      setNewTask({ title: '', priority: 'P1', dueDate: '', description: '', assignedToId: '' });
      refetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(msg || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId: string, task: Record<string, unknown>, newStatus: string) => {
    if (!canChangeStatus(task, newStatus)) {
      const priority = task.priority as string;
      toast.error(
        `Certification Required: Complete the ${priority} LMS course before accepting this task.`,
        { duration: 5000 },
      );
      return;
    }
    try {
      await tasksService.update(taskId, { status: newStatus });
      refetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(msg || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Task Management</h1>
          <p className="text-surface-500 text-sm mt-0.5">Manage and track all your project tasks.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm">
          <Plus size={16} /> Add Task
        </button>
      </div>

      {/* Cert status banner — shown only when provider has NO P0/P1 certs */}
      {isProvider && certLoaded && !certGate.canDoP1 && (
        <div className="flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-sm">
          <BookOpen size={16} className="text-amber-600 shrink-0" />
          <p className="text-amber-800">
            <span className="font-semibold">Skill Certification Missing —</span> P0 and P1 priority
            tasks are locked until you complete the required training.{' '}
            <a href="/provider/training" className="underline font-medium">Complete Training →</a>
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 flex flex-col md:flex-row gap-3">
        <div className="flex items-center gap-2 bg-surface-50 border border-surface-200 rounded-xl px-3 py-2 flex-1">
          <Search size={15} className="text-surface-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="bg-transparent text-sm outline-none flex-1 text-surface-700 placeholder-surface-400"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {PRIORITIES.map(p => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${filterPriority === p ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-1 p-1 bg-surface-100 rounded-xl ml-auto">
          <button
            onClick={() => setView('board')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === 'board' ? 'bg-white shadow-sm text-primary-600' : 'text-surface-500'}`}
          >
            Board
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-surface-500'}`}
          >
            List
          </button>
        </div>
      </div>

      {/* Board View */}
      {view === 'board' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto">
          {COLUMNS.map(col => (
            <div key={col.key} className="min-w-[240px]">
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3 ${col.color}`}>
                <span className="text-sm font-semibold text-surface-800">{col.label}</span>
                <span className="ml-auto bg-white rounded-full px-2 py-0.5 text-xs font-bold text-surface-600">
                  {tasksByStatus(col.key).length}
                </span>
              </div>
              <div className="space-y-3">
                {tasksByStatus(col.key).map(task => {
                  const priority = task.priority as Priority;
                  const isHighPriority = priority === 'P0' || priority === 'P1';
                  const locked = isProvider && isHighPriority && !canChangeStatus(task, 'IN_PROGRESS');

                  return (
                    <div
                      key={task.id as string}
                      className={`bg-white rounded-xl border p-4 hover:shadow-md transition-all duration-200 cursor-pointer group
                        ${locked ? 'border-amber-200 bg-amber-50/30' : 'border-surface-200'}`}
                    >
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`badge text-xs font-bold ${priorityColor[priority] || 'bg-surface-100 text-surface-600'}`}>
                            {priority}
                          </span>
                          {locked && <CertLockBadge priority={priority} />}
                        </div>

                        {locked ? (
                          /* Locked: show disabled dropdown with lock icon */
                          <div
                            title="Complete the required LMS certification to change this task's status."
                            className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg cursor-not-allowed"
                          >
                            <Lock size={11} />
                            <span className="font-medium">{(task.status as string).replace('_', ' ')}</span>
                          </div>
                        ) : (
                          <select
                            value={task.status as string}
                            onChange={e => handleStatusChange(task.id as string, task, e.target.value)}
                            className="text-xs border border-surface-200 rounded-lg px-1.5 py-1 text-surface-600 focus:outline-none focus:border-primary-300"
                            onClick={e => e.stopPropagation()}
                          >
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                          </select>
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-surface-800 mb-1 line-clamp-2">
                        {task.title as string}
                      </h3>
                      {task.description && (
                        <p className="text-xs text-surface-500 mb-3 line-clamp-2">{task.description as string}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-surface-400">
                        {task.contract && (
                          <span className="bg-surface-50 px-2 py-0.5 rounded truncate">
                            {(task.contract as Record<string, string>).title}
                          </span>
                        )}
                        {task.dueDate && <span>{new Date(task.dueDate as string).toLocaleDateString()}</span>}
                      </div>
                      {task.assignedTo && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <div className="w-5 h-5 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-[10px] font-bold">
                            {((task.assignedTo as Record<string, string>).name || 'U')[0]}
                          </div>
                          <span className="text-xs text-surface-500">
                            {(task.assignedTo as Record<string, string>).name}
                          </span>
                        </div>
                      )}
                      {(task.slaBreached as boolean) && (
                        <span className="badge bg-red-100 text-red-600 text-[10px] mt-2">SLA Breached</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead className="bg-surface-50 border-b border-surface-200">
              <tr>
                <th className="table-th">Task</th>
                <th className="table-th">Priority</th>
                <th className="table-th">Status</th>
                <th className="table-th">Assignee</th>
                <th className="table-th">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filtered.map(task => {
                const priority = task.priority as Priority;
                const isHighPriority = priority === 'P0' || priority === 'P1';
                const locked = isProvider && isHighPriority && !canChangeStatus(task, 'IN_PROGRESS');

                return (
                  <tr key={task.id as string} className="hover:bg-surface-50 transition-colors">
                    <td className="table-td">
                      <p className="font-medium text-surface-800">{task.title as string}</p>
                      {task.description && (
                        <p className="text-xs text-surface-400 mt-0.5">
                          {(task.description as string).slice(0, 60)}...
                        </p>
                      )}
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-1.5">
                        <span className={`badge text-xs font-bold ${priorityColor[priority] || 'bg-surface-100 text-surface-600'}`}>
                          {priority}
                        </span>
                        {locked && <Lock size={12} className="text-amber-500" title="Certification required" />}
                      </div>
                    </td>
                    <td className="table-td">
                      {locked ? (
                        <span
                          title="Complete the required LMS certification to change this task's status."
                          className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded cursor-not-allowed"
                        >
                          <Lock size={10} /> {(task.status as string).replace('_', ' ').toLowerCase()}
                        </span>
                      ) : (
                        <Badge label={(task.status as string).replace('_', ' ').toLowerCase()} />
                      )}
                    </td>
                    <td className="table-td">
                      {task.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-[10px] font-bold">
                            {((task.assignedTo as Record<string, string>).name || 'U')[0]}
                          </div>
                          <span className="text-surface-700">
                            {(task.assignedTo as Record<string, string>).name}
                          </span>
                        </div>
                      ) : <span className="text-surface-400">—</span>}
                    </td>
                    <td className="table-td text-surface-500">
                      {task.dueDate ? new Date(task.dueDate as string).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-surface-400">No tasks found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Task Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Task" size="md">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">Task Title *</label>
            <input
              required
              className="input-field text-sm"
              placeholder="e.g. Implement user authentication"
              value={newTask.title}
              onChange={e => setNewTask({ ...newTask, title: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Priority</label>
              <select
                className="input-field text-sm"
                value={newTask.priority}
                onChange={e => setNewTask({ ...newTask, priority: e.target.value as Priority })}
              >
                <option value="P0">P0 — Critical</option>
                <option value="P1">P1 — High</option>
                <option value="P2">P2 — Medium</option>
                <option value="P3">P3 — Low</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Due Date</label>
              <input
                type="date"
                className="input-field text-sm"
                value={newTask.dueDate}
                onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
              />
            </div>
          </div>

          {/* Cert gate warning — only shown for providers selecting P0/P1 without cert */}
          {isProvider && !canCreateWithPriority(newTask.priority) && (
            <CertGateBanner priority={newTask.priority} />
          )}

          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">Assign To</label>
            <select
              className="input-field text-sm"
              value={newTask.assignedToId}
              onChange={e => setNewTask({ ...newTask, assignedToId: e.target.value })}
            >
              <option value="">Unassigned</option>
              {employees.map(emp => (
                <option key={emp.id as string} value={emp.id as string}>{emp.name as string}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">Description</label>
            <textarea
              rows={3}
              className="input-field text-sm resize-none"
              placeholder="Task description..."
              value={newTask.description}
              onChange={e => setNewTask({ ...newTask, description: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="btn-secondary flex-1 justify-center text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1 justify-center text-sm disabled:opacity-60"
            >
              {submitting ? 'Creating...' : 'Add Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TasksPage;
