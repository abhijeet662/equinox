import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, CheckCircle, XCircle, Star, Shield, Zap, Ban, Eye,
  Clock, AlertTriangle, CheckCircle2, X, ExternalLink, FileText,
  Loader2, ChevronRight, CreditCard,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useApi } from '../../hooks/useApi';
import { providersService } from '../../services/providers.service';
import type { PendingProvider } from '../../services/providers.service';

type Tab = 'pending' | 'all';

const FILTERS = ['All', 'Verified', 'Unverified', 'Under Review', 'Featured'];

// ─── Review Modal ──────────────────────────────────────────────────────────────

interface ReviewModalProps {
  provider: PendingProvider;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
  acting: boolean;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ provider, onClose, onApprove, onReject, acting }) => {
  const [mode, setMode] = useState<'review' | 'reject'>('review');
  const [reason, setReason] = useState('');

  const handleReject = () => {
    if (!reason.trim()) { toast.error('Please provide a rejection reason'); return; }
    onReject(reason.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0f172a]/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-primary-500 via-secondary-500 to-violet-500" />

        <div className="p-7">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg shadow-md">
                {provider.businessName[0]}
              </div>
              <div>
                <h2 className="font-extrabold text-surface-900 text-lg leading-tight">{provider.businessName}</h2>
                <p className="text-xs text-surface-400 mt-0.5">{provider.category}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-surface-100 hover:bg-surface-200 flex items-center justify-center transition-colors"
            >
              <X size={15} className="text-surface-500" />
            </button>
          </div>

          {mode === 'review' ? (
            <>
              {/* Business Details */}
              <div className="bg-surface-50 rounded-2xl p-4 mb-5 space-y-2.5">
                <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-3">Business Details</p>
                <Detail label="Contact Name" value={provider.user.name} />
                <Detail label="Email" value={provider.user.email} />
                {provider.user.phone && <Detail label="Phone" value={provider.user.phone} />}
                {provider.user.company && <Detail label="Company" value={provider.user.company} />}
                {provider.location && <Detail label="Location" value={provider.location} />}
                {provider.website && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-surface-500">Website</span>
                    <a href={provider.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                      {provider.website} <ExternalLink size={11} />
                    </a>
                  </div>
                )}
                <Detail label="Applied" value={new Date(provider.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
              </div>

              {/* Services */}
              {provider.services.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">Services Offered</p>
                  <div className="flex flex-wrap gap-1.5">
                    {provider.services.map(s => (
                      <span key={s} className="bg-primary-50 text-primary-700 text-xs px-2.5 py-1 rounded-lg font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              <div className="mb-6">
                <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">Identity / Business Documents</p>
                {provider.documentUrls.length === 0 ? (
                  <p className="text-xs text-surface-400 italic flex items-center gap-1.5">
                    <AlertTriangle size={12} className="text-amber-400" />
                    No documents uploaded by provider.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {provider.documentUrls.map((url, i) => (
                      <li key={i}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs text-primary-600 hover:underline"
                        >
                          <FileText size={12} /> Document {i + 1} <ExternalLink size={10} />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Description */}
              {provider.description && (
                <div className="bg-surface-50 rounded-xl p-3 mb-6 text-xs text-surface-600 leading-relaxed">
                  {provider.description}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onApprove}
                  disabled={acting}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-3 rounded-xl text-sm transition-all disabled:opacity-60 shadow-sm"
                >
                  {acting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  Approve & Verify
                </button>
                <button
                  onClick={() => setMode('reject')}
                  disabled={acting}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold py-3 rounded-xl text-sm transition-all border border-red-200 disabled:opacity-60"
                >
                  <XCircle size={15} /> Reject Application
                </button>
              </div>
            </>
          ) : (
            /* Reject flow */
            <>
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5">
                <p className="text-sm font-semibold text-red-800 mb-1">Rejecting: {provider.businessName}</p>
                <p className="text-xs text-red-600">The provider will be notified with your reason.</p>
              </div>

              <div className="mb-5">
                <label className="text-xs font-semibold text-surface-700 mb-2 block">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-surface-400 mb-2">Select a reason or type a custom one below.</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {[
                    'Invalid or missing business documents',
                    'Incomplete profile information',
                    'Services do not match platform categories',
                    'Duplicate account detected',
                    'Insufficient experience or credentials',
                  ].map(r => (
                    <button
                      key={r}
                      onClick={() => setReason(r)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                        reason === r
                          ? 'border-red-400 bg-red-50 text-red-700 font-semibold'
                          : 'border-surface-200 text-surface-600 hover:border-surface-300'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="input-field text-sm w-full resize-none"
                  placeholder="Or type a custom reason…"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setMode('review')}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-surface-200 text-sm font-semibold text-surface-600 hover:bg-surface-50"
                >
                  ← Back
                </button>
                <button
                  onClick={handleReject}
                  disabled={acting || !reason.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl text-sm transition-all disabled:opacity-60"
                >
                  {acting ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
                  Confirm Rejection
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const Detail: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-surface-500">{label}</span>
    <span className="text-xs font-semibold text-surface-800">{value}</span>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const AdminProvidersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [reviewTarget, setReviewTarget] = useState<PendingProvider | null>(null);
  const [acting, setActing] = useState(false);

  const { data: providersRes, refetch: refetchAll } = useApi(() => providersService.listAll({ limit: 200 }), []);
  const { data: pending, refetch: refetchPending } = useApi(() => providersService.getPending(), []);

  const allProviders: Record<string, unknown>[] = providersRes?.data || [];
  const pendingList: PendingProvider[] = pending || [];

  const refetchBoth = () => { refetchAll(); refetchPending(); };

  const filtered = allProviders.filter(p =>
    (filter === 'All' ||
      (filter === 'Verified' && p.isVerified) ||
      (filter === 'Unverified' && !p.isVerified && p.verificationStatus !== 'PENDING') ||
      (filter === 'Under Review' && p.verificationStatus === 'PENDING') ||
      (filter === 'Featured' && p.featured)) &&
    (search === '' ||
      ((p.businessName as string) || '').toLowerCase().includes(search.toLowerCase()) ||
      ((p.category as string) || '').toLowerCase().includes(search.toLowerCase()) ||
      ((p.user as Record<string, string>)?.name || '').toLowerCase().includes(search.toLowerCase()))
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleApprove = async (id: string, name: string) => {
    setActing(true);
    try {
      await providersService.approve(id);
      toast.success(`${name} approved — now live in marketplace`);
      setReviewTarget(null);
      refetchBoth();
    } catch {
      toast.error('Approval failed. Please try again.');
    } finally {
      setActing(false);
    }
  };

  const handleReject = async (id: string, name: string, reason: string) => {
    setActing(true);
    try {
      await providersService.reject(id, reason);
      toast.success(`${name} application rejected`);
      setReviewTarget(null);
      refetchBoth();
    } catch {
      toast.error('Rejection failed. Please try again.');
    } finally {
      setActing(false);
    }
  };

  const handleVerify = async (id: string, name: string) => {
    try {
      await providersService.verify(id);
      toast.success(`${name} verified`);
      refetchBoth();
    } catch { toast.error('Failed to verify provider'); }
  };

  const handleFeature = async (id: string, featured: boolean) => {
    try {
      await providersService.feature(id);
      toast.success(featured ? 'Provider unfeatured' : 'Force Featured — 180-day window reset');
      refetchAll();
    } catch { toast.error('Failed to update provider'); }
  };

  const handleSetSubscription = async (id: string, currentActive: boolean) => {
    try {
      await providersService.setSubscription(id, !currentActive);
      toast.success(currentActive ? 'Subscription deactivated' : 'Subscription activated — provider is now permanently featured');
      refetchAll();
    } catch { toast.error('Failed to update subscription'); }
  };

  const handleSuspend = async (id: string, name: string) => {
    if (!window.confirm(`Suspend ${name}?`)) return;
    try {
      await providersService.suspend(id);
      toast.success(`${name} suspended`);
      refetchAll();
    } catch { toast.error('Failed to suspend provider'); }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Provider Management</h1>
          <p className="text-surface-500 text-sm mt-0.5">Review applications and manage service providers.</p>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-surface-900">{allProviders.length}</p>
          <p className="text-sm text-surface-500">Total Providers</p>
        </div>
        <div
          className={`card text-center cursor-pointer hover:shadow-md transition-shadow ${activeTab === 'pending' ? 'ring-2 ring-amber-400' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <div className="flex items-center justify-center gap-2">
            <p className="text-2xl font-bold text-amber-600">{pendingList.length}</p>
            {pendingList.length > 0 && (
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            )}
          </div>
          <p className="text-sm text-surface-500">Needs Verification</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-emerald-600">{allProviders.filter(p => p.isVerified).length}</p>
          <p className="text-sm text-surface-500">Verified</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-purple-600">{allProviders.filter(p => p.featured).length}</p>
          <p className="text-sm text-surface-500">Featured</p>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 bg-surface-100 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'pending' ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'
          }`}
        >
          <Clock size={14} />
          Pending Approvals
          {pendingList.length > 0 && (
            <span className="bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {pendingList.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'all' ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'
          }`}
        >
          All Providers
          <span className="text-xs text-surface-400">({allProviders.length})</span>
        </button>
      </div>

      {/* ════════ PENDING TAB ════════ */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingList.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center">
                <CheckCircle2 size={28} className="text-emerald-600" />
              </div>
              <p className="font-semibold text-surface-800">All Clear!</p>
              <p className="text-sm text-surface-500">All providers are verified.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 flex-wrap">
                <p className="text-sm text-surface-500">
                  <span className="font-semibold text-surface-800">{pendingList.length}</span> provider{pendingList.length !== 1 ? 's' : ''} awaiting verification.
                </p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-amber-700 font-medium">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    {pendingList.filter(p => p.verificationStatus === 'PENDING').length} Application{pendingList.filter(p => p.verificationStatus === 'PENDING').length !== 1 ? 's' : ''} Submitted
                  </span>
                  <span className="flex items-center gap-1.5 text-surface-500 font-medium">
                    <span className="w-2 h-2 rounded-full bg-surface-400" />
                    {pendingList.filter(p => p.verificationStatus === 'UNVERIFIED').length} Not Yet Applied
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                {pendingList.map(p => {
                  const hasApplied = p.verificationStatus === 'PENDING';
                  return (
                    <div
                      key={p.id}
                      className={`bg-white rounded-2xl border-2 shadow-sm p-5 flex flex-col sm:flex-row gap-4 sm:items-center hover:shadow-md transition-shadow ${
                        hasApplied ? 'border-amber-200' : 'border-surface-200'
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-extrabold text-lg flex-shrink-0 shadow-sm ${
                        hasApplied
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                          : 'bg-gradient-to-br from-surface-400 to-surface-500'
                      }`}>
                        {p.businessName[0]}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="font-bold text-surface-900">{p.businessName}</p>
                          {hasApplied ? (
                            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Clock size={10} /> Application Submitted
                            </span>
                          ) : (
                            <span className="bg-surface-100 text-surface-500 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Shield size={10} /> Not Applied Yet
                            </span>
                          )}
                          {p.verificationStatus === 'REJECTED' && (
                            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <XCircle size={10} /> Previously Rejected
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-surface-500 mb-1">
                          {p.user.name} · {p.user.email} · {p.category}
                        </p>
                        <p className="text-xs text-surface-400">
                          Registered {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {p.documentUrls.length > 0 && (
                            <span className="ml-3 text-primary-600 font-medium">
                              {p.documentUrls.length} document{p.documentUrls.length !== 1 ? 's' : ''} uploaded
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Action */}
                      <button
                        onClick={() => setReviewTarget(p)}
                        className={`flex items-center gap-2 font-bold px-4 py-2.5 rounded-xl text-sm transition-all flex-shrink-0 shadow-sm ${
                          hasApplied
                            ? 'bg-gradient-to-r from-primary-600 to-secondary-600 hover:opacity-90 text-white'
                            : 'bg-surface-100 hover:bg-surface-200 text-surface-700 border border-surface-200'
                        }`}
                      >
                        <Shield size={14} /> {hasApplied ? 'Review' : 'Quick Verify'} <ChevronRight size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════ ALL PROVIDERS TAB ════════ */}
      {activeTab === 'all' && (
        <>
          <div className="card p-4 flex flex-col md:flex-row gap-3">
            <div className="flex items-center gap-2 bg-surface-50 border border-surface-200 rounded-xl px-3 py-2 flex-1">
              <Search size={15} className="text-surface-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search providers..."
                className="bg-transparent text-sm outline-none flex-1 placeholder-surface-400"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${filter === f ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="card overflow-hidden p-0">
            <table className="w-full">
              <thead className="bg-surface-50 border-b border-surface-200">
                <tr>
                  <th className="table-th">Provider</th>
                  <th className="table-th">Category</th>
                  <th className="table-th">Rating</th>
                  <th className="table-th">Jobs</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Featured</th>
                  <th className="table-th">Subscription</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {filtered.map(p => {
                  const providerName = (p.businessName as string) || (p.user as Record<string, string>)?.name || 'Provider';
                  const verStatus = (p.verificationStatus as string) || 'PENDING';
                  return (
                    <tr key={p.id as string} className="hover:bg-surface-50 transition-colors">
                      <td className="table-td">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {providerName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-surface-800">{providerName}</p>
                            <p className="text-xs text-surface-400">{(p.user as Record<string, string>)?.email || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-td">
                        <span className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded text-xs font-medium">{(p.category as string) || '—'}</span>
                      </td>
                      <td className="table-td">
                        <div className="flex items-center gap-1">
                          <Star size={13} className="text-amber-400 fill-amber-400" />
                          <span className="font-semibold text-surface-800">{(p.rating as number || 0).toFixed(1)}</span>
                          <span className="text-surface-400 text-xs">({p.reviewCount as number || 0})</span>
                        </div>
                      </td>
                      <td className="table-td text-surface-600">{p.completedJobs as number || 0}</td>
                      <td className="table-td">
                        {verStatus === 'VERIFIED'
                          ? <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full"><CheckCircle size={10} /> Verified</span>
                          : verStatus === 'REJECTED'
                          ? <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full"><XCircle size={10} /> Rejected</span>
                          : verStatus === 'PENDING'
                          ? <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full"><Clock size={10} /> Under Review</span>
                          : <span className="inline-flex items-center gap-1 bg-surface-100 text-surface-500 text-xs font-bold px-2 py-0.5 rounded-full"><Shield size={10} /> Unverified</span>
                        }
                      </td>
                      <td className="table-td">
                        {(() => {
                          const subscriptionActive = p.subscriptionActive as boolean;
                          const effectiveFeatured = p.effectiveFeatured as boolean;
                          const daysLeft = p.featuredDaysLeft as number | undefined;
                          if (subscriptionActive) {
                            return <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full"><Star size={9} className="fill-amber-500" /> Subscribed</span>;
                          }
                          if (effectiveFeatured) {
                            return (
                              <div className="flex flex-col gap-0.5">
                                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full"><Star size={9} className="fill-amber-400" /> Featured</span>
                                {daysLeft !== undefined && <span className="text-[10px] text-surface-400">{daysLeft}d left</span>}
                              </div>
                            );
                          }
                          return <span className="text-surface-300 text-xs">—</span>;
                        })()}
                      </td>
                      <td className="table-td">
                        {(p.subscriptionActive as boolean)
                          ? <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full"><CreditCard size={9} /> Active</span>
                          : <span className="text-surface-300 text-xs">—</span>}
                      </td>
                      <td className="table-td">
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/admin/providers/${p.id as string}`}
                            title="View full profile"
                            className="w-7 h-7 rounded-lg hover:bg-primary-50 flex items-center justify-center text-surface-400 hover:text-primary-600 transition-colors"
                          >
                            <Eye size={14} />
                          </Link>
                          {verStatus !== 'VERIFIED' && (
                            <button
                              onClick={() => handleVerify(p.id as string, providerName)}
                              title="Quick verify"
                              className="w-7 h-7 rounded-lg hover:bg-green-50 flex items-center justify-center text-surface-400 hover:text-green-600 transition-colors"
                            >
                              <Shield size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleFeature(p.id as string, p.featured as boolean)}
                            title={p.featured ? 'Unfeature' : 'Force Feature (reset 180d)'}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${p.effectiveFeatured ? 'text-amber-500 hover:bg-amber-50' : 'text-surface-400 hover:bg-amber-50 hover:text-amber-500'}`}
                          >
                            <Zap size={14} />
                          </button>
                          <button
                            onClick={() => handleSetSubscription(p.id as string, p.subscriptionActive as boolean)}
                            title={(p.subscriptionActive as boolean) ? 'Deactivate subscription' : 'Activate subscription'}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${p.subscriptionActive ? 'text-purple-600 hover:bg-purple-50' : 'text-surface-400 hover:bg-purple-50 hover:text-purple-600'}`}
                          >
                            <CreditCard size={14} />
                          </button>
                          <button
                            onClick={() => handleSuspend(p.id as string, providerName)}
                            title="Suspend"
                            className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-surface-400 hover:text-red-500 transition-colors"
                          >
                            <Ban size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-12 text-surface-400">No providers found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Review Modal ── */}
      {reviewTarget && (
        <ReviewModal
          provider={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onApprove={() => handleApprove(reviewTarget.id, reviewTarget.businessName)}
          onReject={reason => handleReject(reviewTarget.id, reviewTarget.businessName, reason)}
          acting={acting}
        />
      )}
    </div>
  );
};

export default AdminProvidersPage;
