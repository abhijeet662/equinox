import React, { useState } from 'react';
import { CheckCircle, Star, XCircle, Store, Shield, Package } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { providersService } from '../../services/providers.service';
import toast from 'react-hot-toast';

type Tab = 'all' | 'featured' | 'pending';

const PRICING_PLANS = [
  { name: 'Basic', price: '$0', period: '/mo', features: ['Up to 3 listings', 'Basic analytics', 'Email support'], color: 'border-surface-200' },
  { name: 'Pro', price: '$49', period: '/mo', features: ['Unlimited listings', 'Advanced analytics', 'Priority support', 'Featured badge'], color: 'border-primary-300', highlight: true },
  { name: 'Enterprise', price: '$149', period: '/mo', features: ['Everything in Pro', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee'], color: 'border-purple-300' },
];

const AdminMarketplaceControlPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data: providersRes, refetch } = useApi(() => providersService.list({ limit: 100 }), []);
  const providers: Record<string, unknown>[] = providersRes?.data || [];

  const total = providers.length;
  const featured = providers.filter(p => p.featured).length;
  const verified = providers.filter(p => p.verified).length;
  const pending = providers.filter(p => !p.verified).length;

  const tabFiltered = providers.filter(p => {
    if (tab === 'featured') return p.featured;
    if (tab === 'pending') return !p.verified;
    return true;
  });

  const handleAction = async (action: 'verify' | 'feature' | 'suspend', id: string, name: string) => {
    setActionLoading(`${action}-${id}`);
    try {
      if (action === 'verify') {
        await providersService.verify(id);
        toast.success(`${name} verified`);
      } else if (action === 'feature') {
        await providersService.feature(id);
        toast.success(`Feature status toggled for ${name}`);
      } else {
        await providersService.suspend(id);
        toast.success(`${name} suspended`);
      }
      refetch();
    } catch {
      toast.error(`Failed to ${action} provider`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Marketplace Control</h1>
        <p className="text-surface-500 text-sm mt-0.5">Manage provider listings, verifications and platform pricing.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Store size={18} className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-surface-900">{total}</p>
          <p className="text-sm text-surface-500">Total Listings</p>
        </div>
        <div className="card text-center">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Star size={18} className="text-amber-500 fill-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600">{featured}</p>
          <p className="text-sm text-surface-500">Featured</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">{verified}</p>
          <p className="text-sm text-surface-500">Verified</p>
        </div>
        <div className="card text-center">
          <div className="flex items-center justify-center gap-1">
            <p className="text-2xl font-bold text-amber-600">{pending}</p>
            {pending > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
          </div>
          <p className="text-sm text-surface-500">Pending Approval</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 p-1 rounded-xl w-fit">
        {([['all', 'All Providers'], ['featured', 'Featured'], ['pending', 'Pending Verification']] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead className="bg-surface-50 border-b border-surface-200">
            <tr>
              <th className="table-th">Provider</th>
              <th className="table-th">Category</th>
              <th className="table-th">Rating</th>
              <th className="table-th">Verified</th>
              <th className="table-th">Featured</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {tabFiltered.map(p => {
              const u = p.user as Record<string, string> | null;
              const displayName = (p.businessName as string) || (p.companyName as string) || u?.name || '—';
              return (
                <tr key={p.id as string} className="hover:bg-surface-50 transition-colors">
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {displayName[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-surface-800">{displayName}</p>
                        <p className="text-xs text-surface-400">{u?.email || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-td">
                    <span className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded text-xs font-medium">
                      {(p.category as string) || '—'}
                    </span>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-1">
                      <Star size={13} className="text-amber-400 fill-amber-400" />
                      <span className="font-semibold text-surface-800 text-sm">{(p.rating as number || 0).toFixed(1)}</span>
                      <span className="text-surface-400 text-xs">({p.reviewCount as number || 0})</span>
                    </div>
                  </td>
                  <td className="table-td">
                    {p.verified
                      ? <CheckCircle size={16} className="text-green-500" />
                      : <XCircle size={16} className="text-surface-300" />}
                  </td>
                  <td className="table-td">
                    {p.featured
                      ? <Star size={16} className="text-amber-400 fill-amber-400" />
                      : <Star size={16} className="text-surface-300" />}
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-1">
                      {!p.verified && (
                        <button
                          disabled={actionLoading === `verify-${p.id}`}
                          onClick={() => handleAction('verify', p.id as string, displayName)}
                          className="btn-primary text-xs py-1 px-2 flex items-center gap-1"
                          title="Verify"
                        >
                          <CheckCircle size={11} /> Verify
                        </button>
                      )}
                      <button
                        disabled={actionLoading === `feature-${p.id}`}
                        onClick={() => handleAction('feature', p.id as string, displayName)}
                        className="btn-outline text-xs py-1 px-2 flex items-center gap-1"
                        title={p.featured ? 'Unfeature' : 'Feature'}
                      >
                        <Star size={11} /> {p.featured ? 'Unfeature' : 'Feature'}
                      </button>
                      <button
                        disabled={actionLoading === `suspend-${p.id}`}
                        onClick={() => handleAction('suspend', p.id as string, displayName)}
                        className="btn-outline text-xs py-1 px-2 flex items-center gap-1 border-red-200 text-red-600 hover:bg-red-50"
                        title="Suspend"
                      >
                        <XCircle size={11} /> Suspend
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {tabFiltered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-surface-400">No providers found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pricing Plans (UI only) */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Package size={18} className="text-surface-600" />
          <h2 className="font-bold text-surface-800">Platform Pricing Plans</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {PRICING_PLANS.map(plan => (
            <div key={plan.name} className={`card border-2 ${plan.color} ${plan.highlight ? 'ring-2 ring-primary-200' : ''} relative`}>
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary-600 text-white text-xs px-3 py-1 rounded-full font-medium">Most Popular</span>
                </div>
              )}
              <div className="flex items-end gap-1 mb-1 mt-2">
                <span className="text-3xl font-bold text-surface-900">{plan.price}</span>
                <span className="text-surface-400 text-sm mb-1">{plan.period}</span>
              </div>
              <p className="font-semibold text-surface-800 mb-3">{plan.name}</p>
              <ul className="space-y-1.5 mb-4">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-surface-600">
                    <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => toast('Pricing configuration coming soon', { icon: '🔧' })}
                className="btn-outline text-sm w-full flex items-center justify-center gap-1"
              >
                <Shield size={13} /> Edit Plan
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminMarketplaceControlPage;
