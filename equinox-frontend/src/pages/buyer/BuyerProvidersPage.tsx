import React, { useState } from 'react';
import { Building2, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { useApi } from '../../hooks/useApi';
import { contractsService } from '../../services/contracts.service';
import { formatCurrency, formatDate } from '../../utils/helpers';

interface ProviderAgg {
  id: string;
  userId: string;
  name: string;
  company: string;
  category: string;
  contracts: Record<string, unknown>[];
  totalValue: number;
  activeCount: number;
  completedCount: number;
  nextRenewal: string | null;
}

const BuyerProvidersPage: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: contractsRes, loading } = useApi(() => contractsService.list({ limit: 100 }), []);
  const allContracts: Record<string, unknown>[] = contractsRes?.data || [];

  // Derive unique providers from contracts
  const providerMap: Record<string, ProviderAgg> = {};
  allContracts.forEach(c => {
    const prov = c.provider as Record<string, unknown> | undefined;
    if (!prov) return;
    const pid = (prov.id || prov.userId || c.providerId) as string;
    if (!pid) return;
    if (!providerMap[pid]) {
      providerMap[pid] = {
        id: pid,
        userId: (prov.userId || pid) as string,
        name: (prov.name || prov.businessName || 'Provider') as string,
        company: (prov.company || '') as string,
        category: (prov.category || (c.type as string) || 'General') as string,
        contracts: [],
        totalValue: 0,
        activeCount: 0,
        completedCount: 0,
        nextRenewal: null,
      };
    }
    const agg = providerMap[pid];
    agg.contracts.push(c);
    agg.totalValue += (c.value as number) || 0;
    if (c.status === 'ACTIVE') agg.activeCount++;
    if (c.status === 'COMPLETED') agg.completedCount++;
    if (c.endDate) {
      const ed = c.endDate as string;
      if (!agg.nextRenewal || ed < agg.nextRenewal) agg.nextRenewal = ed;
    }
  });

  const providers = Object.values(providerMap);
  const totalValue = providers.reduce((s, p) => s + p.totalValue, 0);
  const avgValue = providers.length ? totalValue / providers.length : 0;
  const activeRelationships = providers.filter(p => p.activeCount > 0).length;

  const isDueSoon = (date: string | null) => {
    if (!date) return false;
    const diff = new Date(date).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">My Providers</h1>
        <p className="text-surface-500 text-sm mt-0.5">All service providers you have contracts with.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-surface-900">{providers.length}</p>
          <p className="text-sm text-surface-500 mt-0.5">Total Providers</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-600">{activeRelationships}</p>
          <p className="text-sm text-surface-500 mt-0.5">Active Relationships</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalValue)}</p>
          <p className="text-sm text-surface-500 mt-0.5">Total Contracted Value</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-amber-600">{formatCurrency(avgValue)}</p>
          <p className="text-sm text-surface-500 mt-0.5">Avg Contract Value</p>
        </div>
      </div>

      {/* Providers grid */}
      {loading && <p className="text-surface-400 text-sm text-center py-10">Loading providers…</p>}
      {!loading && providers.length === 0 && (
        <div className="text-center py-16 text-surface-400">
          <Building2 size={32} className="mx-auto mb-3 opacity-30" />
          <p>No providers yet. Browse the marketplace to find providers.</p>
          <Link to="/buyer/marketplace" className="btn-primary text-sm mt-4 inline-flex">Browse Marketplace</Link>
        </div>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {providers.map(p => (
          <div key={p.id} className="card hover:shadow-md transition-all duration-200">
            <div className="flex items-start gap-3 mb-3">
              <Avatar initials={p.name.slice(0, 2).toUpperCase()} size="lg" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-surface-900 truncate">{p.name}</h3>
                {p.company && <p className="text-xs text-surface-500 truncate">{p.company}</p>}
                <Badge label={p.category} className="mt-1" />
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-surface-500 mb-3">
              <span>{p.contracts.length} contract{p.contracts.length !== 1 ? 's' : ''}</span>
              <span className="text-emerald-600 font-medium">{formatCurrency(p.totalValue)} total</span>
            </div>

            <div className="flex gap-2 mb-3">
              {p.activeCount > 0 && <Badge label={`${p.activeCount} active`} className="text-xs" />}
              {p.completedCount > 0 && <Badge label={`${p.completedCount} completed`} className="text-xs" />}
            </div>

            {p.nextRenewal && (
              <div className={`flex items-center gap-1.5 text-xs mb-3 ${isDueSoon(p.nextRenewal) ? 'text-red-600' : 'text-surface-500'}`}>
                {isDueSoon(p.nextRenewal) && <AlertTriangle size={12} />}
                <span>Renewal: {formatDate(p.nextRenewal)}</span>
              </div>
            )}

            <button
              onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
              className="btn-outline text-xs w-full justify-center flex items-center gap-1"
            >
              View Contracts {expandedId === p.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {expandedId === p.id && (
              <div className="mt-3 space-y-2 border-t border-surface-100 pt-3">
                {p.contracts.map(c => (
                  <div key={c.id as string} className="flex items-center justify-between text-xs p-2 bg-surface-50 rounded-lg">
                    <div className="min-w-0">
                      <p className="font-medium text-surface-800 truncate">{c.title as string}</p>
                      <p className="text-surface-400">{c.type as string} · {formatCurrency(c.value as number)}</p>
                    </div>
                    <Badge label={(c.status as string).toLowerCase()} className="ml-2 flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contracts table */}
      {allContracts.length > 0 && (
        <div className="card overflow-x-auto">
          <h2 className="font-bold text-surface-800 mb-4">All Contracts</h2>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="table-th">Provider</th>
                <th className="table-th">Contract</th>
                <th className="table-th">Type</th>
                <th className="table-th">Value</th>
                <th className="table-th">Status</th>
                <th className="table-th">Renewal Date</th>
              </tr>
            </thead>
            <tbody>
              {allContracts.map(c => {
                const prov = c.provider as Record<string, unknown> | undefined;
                const renewal = c.endDate as string | null;
                return (
                  <tr key={c.id as string} className="border-t border-surface-100 hover:bg-surface-50">
                    <td className="table-td font-medium">{prov?.name as string || '—'}</td>
                    <td className="table-td">{c.title as string}</td>
                    <td className="table-td text-surface-500">{c.type as string}</td>
                    <td className="table-td">{formatCurrency(c.value as number)}</td>
                    <td className="table-td"><Badge label={(c.status as string).toLowerCase()} /></td>
                    <td className={`table-td ${isDueSoon(renewal) ? 'text-red-600 font-medium' : 'text-surface-500'}`}>
                      {renewal ? (
                        <span className="flex items-center gap-1">
                          {isDueSoon(renewal) && <AlertTriangle size={12} />}
                          {formatDate(renewal)}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BuyerProvidersPage;
