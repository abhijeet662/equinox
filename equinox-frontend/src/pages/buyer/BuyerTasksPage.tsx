import React, { useState } from 'react';
import { CheckSquare, AlertTriangle, Clock } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import { useApi } from '../../hooks/useApi';
import { tasksService } from '../../services/tasks.service';
import { formatDate } from '../../utils/helpers';

const PRIORITY_COLORS: Record<string, string> = {
  P0: 'bg-red-100 text-red-700 border border-red-200',
  P1: 'bg-amber-100 text-amber-700 border border-amber-200',
  P2: 'bg-blue-100 text-blue-700 border border-blue-200',
  P3: 'bg-surface-100 text-surface-600 border border-surface-200',
};

// Normalise priority to P0/P1/P2/P3 regardless of API format
const normalisePriority = (p: string): string => {
  if (!p) return 'P3';
  if (/^P[0-3]$/.test(p)) return p;          // already P0-P3
  const map: Record<string, string> = { CRITICAL: 'P0', HIGH: 'P1', MEDIUM: 'P2', LOW: 'P3' };
  return map[p.toUpperCase()] || 'P3';
};

const BuyerTasksPage: React.FC = () => {
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const { data: tasksRes, loading } = useApi(() => tasksService.list({ limit: 100 }), []);
  const allTasks: Record<string, unknown>[] = tasksRes?.data || [];

  const total = allTasks.length;
  const inProgress = allTasks.filter(t => t.status === 'IN_PROGRESS').length;
  const completed = allTasks.filter(t => t.status === 'DONE').length;
  const slaBreached = allTasks.filter(t => t.slaBreached).length;

  const filtered = allTasks.filter(t => {
    const pl = normalisePriority(t.priority as string);
    const matchP = priorityFilter === 'All' || pl === priorityFilter;
    const matchS = statusFilter === 'All' || t.status === statusFilter;
    return matchP && matchS;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Task Overview</h1>
        <p className="text-surface-500 text-sm mt-0.5">Track progress of work done by your providers.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-surface-900">{total}</p>
          <p className="text-sm text-surface-500 mt-0.5">Total Tasks</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-blue-600">{inProgress}</p>
          <p className="text-sm text-surface-500 mt-0.5">In Progress</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-emerald-600">{completed}</p>
          <p className="text-sm text-surface-500 mt-0.5">Completed</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-red-600">{slaBreached}</p>
          <p className="text-sm text-surface-500 mt-0.5">SLA Breached</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div>
          <p className="text-xs font-medium text-surface-500 mb-2">Priority</p>
          <div className="flex gap-2 flex-wrap">
            {['All', 'P0', 'P1', 'P2', 'P3'].map(p => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${priorityFilter === p ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-surface-500 mb-2">Status</p>
          <div className="flex gap-2 flex-wrap">
            {['All', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}
              >
                {s.replace('_', ' ').toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Task list */}
      {loading && <p className="text-surface-400 text-sm text-center py-10">Loading tasks…</p>}
      <div className="space-y-3">
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-surface-400">
            <CheckSquare size={32} className="mx-auto mb-3 opacity-30" />
            <p>No tasks found for the selected filters.</p>
          </div>
        )}
        {filtered.map(t => {
          const pl = normalisePriority(t.priority as string);
          const assignee = t.assignedTo as Record<string, string> | undefined;
          const contract = t.contract as Record<string, string> | undefined;
          const dueDate = t.dueDate as string | null;
          return (
            <div key={t.id as string} className="card hover:shadow-md transition-all duration-200">
              <div className="flex items-start gap-4">
                <span className={`text-xs font-bold px-2 py-0.5 rounded flex-shrink-0 mt-0.5 ${PRIORITY_COLORS[pl]}`}>{pl}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 className="font-semibold text-surface-800">{t.title as string}</h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {t.slaBreached && (
                        <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                          <AlertTriangle size={10} /> SLA Breached
                        </span>
                      )}
                      <Badge label={(t.status as string).replace('_', ' ').toLowerCase()} />
                    </div>
                  </div>
                  {t.description && (
                    <p className="text-sm text-surface-500 mb-2 line-clamp-2">{(t.description as string).slice(0, 120)}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-surface-400">
                    {assignee && (
                      <span className="bg-surface-100 px-2 py-0.5 rounded font-medium text-surface-600">
                        {assignee.name || assignee.email}
                      </span>
                    )}
                    {contract && (
                      <span className="text-primary-600 font-medium">{contract.title}</span>
                    )}
                    {dueDate && (
                      <span className="flex items-center gap-1">
                        <Clock size={10} /> Due {formatDate(dueDate)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BuyerTasksPage;
