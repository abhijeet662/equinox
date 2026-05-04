import React, { useState } from 'react';
import {
  TrendingUp, TrendingDown, Star, MessageSquare, Award, Target,
  ChevronDown, CheckCircle, XCircle, Clock, Zap, BarChart2,
} from 'lucide-react';
import ProgressBar from '../../components/ui/ProgressBar';
import { useApi } from '../../hooks/useApi';
import { kpiService } from '../../services/kpi.service';
import { tasksService } from '../../services/tasks.service';

// ─── Static manager feedback (replaced by real data in a future sprint) ───────
const FEEDBACK_HISTORY = [
  {
    id: 'fb-1', month: 'April 2026', manager: 'Sarah Chen', rating: 4.5,
    summary: 'Excellent delivery on the Q1 migration project. Showed great initiative and cross-team communication.',
    strengths: ['On-time delivery', 'Technical problem solving', 'Team collaboration'],
    improvements: ['Documentation could be more detailed', 'Proactive status updates'],
    goals: 'Lead at least one sprint retrospective next quarter.',
  },
  {
    id: 'fb-2', month: 'March 2026', manager: 'Sarah Chen', rating: 4.0,
    summary: 'Good month overall. Completed all assigned tasks. Some delays in the billing module.',
    strengths: ['Code quality', 'Attendance and punctuality'],
    improvements: ['Task estimation accuracy', 'Raise blockers earlier'],
    goals: 'Complete the PostgreSQL performance course.',
  },
  {
    id: 'fb-3', month: 'February 2026', manager: 'David Park', rating: 3.8,
    summary: 'Steady performance. Needs to improve communication frequency with the team.',
    strengths: ['Technical knowledge', 'Quick learner'],
    improvements: ['Update task status daily', 'Participate more in standups'],
    goals: 'Mentor a new team member joining in March.',
  },
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const PRIORITY_COLOR: Record<string, string> = {
  P0: 'bg-red-100 text-red-700',
  P1: 'bg-orange-100 text-orange-700',
  P2: 'bg-amber-100 text-amber-700',
  P3: 'bg-blue-100 text-blue-700',
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} size={14} className={
          n <= Math.floor(rating) ? 'text-amber-400 fill-amber-400' :
          n - 0.5 <= rating ? 'text-amber-400 fill-amber-200' : 'text-surface-300'
        } />
      ))}
      <span className="text-xs font-medium text-surface-700 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

function ScoreRing({ score, size = 88 }: { score: number; size?: number }) {
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;
  const filled = circ * (score / 100);
  const color = score >= 90 ? '#22c55e' : score >= 70 ? '#3b82f6' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${filled} ${circ}`} strokeLinecap="round" />
    </svg>
  );
}

type Tab = 'kpi' | 'scorecard' | 'feedback';

const PerformancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('scorecard');
  const [expandedFb, setExpandedFb] = useState<string | null>(FEEDBACK_HISTORY[0].id);

  // KPI data
  const { data: kpiRes } = useApi(() => kpiService.list({ limit: 50 }), []);
  const kpis: Record<string, unknown>[] = kpiRes?.data || [];

  // ── Scorecard data (§5.2 real endpoint) ─────────────────────────────────────
  const { data: scorecardData, loading: scoreLoading } =
    useApi(() => tasksService.getScorecard(3), []);

  const scorecard = scorecardData as {
    summary: {
      totalAssigned: number;
      completedOnTime: number;
      completedLate: number;
      stillOpen: number;
      productivityScore: number;
      slaAdherenceRate: number;
    };
    monthlyTrend: { month: string; onTime: number; late: number; total: number; score: number }[];
    tasks: {
      id: string; title: string; priority: string; status: string;
      createdAt: string; completedAt?: string;
      slaAllowedHours: number; takenHours: number | null;
      onTime: boolean | null; breached: boolean;
    }[];
  } | null;

  // ── KPI chart helpers ────────────────────────────────────────────────────────
  const monthlyScores: Record<string, number[]> = {};
  kpis.forEach(k => {
    if (k.period) {
      const m = MONTHS[(new Date(k.period as string)).getMonth()];
      const pct = typeof k.target === 'number' && k.target > 0
        ? Math.min(100, Math.round(((k.value as number) / (k.target as number)) * 100)) : 0;
      if (!monthlyScores[m]) monthlyScores[m] = [];
      monthlyScores[m].push(pct);
    }
  });
  const monthlyAvg = MONTHS.map(m => ({
    month: m,
    score: monthlyScores[m]?.length
      ? Math.round(monthlyScores[m].reduce((a, b) => a + b, 0) / monthlyScores[m].length) : null,
  })).filter(m => m.score !== null);

  const overallKpiScore = kpis.length > 0
    ? Math.round(kpis.reduce((acc, k) => {
        const pct = typeof k.target === 'number' && k.target > 0
          ? Math.min(100, ((k.value as number) / (k.target as number)) * 100) : 0;
        return acc + pct;
      }, 0) / kpis.length) : 0;

  const avgRating = FEEDBACK_HISTORY.reduce((acc, fb) => acc + fb.rating, 0) / FEEDBACK_HISTORY.length;
  const productivityScore = scorecard?.summary.productivityScore ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Performance</h1>
        <p className="text-surface-500 text-sm mt-0.5">SLA scorecard, monthly KPIs, and manager feedback.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <Zap size={20} className="text-primary-600" />
          </div>
          <p className="text-2xl font-bold text-surface-900">{productivityScore}%</p>
          <p className="text-xs text-surface-500 mt-0.5">Productivity Score</p>
        </div>
        <div className="card text-center">
          <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <Target size={20} className="text-green-600" />
          </div>
          <p className="text-2xl font-bold text-surface-900">{scorecard?.summary.slaAdherenceRate ?? 0}%</p>
          <p className="text-xs text-surface-500 mt-0.5">SLA Adherence</p>
        </div>
        <div className="card text-center">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <Star size={20} className="text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-surface-900">{avgRating.toFixed(1)}</p>
          <p className="text-xs text-surface-500 mt-0.5">Avg Manager Rating</p>
        </div>
        <div className="card text-center">
          <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <BarChart2 size={20} className="text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-surface-900">{overallKpiScore}%</p>
          <p className="text-xs text-surface-500 mt-0.5">Overall KPI Score</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-100 rounded-xl w-fit">
        {([
          { key: 'scorecard', label: 'SLA Scorecard' },
          { key: 'kpi',       label: 'Monthly KPI'   },
          { key: 'feedback',  label: 'Manager Feedback' },
        ] as { key: Tab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === t.key ? 'bg-white shadow-sm text-primary-600' : 'text-surface-500 hover:text-surface-800'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── SLA SCORECARD TAB ────────────────────────────────────────────────── */}
      {activeTab === 'scorecard' && (
        <div className="space-y-5">
          {scoreLoading ? (
            <div className="card flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : scorecard ? (
            <>
              {/* Score ring + summary */}
              <div className="card">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  {/* Ring */}
                  <div className="relative flex-shrink-0">
                    <ScoreRing score={productivityScore} size={120} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-extrabold text-surface-900">{productivityScore}%</span>
                      <span className="text-[10px] text-surface-400 font-medium">Score</span>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 w-full">
                    {[
                      { label: 'Total Assigned',  value: scorecard.summary.totalAssigned,    color: 'text-surface-900' },
                      { label: 'Completed On-Time', value: scorecard.summary.completedOnTime, color: 'text-green-600'   },
                      { label: 'Completed Late',   value: scorecard.summary.completedLate,   color: 'text-red-500'     },
                      { label: 'Still Open',       value: scorecard.summary.stillOpen,       color: 'text-amber-600'   },
                    ].map(s => (
                      <div key={s.label} className="bg-surface-50 rounded-xl p-4 text-center border border-surface-100">
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-surface-500 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Formula explanation */}
                <div className="mt-5 pt-5 border-t border-surface-100 bg-primary-50 rounded-xl px-4 py-3">
                  <p className="text-xs font-semibold text-primary-700 mb-0.5">How it's calculated</p>
                  <p className="text-xs text-primary-700">
                    Productivity Score = (Tasks Completed within SLA ÷ Total Assigned) × 100
                    &nbsp;·&nbsp; SLA: P0 = 4h, P1 = 8h, P2 = 48h, P3 = 96h
                  </p>
                </div>
              </div>

              {/* Monthly trend chart */}
              {scorecard.monthlyTrend.length > 0 && (
                <div className="card">
                  <h2 className="font-semibold text-surface-800 mb-4">Monthly SLA Adherence Trend</h2>
                  <div className="flex items-end gap-3 h-32">
                    {scorecard.monthlyTrend.map(m => (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                        <span className="text-[10px] text-surface-600 font-medium">{m.score}%</span>
                        <div className="w-full flex flex-col gap-px" style={{ height: `${(m.score / 100) * 96}px` }}>
                          <div className="w-full bg-green-400 rounded-t-md flex-1" style={{ flex: m.onTime }} />
                          {m.late > 0 && <div className="w-full bg-red-300 flex-none" style={{ flex: m.late }} />}
                        </div>
                        <span className="text-[10px] text-surface-400 truncate w-full text-center">
                          {m.month.slice(5)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="flex items-center gap-1.5 text-xs text-surface-500"><span className="w-3 h-3 rounded bg-green-400" />On-time</span>
                    <span className="flex items-center gap-1.5 text-xs text-surface-500"><span className="w-3 h-3 rounded bg-red-300" />Late</span>
                  </div>
                </div>
              )}

              {/* Per-task SLA adherence list */}
              <div className="card overflow-hidden p-0">
                <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
                  <h2 className="font-semibold text-surface-800">Task-Level SLA Adherence</h2>
                  <span className="text-xs text-surface-400">Last 3 months</span>
                </div>
                <div className="divide-y divide-surface-100">
                  {scorecard.tasks.length === 0 && (
                    <div className="py-12 text-center text-surface-400 text-sm">No tasks assigned in this period.</div>
                  )}
                  {scorecard.tasks.map(task => (
                    <div key={task.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-50 transition-colors">
                      {/* Status icon */}
                      <div className="flex-shrink-0">
                        {task.status === 'DONE' ? (
                          task.onTime
                            ? <CheckCircle size={18} className="text-green-500" />
                            : <XCircle    size={18} className="text-red-500"   />
                        ) : (
                          task.breached
                            ? <Clock size={18} className="text-red-400" />
                            : <Clock size={18} className="text-amber-400" />
                        )}
                      </div>

                      {/* Title + priority */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-800 truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${PRIORITY_COLOR[task.priority] || 'bg-surface-100 text-surface-600'}`}>
                            {task.priority}
                          </span>
                          <span className="text-xs text-surface-400">
                            SLA: {task.slaAllowedHours}h
                          </span>
                        </div>
                      </div>

                      {/* Time info */}
                      <div className="text-right flex-shrink-0">
                        {task.status === 'DONE' && task.takenHours !== null ? (
                          <>
                            <p className={`text-sm font-semibold ${task.onTime ? 'text-green-600' : 'text-red-500'}`}>
                              {task.takenHours}h taken
                            </p>
                            <p className="text-xs text-surface-400">
                              {task.onTime ? 'On time ✓' : `${task.takenHours - task.slaAllowedHours}h over`}
                            </p>
                          </>
                        ) : (
                          <span className={`text-xs font-medium px-2 py-1 rounded ${task.breached ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                            {task.breached ? 'SLA Breached' : task.status.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="card py-16 text-center">
              <Zap size={40} className="text-surface-300 mx-auto mb-3" />
              <p className="text-surface-500">No scorecard data available yet.</p>
              <p className="text-sm text-surface-400 mt-1">Your scorecard will appear once tasks are assigned to you.</p>
            </div>
          )}
        </div>
      )}

      {/* ── MONTHLY KPI TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'kpi' && (
        <div className="space-y-4">
          {monthlyAvg.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-surface-800 mb-4">Monthly Performance Trend</h2>
              <div className="flex items-end gap-2 h-40">
                {monthlyAvg.map(({ month, score }) => (
                  <div key={month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-surface-600 font-medium">{score}%</span>
                    <div
                      className={`w-full rounded-t-lg transition-all ${(score || 0) >= 90 ? 'bg-green-500' : (score || 0) >= 70 ? 'bg-primary-500' : 'bg-amber-500'}`}
                      style={{ height: `${((score || 0) / 100) * 120}px` }}
                    />
                    <span className="text-[10px] text-surface-400">{month}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {kpis.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {kpis.map(kpi => {
                const value = kpi.value as number;
                const target = kpi.target as number;
                const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
                const onTarget = pct >= 100;
                const near     = pct >= 90;
                return (
                  <div key={kpi.id as string} className="card">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {onTarget ? <TrendingUp size={16} className="text-green-500" /> : <TrendingDown size={16} className="text-red-400" />}
                        <p className="font-semibold text-surface-800 text-sm">{kpi.metric as string}</p>
                      </div>
                      <span className={`badge text-xs ${onTarget ? 'bg-green-100 text-green-700' : near ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                        {onTarget ? 'Target Met' : `${pct}% of target`}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-surface-500 mb-1.5">
                      <span>Current: <strong className="text-surface-800">{value}{kpi.unit as string || ''}</strong></span>
                      <span>Target: <strong className="text-surface-800">{target}{kpi.unit as string || ''}</strong></span>
                    </div>
                    <ProgressBar value={pct} color={onTarget ? 'bg-green-500' : near ? 'bg-amber-500' : 'bg-red-400'} />
                    {kpi.period && <p className="text-[11px] text-surface-400 mt-2">Period: {new Date(kpi.period as string).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card py-16 text-center">
              <Target size={40} className="text-surface-300 mx-auto mb-3" />
              <p className="text-surface-500">No KPI data assigned yet.</p>
            </div>
          )}
        </div>
      )}

      {/* ── MANAGER FEEDBACK TAB ─────────────────────────────────────────────── */}
      {activeTab === 'feedback' && (
        <div className="space-y-4">
          {FEEDBACK_HISTORY.map(fb => (
            <div key={fb.id} className="card overflow-hidden">
              <button className="w-full flex items-center justify-between text-left"
                onClick={() => setExpandedFb(expandedFb === fb.id ? null : fb.id)}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageSquare size={18} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-surface-900">{fb.month}</p>
                    <p className="text-xs text-surface-500">by {fb.manager}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <StarRating rating={fb.rating} />
                  <ChevronDown size={16} className={`text-surface-400 transition-transform ${expandedFb === fb.id ? 'rotate-180' : ''}`} />
                </div>
              </button>
              {expandedFb === fb.id && (
                <div className="mt-4 pt-4 border-t border-surface-100 space-y-4">
                  <p className="text-sm text-surface-700 leading-relaxed">{fb.summary}</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">Strengths</p>
                      <ul className="space-y-1">
                        {fb.strengths.map((s, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-surface-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">Areas to Improve</p>
                      <ul className="space-y-1">
                        {fb.improvements.map((s, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-surface-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="bg-primary-50 rounded-xl px-4 py-3">
                    <p className="text-xs font-semibold text-primary-700 mb-1">Goal for Next Month</p>
                    <p className="text-sm text-primary-800">{fb.goals}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PerformancePage;
