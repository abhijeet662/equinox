import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, CheckCircle, MapPin, Grid3X3, List } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { providersService } from '../../services/providers.service';

const ProvidersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('rating');

  const { data: providersRes } = useApi(() => providersService.list({ limit: 100 }), []);
  const { data: categoriesData } = useApi(() => providersService.listCategories(), []);

  const allProviders: Record<string, unknown>[] = providersRes?.data || [];
  const categoryList: string[] = ['All', ...(categoriesData || []).map((c: { name: string }) => c.name)];

  const filtered = useMemo(() => {
    let list = allProviders;
    if (category !== 'All') list = list.filter(p => p.category === category);
    if (search) list = list.filter(p =>
      ((p.businessName as string) || '').toLowerCase().includes(search.toLowerCase()) ||
      ((p.category as string) || '').toLowerCase().includes(search.toLowerCase()) ||
      ((p.user as Record<string, string>)?.name || '').toLowerCase().includes(search.toLowerCase())
    );
    if (verifiedOnly) list = list.filter(p => p.verified);
    if (sortBy === 'rating') list = [...list].sort((a, b) => (b.rating as number || 0) - (a.rating as number || 0));
    else if (sortBy === 'reviews') list = [...list].sort((a, b) => (b.reviewCount as number || 0) - (a.reviewCount as number || 0));
    return list;
  }, [allProviders, search, category, verifiedOnly, sortBy]);

  const getName = (p: Record<string, unknown>) =>
    (p.businessName as string) || (p.user as Record<string, string>)?.name || 'Provider';

  const getLogo = (p: Record<string, unknown>) => getName(p)[0]?.toUpperCase() || 'P';

  return (
    <div className="pt-20 min-h-screen bg-surface-50">
      {/* Header */}
      <div className="bg-white border-b border-surface-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <h1 className="text-3xl font-bold text-surface-900 mb-2">Service Providers</h1>
          <p className="text-surface-500">Browse {allProviders.length} verified service providers across multiple categories.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl border border-surface-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex items-center gap-2 bg-surface-50 border border-surface-200 rounded-xl px-3 py-2.5 flex-1">
              <Search size={16} className="text-surface-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search providers, services..."
                className="bg-transparent text-sm text-surface-700 placeholder-surface-400 outline-none flex-1"
              />
            </div>
            <select value={category} onChange={e => setCategory(e.target.value)} className="input-field md:w-52 text-sm">
              {categoryList.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-field md:w-44 text-sm">
              <option value="rating">Highest Rated</option>
              <option value="reviews">Most Reviews</option>
            </select>
            <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
              <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} className="w-4 h-4 accent-primary-600" />
              <span className="text-sm text-surface-600 font-medium">Verified only</span>
            </label>
            <div className="flex gap-1 p-1 bg-surface-100 rounded-lg ml-auto">
              <button onClick={() => setView('grid')} className={`p-2 rounded-md transition-colors ${view === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-surface-400'}`}><Grid3X3 size={16} /></button>
              <button onClick={() => setView('list')} className={`p-2 rounded-md transition-colors ${view === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-surface-400'}`}><List size={16} /></button>
            </div>
          </div>
        </div>

        <p className="text-sm text-surface-500 mb-5 font-medium">{filtered.length} providers found</p>

        {/* Grid View */}
        {view === 'grid' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(provider => (
              <Link
                key={provider.id as string}
                to={`/providers/${provider.id as string}`}
                className="bg-white rounded-2xl border border-surface-200 p-6 hover:shadow-lg hover:border-primary-200 transition-all duration-200 group"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {getLogo(provider)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <h3 className="font-bold text-surface-900 group-hover:text-primary-600 transition-colors truncate">{getName(provider)}</h3>
                      {provider.verified && <CheckCircle size={14} className="text-primary-500 flex-shrink-0" />}
                    </div>
                    <span className="text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full font-medium">{provider.category as string || 'General'}</span>
                  </div>
                </div>
                {provider.description && <p className="text-sm text-surface-600 line-clamp-2 mb-4">{provider.description as string}</p>}
                <div className="flex items-center justify-between pt-4 border-t border-surface-100">
                  <div className="flex items-center gap-1">
                    <Star size={13} className="text-amber-400 fill-amber-400" />
                    <span className="text-sm font-semibold text-surface-800">{(provider.rating as number || 0).toFixed(1)}</span>
                    <span className="text-xs text-surface-400">({provider.reviewCount as number || 0})</span>
                  </div>
                  {provider.location && (
                    <div className="flex items-center gap-1 text-xs text-surface-400">
                      <MapPin size={12} />
                      {provider.location as string}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* List View */}
        {view === 'list' && (
          <div className="space-y-3">
            {filtered.map(provider => (
              <Link
                key={provider.id as string}
                to={`/providers/${provider.id as string}`}
                className="bg-white rounded-2xl border border-surface-200 p-5 flex items-center gap-5 hover:shadow-md hover:border-primary-200 transition-all duration-200 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {getLogo(provider)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-surface-900 group-hover:text-primary-600 transition-colors">{getName(provider)}</h3>
                    {provider.verified && <CheckCircle size={14} className="text-primary-500" />}
                    <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium">{provider.category as string || 'General'}</span>
                  </div>
                  {provider.description && <p className="text-sm text-surface-500 line-clamp-1">{provider.description as string}</p>}
                </div>
                <div className="hidden md:flex flex-col items-end gap-1 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <Star size={13} className="text-amber-400 fill-amber-400" />
                    <span className="text-sm font-semibold text-surface-800">{(provider.rating as number || 0).toFixed(1)}</span>
                    <span className="text-xs text-surface-400">({provider.reviewCount as number || 0})</span>
                  </div>
                  {provider.location && (
                    <div className="flex items-center gap-1 text-xs text-surface-400">
                      <MapPin size={11} /> {provider.location as string}
                    </div>
                  )}
                  <div className="text-xs text-surface-400">{provider.completedJobs as number || 0} jobs completed</div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-surface-700 font-semibold text-lg">No providers found</p>
            <p className="text-surface-400 text-sm mt-2">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProvidersPage;
