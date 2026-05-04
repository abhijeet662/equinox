import React, { useState, useMemo } from 'react';
import { Search, Star, MapPin, Briefcase, CheckCircle, X, Send, SlidersHorizontal, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { providersService } from '../../services/providers.service';
import { contractsService } from '../../services/contracts.service';
import Avatar from '../../components/ui/Avatar';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'E-Commerce', 'Marketing', 'Technology', 'Design', 'Finance', 'Operations', 'Other'];

interface Provider {
  id: string;
  userId?: string;
  user?: { id: string; name: string; email: string };
  businessName: string;
  category: string;
  description?: string;
  location?: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  verified: boolean;
  featured: boolean;
  effectiveFeatured?: boolean;
  featuredDaysLeft?: number;
  subscriptionActive?: boolean;
}

interface ProposalForm {
  description: string;
  budget: string;
  timeline: string;
  startDate: string;
}

const EMPTY_PROPOSAL: ProposalForm = { description: '', budget: '', timeline: '1 month', startDate: '' };
const TIMELINES = ['1 week', '2 weeks', '1 month', '3 months', '6 months'];

const StarDisplay: React.FC<{ rating: number; size?: number }> = ({ rating, size = 12 }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} size={size} className={i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-surface-200 fill-surface-200'} />
    ))}
  </div>
);

const BuyerMarketplacePage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [proposalProvider, setProposalProvider] = useState<Provider | null>(null);
  const [proposal, setProposal] = useState<ProposalForm>(EMPTY_PROPOSAL);
  const [sendingProposal, setSendingProposal] = useState(false);

  const { data: providersRes, loading } = useApi(
    () => providersService.list({
      limit: 50,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(category !== 'All' ? { category } : {}),
    }),
    [search, category]
  );

  const providers: Provider[] = providersRes?.data || [];

  const compareProviders = useMemo(
    () => providers.filter(p => compareIds.includes(p.id)),
    [providers, compareIds]
  );

  const toggleCompare = (id: string) => {
    setCompareIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length >= 3 ? (toast.error('Compare up to 3 providers'), prev) : [...prev, id]
    );
  };

  const handleSendProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalProvider) return;
    if (!proposal.description.trim()) { toast.error('Please describe what you need'); return; }

    const providerId = proposalProvider.user?.id || proposalProvider.userId;
    if (!providerId) { toast.error('Provider ID not found'); return; }

    setSendingProposal(true);
    try {
      await contractsService.create({
        title: `Proposal: ${proposal.description.slice(0, 50)}`,
        providerId,
        type: 'PROJECT',
        value: proposal.budget ? Number(proposal.budget) : 0,
        startDate: proposal.startDate || undefined,
        description: proposal.description,
      });
      toast.success(`Proposal sent to ${proposalProvider.businessName}!`);
      setProposalProvider(null);
      setProposal(EMPTY_PROPOSAL);
    } catch {
      toast.error('Failed to send proposal');
    } finally {
      setSendingProposal(false);
    }
  };

  const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Find Providers</h1>
        <p className="text-surface-500 text-sm mt-0.5">Search, compare, and connect with top service providers.</p>
      </div>

      {/* Search + Category */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            className="input-field pl-11 py-3 text-base w-full"
            placeholder="Search providers by name, service, or category…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal size={15} className="text-surface-400 flex-shrink-0" />
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                category === cat
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results count + compare hint */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-surface-500">
          {loading ? 'Searching…' : `${providers.length} provider${providers.length !== 1 ? 's' : ''} found`}
        </p>
        {compareIds.length > 0 && (
          <button
            onClick={() => setShowCompare(true)}
            className="text-sm text-primary-600 font-medium flex items-center gap-1.5 hover:underline"
          >
            Compare {compareIds.length} provider{compareIds.length > 1 ? 's' : ''} →
          </button>
        )}
      </div>

      {/* Provider grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card animate-pulse space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-surface-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-surface-200 rounded w-3/4" />
                  <div className="h-3 bg-surface-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-surface-100 rounded" />
              <div className="h-3 bg-surface-100 rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : providers.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <Search size={40} className="text-surface-300 mb-3" />
          <p className="font-medium text-surface-600">No providers found</p>
          <p className="text-sm text-surface-400 mt-1">Try a different search term or category</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map(p => {
            const isComparing = compareIds.includes(p.id);
            return (
              <div
                key={p.id}
                className={`card space-y-4 transition-all relative ${isComparing ? 'ring-2 ring-primary-400' : ''} ${p.effectiveFeatured ? 'ring-1 ring-amber-300' : ''}`}
              >
                {/* Featured Partner badge */}
                {p.effectiveFeatured && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    <Star size={9} className="fill-amber-500 text-amber-500" />
                    Featured Partner
                  </div>
                )}

                {/* Header */}
                <div className="flex items-start gap-3">
                  <Avatar initials={getInitials(p.businessName || 'P')} size="lg" />
                  <div className="flex-1 min-w-0 pr-20">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-surface-900 truncate">{p.businessName}</p>
                      {p.verified && <CheckCircle size={14} className="text-green-500 flex-shrink-0" />}
                    </div>
                    <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded font-medium">
                      {p.category || 'General'}
                    </span>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <StarDisplay rating={p.rating} />
                  <span className="text-sm font-semibold text-surface-800">{(p.rating || 0).toFixed(1)}</span>
                  <span className="text-xs text-surface-400">({p.reviewCount || 0} reviews)</span>
                </div>

                {/* Description */}
                {p.description && (
                  <p className="text-xs text-surface-500 line-clamp-2">{p.description}</p>
                )}

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-surface-400">
                  {p.location && (
                    <span className="flex items-center gap-1"><MapPin size={11} />{p.location}</span>
                  )}
                  <span className="flex items-center gap-1"><Briefcase size={11} />{p.completedJobs || 0} jobs</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1 border-t border-surface-100">
                  <button
                    onClick={() => toggleCompare(p.id)}
                    className={`text-xs py-1.5 px-2 rounded-lg font-medium transition-colors border flex-shrink-0 ${
                      isComparing
                        ? 'bg-primary-50 text-primary-700 border-primary-200'
                        : 'bg-surface-50 text-surface-600 border-surface-200 hover:bg-surface-100'
                    }`}
                  >
                    {isComparing ? '✓' : 'Compare'}
                  </button>
                  <Link
                    to={`/providers/${p.id}`}
                    className="flex items-center justify-center gap-1 text-xs py-1.5 px-2 rounded-lg border border-surface-200 bg-surface-50 text-surface-600 hover:bg-surface-100 transition-colors flex-shrink-0"
                  >
                    <ExternalLink size={11} /> Profile
                  </Link>
                  <button
                    onClick={() => { setProposalProvider(p); setProposal(EMPTY_PROPOSAL); }}
                    className="flex-1 btn-primary text-xs py-1.5 flex items-center justify-center gap-1"
                  >
                    <Send size={12} /> Connect
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Compare Modal */}
      {showCompare && compareProviders.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 sticky top-0 bg-white">
              <h2 className="font-bold text-surface-900">Compare Providers</h2>
              <button onClick={() => setShowCompare(false)} className="w-8 h-8 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-400">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left text-xs text-surface-500 font-medium py-2 pr-4 w-32">Attribute</th>
                    {compareProviders.map(p => (
                      <th key={p.id} className="text-center py-2 px-3">
                        <div className="flex flex-col items-center gap-1">
                          <Avatar initials={getInitials(p.businessName || 'P')} size="md" />
                          <span className="font-semibold text-surface-800 text-xs">{p.businessName}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {[
                    { label: 'Category', key: (p: Provider) => p.category || '—' },
                    { label: 'Rating', key: (p: Provider) => `${(p.rating || 0).toFixed(1)} ⭐` },
                    { label: 'Reviews', key: (p: Provider) => `${p.reviewCount || 0}` },
                    { label: 'Completed Jobs', key: (p: Provider) => `${p.completedJobs || 0}` },
                    { label: 'Location', key: (p: Provider) => p.location || '—' },
                    { label: 'Verified', key: (p: Provider) => p.verified ? '✓ Verified' : 'Unverified' },
                  ].map(row => (
                    <tr key={row.label}>
                      <td className="py-3 pr-4 text-surface-500 font-medium text-xs">{row.label}</td>
                      {compareProviders.map(p => (
                        <td key={p.id} className="py-3 px-3 text-center text-surface-800">{row.key(p)}</td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td className="py-3 pr-4" />
                    {compareProviders.map(p => (
                      <td key={p.id} className="py-3 px-3 text-center">
                        <button
                          onClick={() => { setShowCompare(false); setProposalProvider(p); setProposal(EMPTY_PROPOSAL); }}
                          className="btn-primary text-xs"
                        >
                          <Send size={12} /> Propose
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Send Proposal Modal */}
      {proposalProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
              <div>
                <h2 className="font-bold text-surface-900">Send Proposal</h2>
                <p className="text-xs text-surface-500 mt-0.5">To: {proposalProvider.businessName}</p>
              </div>
              <button onClick={() => setProposalProvider(null)} className="w-8 h-8 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-400">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSendProposal} className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-surface-600 mb-1.5 block">What do you need? *</label>
                <textarea
                  required
                  rows={3}
                  className="input-field text-sm resize-none"
                  placeholder="Describe the service, project scope, or requirements…"
                  value={proposal.description}
                  onChange={e => setProposal({ ...proposal, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-surface-600 mb-1.5 block">Budget ($)</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field text-sm"
                    placeholder="0"
                    value={proposal.budget}
                    onChange={e => setProposal({ ...proposal, budget: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-surface-600 mb-1.5 block">Timeline</label>
                  <select
                    className="input-field text-sm"
                    value={proposal.timeline}
                    onChange={e => setProposal({ ...proposal, timeline: e.target.value })}
                  >
                    {TIMELINES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-surface-600 mb-1.5 block">Desired Start Date</label>
                <input
                  type="date"
                  className="input-field text-sm"
                  value={proposal.startDate}
                  onChange={e => setProposal({ ...proposal, startDate: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setProposalProvider(null)} className="btn-outline flex-1 justify-center text-sm">Cancel</button>
                <button type="submit" disabled={sendingProposal} className="btn-primary flex-1 justify-center text-sm disabled:opacity-60">
                  {sendingProposal
                    ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sending…</>
                    : <><Send size={14} /> Send Proposal</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerMarketplacePage;
