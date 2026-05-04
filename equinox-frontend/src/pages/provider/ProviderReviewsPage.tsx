import React from 'react';
import { Star, MessageSquare, Clock, TrendingUp } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { providersService } from '../../services/providers.service';
import { reviewsService } from '../../services/reviews.service';
import Avatar from '../../components/ui/Avatar';
import { formatDate } from '../../utils/helpers';

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  buyer?: { name: string; avatar?: string };
}

interface ProviderProfile {
  id: string;
  rating: number;
  reviewCount: number;
  verified?: boolean;
}

const renderStars = (rating: number) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={14}
          className={i <= rating ? 'text-amber-400 fill-amber-400' : 'text-surface-200 fill-surface-200'}
        />
      ))}
    </div>
  );
};

const ProviderReviewsPage: React.FC = () => {
  const { data: profile, loading: loadingProfile } = useApi<ProviderProfile>(
    () => providersService.getMyProfile(),
    []
  );

  const { data: reviewsData, loading: loadingReviews } = useApi<{ data: Review[] }>(
    () => (profile?.id ? reviewsService.listForProvider(profile.id) : Promise.resolve({ data: [] })),
    [profile?.id]
  );

  const reviews: Review[] = reviewsData?.data || (Array.isArray(reviewsData) ? reviewsData as Review[] : []);

  const loading = loadingProfile || loadingReviews;

  const overallRating = profile?.rating || 0;
  const totalReviews = profile?.reviewCount || reviews.length;

  // 5-star count
  const fiveStarCount = reviews.filter(r => r.rating === 5).length;

  // Recent (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentCount = reviews.filter(r => new Date(r.createdAt) >= thirtyDaysAgo).length;

  // Rating breakdown
  const ratingBreakdown = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length > 0 ? Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100) : 0,
  }));

  const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">My Reviews & Ratings</h1>
        <p className="text-surface-500 text-sm mt-1">See what your clients are saying about your services</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Star size={20} className="text-amber-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-surface-900">{overallRating.toFixed(1)}</p>
            <p className="text-xs text-surface-500">Overall Rating</p>
          </div>
        </div>
        {[
          { title: 'Total Reviews', value: totalReviews, icon: <MessageSquare size={20} className="text-primary-600" />, bg: 'bg-primary-50' },
          { title: '5-Star Reviews', value: fiveStarCount, icon: <TrendingUp size={20} className="text-emerald-600" />, bg: 'bg-emerald-50' },
          { title: 'Last 30 Days', value: recentCount, icon: <Clock size={20} className="text-purple-600" />, bg: 'bg-purple-50' },
        ].map(s => (
          <div key={s.title} className="card flex items-center gap-4">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>{s.icon}</div>
            <div>
              <p className="text-xl font-bold text-surface-900">{s.value}</p>
              <p className="text-xs text-surface-500">{s.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Rating breakdown */}
        <div className="card">
          <h2 className="font-bold text-surface-800 mb-4">Rating Breakdown</h2>
          <div className="flex flex-col items-center mb-6">
            <p className="text-5xl font-bold text-surface-900">{overallRating.toFixed(1)}</p>
            <div className="flex items-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Star
                  key={i}
                  size={20}
                  className={i <= Math.round(overallRating) ? 'text-amber-400 fill-amber-400' : 'text-surface-200 fill-surface-200'}
                />
              ))}
            </div>
            <p className="text-sm text-surface-400 mt-1">{totalReviews} reviews</p>
          </div>
          <div className="space-y-3">
            {ratingBreakdown.map(({ star, count, pct }) => (
              <div key={star} className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1 w-16 flex-shrink-0">
                  <span className="text-surface-600">{star}</span>
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                </div>
                <div className="flex-1 h-2 bg-surface-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-surface-500 w-10 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews list */}
        <div className="lg:col-span-2 card">
          <h2 className="font-bold text-surface-800 mb-4">All Reviews</h2>
          {loading ? (
            <p className="text-surface-400 text-sm text-center py-8">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mb-4">
                <Star size={28} className="text-surface-300" />
              </div>
              <p className="font-semibold text-surface-700">No reviews yet</p>
              <p className="text-sm text-surface-400 mt-1">Your client reviews will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review.id} className="border border-surface-100 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        initials={getInitials(review.buyer?.name || 'U')}
                        src={review.buyer?.avatar}
                        size="sm"
                      />
                      <div>
                        <p className="font-semibold text-surface-900 text-sm">{review.buyer?.name || 'Anonymous'}</p>
                        <p className="text-xs text-surface-400">{formatDate(review.createdAt)}</p>
                      </div>
                    </div>
                    {renderStars(review.rating)}
                  </div>
                  <p className="text-sm text-surface-600 leading-relaxed">
                    {review.comment || <span className="italic text-surface-400">No comment</span>}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderReviewsPage;
