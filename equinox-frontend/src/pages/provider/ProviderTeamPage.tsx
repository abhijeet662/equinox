import React, { useState } from 'react';
import { Users, CheckSquare, AlertTriangle, TrendingUp, Search } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { usersService } from '../../services/users.service';
import { tasksService } from '../../services/tasks.service';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';

interface Employee {
  id: string;
  name: string;
  email: string;
  status?: string;
}

interface Task {
  id: string;
  status: string;
  slaBreached?: boolean;
  assignedTo?: { id: string; name: string };
}

const ProviderTeamPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data: employeesRes, loading: loadingEmp } = useApi(
    () => usersService.list({ role: 'EMPLOYEE', limit: 50 }),
    []
  );
  const { data: tasksRes, loading: loadingTasks } = useApi(
    () => tasksService.list({ limit: 200 }),
    []
  );

  const employees: Employee[] = employeesRes?.data || [];
  const tasks: Task[] = tasksRes?.data || [];

  const loading = loadingEmp || loadingTasks;

  // Compute per-employee stats
  const empStats = employees.map(emp => {
    const empTasks = tasks.filter(t => t.assignedTo?.id === emp.id);
    const active = empTasks.filter(t => t.status === 'TODO' || t.status === 'IN_PROGRESS').length;
    const inReview = empTasks.filter(t => t.status === 'IN_REVIEW').length;
    const done = empTasks.filter(t => t.status === 'DONE').length;
    const slaBreached = empTasks.filter(t => t.slaBreached).length;
    const total = empTasks.length;
    const productivity = total > 0 ? Math.round((done / total) * 100) : 0;
    return { ...emp, active, inReview, done, slaBreached, total, productivity };
  });

  const totalActive = tasks.filter(t => t.status === 'TODO' || t.status === 'IN_PROGRESS').length;
  const totalSlaBreached = tasks.filter(t => t.slaBreached).length;
  const avgTasks = employees.length > 0 ? Math.round(tasks.length / employees.length) : 0;

  const filtered = empStats.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Team & Workload</h1>
        <p className="text-surface-500 text-sm mt-1">Manage your team and track workload distribution</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Team Members', value: employees.length, icon: <Users size={20} className="text-primary-600" />, bg: 'bg-primary-50' },
          { title: 'Active Tasks', value: totalActive, icon: <CheckSquare size={20} className="text-amber-600" />, bg: 'bg-amber-50' },
          { title: 'Avg Tasks / Member', value: avgTasks, icon: <TrendingUp size={20} className="text-emerald-600" />, bg: 'bg-emerald-50' },
          { title: 'SLA Breaches', value: totalSlaBreached, icon: <AlertTriangle size={20} className="text-red-500" />, bg: 'bg-red-50' },
        ].map(s => (
          <div key={s.title} className="card flex items-center gap-4">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>{s.icon}</div>
            <div>
              <p className="text-xl font-bold text-surface-900">{s.value}</p>
              <p className="text-xs text-surface-500">{s.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
        <input
          className="input-field pl-9"
          placeholder="Search employees..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Employee cards */}
      {loading ? (
        <div className="text-center py-12 text-surface-400">Loading team...</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(emp => (
            <div key={emp.id} className="card space-y-4">
              <div className="flex items-start gap-3">
                <Avatar initials={getInitials(emp.name)} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-surface-900 truncate">{emp.name}</p>
                  <p className="text-xs text-surface-500 truncate">{emp.email}</p>
                  <p className="text-xs text-surface-400 mt-1">{emp.total} task{emp.total !== 1 ? 's' : ''} assigned</p>
                </div>
                <Badge label={emp.status?.toLowerCase() || 'active'} />
              </div>

              {/* Workload bar */}
              <div>
                <div className="flex justify-between text-xs text-surface-500 mb-1">
                  <span>Productivity</span>
                  <span>{emp.productivity}%</span>
                </div>
                <div className="w-full h-2 bg-surface-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${emp.productivity}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-surface-50 rounded-lg p-2">
                  <p className="font-bold text-surface-900">{emp.active}</p>
                  <p className="text-surface-500">Active</p>
                </div>
                <div className="bg-surface-50 rounded-lg p-2">
                  <p className="font-bold text-surface-900">{emp.done}</p>
                  <p className="text-surface-500">Done</p>
                </div>
                <div className="bg-red-50 rounded-lg p-2">
                  <p className="font-bold text-red-600">{emp.slaBreached}</p>
                  <p className="text-surface-500">SLA</p>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-12 text-surface-400">No team members found</div>
          )}
        </div>
      )}

      {/* Workload table */}
      <div className="card">
        <h2 className="font-bold text-surface-800 mb-4">Workload Overview</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100">
                <th className="table-th">Employee</th>
                <th className="table-th">Active Tasks</th>
                <th className="table-th">In Review</th>
                <th className="table-th">Done</th>
                <th className="table-th">SLA Breached</th>
                <th className="table-th">Productivity %</th>
              </tr>
            </thead>
            <tbody>
              {empStats.length === 0 && (
                <tr><td colSpan={6} className="table-td text-center text-surface-400 py-8">No team members found</td></tr>
              )}
              {empStats.map(emp => (
                <tr key={emp.id} className="border-b border-surface-50 hover:bg-surface-50">
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <Avatar initials={getInitials(emp.name)} size="sm" />
                      <div>
                        <p className="font-medium text-surface-900">{emp.name}</p>
                        <p className="text-xs text-surface-400">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-td text-amber-600 font-semibold">{emp.active}</td>
                  <td className="table-td text-purple-600 font-semibold">{emp.inReview}</td>
                  <td className="table-td text-emerald-600 font-semibold">{emp.done}</td>
                  <td className="table-td">
                    {emp.slaBreached > 0
                      ? <span className="text-red-600 font-semibold">{emp.slaBreached}</span>
                      : <span className="text-surface-400">0</span>}
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-surface-100 rounded-full overflow-hidden max-w-[80px]">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${emp.productivity}%` }} />
                      </div>
                      <span className="text-surface-700 font-medium">{emp.productivity}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProviderTeamPage;
