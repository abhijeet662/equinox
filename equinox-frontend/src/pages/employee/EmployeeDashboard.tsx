import React from 'react';
import { CheckSquare, Award, BookOpen, Clock } from 'lucide-react';
import DashboardBanner from '../../components/ui/DashboardBanner';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import { priorityColor } from '../../utils/helpers';
import { useApi } from '../../hooks/useApi';
import { tasksService } from '../../services/tasks.service';
import { kpiService } from '../../services/kpi.service';
import { leaveService } from '../../services/leave.service';

const RADAR_METRICS = ['Delivery', 'Quality', 'Communication', 'Initiative', 'Teamwork', 'Learning'];

const EmployeeDashboard: React.FC = () => {
  const user = useSelector((s: RootState) => s.auth.user);

  const { data: tasksRes } = useApi(() => tasksService.list({ limit: 20 }), []);
  const { data: taskSummary } = useApi(() => tasksService.summary(), []);
  const { data: kpiRes } = useApi(() => kpiService.list({ limit: 10 }), []);
  const { data: leaveRes } = useApi(() => leaveService.list(), []);

  const tasks: Record<string, unknown>[] = tasksRes?.data || [];
  const kpis: Record<string, unknown>[] = kpiRes?.data || [];
  const leaveRequests: Record<string, unknown>[] = leaveRes?.data || [];

  const myTasks = tasks.slice(0, 4);
  const completedTasks = taskSummary?.DONE || 0;

  const avgKPI = kpis.length > 0
    ? Math.round(kpis.reduce((s, k) => s + ((k.value as number) / ((k.target as number) || 1)) * 100, 0) / kpis.length)
    : 0;

  // Build radar from KPI data or use defaults
  const radarData = RADAR_METRICS.map(subject => {
    const match = kpis.find(k => (k.metric as string)?.toLowerCase().includes(subject.toLowerCase()));
    const value = match ? Math.min(Math.round(((match.value as number) / ((match.target as number) || 1)) * 100), 100) : 0;
    return { subject, value };
  });

  // Leave balance from approved leaves — calculate days from date range
  const calcDays = (r: Record<string, unknown>) => {
    if (r.startDate && r.endDate) {
      return Math.max(1, Math.ceil(
        (new Date(r.endDate as string).getTime() - new Date(r.startDate as string).getTime()) / (1000 * 60 * 60 * 24)
      ) + 1);
    }
    return (r.days as number) || 1;
  };
  const approved = leaveRequests.filter(r => r.status === 'APPROVED');
  const usedAnnual = approved.filter(r => r.type === 'ANNUAL').reduce((s, r) => s + calcDays(r), 0);
  const usedSick   = approved.filter(r => r.type === 'SICK').reduce((s, r) => s + calcDays(r), 0);

  return (
    <div className="space-y-6">
      <DashboardBanner cta={
        <Link to="/employee/tasks" className="bg-white/20 hover:bg-white/30 text-white border border-white/25 px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
          <CheckSquare size={15} /> My Tasks
        </Link>
      } />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="KPI Score" value={`${avgKPI}%`} change={3} changeLabel="vs last month" icon={<Award size={20} className="text-amber-600" />} iconBg="bg-amber-50" />
        <StatCard title="Tasks Done" value={completedTasks} change={12} changeLabel="this week" icon={<CheckSquare size={20} className="text-green-600" />} iconBg="bg-green-50" />
        <StatCard title="Open Tasks" value={(taskSummary?.TODO || 0) + (taskSummary?.IN_PROGRESS || 0)} icon={<Clock size={20} className="text-primary-600" />} iconBg="bg-primary-50" />
        <StatCard title="Leave Balance" value={`${21 - usedAnnual}d`} icon={<BookOpen size={20} className="text-purple-600" />} iconBg="bg-purple-50" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* KPI Radar chart */}
        <div className="card">
          <h2 className="font-bold text-surface-800 mb-4">Performance Radar</h2>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
              <Tooltip formatter={(v: unknown) => `${v}%`} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-surface-500">Overall Score</span>
            <span className="font-bold text-primary-600">{avgKPI}%</span>
          </div>
        </div>

        {/* KPI targets */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-surface-800">KPI Targets</h2>
            <Link to="/employee/kpi" className="text-xs text-primary-600 font-medium hover:underline">View all</Link>
          </div>
          {kpis.length === 0 && <p className="text-surface-400 text-sm text-center py-6">No KPI data yet</p>}
          <div className="space-y-4">
            {kpis.slice(0, 4).map(kpi => {
              const isAbove = (kpi.value as number) >= ((kpi.target as number) || 1);
              return (
                <div key={kpi.id as string}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-surface-700 font-medium">{kpi.metric as string}</span>
                    <span className={`font-semibold ${isAbove ? 'text-green-600' : 'text-amber-600'}`}>
                      {kpi.value as number}{kpi.unit as string || ''} / {kpi.target as number}{kpi.unit as string || ''}
                    </span>
                  </div>
                  <ProgressBar value={kpi.value as number} max={(kpi.target as number) || 1} color={isAbove ? 'bg-green-500' : 'bg-amber-400'} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tasks + Leave */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-surface-800">My Tasks</h2>
            <Link to="/employee/tasks" className="text-xs text-primary-600 font-medium hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {myTasks.length === 0 && <p className="text-surface-400 text-sm text-center py-4">No tasks assigned</p>}
            {myTasks.map(task => (
              <div key={task.id as string} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors">
                <span className={`badge text-xs font-bold ${priorityColor[task.priority as 'P0' | 'P1' | 'P2' | 'P3'] || 'bg-surface-100 text-surface-600'}`}>{task.priority as string}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-800 truncate">{task.title as string}</p>
                  <p className="text-xs text-surface-400">
                    {task.dueDate ? new Date(task.dueDate as string).toLocaleDateString() : 'No due date'}
                  </p>
                </div>
                <Badge label={(task.status as string).replace('_', ' ').toLowerCase()} />
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-surface-800">Leave Balance</h2>
            <Link to="/employee/leave" className="text-xs text-primary-600 font-medium hover:underline">Manage leave</Link>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[
              { type: 'Annual Leave', total: 21, used: usedAnnual },
              { type: 'Sick Leave', total: 10, used: usedSick },
              { type: 'Emergency', total: 5, used: 0 },
            ].map(l => (
              <div key={l.type} className="text-center bg-surface-50 rounded-xl p-4">
                <p className="text-2xl font-bold text-surface-900">{l.total - l.used}</p>
                <p className="text-xs text-surface-500 mt-0.5">{l.type}</p>
                <p className="text-xs text-surface-400">{l.used} used</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {leaveRequests.slice(0, 3).map(lr => (
              <div key={lr.id as string} className="flex items-center justify-between py-2 border-b border-surface-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-surface-800">{(lr.type as string).replace('_', ' ')}</p>
                  <p className="text-xs text-surface-400">
                    {new Date(lr.startDate as string).toLocaleDateString()} → {new Date(lr.endDate as string).toLocaleDateString()} ({calcDays(lr)} days)
                  </p>
                </div>
                <Badge label={(lr.status as string).toLowerCase()} />
              </div>
            ))}
            {leaveRequests.length === 0 && <p className="text-xs text-surface-400 text-center py-2">No leave requests</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
