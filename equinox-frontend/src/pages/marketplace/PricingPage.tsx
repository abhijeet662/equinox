import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, X, ArrowRight, Zap, Building2, Rocket } from 'lucide-react';

type Billing = 'monthly' | 'annual';

interface Plan {
  name: string;
  icon: React.ReactNode;
  badge?: string;
  monthlyPrice: string | null;
  annualPrice: string | null;
  priceNote: string;
  description: string;
  cta: string;
  ctaLink: string;
  highlight: boolean;
  features: string[];
  notIncluded?: string[];
}

const PLANS: Plan[] = [
  {
    name: 'Starter',
    icon: <Rocket size={20} />,
    monthlyPrice: 'Free',
    annualPrice: 'Free',
    priceNote: 'No credit card required',
    description: 'Perfect for brands just getting started on marketplaces.',
    cta: 'Get Started Free',
    ctaLink: '/get-started',
    highlight: false,
    features: [
      'Browse & view all providers',
      'Up to 2 active contracts',
      'Basic SLA tracking (P2/P3 only)',
      'Email support',
      'Standard contract templates',
      'Invoice history (3 months)',
    ],
    notIncluded: [
      'P0/P1 priority SLA',
      'AI insights dashboard',
      'Dedicated account manager',
    ],
  },
  {
    name: 'Growth',
    icon: <Zap size={20} />,
    badge: 'Most Popular',
    monthlyPrice: '₹2,999',
    annualPrice: '₹1,999',
    priceNote: 'per month',
    description: 'For scaling brands running multiple service relationships.',
    cta: 'Start Growth Plan',
    ctaLink: '/get-started',
    highlight: true,
    features: [
      'Unlimited active contracts',
      'Full SLA tracking (P0–P3)',
      'Real-time task status board',
      'Wallet & escrow payments',
      'Complaint management portal',
      'AI performance insights',
      'Provider reviews & ratings',
      'Priority email & chat support',
      '12-month invoice history',
    ],
  },
  {
    name: 'Enterprise',
    icon: <Building2 size={20} />,
    monthlyPrice: null,
    annualPrice: null,
    priceNote: 'Custom pricing',
    description: 'Tailored for large brands with complex multi-vendor operations.',
    cta: 'Talk to Sales',
    ctaLink: '/contact',
    highlight: false,
    features: [
      'Everything in Growth',
      'Dedicated account manager',
      'Custom SLA configurations',
      'White-label contract templates',
      'Multi-brand / multi-team access',
      'API & ERP integrations',
      'Custom reporting & BI exports',
      'SSO / SAML authentication',
      '24/7 phone support',
      'On-site onboarding',
    ],
  },
];

const FAQ = [
  {
    q: 'Can I switch plans at any time?',
    a: 'Yes. You can upgrade or downgrade at any time. Upgrades take effect immediately; downgrades apply at the next billing cycle.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit/debit cards, UPI, and NEFT bank transfers for annual enterprise plans.',
  },
  {
    q: 'Is the Starter plan really free forever?',
    a: 'Yes — the Starter plan has no time limit. You only pay when you need advanced SLA tiers or more than 2 concurrent contracts.',
  },
  {
    q: 'How does the escrow wallet work?',
    a: 'Funds are held in Equinox Wallet until you mark a deliverable complete. Providers receive payment only after you approve. Available on Growth and above.',
  },
  {
    q: 'Do providers pay separately?',
    a: 'Providers have their own listing and payout plan — separate from brand subscriptions. Brands pay the plan fee; providers pay a small success commission.',
  },
];

const PricingPage: React.FC = () => {
  const [billing, setBilling] = useState<Billing>('annual');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] pt-28 pb-20 px-4 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold text-violet-300 mb-6">
          Simple, Transparent Pricing
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
          Pay for what you use.<br />
          <span className="bg-gradient-to-r from-violet-400 to-sky-400 bg-clip-text text-transparent">
            Not a pixel more.
          </span>
        </h1>
        <p className="text-surface-400 text-sm max-w-lg mx-auto mb-8">
          All plans include our core SLA-tracking engine. Upgrade for higher priority response tiers and advanced features.
        </p>
        {/* Billing toggle */}
        <div className="inline-flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/20">
          {(['monthly', 'annual'] as Billing[]).map((b) => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                billing === b ? 'bg-white text-surface-900 shadow' : 'text-surface-400 hover:text-white'
              }`}
            >
              {b === 'monthly' ? 'Monthly' : 'Annual'}
              {b === 'annual' && <span className="ml-2 text-xs text-emerald-400 font-bold">−33%</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ── Plans ── */}
      <div className="max-w-6xl mx-auto px-4 -mt-8 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-3xl overflow-hidden border-2 flex flex-col ${
                plan.highlight
                  ? 'border-primary-500 shadow-xl shadow-primary-100'
                  : 'border-surface-200 shadow-sm'
              }`}
            >
              {plan.highlight ? (
                <div className="h-1.5 w-full bg-gradient-to-r from-primary-500 via-secondary-500 to-violet-500" />
              ) : (
                <div className="h-1.5 w-full bg-surface-100" />
              )}
              <div className={`p-7 flex flex-col flex-1 ${plan.highlight ? 'bg-white' : 'bg-white'}`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    plan.highlight ? 'bg-primary-100 text-primary-600' : 'bg-surface-100 text-surface-600'
                  }`}>
                    {plan.icon}
                  </div>
                  {plan.badge && (
                    <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2.5 py-1 rounded-full">
                      {plan.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-surface-900 mt-3">{plan.name}</h3>
                <p className="text-xs text-surface-500 mt-1 mb-4 leading-relaxed">{plan.description}</p>

                {/* Price */}
                <div className="mb-6">
                  {plan.monthlyPrice === null ? (
                    <div>
                      <p className="text-3xl font-extrabold text-surface-900">Custom</p>
                      <p className="text-xs text-surface-400 mt-1">{plan.priceNote}</p>
                    </div>
                  ) : plan.monthlyPrice === 'Free' ? (
                    <div>
                      <p className="text-3xl font-extrabold text-surface-900">Free</p>
                      <p className="text-xs text-surface-400 mt-1">{plan.priceNote}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-3xl font-extrabold text-surface-900">
                        {billing === 'annual' ? plan.annualPrice : plan.monthlyPrice}
                      </p>
                      <p className="text-xs text-surface-400 mt-1">{plan.priceNote}{billing === 'annual' ? ', billed annually' : ''}</p>
                    </div>
                  )}
                </div>

                {/* CTA */}
                <Link
                  to={plan.ctaLink}
                  className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl text-sm transition-all mb-6 ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:opacity-90 shadow-md'
                      : 'border-2 border-surface-200 text-surface-700 hover:border-surface-300 hover:bg-surface-50'
                  }`}
                >
                  {plan.cta} <ArrowRight size={13} />
                </Link>

                {/* Features */}
                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-surface-700">
                      <CheckCircle2 size={13} className={`flex-shrink-0 mt-0.5 ${plan.highlight ? 'text-primary-500' : 'text-emerald-500'}`} />
                      {f}
                    </li>
                  ))}
                  {plan.notIncluded?.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-surface-400">
                      <X size={13} className="flex-shrink-0 mt-0.5 text-surface-300" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="bg-surface-50 border-t border-surface-100 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-extrabold text-surface-900 text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold text-surface-800">{item.q}</span>
                  <span className={`text-surface-400 transition-transform text-lg font-light ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-xs text-surface-600 leading-relaxed border-t border-surface-100 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom CTA ── */}
      <div className="py-12 px-4 text-center border-t border-surface-100">
        <p className="text-surface-600 text-sm mb-4">
          Not sure which plan is right for you?
        </p>
        <Link
          to="/contact"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-bold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity"
        >
          Talk to our team <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
};

export default PricingPage;
