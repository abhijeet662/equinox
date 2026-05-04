import React, { useState } from 'react';
import {
  Star, Trash2, Check, X, Flag, AlertTriangle, Clock,
  Eye, ChevronDown, ChevronUp, Edit3,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { reviewsService } from '../../services/reviews.service';
import type { Review, ReviewStatus } from '../../services/reviews.service';
import toast from 'react-hot-toast';

type Tab = 'queue' | 'all';
type AllFilter = 'All' | 'PUBLISHED' | 'PENDING_MODERATION' | 'FLAGGED' | 'REJECTED';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const StarDisplay: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(s => (
      <Star key={s} size={12} className={s <= rating ? 'text-amber-400 fill-amber-400' : 'text-surface-200'} />
    ))}
    <span className="ml-1 text-sm font-semibold text-surface-700">{rating}</span>
  </div>
);

const StatusBadge: React.FC<{ status: ReviewStatus }> = ({ status }) => {
  const map: Record<ReviewStatus, { label: string; cls: string }> = {
    PENDING_MODERATION: { label: 'Pending',   cls: 'bg-amber-100 text-amber-700' },
    PUBLISHED:          { label: 'Published', cls: 'bg-emerald-100 text-emerald-700' },
    REJECTED:           { label: 'Rejected',  cls: 'bg-red-100 text-red-700' },
    FLAGGED:            { label: 'Flagged',   cls: 'bg-purple-100 text-purple-700' },
  };
  const { label, cls } = map[status] ?? map['PENDING_MODERATION'];
  return (
    <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  );
};

// ─── Flag / Edit Modal ────────────────────────────────────────────────────────

const FlagModal: React.FC<{
  review: Review;
  onClose: () => void;
  onSave: (editedComment: string, note: string) => void;
  saving: boolean;
}> = ({ review, onClose, onSave, saving }) => {
  const [comment, setComment] = useState(review.comment || '');
  const [note, setNote]       = useState(review.moderatorNote || '');

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0f172a]/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-purple-500 to-violet-600" />
        <div className="p-7 space-y-5">
          <div>
            <h2 className="font-bold text-surface-900 text-lg">Edit & Flag Review</h2>
            <p className="text-sm text-surface-500 mt-0.5">
              Mask profanity or sensitive data before publishing. The edited version will be shown publicly.
            </p>
          </div>

          <div className="bg-surface-50 rounded-xl p-4 text-sm text-surface-600 border border-surface-200">
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-1">Original Comment</p>
            <p className="italic">{review.comment || <span className="text-surface-400">No comment</span>}</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-surface-700 block mb-1.5">
              Edited Comment <span className="font-normal text-surface-400">(will replace original)</span>
            </label>
            <textarea
              rows={4}
              className="input-field text-sm w-full resize-none"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Clean up the comment here…"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-surface-700 block mb-1.5">Internal Note</label>
            <input
              type="text"
              className="input-field text-sm w-full"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Why was this flagged?"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border-2 border-surface-200 text-sm font-semibold text-surface-600 hover:bg-surface-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(comment, note)}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving…</>
                : <><Flag size={14} /> Save & Flag</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Review Row ───────────────────────────────────────────────────────────────

const ReviewRow: React.FC<{
  review: Review;
  onApprove: () => void;
  onReject: () => void;
  onFlag: () => void;
  onDelete: () => void;
  acting: boolean;
}> = ({ review, onApprove, onReject, onFlag, onDelete, acting }) => {
  const [expanded, setExpanded] = useState(false);
  const providerName = review.provider?.businessName ?? '—';
  const buyerName    = review.buyer?.name ?? '—';

  return (
    <tr className="hover:bg-surface-50 transition-colors">
      {/* Reviewer */}
      <td className="table-td">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {buyerName[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-surface-800 leading-tight">{buyerName}</p>
            <p className="text-xs text-surface-400">{review.buyer?.email ?? ''}</p>
          </div>
        </div>
      </td>

      {/* Target provider */}
      <td className="table-td">
        <span className="text-sm font-medium text-surface-700">{providerName}</span>
        <p className="text-xs text-surface-400">{review.provider?.category ?? ''}</p>
      </td>

      {/* Rating */}
      <td className="table-td"><StarDisplay rating={review.rating} /></td>

      {/* Comment */}
      <td className="table-td max-w-xs">
        {review.comment ? (
          <div>
            <p className={`text-xs text-surface-600 leading-relaxed ${!expanded ? 'line-clamp-2' : ''}`}>
              {review.comment}
            </p>
            {review.comment.length > 100 && (
              <button
                onClick={() => setExpanded(e => !e)}
                className="text-xs text-primary-600 mt-0.5 flex items-center gap-0.5"
              >
                {expanded ? <><ChevronUp size={11} /> less</> : <><ChevronDown size={11} /> more</>}
              </button>
            )}
          </div>
        ) : (
          <span className="text-xs text-surface-400 italic">No comment</span>
        )}
        {review.moderatorNote && (
          <p className="text-xs text-purple-600 mt-1 font-medium flex items-center gap-1">
            <Flag size={10} /> {review.moderatorNote}
          </p>
        )}
      </td>

      {/* Status */}
      <td className="table-td"><StatusBadge status={review.status} /></td>

      {/* Date */}
      <td className="table-td text-xs text-surface-400 whitespace-nowrap">
        {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
      </td>

      {/* Actions */}
      <td className="table-td">
        <div className="flex items-center gap-1">
          {review.status !== 'PUBLISHED' && (
            <button
              onClick={onApprove}
              disabled={acting}
              title="Approve & publish"
              className="w-7 h-7 rounded-lg hover:bg-emerald-50 flex items-center justify-center text-surface-400 hover:text-emerald-600 transition-colors disabled:opacity-40"
            >
              <Check size={14} />
            </button>
          )}
          <button
            onClick={onFlag}
            disabled={acting}
            title="Edit & flag"
            className="w-7 h-7 rounded-lg hover:bg-purple-50 flex items-center justify-center text-surface-400 hover:text-purple-600 transition-colors disabled:opacity-40"
          >
            <Edit3 size={13} />
          </button>
          {review.status !== 'REJECTED' && (
            <button
              onClick={onReject}
              disabled={acting}
              title="Reject"
              className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-surface-400 hover:text-red-500 transition-colors disabled:opacity-40"
            >
              <X size={14} />
            </button>
          )}
          <button
            onClick={onDelete}
            disabled={acting}
            title="Delete permanently"
            className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-surface-400 hover:text-red-500 transition-colors disabled:opacity-40"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const AdminReviewsPage: React.FC = () => {
  const [activeTab, setActiveTab]   = useState<Tab>('queue');
  const [allFilter, setAllFilter]   = useState<AllFilter>('All');
  const [acting, setActing]         = useState(false);
  const [flagTarget, setFlagTarget] = useState<Review | null>(null);

  const { data: queueRes,  refetch: refetchQueue } = useApi(() => reviewsService.getModerationQueue({ limit: 100 }), []);
  const { data: allRes,    refetch: refetchAll   } = useApi(() => reviewsService.listAll({ limit: 200 }), []);

  const queue: Review[] = (queueRes?.data ?? []) as Review[];
  const allReviews: Review[] = (allRes?.data ?? []) as Review[];

  const refetchBoth = () => { refetchQueue(); refetchAll(); };

  const filteredAll = allFilter === 'All'
    ? allReviews
    : allReviews.filter(r => r.status === allFilter);

  // Stats
  const pendingCount   = allReviews.filter(r => r.status === 'PENDING_MODERATION').length;
  const publishedCount = allReviews.filter(r => r.status === 'PUBLISHED').length;
  const flaggedCount   = allReviews.filter(r => r.status === 'FLAGGED').length;
  const rejectedCount  = allReviews.filter(r => r.status === 'REJECTED').length;

  // ── Action handlers ──────────────────────────────────────────────────────

  const handleApprove = async (id: string) => {
    setActing(true);
    try {
      await reviewsService.approve(id);
      toast.success('Review approved and published');
      refetchBoth();
    } catch { toast.error('Failed to approve review'); }
    finally { setActing(false); }
  };

  const handleReject = async (id: string) => {
    setActing(true);
    try {
      await reviewsService.reject(id);
      toast.success('Review rejected');
      refetchBoth();
    } catch { toast.error('Failed to reject review'); }
    finally { setActing(false); }
  };

  const handleFlagSave = async (editedComment: string, note: string) => {
    if (!flagTarget) return;
    setActing(true);
    try {
      await reviewsService.flag(flagTarget.id, { editedComment, moderatorNote: note });
      toast.success('Review flagged and saved');
      setFlagTarget(null);
      refetchBoth();
    } catch { toast.error('Failed to flag review'); }
    finally { setActing(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this review?')) return;
    setActing(true);
    try {
      await reviewsService.remove(id);
      toast.success('Review deleted');
      refetchBoth();
    } catch { toast.error('Failed to delete review'); }
    finally { setActing(false); }
  };

  // ── Table ────────────────────────────────────────────────────────────────

  const renderTable = (rows: Review[]) => (
    <div className="card overflow-hidden p-0">
      <table className="w-full">
        <thead className="bg-surface-50 border-b border-surface-200">
          <tr>
            <th className="table-th">Reviewer</th>
            <th className="table-th">Provider</th>
            <th className="table-th">Rating</th>
            <th className="table-th">Comment</th>
            <th className="table-th">Status</th>
            <th className="table-th">Date</th>
            <th className="table-th">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-100">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-14 text-surface-400">
                <div className="flex flex-col items-center gap-2">
                  <Eye size={28} className="text-surface-300" />
                  <p className="text-sm">No reviews here</p>
                </div>
              </td>
            </tr>
          ) : rows.map(r => (
            <ReviewRow
              key={r.id}
              review={r}
              acting={acting}
              onApprove={() => handleApprove(r.id)}
              onReject={() => handleReject(r.id)}
              onFlag={() => setFlagTarget(r)}
              onDelete={() => handleDelete(r.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Review Moderation</h1>
        <p className="text-surface-500 text-sm mt-0.5">
          Approve, edit, or reject reviews before they appear publicly. Only published reviews affect provider ratings.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          className={`card text-center cursor-pointer hover:shadow-md transition-all ${activeTab === 'queue' ? 'ring-2 ring-amber-400' : ''}`}
          onClick={() => setActiveTab('queue')}
        >
          <div className="flex items-center justify-center gap-2 mb-0.5">
            <p className="text-2xl font-bold text-amber-600">{pendingCount + flaggedCount}</p>
            {(pendingCount + flaggedCount) > 0 && <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />}
          </div>
          <p className="text-xs text-surface-500">Needs Action</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-emerald-600">{publishedCount}</p>
          <p className="text-xs text-surface-500">Published</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-purple-600">{flaggedCount}</p>
          <p className="text-xs text-surface-500">Flagged</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-red-500">{rejectedCount}</p>
          <p className="text-xs text-surface-500">Rejected</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'queue' ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'
          }`}
        >
          <Clock size={14} />
          Moderation Queue
          {(pendingCount + flaggedCount) > 0 && (
            <span className="bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {pendingCount + flaggedCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'all' ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'
          }`}
        >
          All Reviews
          <span className="text-xs text-surface-400">({allReviews.length})</span>
        </button>
      </div>

      {/* ═══ Moderation Queue ═══ */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {queue.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center">
                <Check size={28} className="text-emerald-600" />
              </div>
              <p className="font-semibold text-surface-800">Queue Clear!</p>
              <p className="text-sm text-surface-500">No reviews pending moderation.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-surface-500">
                <span className="font-semibold text-amber-700">{queue.length}</span> review{queue.length !== 1 ? 's' : ''} awaiting moderation.
              </p>
              {renderTable(queue)}
            </div>
          )}
        </div>
      )}

      {/* ═══ All Reviews ═══ */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          {/* Filter pills */}
          <div className="flex gap-2 flex-wrap">
            {(['All', 'PUBLISHED', 'PENDING_MODERATION', 'FLAGGED', 'REJECTED'] as AllFilter[]).map(f => {
              const labels: Record<AllFilter, string> = {
                All: 'All', PUBLISHED: 'Published', PENDING_MODERATION: 'Pending',
                FLAGGED: 'Flagged', REJECTED: 'Rejected',
              };
              return (
                <button
                  key={f}
                  onClick={() => setAllFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    allFilter === f ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                  }`}
                >
                  {labels[f]}
                  <span className="ml-1.5 opacity-70">
                    ({f === 'All' ? allReviews.length : allReviews.filter(r => r.status === f).length})
                  </span>
                </button>
              );
            })}
          </div>
          {renderTable(filteredAll)}
        </div>
      )}

      {/* Flag modal */}
      {flagTarget && (
        <FlagModal
          review={flagTarget}
          onClose={() => setFlagTarget(null)}
          onSave={handleFlagSave}
          saving={acting}
        />
      )}
    </div>
  );
};

export default AdminReviewsPage;
