import React, { useState } from 'react';
import { DollarSign, CheckSquare, FileText, TrendingUp, AlertTriangle, Star, Clock, Users, ShieldAlert, ShieldCheck, Clock3, X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import DashboardBanner from '../../components/ui/DashboardBanner';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useApi } from '../../hooks/useApi';
import { tasksService } from '../../services/tasks.service';
import { contractsService } from '../../services/contracts.service';
import { providersService } from '../../services/providers.service';
import { invoicesService } from '../../services/invoices.service';
import { formatCurrency } from '../../utils/helpers';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TASK_COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981'];

const ProviderDashboard: React.FC = () => {
  const user = useSelector((s: RootState) => s.auth.user);
  const [featuredBannerDismissed, setFeaturedBannerDismissed] = useState(false);

  const { data: taskSummary } = useApi(() => tasksService.summary(), []);
  const { data: tasksRes } = useApi(() => tasksService.list({ limit: 5 }), []);
  const { data: contractsRes } = useApi(() => contractsService.list({ limit: 5 }), []);
  const { data: allContractsRes } = useApi(() => contractsService.list({ limit: 200 }), []);
  const { data: stats } = useApi(() => providersService.getMyStats(), []);
  const { data: profile } = useApi(() => providersService.getMyProfile(), []);
  const { data: invoicesRes } = useApi(() => invoicesService.list({ status: 'PAID', limit: 200 }), []);
  const { data: featuredStatus } = useApi(() => providersService.getMyFeaturedStatus(), []);

  const tasks = tasksRes?.data || [];
  const contracts = contractsRes?.data || [];
  const allContracts: Record<string, unknown>[] = allContractsRes?.data || [];
  const paidInvoices: Record<string, unknown>[] = invoicesRes?.data || [];
  const openTasks = (taskSummary?.TODO || 0) + (taskSummary?.IN_PROGRESS || 0) + (taskSummary?.IN_REVIEW || 0);
  const activeContracts = stats?.activeContracts || 0;
  const totalRevenue = contracts.filter((c: Record<string, unknown>) => c.status === 'ACTIVE').reduce((s: number, c: Record<string, unknown>) => s + (c.value as number || 0), 0);

  // Performance score from provider rating
  const performanceScore = Math.min(100, Math.round(((profile as Record<string, unknown>)?.rating as number || 0) / 5 * 100));

  // Active buyers: unique buyers from ACTIVE contracts
  const activeBuyerSet = new Set<string>();
  allContracts.filter(c => c.status === 'ACTIVE').forEach(c => {
    const buyer = c.buyer as Record<string, string> | undefined;
    if (buyer?.id) activeBuyerSet.add(buyer.id);
    else if (buyer?.name) activeBuyerSet.add(buyer.name);
  });
  const activeBuyers = activeBuyerSet.size;

  // Build monthly revenue from real paid invoices (current year)
  const currentYear = new Date().getFullYear().toString();
  const monthlyRevMap: Record<string, number> = {};
  paidInvoices.forEach(inv => {
    const d = new Date(inv.createdAt as string);
    if (d.getFullYear().toString() === currentYear) {
      const m = MONTHS[d.getMonth()];
      monthlyRevMap[m] = (monthlyRevMap[m] || 0) + (inv.total as number || 0);
    }
  });
  const revenueChartData = MONTHS.slice(0, new Date().getMonth() + 1).map(month => ({
    month,
    revenue: monthlyRevMap[month] || 0,
  }));

  const taskDist = [
    { name: 'To Do', value: taskSummary?.TODO || 0, color: TASK_COLORS[0] },
    { name: 'In Progress', value: taskSummary?.IN_PROGRESS || 0, color: TASK_COLORS[1] },
    { name: 'In Review', value: taskSummary?.IN_REVIEW || 0, color: TASK_COLORS[2] },
    { name: 'Done', value: taskSummary?.DONE || 0, color: TASK_COLORS[3] },
  ].filter(d => d.value > 0);

  const verificationStatus = (profile as Record<string, unknown>)?.verificationStatus as string | undefined;
  const rejectionReason = (profile as Record<string, unknown>)?.rejectionReason as string | undefined;

  return (
    <div className="space-y-6">
      {verificationStatus === 'UNVERIFIED' && (
        <div className="flex items-start gap-4 rounded-2xl border border-primary-200 bg-gradient-to-r from-primary-50 to-secondary-50 px-5 py-4">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
            <ShieldCheck size={20} className="text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-primary-900">Get Verified to Start Earning</p>
            <p className="text-sm text-primary-700 mt-0.5">
              Verified providers appear in the public marketplace, receive task assignments, and can issue invoices. Apply once — it typically takes 1–2 business days.
            </p>
          </div>
          <Link
            to="/provider/verification"
            className="shrink-0 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
          >
            Apply Now
          </Link>
        </div>
      )}
      {verificationStatus === 'PENDING' && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <Clock3 size={20} className="mt-0.5 shrink-0 text-amber-500" />
          <div>
            <p className="font-semibold text-amber-800">Verification Under Review</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Your verification request is being reviewed by our Admin team. You'll be notified once a decision is made. Marketplace access is restricted until approved.
            </p>
          </div>
        </div>
      )}
      {verificationStatus === 'REJECTED' && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <ShieldAlert size={20} className="mt-0.5 shrink-0 text-red-500" />
          <div className="flex-1">
            <p className="font-semibold text-red-800">Verification Not Approved</p>
            <p className="text-sm text-red-700 mt-0.5">
              {rejectionReason && <>Reason: <span className="font-medium">{rejectionReason}</span>. </>}
              Please address the issue and re-apply.
            </p>
          </div>
          <Link
            to="/provider/verification"
            className="shrink-0 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
          >
            Re-Apply
          </Link>
        </div>
      )}
      {verificationStatus === 'VERIFIED' && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3">
          <ShieldCheck size={18} className="shrink-0 text-emerald-500" />
          <p className="text-sm font-medium text-emerald-800">Your account is verified and live on the marketplace.</p>
        </div>
      )}

      {/* ── Featured expiry notice ── */}
      {!featuredBannerDismissed && featuredStatus?.freePeriodExpired && !featuredStatus?.subscriptionActive && (
        <div className="flex items-start gap-4 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <Star size={20} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-amber-900">Your 6-Month Free Featured Period Has Ended</p>
            <p className="text-sm text-amber-800 mt-0.5">
              You are still listed on the marketplace, but you no longer appear at the top of search results or carry the Featured Partner badge.
              Subscribe to regain your Top-Tier Featured status and priority placement.
            </p>
          </div>
          <button
            onClick={() => setFeaturedBannerDismissed(true)}
            className="shrink-0 w-7 h-7 rounded-lg hover:bg-amber-100 flex items-center justify-center text-amber-600 transition-colors"
            title="Dismiss"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ── Featured days-remaining notice (approaching expiry) ── */}
      {!featuredBannerDismissed && featuredStatus?.effectiveFeatured && !featuredStatus?.subscriptionActive &&
        featuredStatus.daysLeft > 0 && featuredStatus.daysLeft <= 30 && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3">
          <Star size={16} className="shrink-0 text-amber-500 fill-amber-400" />
          <p className="text-sm font-medium text-amber-800 flex-1">
            Your Featured Partner status expires in <span className="font-bold">{featuredStatus.daysLeft} days</span>. Subscribe to keep it going.
          </p>
          <button onClick={() => setFeaturedBannerDismissed(true)} className="shrink-0 w-6 h-6 rounded-lg hover:bg-amber-100 flex items-center justify-center text-amber-500">
            <X size={13} />
          </button>
        </div>
      )}

      <DashboardBanner cta={
        <Link to="/provider/tasks" className="bg-white/20 hover:bg-white/30 text-white border border-white/25 px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
          <CheckSquare size={15} /> New Task
        </Link>
      } />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Revenue" value={formatCurrency(totalRevenue)} change={12.5} changeLabel="vs last month" icon={<DollarSign size={20} className="text-primary-600" />} iconBg="bg-primary-50" />
        <StatCard title="Open Tasks" value={openTasks} change={-5.2} changeLabel="vs last week" icon={<CheckSquare size={20} className="text-amber-600" />} iconBg="bg-amber-50" />
        <StatCard title="Active Contracts" value={activeContracts} change={8.3} changeLabel="vs last month" icon={<FileText size={20} className="text-emerald-600" />} iconBg="bg-emerald-50" />
        <StatCard title="Performance Score" value={`${performanceScore}%`} change={1.2} changeLabel="vs last month" icon={<Star size={20} className="text-purple-600" />} iconBg="bg-purple-50" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue chart — static sparkline */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-surface-800">Revenue Overview</h2>
            <select className="text-xs border border-surface-200 rounded-lg px-2 py-1.5 text-surface-600 focus:outline-none"><option>This Year</option></select>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueChartData}>
              <defs>
                <linearGradient id="rGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}k`} />
              <Tooltip formatter={(v: unknown) => formatCurrency(v as number)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#rGrad)" name="Revenue" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Task distribution */}
        <div className="card">
          <h2 className="font-bold text-surface-800 mb-5">Task Distribution</h2>
          {taskDist.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={taskDist} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                    {taskDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: unknown) => `${v} tasks`} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {taskDist.map(item => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                      <span className="text-surface-600">{item.name}</span>
                    </div>
                    <span className="font-semibold text-surface-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-surface-400 text-sm text-center py-8">No tasks yet</p>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-surface-800">Recent Tasks</h2>
            <Link to="/provider/tasks" className="text-xs text-primary-600 font-medium hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {tasks.length === 0 && <p className="text-surface-400 text-sm text-center py-4">No tasks found</p>}
            {tasks.map((task: Record<string, unknown>) => (
              <div key={task.id as string} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors">
                <span className={`badge flex-shrink-0 text-xs font-bold ${task.priority === 'P0' ? 'bg-red-100 text-red-700' : task.priority === 'P1' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{task.priority as string}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-800 truncate">{task.title as string}</p>
                  <p className="text-xs text-surface-400">{(task.assignedTo as Record<string, string>)?.name || 'Unassigned'}</p>
                </div>
                <Badge label={(task.status as string).replace('_', ' ').toLowerCase()} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent contracts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-surface-800">Active Contracts</h2>
            <Link to="/provider/contracts" className="text-xs text-primary-600 font-medium hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {contracts.length === 0 && <p className="text-surface-400 text-sm text-center py-4">No contracts found</p>}
            {contracts.map((c: Record<string, unknown>) => (
              <div key={c.id as string} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors">
                <div className="w-9 h-9 bg-surface-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-surface-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-800 truncate">{c.title as string}</p>
                  <p className="text-xs text-surface-400">{c.type as string} · {formatCurrency(c.value as number)}</p>
                </div>
                <Badge label={(c.status as string).toLowerCase()} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Avg Response Time', value: '< 2 hrs', icon: <Clock size={16} className="text-primary-500" /> },
          { label: 'Client Satisfaction', value: '4.8 / 5', icon: <Star size={16} className="text-amber-400" /> },
          { label: 'Open Complaints', value: '0', icon: <AlertTriangle size={16} className="text-green-500" /> },
          { label: 'SLA Breached', value: taskSummary?.slaBreached || '0', icon: <Users size={16} className="text-purple-500" /> },
          { label: 'Active Buyers', value: activeBuyers, icon: <Users size={16} className="text-emerald-500" /> },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-xl p-4 border border-surface-200 flex items-center gap-3">
            <div className="w-9 h-9 bg-surface-50 rounded-lg flex items-center justify-center flex-shrink-0">{item.icon}</div>
            <div>
              <p className="text-lg font-bold text-surface-900">{item.value}</p>
              <p className="text-xs text-surface-500">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProviderDashboard;
