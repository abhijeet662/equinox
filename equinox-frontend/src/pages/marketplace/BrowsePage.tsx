/**
 * BrowsePage — /marketplace/browse
 *
 * The Marketplace "Gatekeeper" page.
 *
 * Public:   browsing, searching, filtering, viewing provider cards
 * Protected: "Hire Now" / "Request Proposal" — triggers AuthGateModal for guests
 *
 * On successful auth the user is redirected to the provider's profile page
 * so they can complete the engagement flow.
 */

import React, { useState, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Search, Star, CheckCircle, MapPin, BadgeCheck,
  Grid3X3, List, SlidersHorizontal, Clock, Zap,
  ChevronRight, Shield,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { providersService } from '../../services/providers.service';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import AuthGateModal from '../../components/ui/AuthGateModal';

// ─── Helper types ──────────────────────────────────────────────────────────────

type Provider = Record<string, unknown>;
type SortOption = 'rating' | 'reviews' | 'name';

const CATEGORY_EMOJI: Record<string, string> = {
  Amazon:      '📦', Flipkart:  '🛒', Shopify:    '🛍️',
  Marketing:   '📣', Design:    '🎨', 'Data & AI': '🤖',
  Cataloguing: '📋', Analytics: '📊', Advertising: '📢',
};

const SLA_RESPONSE: Record<string, string> = {
  P0: '4h', P1: '8h', P2: '48h', P3: '96h',
};

// ─── Provider card ────────────────────────────────────────────────────────────

const ProviderCard: React.FC<{
  provider: Provider;
  view: 'grid' | 'list';
  onHire: (id: string) => void;
  isAuthenticated: boolean;
}> = ({ provider, view, onHire, isAuthenticated }) => {
  const navigate = useNavigate();

  const id        = provider.id as string;
  const name      = (provider.businessName as string) || (provider.user as Record<string, string>)?.name || 'Provider';
  const cat       = (provider.category as string) || 'General';
  const rating    = (provider.rating as number) || 0;
  const reviews   = (provider.reviewCount as number) || 0;
  const verified  = !!(provider.verified);
  const slaVerified = verified || rating >= 4.5;
  const location  = provider.location as string | undefined;

  const handleHire = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAuthenticated) {
      navigate(`/providers/${id}`);
    } else {
      onHire(id);
    }
  };

  if (view === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-2xl border border-surface-200 hover:border-primary-200 hover:shadow-md transition-all duration-200 overflow-hidden"
      >
        <div className="flex items-center gap-5 p-5">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center text-xl flex-shrink-0">
            {CATEGORY_EMOJI[cat] ?? '⚙️'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-bold text-surface-900 truncate">{name}</h3>
              {verified && (
                <span title="Equinox Verified Provider" className="inline-flex items-center gap-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                  <BadgeCheck size={9} /> Verified
                </span>
              )}
              {slaVerified && (
                <span className="flex items-center gap-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                  <BadgeCheck size={9} /> SLA Verified
                </span>
              )}
              <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium">{cat}</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1">
                <Star size={12} className="text-amber-400 fill-amber-400" />
                <span className="text-sm font-semibold text-surface-800">{rating.toFixed(1)}</span>
                <span className="text-xs text-surface-400">({reviews})</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <Clock size={11} /> P0 in {SLA_RESPONSE.P0}
              </div>
              {location && (
                <div className="flex items-center gap-1 text-xs text-surface-400">
                  <MapPin size={11} /> {location}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to={`/providers/${id}`}
              className="px-4 py-2 border border-surface-200 text-surface-600 hover:bg-surface-50 rounded-xl text-xs font-semibold transition-colors"
            >
              View Profile
            </Link>
            <button
              onClick={handleHire}
              className="px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md flex items-center gap-1"
            >
              <Zap size={12} /> Hire Now
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white rounded-2xl border border-surface-200 hover:border-primary-300 hover:shadow-xl hover:shadow-primary-100/30 transition-all duration-300 overflow-hidden flex flex-col"
    >
      {/* Top accent */}
      <div className="h-1 bg-gradient-to-r from-primary-400 to-secondary-500" />

      <div className="p-6 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center text-2xl flex-shrink-0 border border-surface-100">
            {CATEGORY_EMOJI[cat] ?? '⚙️'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <h3 className="font-bold text-surface-900 group-hover:text-primary-700 transition-colors text-sm truncate">
                {name}
              </h3>
              {verified && (
                <span title="Equinox Verified Provider" className="inline-flex items-center gap-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                  <BadgeCheck size={9} /> Verified
                </span>
              )}
            </div>
            {slaVerified && (
              <span className="inline-flex items-center gap-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full mb-1">
                <BadgeCheck size={9} /> SLA Verified
              </span>
            )}
            <span className="block text-[11px] bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium w-fit">
              {cat}
            </span>
          </div>
        </div>

        {/* Description */}
        {provider.description && (
          <p className="text-xs text-surface-500 leading-relaxed mb-4 line-clamp-2 flex-shrink-0">
            {provider.description as string}
          </p>
        )}

        {/* Rating + SLA */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} size={12} className={i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-surface-200 fill-surface-200'} />
            ))}
            <span className="text-xs font-bold text-surface-800 ml-1">{rating.toFixed(1)}</span>
            <span className="text-xs text-surface-400">({reviews})</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
            <Clock size={11} />
            <span>P0: {SLA_RESPONSE.P0}</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex gap-2 mt-auto pt-4 border-t border-surface-100">
          <Link
            to={`/providers/${id}`}
            className="flex-1 text-center text-xs font-semibold text-surface-600 hover:text-primary-600 border border-surface-200 hover:border-primary-200 hover:bg-primary-50 py-2 rounded-xl transition-colors"
          >
            View Profile
          </Link>
          <button
            onClick={handleHire}
            className="flex-1 flex items-center justify-center gap-1 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white text-xs font-bold py-2 rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            <Zap size={12} />
            Hire Now
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const BrowsePage: React.FC = () => {
  const user = useSelector((s: RootState) => s.auth.user);
  const isAuthenticated = !!user;

  const [search, setSearch]         = useState('');
  const [category, setCategory]     = useState('All');
  const [view, setView]             = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy]         = useState<SortOption>('rating');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [showFilters, setShowFilters]   = useState(false);

  // AuthGate state
  const [gateOpen, setGateOpen]     = useState(false);
  const [pendingId, setPendingId]   = useState<string | null>(null);

  const navigate = useNavigate();

  const { data: providersRes, loading } = useApi(() => providersService.list({ limit: 100 }), []);
  const { data: categoriesRaw }         = useApi(() => providersService.listCategories(), []);

  const allProviders: Provider[] = providersRes?.data || [];
  const categoryList = ['All', ...(categoriesRaw || []).map((c: { name: string }) => c.name)];

  const filtered = useMemo(() => {
    let list = allProviders;
    if (category !== 'All')  list = list.filter(p => p.category === category);
    if (verifiedOnly)        list = list.filter(p => p.verified);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        ((p.businessName as string) || '').toLowerCase().includes(q) ||
        ((p.category as string) || '').toLowerCase().includes(q) ||
        ((p.user as Record<string, string>)?.name || '').toLowerCase().includes(q)
      );
    }
    if (sortBy === 'rating')  return [...list].sort((a, b) => ((b.rating as number) || 0) - ((a.rating as number) || 0));
    if (sortBy === 'reviews') return [...list].sort((a, b) => ((b.reviewCount as number) || 0) - ((a.reviewCount as number) || 0));
    return [...list].sort((a, b) => (a.businessName as string || '').localeCompare(b.businessName as string || ''));
  }, [allProviders, search, category, verifiedOnly, sortBy]);

  const handleHire = (providerId: string) => {
    if (isAuthenticated) {
      navigate(`/providers/${providerId}`);
    } else {
      setPendingId(providerId);
      setGateOpen(true);
    }
  };

  const handleAuthenticated = () => {
    if (pendingId) {
      navigate(`/providers/${pendingId}`);
      setPendingId(null);
    }
  };

  const statsRef = useRef<HTMLDivElement>(null);
  const inView   = useInView(statsRef, { once: true });

  return (
    <div className="min-h-screen bg-surface-50">
      {/* ── Hero bar ─────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#0f172a] via-[#1e3a8a] to-[#312e81] pt-24 pb-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-300 mb-2">Provider Directory</p>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
                Browse Certified Experts
              </h1>
              <p className="text-blue-200/80 text-sm">
                {allProviders.length > 0 ? allProviders.length : '10'}+ LMS-certified agencies · SLA-backed engagements only
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-white/70 bg-white/10 border border-white/20 rounded-xl px-3 py-2">
                <Shield size={13} className="text-green-300" /> SLA-guaranteed contracts
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/70 bg-white/10 border border-white/20 rounded-xl px-3 py-2">
                <Clock size={13} className="text-amber-300" /> P0 response in 4h
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* ── Filter bar ───────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-surface-200 p-4 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 bg-surface-50 border border-surface-200 rounded-xl px-3 py-2.5 flex-1">
              <Search size={16} className="text-surface-400 flex-shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, category, service…"
                className="bg-transparent text-sm text-surface-700 placeholder-surface-400 outline-none flex-1"
              />
            </div>

            {/* Category */}
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="input-field md:w-48 text-sm"
            >
              {categoryList.map(c => <option key={c}>{c}</option>)}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              className="input-field md:w-44 text-sm"
            >
              <option value="rating">Highest Rated</option>
              <option value="reviews">Most Reviews</option>
              <option value="name">Alphabetical</option>
            </select>

            {/* Filters toggle */}
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${showFilters ? 'bg-primary-50 border-primary-200 text-primary-700' : 'border-surface-200 text-surface-600 hover:bg-surface-50'}`}
            >
              <SlidersHorizontal size={15} /> Filters
            </button>

            {/* View toggle */}
            <div className="flex gap-1 p-1 bg-surface-100 rounded-xl">
              <button onClick={() => setView('grid')} className={`p-2 rounded-lg transition-colors ${view === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-surface-400 hover:text-surface-600'}`}>
                <Grid3X3 size={16} />
              </button>
              <button onClick={() => setView('list')} className={`p-2 rounded-lg transition-colors ${view === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-surface-400 hover:text-surface-600'}`}>
                <List size={16} />
              </button>
            </div>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-surface-100">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={e => setVerifiedOnly(e.target.checked)}
                  className="w-4 h-4 accent-primary-600 rounded"
                />
                <span className="text-sm text-surface-600 font-medium">Verified providers only</span>
              </label>
            </div>
          )}
        </div>

        {/* Guest notice bar */}
        {!isAuthenticated && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5 mb-6">
            <Shield size={16} className="text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              <span className="font-semibold">Browsing as guest.</span>{' '}
              Searching is free. To hire or send a proposal,{' '}
              <button onClick={() => setGateOpen(true)} className="underline font-semibold hover:text-amber-900">
                sign in or create a free account
              </button>.
            </p>
          </div>
        )}

        {/* Result count */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-surface-500">
            <span className="font-bold text-surface-800">{filtered.length}</span> provider{filtered.length !== 1 ? 's' : ''} found
          </p>
          <Link to="/" className="hidden md:flex items-center gap-1 text-xs text-primary-600 hover:underline font-medium">
            ← Back to home <ChevronRight size={12} />
          </Link>
        </div>

        {/* Grid */}
        {loading ? (
          <div className={`grid gap-5 ${view === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : ''}`}>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-surface-200 p-6 animate-pulse">
                <div className="flex gap-4 mb-4">
                  <div className="w-14 h-14 bg-surface-100 rounded-2xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-surface-100 rounded w-3/4" />
                    <div className="h-3 bg-surface-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-16 bg-surface-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-surface-700 font-semibold text-lg">No providers found</p>
            <p className="text-surface-400 text-sm mt-2">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className={`grid gap-5 ${view === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {filtered.map(p => (
              <ProviderCard
                key={p.id as string}
                provider={p}
                view={view}
                onHire={handleHire}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        )}

        {/* Stats strip */}
        <motion.div
          ref={statsRef}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="mt-16 bg-gradient-to-r from-[#0f172a] to-[#1e3a8a] rounded-3xl p-8 text-center"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-blue-300 mb-4">Platform Statistics</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '10+',   label: 'Certified Agencies' },
              { value: '99.8%', label: 'SLA Success Rate' },
              { value: '$40k+', label: 'Revenue Managed' },
              { value: '< 4h',  label: 'Avg P0 Response' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-2xl font-extrabold text-white">{s.value}</p>
                <p className="text-xs text-blue-300 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* AuthGateModal */}
      <AuthGateModal
        isOpen={gateOpen}
        onClose={() => { setGateOpen(false); setPendingId(null); }}
        onAuthenticated={handleAuthenticated}
        actionText="hire a provider or send a proposal"
      />
    </div>
  );
};

export default BrowsePage;
