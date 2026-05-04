import React, { useState } from 'react';
import { Star, MessageSquare, Users, ThumbsUp } from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { useApi } from '../../hooks/useApi';
import { contractsService } from '../../services/contracts.service';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReviewForm {
  rating: number;
  title: string;
  comment: string;
}

interface SubmittedReview {
  providerId: string;
  rating: number;
  title: string;
  comment: string;
}

// ─── Star renderer ────────────────────────────────────────────────────────────

interface StarRowProps {
  value: number;               // current selected/display value
  hover?: number;              // hovered star index (0 = none)
  onHover?: (n: number) => void;
  onSelect?: (n: number) => void;
  size?: number;
  interactive?: boolean;
}

const StarRow: React.FC<StarRowProps> = ({
  value,
  hover = 0,
  onHover,
  onSelect,
  size = 18,
  interactive = false,
}) => {
  const active = hover > 0 ? hover : value;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={`transition-colors ${
            n <= active ? 'text-amber-400 fill-amber-400' : 'text-surface-200 fill-surface-200'
          } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          onMouseEnter={() => interactive && onHover?.(n)}
          onMouseLeave={() => interactive && onHover?.(0)}
          onClick={() => interactive && onSelect?.(n)}
        />
      ))}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const BuyerReviewsPage: React.FC = () => {
  const { data: contractsRes, loading } = useApi(() => contractsService.list({ limit: 50 }), []);
  const contracts: Record<string, unknown>[] = contractsRes?.data || [];

  // Per-provider hover state for the row stars
  const [rowHover, setRowHover] = useState<Record<string, number>>({});
  const [rowRating, setRowRating] = useState<Record<string, number>>({});

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [activeContract, setActiveContract] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<ReviewForm>({ rating: 0, title: '', comment: '' });
  const [modalHover, setModalHover] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Locally track submitted reviews so stats update immediately
  const [submittedReviews, setSubmittedReviews] = useState<SubmittedReview[]>([]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const reviewsGiven = submittedReviews.length;
  const avgRating =
    reviewsGiven === 0
      ? 0
      : Math.round((submittedReviews.reduce((s, r) => s + r.rating, 0) / reviewsGiven) * 10) / 10;
  const providersWorkedWith = contracts.length;

  // ── Unique providers (one row per contract) ────────────────────────────────
  const openModal = (contract: Record<string, unknown>) => {
    setActiveContract(contract);
    const providerId = (contract.provider as Record<string, string>)?.id || (contract.id as string);
    setForm({ rating: rowRating[providerId] || 0, title: '', comment: '' });
    setSubmitted(false);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.rating === 0) {
      toast.error('Please select a star rating.');
      return;
    }
    setSubmitting(true);
    try {
      // No dedicated reviews endpoint yet — simulate a successful submission
      await new Promise((res) => setTimeout(res, 800));
      const provider = activeContract?.provider as Record<string, string> | null;
      const providerId = provider?.id || (activeContract?.id as string) || '';
      setSubmittedReviews((prev) => [
        ...prev.filter((r) => r.providerId !== providerId),
        { providerId, rating: form.rating, title: form.title, comment: form.comment },
      ]);
      setSubmitted(true);
      toast.success('Review submitted successfully!');
    } catch {
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setActiveContract(null);
    setModalHover(0);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Service Reviews</h1>
        <p className="text-surface-500 text-sm mt-0.5">Rate your experience with providers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Reviews Given"
          value={reviewsGiven}
          icon={<MessageSquare size={20} className="text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="Average Rating"
          value={avgRating === 0 ? '0' : avgRating.toFixed(1)}
          suffix={avgRating > 0 ? '/ 5' : ''}
          icon={<Star size={20} className="text-amber-500" />}
          iconBg="bg-amber-50"
        />
        <StatCard
          title="Providers Worked With"
          value={providersWorkedWith}
          icon={<Users size={20} className="text-primary-600" />}
          iconBg="bg-primary-50"
        />
      </div>

      {/* Provider list */}
      <div className="card">
        <h2 className="font-bold text-surface-800 mb-4">Your Providers</h2>

        {loading ? (
          <div className="text-center py-12 text-surface-400 text-sm">Loading providers...</div>
        ) : contracts.length === 0 ? (
          <EmptyState
            title="No contracts yet"
            message="No contracts yet — browse providers to get started"
            icon={<ThumbsUp size={24} />}
          />
        ) : (
          <div className="divide-y divide-surface-100">
            {contracts.map((contract) => {
              const provider = contract.provider as Record<string, string> | null;
              const providerId = provider?.id || (contract.id as string);
              const providerName = provider?.name || provider?.businessName || 'Unknown Provider';
              const initial = providerName[0].toUpperCase();
              const contractTitle = (contract.title as string) || '—';
              const serviceType = (contract.type as string || '').toLowerCase() || '—';
              const existingReview = submittedReviews.find((r) => r.providerId === providerId);
              const currentHover = rowHover[providerId] || 0;
              const currentRating = rowRating[providerId] || 0;

              return (
                <div
                  key={contract.id as string}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 py-4 first:pt-0 last:pb-0"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {initial}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-surface-800 truncate">{providerName}</p>
                    <p className="text-sm text-surface-500 truncate">{contractTitle}</p>
                    <p className="text-xs text-surface-400 capitalize mt-0.5">{serviceType}</p>
                  </div>

                  {/* Star rating selector */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StarRow
                      value={currentRating}
                      hover={currentHover}
                      onHover={(n) => setRowHover((prev) => ({ ...prev, [providerId]: n }))}
                      onSelect={(n) => setRowRating((prev) => ({ ...prev, [providerId]: n }))}
                      interactive
                      size={20}
                    />
                    {existingReview && (
                      <span className="text-xs text-emerald-600 font-medium ml-1">Reviewed</span>
                    )}
                  </div>

                  {/* Submit button */}
                  <button
                    onClick={() => openModal(contract)}
                    className="btn-primary text-xs px-4 py-2 flex-shrink-0"
                  >
                    Submit Review
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title="Submit a Review"
        size="md"
      >
        {submitted ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ThumbsUp size={28} className="text-emerald-600" />
            </div>
            <h3 className="font-bold text-surface-900 text-lg mb-2">Review Submitted!</h3>
            <p className="text-surface-500 text-sm mb-1">
              Thank you for rating{' '}
              <span className="font-medium text-surface-700">
                {((activeContract?.provider as Record<string, string>)?.name) ||
                  ((activeContract?.provider as Record<string, string>)?.businessName) ||
                  'this provider'}
              </span>
              .
            </p>
            <div className="flex justify-center mt-2 mb-5">
              <StarRow value={form.rating} size={22} />
            </div>
            <button onClick={closeModal} className="btn-primary text-sm px-8">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Provider context */}
            {activeContract && (
              <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl border border-surface-200">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {(
                    ((activeContract.provider as Record<string, string>)?.name ||
                      (activeContract.provider as Record<string, string>)?.businessName ||
                      'P')[0]
                  ).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-surface-800 truncate">
                    {(activeContract.provider as Record<string, string>)?.name ||
                      (activeContract.provider as Record<string, string>)?.businessName ||
                      'Provider'}
                  </p>
                  <p className="text-xs text-surface-500 truncate">
                    {(activeContract.title as string) || ''}
                  </p>
                </div>
              </div>
            )}

            {/* Star rating */}
            <div>
              <label className="text-xs font-medium text-surface-600 mb-2 block">
                Rating <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center gap-2">
                <StarRow
                  value={form.rating}
                  hover={modalHover}
                  onHover={setModalHover}
                  onSelect={(n) => setForm((f) => ({ ...f, rating: n }))}
                  interactive
                  size={28}
                />
                {form.rating > 0 && (
                  <span className="text-sm font-semibold text-amber-500 ml-1">
                    {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][form.rating]}
                  </span>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">
                Review Title
              </label>
              <input
                className="input-field text-sm"
                placeholder="Summarise your experience"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                maxLength={100}
              />
            </div>

            {/* Comment */}
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">
                Comment
              </label>
              <textarea
                rows={4}
                className="input-field text-sm resize-none"
                placeholder="Share details about your experience with this provider..."
                value={form.comment}
                onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                maxLength={1000}
              />
              <p className="text-right text-xs text-surface-400 mt-1">
                {form.comment.length}/1000
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={closeModal}
                className="btn-secondary flex-1 justify-center text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || form.rating === 0}
                className="btn-primary flex-1 justify-center text-sm disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default BuyerReviewsPage;
