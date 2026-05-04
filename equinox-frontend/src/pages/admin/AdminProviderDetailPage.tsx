/**
 * AdminProviderDetailPage — /admin/providers/:id
 *
 * Command-center view for a single provider.
 * Tabs: Overview | Tasks | Finance | Reviews | Settings
 */

import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Star, CheckCircle2, XCircle, ShieldCheck, Zap, Ban,
  Globe, MapPin, Phone, Mail, Building2, Calendar, RefreshCw,
  TrendingUp, Wallet, FileText, Award, BookOpen, AlertTriangle,
  Activity, Clock, ChevronRight, User, BarChart3, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useApi } from '../../hooks/useApi';
import { providersService } from '../../services/providers.service';
import type { ProviderAdminDetail } from '../../services/providers.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const PRIORITY_COLOR: Record<string, string> = {
  P0: 'bg-red-100 text-red-700',
  P1: 'bg-orange-100 text-orange-700',
  P2: 'bg-blue-100 text-blue-700',
  P3: 'bg-surface-100 text-surface-600',
};

const STATUS_COLOR: Record<string, string> = {
  TODO:        'bg-surface-100 text-surface-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  IN_REVIEW:   'bg-violet-100 text-violet-700',
  DONE:        'bg-emerald-100 text-emerald-700',
  ACTIVE:      'bg-emerald-100 text-emerald-700',
  COMPLETED:   'bg-emerald-100 text-emerald-700',
  DRAFT:       'bg-surface-100 text-surface-600',
  CANCELLED:   'bg-red-100 text-red-700',
  DISPUTED:    'bg-orange-100 text-orange-700',
  PENDING:     'bg-amber-100 text-amber-700',
  PAID:        'bg-emerald-100 text-emerald-700',
  OVERDUE:     'bg-red-100 text-red-700',
};

const TAB_LABELS = ['Overview', 'Tasks', 'Finance', 'Reviews', 'Settings'] as const;
type Tab = typeof TAB_LABELS[number];

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard: React.FC<{
  icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string;
  color?: string; onClick?: () => void;
}> = ({ icon, label, value, sub, color = 'text-primary-600', onClick }) => (
  <div
    className={`bg-white rounded-2xl border border-surface-200 p-5 flex items-start gap-4 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    onClick={onClick}
  >
    <div className={`w-11 h-11 rounded-xl bg-surface-50 flex items-center justify-center flex-shrink-0 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-medium text-surface-500 mb-0.5">{label}</p>
      <p className="text-xl font-extrabold text-surface-900 leading-tight">{value}</p>
      {sub && <p className="text-xs text-surface-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const PriorityBar: React.FC<{ priority: 'P0'|'P1'|'P2'|'P3'; active: number; cap: number }> = ({ priority, active, cap }) => {
  const pct = Math.min((active / cap) * 100, 100);
  const barColor = pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-400' : 'bg-emerald-500';
  const textColor: Record<string, string> = {
    P0: 'text-red-600', P1: 'text-orange-600', P2: 'text-blue-600', P3: 'text-surface-600',
  };

  return (
    <div className="flex items-center gap-3">
      <span className={`w-8 text-xs font-bold ${textColor[priority]}`}>{priority}</span>
      <div className="flex-1 bg-surface-100 rounded-full h-2.5 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-semibold w-12 text-right ${pct >= 100 ? 'text-red-600' : 'text-surface-600'}`}>
        {active}/{cap}
      </span>
      {pct >= 100 && <AlertTriangle size={13} className="text-red-500 flex-shrink-0" />}
    </div>
  );
};

const SlaRing: React.FC<{ pct: number | null }> = ({ pct }) => {
  if (pct === null) return <p className="text-surface-400 text-sm">No data</p>;
  const color = pct >= 90 ? 'text-emerald-500' : pct >= 70 ? 'text-amber-500' : 'text-red-500';
  return (
    <div className="flex flex-col items-center">
      <span className={`text-4xl font-extrabold ${color}`}>{pct}%</span>
      <span className="text-xs text-surface-500 mt-1">SLA Success Rate</span>
    </div>
  );
};

const Badge: React.FC<{ label: string; className: string }> = ({ label, className }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}>
    {label}
  </span>
);

// ─── Tab: Overview ────────────────────────────────────────────────────────────

const OverviewTab: React.FC<{ d: ProviderAdminDetail; onTabChange: (t: Tab) => void }> = ({ d, onTabChange }) => {
  const { profile, slaSuccessRate, taskLoad, contracts, reviews, lmsEnrollments, financials } = d;
  const activeContracts = contracts.filter(c => c.status === 'ACTIVE');
  const completedLms = lmsEnrollments.filter(e => e.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Activity size={20} />} label="SLA Success Rate" color="text-emerald-600"
          value={slaSuccessRate !== null ? `${slaSuccessRate}%` : 'N/A'}
          sub="Completed tasks on time"
          onClick={() => onTabChange('Tasks')}
        />
        <StatCard
          icon={<Star size={20} />} label="Avg Rating" color="text-amber-500"
          value={profile.rating.toFixed(1)}
          sub={`${profile.reviewCount} review${profile.reviewCount !== 1 ? 's' : ''}`}
          onClick={() => onTabChange('Reviews')}
        />
        <StatCard
          icon={<FileText size={20} />} label="Active Contracts" color="text-blue-600"
          value={activeContracts.length}
          sub={`${contracts.length} total`}
          onClick={() => onTabChange('Finance')}
        />
        <StatCard
          icon={<Wallet size={20} />} label="Wallet Balance" color="text-violet-600"
          value={fmt(profile.user.walletAccount?.balance ?? 0, profile.user.walletAccount?.currency)}
          sub={`${fmt(financials.pendingRevenue)} pending`}
          onClick={() => onTabChange('Finance')}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Task Load Heatmap */}
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-surface-800 text-sm">Task Load Heatmap</h3>
            <button onClick={() => onTabChange('Tasks')} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {(['P0','P1','P2','P3'] as const).map(p => (
              <PriorityBar key={p} priority={p} active={taskLoad[p].active} cap={taskLoad[p].cap} />
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-surface-100 flex items-center justify-between text-xs text-surface-500">
            <span>Total active: <span className="font-semibold text-surface-800">{Object.values(taskLoad).reduce((s,v) => s+v.active,0)}</span></span>
            <SlaRing pct={slaSuccessRate} />
          </div>
        </div>

        {/* Active Clients */}
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-surface-800 text-sm">Active Clients</h3>
            <button onClick={() => onTabChange('Finance')} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              All contracts <ChevronRight size={12} />
            </button>
          </div>
          {activeContracts.length === 0 ? (
            <p className="text-xs text-surface-400 text-center py-6">No active contracts</p>
          ) : (
            <ul className="space-y-3">
              {activeContracts.slice(0, 5).map(c => (
                <li key={c.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {(c.buyer.company || c.buyer.name)[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-800 truncate">{c.buyer.company || c.buyer.name}</p>
                    <p className="text-xs text-surface-400 truncate">{c.title}</p>
                  </div>
                  {c.value && <span className="text-xs font-semibold text-surface-600 flex-shrink-0">{fmt(c.value)}</span>}
                </li>
              ))}
              {activeContracts.length > 5 && (
                <p className="text-xs text-surface-400 text-center">+{activeContracts.length - 5} more</p>
              )}
            </ul>
          )}
        </div>

        {/* LMS Certifications */}
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-surface-800 text-sm">Certifications</h3>
            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {completedLms.length} earned
            </span>
          </div>
          {lmsEnrollments.length === 0 ? (
            <p className="text-xs text-surface-400 text-center py-6">No training records</p>
          ) : (
            <ul className="space-y-2.5">
              {lmsEnrollments.slice(0, 5).map(e => (
                <li key={e.id} className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    e.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' : 'bg-surface-100 text-surface-400'
                  }`}>
                    {e.status === 'COMPLETED' ? <CheckCircle2 size={12} /> : <BookOpen size={11} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-surface-700 truncate">{e.course.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="flex-1 bg-surface-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-primary-500 rounded-full" style={{ width: `${e.progress}%` }} />
                      </div>
                      <span className="text-[10px] text-surface-400">{e.progress}%</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent reviews strip */}
      {reviews.length > 0 && (
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-surface-800 text-sm">Recent Reviews</h3>
            <button onClick={() => onTabChange('Reviews')} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              All reviews <ChevronRight size={12} />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.slice(0, 3).map(r => (
              <div key={r.id} className="bg-surface-50 rounded-xl p-4 border border-surface-100">
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={12} className={i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-surface-200 fill-surface-200'} />
                  ))}
                </div>
                <p className="text-xs text-surface-600 leading-relaxed italic mb-2 line-clamp-2">
                  {r.comment || 'No comment.'}
                </p>
                <p className="text-xs font-semibold text-surface-700">{r.buyer.name}</p>
                <p className="text-[10px] text-surface-400">{fmtDate(r.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Tab: Tasks ───────────────────────────────────────────────────────────────

const TasksTab: React.FC<{ tasks: ProviderAdminDetail['tasks'] }> = ({ tasks }) => {
  const total    = tasks.length;
  const active   = tasks.filter(t => t.status !== 'DONE').length;
  const done     = tasks.filter(t => t.status === 'DONE').length;
  const overdue  = tasks.filter(t => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < new Date()).length;

  const isSlaBreached = (t: ProviderAdminDetail['tasks'][0]) =>
    t.status === 'DONE' && t.completedAt && t.dueDate
      ? new Date(t.completedAt) > new Date(t.dueDate)
      : t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < new Date();

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: total, color: 'text-surface-700' },
          { label: 'Active',      value: active, color: 'text-blue-600' },
          { label: 'Completed',   value: done,   color: 'text-emerald-600' },
          { label: 'Overdue',     value: overdue, color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-surface-200 p-4 text-center shadow-sm">
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-surface-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
          <h3 className="font-bold text-surface-800 text-sm">All Assigned Tasks</h3>
          <span className="text-xs text-surface-400">{total} tasks</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-50 border-b border-surface-100">
              <tr>
                {['Task', 'Priority', 'Status', 'SLA', 'Contract / Client', 'Due Date'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {tasks.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-sm text-surface-400">No tasks found</td></tr>
              ) : tasks.map(t => {
                const breached = isSlaBreached(t);
                return (
                  <tr key={t.id} className="hover:bg-surface-50 transition-colors">
                    <td className="table-td max-w-[200px]">
                      <p className="font-medium text-surface-800 text-sm truncate">{t.title}</p>
                    </td>
                    <td className="table-td">
                      <Badge label={t.priority} className={PRIORITY_COLOR[t.priority] || ''} />
                    </td>
                    <td className="table-td">
                      <Badge label={t.status.replace('_', ' ')} className={STATUS_COLOR[t.status] || 'bg-surface-100 text-surface-600'} />
                    </td>
                    <td className="table-td">
                      {t.status === 'DONE' && t.dueDate && t.completedAt ? (
                        <span className={`flex items-center gap-1 text-xs font-semibold ${breached ? 'text-red-600' : 'text-emerald-600'}`}>
                          {breached ? <XCircle size={13} /> : <CheckCircle2 size={13} />}
                          {breached ? 'Breached' : 'On time'}
                        </span>
                      ) : t.status !== 'DONE' && t.dueDate ? (
                        <span className={`flex items-center gap-1 text-xs font-semibold ${breached ? 'text-red-600' : 'text-surface-500'}`}>
                          {breached ? <AlertTriangle size={13} /> : <Clock size={13} />}
                          {breached ? 'Overdue' : 'Active'}
                        </span>
                      ) : (
                        <span className="text-xs text-surface-400">—</span>
                      )}
                    </td>
                    <td className="table-td text-xs text-surface-500 max-w-[150px]">
                      {t.contract ? (
                        <div>
                          <p className="font-medium text-surface-700 truncate">{t.contract.buyer.name}</p>
                          <p className="text-surface-400 truncate">{t.contract.title}</p>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="table-td text-xs text-surface-500">{fmtDate(t.dueDate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Tab: Finance ─────────────────────────────────────────────────────────────

const FinanceTab: React.FC<{ d: ProviderAdminDetail }> = ({ d }) => {
  const { profile, invoices, contracts, financials } = d;
  const wallet = profile.user.walletAccount;

  return (
    <div className="space-y-5">
      {/* Balance strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] rounded-2xl p-6 text-white">
          <p className="text-xs text-surface-400 mb-1">Wallet Balance</p>
          <p className="text-3xl font-extrabold">{fmt(wallet?.balance ?? 0, wallet?.currency)}</p>
          <p className="text-xs text-surface-500 mt-1">{wallet?.currency ?? 'INR'} wallet</p>
        </div>
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6">
          <p className="text-xs text-surface-500 mb-1">Total Earned (Paid)</p>
          <p className="text-2xl font-extrabold text-emerald-600">{fmt(financials.totalRevenue)}</p>
          <p className="text-xs text-surface-400 mt-1">{invoices.filter(i => i.status === 'PAID').length} paid invoices</p>
        </div>
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6">
          <p className="text-xs text-surface-500 mb-1">Pending Revenue</p>
          <p className="text-2xl font-extrabold text-amber-600">{fmt(financials.pendingRevenue)}</p>
          <p className="text-xs text-surface-400 mt-1">{invoices.filter(i => i.status === 'PENDING').length} pending invoices</p>
        </div>
      </div>

      {/* Transaction history */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-100">
          <h3 className="font-bold text-surface-800 text-sm">Recent Wallet Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-50 border-b border-surface-100">
              <tr>
                {['Type', 'Amount', 'Description', 'Reference', 'Status', 'Date'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {!wallet?.transactions.length ? (
                <tr><td colSpan={6} className="py-8 text-center text-sm text-surface-400">No transactions yet</td></tr>
              ) : wallet.transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-surface-50">
                  <td className="table-td">
                    <span className={`text-xs font-bold ${tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {tx.type === 'CREDIT' ? '+' : '−'} {tx.type}
                    </span>
                  </td>
                  <td className="table-td font-semibold text-surface-800">{fmt(tx.amount)}</td>
                  <td className="table-td text-xs text-surface-600 max-w-[180px] truncate">{tx.description || '—'}</td>
                  <td className="table-td text-xs font-mono text-surface-400">{tx.reference || '—'}</td>
                  <td className="table-td">
                    <Badge label={tx.status} className={STATUS_COLOR[tx.status] || 'bg-surface-100 text-surface-600'} />
                  </td>
                  <td className="table-td text-xs text-surface-500">{fmtDate(tx.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoices */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-100">
          <h3 className="font-bold text-surface-800 text-sm">Invoice History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-50 border-b border-surface-100">
              <tr>
                {['Invoice #', 'Client', 'Total', 'Status', 'Due', 'Paid'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {invoices.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-sm text-surface-400">No invoices yet</td></tr>
              ) : invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-surface-50">
                  <td className="table-td font-mono text-xs text-primary-700">{inv.invoiceNo}</td>
                  <td className="table-td text-xs text-surface-700">{inv.buyer.company || inv.buyer.name}</td>
                  <td className="table-td font-semibold text-surface-800">{fmt(inv.total, inv.currency)}</td>
                  <td className="table-td">
                    <Badge label={inv.status} className={STATUS_COLOR[inv.status] || 'bg-surface-100 text-surface-600'} />
                  </td>
                  <td className="table-td text-xs text-surface-500">{fmtDate(inv.dueDate)}</td>
                  <td className="table-td text-xs text-surface-500">{fmtDate(inv.paidAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contracts */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-100">
          <h3 className="font-bold text-surface-800 text-sm">All Contracts</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-50 border-b border-surface-100">
              <tr>
                {['Title', 'Client', 'Value', 'Type', 'Status', 'Start'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {contracts.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-sm text-surface-400">No contracts yet</td></tr>
              ) : contracts.map(c => (
                <tr key={c.id} className="hover:bg-surface-50">
                  <td className="table-td max-w-[180px]">
                    <p className="text-sm font-medium text-surface-800 truncate">{c.title}</p>
                  </td>
                  <td className="table-td text-xs text-surface-600">{c.buyer.company || c.buyer.name}</td>
                  <td className="table-td font-semibold text-surface-700">{c.value ? fmt(c.value, c.currency) : '—'}</td>
                  <td className="table-td text-xs text-surface-500">{c.type.replace('_', ' ')}</td>
                  <td className="table-td">
                    <Badge label={c.status} className={STATUS_COLOR[c.status] || 'bg-surface-100 text-surface-600'} />
                  </td>
                  <td className="table-td text-xs text-surface-500">{fmtDate(c.startDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Tab: Reviews ─────────────────────────────────────────────────────────────

const ReviewsTab: React.FC<{ reviews: ProviderAdminDetail['reviews']; rating: number; reviewCount: number }> = ({ reviews, rating, reviewCount }) => {
  const dist = [5,4,3,2,1].map(n => ({ star: n, count: reviews.filter(r => r.rating === n).length }));

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6 flex flex-col md:flex-row gap-8 items-start">
        {/* Summary */}
        <div className="text-center md:w-40 flex-shrink-0">
          <p className="text-5xl font-extrabold text-surface-900">{rating.toFixed(1)}</p>
          <div className="flex justify-center gap-0.5 my-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={16} className={i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-surface-200 fill-surface-200'} />
            ))}
          </div>
          <p className="text-xs text-surface-400">{reviewCount} reviews</p>
        </div>

        {/* Distribution */}
        <div className="flex-1 space-y-2">
          {dist.map(({ star, count }) => {
            const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3">
                <span className="text-xs font-medium text-surface-600 w-4">{star}</span>
                <Star size={12} className="text-amber-400 fill-amber-400 flex-shrink-0" />
                <div className="flex-1 bg-surface-100 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-surface-400 w-6">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        {reviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-surface-200 p-10 text-center text-surface-400 text-sm">
            No reviews yet
          </div>
        ) : reviews.map(r => (
          <div key={r.id} className="bg-white rounded-2xl border border-surface-200 shadow-sm p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {r.buyer.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-surface-800 text-sm">{r.buyer.name}</p>
                  <p className="text-xs text-surface-400">{fmtDate(r.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={13} className={i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-surface-200 fill-surface-200'} />
                ))}
              </div>
            </div>
            <p className="text-sm text-surface-600 leading-relaxed">
              {r.comment || <span className="italic text-surface-400">No comment provided.</span>}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Tab: Settings ────────────────────────────────────────────────────────────

const SettingsTab: React.FC<{
  d: ProviderAdminDetail;
  onAction: (action: 'verify'|'feature'|'suspend'|'reactivate') => Promise<void>;
  acting: boolean;
}> = ({ d, onAction, acting }) => {
  const { profile } = d;
  const user = profile.user;
  const isActive    = user.status === 'ACTIVE';
  const isSuspended = user.status === 'SUSPENDED';

  const actions = [
    {
      key: 'verify' as const,
      label: profile.verified ? 'Already Verified' : 'Verify Provider',
      desc: 'Mark this provider as SLA-certified and display the verification badge.',
      icon: <ShieldCheck size={18} />,
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      disabled: profile.verified,
    },
    {
      key: 'feature' as const,
      label: profile.featured ? 'Unfeature Provider' : 'Feature Provider',
      desc: 'Toggle "Featured" status — featured providers appear at the top of marketplace listings.',
      icon: <Zap size={18} />,
      color: 'bg-amber-500 hover:bg-amber-600 text-white',
      disabled: false,
    },
    {
      key: (isSuspended ? 'reactivate' : 'suspend') as 'suspend'|'reactivate',
      label: isSuspended ? 'Reactivate Account' : 'Suspend Account',
      desc: isSuspended
        ? 'Restore access to the platform for this provider.'
        : 'Immediately revoke platform access. The provider will not be able to log in.',
      icon: isSuspended ? <RefreshCw size={18} /> : <Ban size={18} />,
      color: isSuspended
        ? 'bg-blue-600 hover:bg-blue-700 text-white'
        : 'bg-red-600 hover:bg-red-700 text-white',
      disabled: false,
    },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Account status */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6">
        <h3 className="font-bold text-surface-800 mb-4">Account Status</h3>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-emerald-500' : isSuspended ? 'bg-red-500' : 'bg-amber-400'}`} />
          <span className="font-semibold text-surface-800">{user.status}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm text-surface-600 mb-5">
          <div><span className="text-surface-400 text-xs">Email</span><br />{user.email}</div>
          <div><span className="text-surface-400 text-xs">Phone</span><br />{user.phone || '—'}</div>
          <div><span className="text-surface-400 text-xs">Member Since</span><br />{fmtDate(user.createdAt)}</div>
          <div><span className="text-surface-400 text-xs">Category</span><br />{profile.category}</div>
        </div>
        {profile.services.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {profile.services.map(s => (
              <span key={s} className="bg-surface-100 text-surface-600 text-xs px-2.5 py-1 rounded-lg">{s}</span>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6 space-y-3">
        <h3 className="font-bold text-surface-800 mb-2">Admin Actions</h3>
        {actions.map(a => (
          <div key={a.key} className="flex items-center justify-between gap-4 py-3 border-b border-surface-100 last:border-0">
            <div>
              <p className="text-sm font-semibold text-surface-800">{a.label}</p>
              <p className="text-xs text-surface-500 mt-0.5">{a.desc}</p>
            </div>
            <button
              onClick={() => onAction(a.key)}
              disabled={a.disabled || acting}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex-shrink-0 disabled:opacity-40 ${a.color}`}
            >
              {acting ? <Loader2 size={14} className="animate-spin" /> : a.icon}
              {a.label.split(' ')[0]}
            </button>
          </div>
        ))}
      </div>

      {/* Profile info (read-only) */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6">
        <h3 className="font-bold text-surface-800 mb-4">Provider Profile</h3>
        <div className="space-y-3 text-sm">
          {profile.description && (
            <div>
              <p className="text-xs text-surface-400 mb-1">Description</p>
              <p className="text-surface-700 leading-relaxed">{profile.description}</p>
            </div>
          )}
          {profile.website && (
            <div className="flex items-center gap-2 text-surface-600">
              <Globe size={14} className="text-surface-400" />
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">{profile.website}</a>
            </div>
          )}
          {profile.address && (
            <div className="flex items-center gap-2 text-surface-600">
              <MapPin size={14} className="text-surface-400" /> {profile.address}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const AdminProviderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [acting, setActing] = useState(false);

  const { data, loading, error, refetch } = useApi(
    () => providersService.getAdminDetail(id!),
    [id]
  );

  const handleAction = async (action: 'verify'|'feature'|'suspend'|'reactivate') => {
    if (!data) return;
    const profileId = data.profile.id;
    const userId    = data.profile.userId;

    if (action === 'suspend' && !window.confirm('Suspend this provider? They will lose platform access immediately.')) return;
    if (action === 'reactivate' && !window.confirm('Reactivate this provider account?')) return;

    setActing(true);
    try {
      if (action === 'verify')     await providersService.verify(profileId);
      if (action === 'feature')    await providersService.feature(profileId);
      if (action === 'suspend')    await providersService.suspend(profileId);
      if (action === 'reactivate') await providersService.reactivate(userId);

      const labels = { verify: 'Provider verified', feature: 'Featured status updated', suspend: 'Provider suspended', reactivate: 'Account reactivated' };
      toast.success(labels[action]);
      refetch();
    } catch {
      toast.error('Action failed. Please try again.');
    } finally {
      setActing(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="animate-spin text-primary-500" />
    </div>
  );

  if (error || !data) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <AlertTriangle size={28} className="text-red-400" />
      <p className="text-surface-600">Provider not found or failed to load.</p>
      <button onClick={() => navigate(-1)} className="text-primary-600 text-sm hover:underline">← Go back</button>
    </div>
  );

  const { profile } = data;
  const user = profile.user;
  const providerName = profile.businessName || user.name;
  const initials = (profile.logoInitials || providerName[0]).toUpperCase();

  return (
    <div className="space-y-6">
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-sm text-surface-500">
        <Link to="/admin/providers" className="hover:text-primary-600 transition-colors flex items-center gap-1">
          <ArrowLeft size={14} /> Providers
        </Link>
        <span>/</span>
        <span className="text-surface-800 font-medium">{providerName}</span>
      </div>

      {/* ── Profile Header ── */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary-500 via-secondary-500 to-violet-500" />
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-5 items-start md:items-center">
            {/* Avatar */}
            <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-primary-200 flex-shrink-0">
              {initials}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-extrabold text-surface-900">{providerName}</h1>
                {profile.verified && (
                  <span className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                    <ShieldCheck size={11} /> Equinox Verified
                  </span>
                )}
                {profile.featured && (
                  <span className="flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    <Zap size={11} /> Featured
                  </span>
                )}
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  user.status === 'ACTIVE'    ? 'bg-emerald-100 text-emerald-700' :
                  user.status === 'SUSPENDED' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {user.status}
                </span>
              </div>
              <p className="text-sm text-surface-500 mb-2">{profile.category}</p>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-surface-500">
                <span className="flex items-center gap-1"><Mail size={12} /> {user.email}</span>
                {user.phone && <span className="flex items-center gap-1"><Phone size={12} /> {user.phone}</span>}
                {profile.location && <span className="flex items-center gap-1"><MapPin size={12} /> {profile.location}</span>}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-600 hover:underline">
                    <Globe size={12} /> Website
                  </a>
                )}
                <span className="flex items-center gap-1"><Calendar size={12} /> Member since {fmtDate(user.createdAt)}</span>
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2 flex-shrink-0">
              {!profile.verified && (
                <button
                  onClick={() => handleAction('verify')}
                  disabled={acting}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-2 rounded-xl text-xs transition-all disabled:opacity-60"
                >
                  <ShieldCheck size={13} /> Verify
                </button>
              )}
              <button
                onClick={() => handleAction('feature')}
                disabled={acting}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-3 py-2 rounded-xl text-xs transition-all disabled:opacity-60"
              >
                <Zap size={13} /> {profile.featured ? 'Unfeature' : 'Feature'}
              </button>
              {user.status === 'SUSPENDED' ? (
                <button
                  onClick={() => handleAction('reactivate')}
                  disabled={acting}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-2 rounded-xl text-xs transition-all disabled:opacity-60"
                >
                  <RefreshCw size={13} /> Reactivate
                </button>
              ) : (
                <button
                  onClick={() => handleAction('suspend')}
                  disabled={acting}
                  className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-2 rounded-xl text-xs transition-all disabled:opacity-60"
                >
                  <Ban size={13} /> Suspend
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 bg-surface-100 p-1 rounded-2xl">
        {TAB_LABELS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab
                ? 'bg-white text-surface-900 shadow-sm'
                : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {activeTab === 'Overview'  && <OverviewTab d={data} onTabChange={setActiveTab} />}
      {activeTab === 'Tasks'     && <TasksTab tasks={data.tasks} />}
      {activeTab === 'Finance'   && <FinanceTab d={data} />}
      {activeTab === 'Reviews'   && <ReviewsTab reviews={data.reviews} rating={profile.rating} reviewCount={profile.reviewCount} />}
      {activeTab === 'Settings'  && <SettingsTab d={data} onAction={handleAction} acting={acting} />}
    </div>
  );
};

export default AdminProviderDetailPage;
