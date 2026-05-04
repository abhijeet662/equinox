import React from 'react';
import { Award, TrendingUp, TrendingDown, Target } from 'lucide-react';
import ProgressBar from '../../components/ui/ProgressBar';
import { useApi } from '../../hooks/useApi';
import { kpiService } from '../../services/kpi.service';

const KPIPage: React.FC = () => {
  const { data: kpiRes } = useApi(() => kpiService.list({ limit: 50 }), []);
  const kpis: Record<string, unknown>[] = kpiRes?.data || [];

  const overallScore = kpis.length > 0
    ? Math.round(kpis.reduce((s, k) => s + ((k.value as number) / (k.target as number || 1)) * 100, 0) / kpis.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">KPI Tracker</h1>
        <p className="text-surface-500 text-sm mt-0.5">Track your key performance indicators and targets.</p>
      </div>

      {/* Overall score */}
      <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-8 text-white">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
            <Award size={36} className="text-white" />
          </div>
          <div>
            <p className="text-amber-100 text-sm font-medium">Overall Performance Score</p>
            <p className="text-5xl font-extrabold">{overallScore}%</p>
            <div className="flex items-center gap-2 mt-1">
              <TrendingUp size={14} className="text-amber-200" />
              <span className="text-amber-100 text-sm">Based on {kpis.length} metrics</span>
            </div>
          </div>
          <div className="ml-auto hidden md:block">
            <span className="bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-semibold">
              {overallScore >= 90 ? 'Excellent' : overallScore >= 70 ? 'Good' : 'Needs Work'}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {kpis.length === 0 && (
        <div className="text-center py-16 text-surface-400">
          <Target size={32} className="mx-auto mb-3 opacity-30" />
          <p>No KPI data available yet.</p>
        </div>
      )}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map(kpi => {
          const target = (kpi.target as number) || 1;
          const value = kpi.value as number;
          const pct = Math.min(Math.round((value / target) * 100), 100);
          const isAbove = value >= target;
          const isNearTarget = pct >= 90;
          const trend = kpi.trend as number || 0;
          return (
            <div key={kpi.id as string} className="card hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Target size={18} className="text-amber-600" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {trend >= 0 ? '+' : ''}{trend}
                </div>
              </div>
              <p className="text-sm font-semibold text-surface-700 mb-1">{kpi.metric as string}</p>
              <div className="flex items-end gap-1 mb-3">
                <p className="text-2xl font-bold text-surface-900">{value}{kpi.unit as string || ''}</p>
                <p className="text-sm text-surface-400 mb-0.5">/ {target}{kpi.unit as string || ''}</p>
              </div>
              <ProgressBar
                value={value}
                max={target}
                color={isAbove ? 'bg-green-500' : isNearTarget ? 'bg-amber-400' : 'bg-red-400'}
                showLabel
              />
              <div className="mt-2">
                <span className={`badge text-xs ${isAbove ? 'bg-green-100 text-green-700' : isNearTarget ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                  {isAbove ? 'Target Met' : `${pct}% of target`}
                </span>
              </div>
              {kpi.period && <p className="text-xs text-surface-400 mt-2">{kpi.period as string}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KPIPage;
