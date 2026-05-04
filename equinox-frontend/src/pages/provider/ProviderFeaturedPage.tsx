import React, { useState } from 'react';
import {
  Star, Zap, CreditCard, Clock, TrendingUp, ShieldCheck,
  Award, CheckCircle, ArrowRight, Sparkles, Crown,
  BadgeCheck, BarChart3, Megaphone, Lock, RefreshCcw,
  XCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { providersService } from '../../services/providers.service';
import toast from 'react-hot-toast';

// ─── Plan config ───────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: 2999,
    period: 'month',
    priceLabel: '₹2,999',
    perLabel: '/month',
    savingsBadge: null,
    billedAs: 'Billed every month. Cancel anytime.',
  },
  {
    id: 'quarterly',
    label: 'Quarterly',
    price: 7999,
    period: 'quarter',
    priceLabel: '₹7,999',
    perLabel: '/quarter',
    savingsBadge: 'Save 11%',
    billedAs: 'Billed every 3 months. Equivalent to ₹2,666/mo.',
    popular: true,
  },
  {
    id: 'yearly',
    label: 'Yearly',
    price: 24999,
    period: 'year',
    priceLabel: '₹24,999',
    perLabel: '/year',
    savingsBadge: 'Save 30%',
    billedAs: 'Billed once annually. Equivalent to ₹2,083/mo.',
  },
];

const INCLUDED = [
  { icon: Crown,       text: 'Featured Partner badge on your public profile' },
  { icon: TrendingUp,  text: '#1 placement in all marketplace search results' },
  { icon: Megaphone,   text: 'Priority listing in admin-assigned task matching' },
  { icon: BarChart3,   text: 'Featured analytics — track impression & click uplift' },
  { icon: BadgeCheck,  text: 'Verified Featured status across buyer-facing pages' },
  { icon: Zap,         text: 'Never-expiring status while subscription is active' },
  { icon: ShieldCheck, text: '3× more proposal requests from marketplace buyers' },
  { icon: RefreshCcw,  text: 'Auto-renewal with email reminder 7 days before' },
];

const NOT_INCLUDED = [
  'Automatic listing removal on cancellation',
  'Guaranteed contract awards',
];

const FAQS = [
  {
    q: 'When does my Featured status activate?',
    a: 'Your Featured badge and top placement go live immediately after payment is confirmed — typically within a few minutes.',
  },
  {
    q: 'Can I cancel before the billing period ends?',
    a: 'Yes. You can cancel at any time from this page. Your Featured status remains active until the end of the paid period.',
  },
  {
    q: 'Will I lose my listing if I cancel?',
    a: 'No. You remain listed on the marketplace after cancellation, but you will no longer appear at the top or carry the Featured Partner badge.',
  },
  {
    q: 'Is my payment secure?',
    a: 'All payments are processed via Razorpay with 256-bit SSL encryption. We never store your card details.',
  },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

const FaqItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(o => !o)}
      className="w-full text-left bg-white border border-surface-200 rounded-2xl px-6 py-4 hover:border-primary-200 transition-colors"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="font-semibold text-surface-800 text-sm">{q}</p>
        {open ? <ChevronUp size={16} className="text-surface-400 shrink-0" /> : <ChevronDown size={16} className="text-surface-400 shrink-0" />}
      </div>
      {open && <p className="text-sm text-surface-500 mt-3 leading-relaxed">{a}</p>}
    </button>
  );
};

// ─── Main page ─────────────────────────────────────────────────────────────────

const ProviderFeaturedPage: React.FC = () => {
  const { data: featuredStatus, loading } = useApi(() => providersService.getMyFeaturedStatus(), []);
  const [selectedPlan, setSelectedPlan] = useState('quarterly');
  const [paying, setPaying] = useState(false);

  const handleSubscribe = async () => {
    setPaying(true);
    await new Promise(r => setTimeout(r, 1400));
    setPaying(false);
    toast.success('Redirecting to secure payment gateway…');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-surface-100 rounded-xl w-72 animate-pulse" />
        <div className="h-52 bg-surface-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-surface-100 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const isSubscribed   = featuredStatus?.subscriptionActive ?? false;
  const isFreeFeatured = (featuredStatus?.effectiveFeatured ?? false) && !isSubscribed;
  const isExpired      = (featuredStatus?.freePeriodExpired ?? false) && !isSubscribed;
  const daysLeft       = featuredStatus?.daysLeft ?? 180;
  const daysUsed       = 180 - daysLeft;
  const progressPct    = Math.min(100, Math.round((daysUsed / 180) * 100));
  const plan = PLANS.find(p => p.id === selectedPlan)!;

  return (
    <div className="space-y-10">

      {/* ── Page header ── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
            <Star size={16} className="text-amber-500 fill-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-surface-900">Featured Partner</h1>
        </div>
        <p className="text-surface-500 text-sm">
          Get top placement in the marketplace with the Featured Partner badge — permanently, while your subscription is active.
        </p>
      </div>

      {/* ── Current status card ── */}
      {isSubscribed && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-700 p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none" />
          <div className="relative flex items-start justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
                <CreditCard size={11} /> SUBSCRIPTION ACTIVE
              </span>
              <h2 className="text-3xl font-extrabold mb-2">You're a Featured Partner</h2>
              <p className="text-purple-200 text-sm max-w-md">
                You have permanent top placement and the Featured Partner badge. Your subscription renews automatically.
              </p>
              <div className="flex flex-wrap gap-3 mt-5">
                {['Top of Search', 'Featured Badge', 'Never Expires'].map(t => (
                  <div key={t} className="flex items-center gap-1.5 bg-white/10 rounded-xl px-4 py-2 text-sm font-medium">
                    <CheckCircle size={13} className="text-green-300" /> {t}
                  </div>
                ))}
              </div>
            </div>
            <div className="shrink-0 w-20 h-20 bg-white/15 rounded-2xl flex items-center justify-center">
              <Crown size={38} className="text-white" />
            </div>
          </div>
        </div>
      )}

      {isFreeFeatured && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none" />
          <div className="relative flex items-start justify-between gap-6">
            <div className="flex-1">
              <span className="inline-flex items-center gap-1.5 bg-white/25 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
                <Sparkles size={11} /> FREE PERIOD ACTIVE
              </span>
              <h2 className="text-3xl font-extrabold mb-2">You're Currently Featured!</h2>
              <p className="text-orange-100 text-sm mb-5">
                Your complimentary 6-month Featured window is active. Subscribe before it ends to avoid losing your top placement.
              </p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-orange-100">
                  <span>{daysUsed} days used</span>
                  <span>{daysLeft} days left</span>
                </div>
                <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: `${Math.max(2, progressPct)}%` }} />
                </div>
                <p className="text-xs text-orange-200">180-day free window</p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-6xl font-black leading-none">{daysLeft}</p>
              <p className="text-orange-200 text-sm font-medium mt-1">days left</p>
            </div>
          </div>
        </div>
      )}

      {isExpired && (
        <div className="rounded-3xl border-2 border-red-200 bg-red-50 p-7 flex items-start gap-5">
          <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center shrink-0">
            <Clock size={26} className="text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-red-800 mb-1">Free Period Expired</h2>
            <p className="text-red-700 text-sm">Your 6-month complimentary window has ended. Subscribe below to regain top placement and the Featured Partner badge.</p>
          </div>
        </div>
      )}

      {/* ── Subscription module (hide when already subscribed) ── */}
      {!isSubscribed && (
        <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">

          {/* LEFT — Plan selector + features */}
          <div className="space-y-6">

            {/* Plan toggle */}
            <div>
              <p className="text-sm font-bold text-surface-700 mb-3">Choose your billing cycle</p>
              <div className="grid grid-cols-3 gap-3">
                {PLANS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlan(p.id)}
                    className={`relative rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
                      selectedPlan === p.id
                        ? 'border-primary-500 bg-primary-50 shadow-md shadow-primary-100'
                        : 'border-surface-200 bg-white hover:border-primary-300'
                    }`}
                  >
                    {p.popular && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white text-[10px] font-black px-3 py-0.5 rounded-full whitespace-nowrap">
                        MOST POPULAR
                      </span>
                    )}
                    {p.savingsBadge && (
                      <span className="absolute top-3 right-3 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {p.savingsBadge}
                      </span>
                    )}
                    <p className="text-xs font-semibold text-surface-500 mb-1">{p.label}</p>
                    <p className="text-xl font-extrabold text-surface-900">{p.priceLabel}</p>
                    <p className="text-xs text-surface-400">{p.perLabel}</p>
                  </button>
                ))}
              </div>
              <p className="text-xs text-surface-400 mt-2 ml-1">{plan.billedAs}</p>
            </div>

            {/* What's included */}
            <div className="bg-white border border-surface-200 rounded-2xl p-6">
              <p className="text-sm font-bold text-surface-700 mb-4">What's included</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {INCLUDED.map(item => (
                  <div key={item.text} className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-primary-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <item.icon size={14} className="text-primary-600" />
                    </div>
                    <p className="text-sm text-surface-700 leading-snug">{item.text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-5 border-t border-surface-100">
                <p className="text-xs font-semibold text-surface-400 mb-3 uppercase tracking-wide">Not included</p>
                <div className="space-y-2">
                  {NOT_INCLUDED.map(t => (
                    <div key={t} className="flex items-center gap-2.5 text-surface-400 text-xs">
                      <XCircle size={13} className="text-surface-300 shrink-0" /> {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div>
              <p className="text-sm font-bold text-surface-700 mb-3">Frequently asked questions</p>
              <div className="space-y-2">
                {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
              </div>
            </div>
          </div>

          {/* RIGHT — Payment summary card */}
          <div className="sticky top-24 space-y-4">
            <div className="bg-white border-2 border-surface-200 rounded-3xl overflow-hidden shadow-lg">

              {/* Card header */}
              <div className="bg-gradient-to-br from-primary-600 to-secondary-700 p-6 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <Crown size={18} className="text-amber-300" />
                  <p className="font-bold text-base">Featured Partner</p>
                </div>
                <div className="flex items-end gap-1 mb-1">
                  <p className="text-4xl font-extrabold">{plan.priceLabel}</p>
                  <p className="text-primary-200 text-sm mb-1.5">{plan.perLabel}</p>
                </div>
                {plan.savingsBadge && (
                  <span className="inline-block bg-emerald-400/20 border border-emerald-300/30 text-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {plan.savingsBadge} vs monthly
                  </span>
                )}
                <p className="text-primary-200 text-xs mt-3">{plan.billedAs}</p>
              </div>

              {/* Summary */}
              <div className="p-6 space-y-4">
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-500">Plan</span>
                    <span className="font-semibold text-surface-800">Featured Partner ({plan.label})</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-500">Amount</span>
                    <span className="font-semibold text-surface-800">{plan.priceLabel}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-500">Tax (GST 18%)</span>
                    <span className="font-semibold text-surface-800">
                      ₹{Math.round(plan.price * 0.18).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="border-t border-surface-100 pt-2.5 flex justify-between">
                    <span className="font-bold text-surface-900">Total due today</span>
                    <span className="font-extrabold text-surface-900 text-lg">
                      ₹{Math.round(plan.price * 1.18).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleSubscribe}
                  disabled={paying}
                  className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 transition-all disabled:opacity-70 hover:opacity-90 shadow-lg shadow-primary-200"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                >
                  {paying
                    ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</>
                    : <><CreditCard size={17} /> Subscribe Now <ArrowRight size={15} /></>}
                </button>

                {/* Trust badges */}
                <div className="flex items-center justify-center gap-3 pt-1">
                  <div className="flex items-center gap-1 text-xs text-surface-400">
                    <Lock size={11} /> Secure checkout
                  </div>
                  <span className="text-surface-200">·</span>
                  <div className="flex items-center gap-1 text-xs text-surface-400">
                    <RefreshCcw size={11} /> Cancel anytime
                  </div>
                  <span className="text-surface-200">·</span>
                  <div className="flex items-center gap-1 text-xs text-surface-400">
                    <ShieldCheck size={11} /> GST invoice
                  </div>
                </div>

                {/* Payment methods */}
                <div className="border-t border-surface-100 pt-4">
                  <p className="text-xs text-surface-400 text-center mb-3">Accepted payment methods</p>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {['UPI', 'Visa', 'MC', 'NetBanking', 'Wallet'].map(m => (
                      <span key={m} className="bg-surface-50 border border-surface-200 text-surface-500 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                        {m}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-center text-surface-400 mt-3">
                    Powered by <span className="font-bold text-surface-600">Razorpay</span> · 256-bit SSL secured
                  </p>
                </div>
              </div>
            </div>

            {/* Money-back note */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex gap-3">
              <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">7-Day Refund Guarantee</p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Not satisfied in your first 7 days? Contact support for a full refund — no questions asked.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Subscribed: manage section ── */}
      {isSubscribed && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white border border-surface-200 rounded-2xl p-5 flex gap-4">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
              <CreditCard size={18} className="text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-surface-800 text-sm">Billing & Invoices</p>
              <p className="text-xs text-surface-500 mt-0.5">Download GST invoices or update your payment method.</p>
              <button className="text-xs text-primary-600 font-semibold mt-2 hover:underline flex items-center gap-1">
                Manage billing <ArrowRight size={11} />
              </button>
            </div>
          </div>
          <div className="bg-white border border-surface-200 rounded-2xl p-5 flex gap-4">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
              <XCircle size={18} className="text-red-500" />
            </div>
            <div>
              <p className="font-semibold text-surface-800 text-sm">Cancel Subscription</p>
              <p className="text-xs text-surface-500 mt-0.5">Your Featured status stays active until end of billing period.</p>
              <button className="text-xs text-red-500 font-semibold mt-2 hover:underline flex items-center gap-1">
                Cancel plan <ArrowRight size={11} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderFeaturedPage;
