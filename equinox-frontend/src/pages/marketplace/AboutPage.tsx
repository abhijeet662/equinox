import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Zap, Globe, Users, TrendingUp, ArrowRight,
  CheckCircle2, Award, Target, Heart,
} from 'lucide-react';

const MISSION_PILLARS = [
  {
    icon: <ShieldCheck size={22} />,
    title: 'SLA-First Accountability',
    desc: 'Every engagement on Equinox is backed by contractual SLA timers. No more missed deadlines with zero consequences.',
    color: 'bg-violet-100 text-violet-600',
  },
  {
    icon: <Globe size={22} />,
    title: 'Multi-Platform Coverage',
    desc: 'Amazon, Flipkart, Shopify, Meesho, Myntra, Nykaa — our providers are specialists in every channel that matters.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: <TrendingUp size={22} />,
    title: 'Data-Driven Matching',
    desc: 'We surface the right provider for your brand based on category fit, SLA track record, and verified performance history.',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: <Users size={22} />,
    title: 'Vetted Network Only',
    desc: 'Every provider undergoes a structured onboarding review. No anonymous gig workers — only accountable professionals.',
    color: 'bg-amber-100 text-amber-700',
  },
];

const STATS = [
  { value: '500+', label: 'Verified Providers' },
  { value: '2,400+', label: 'Brands Served' },
  { value: '98.2%', label: 'SLA Compliance Rate' },
  { value: '4.8★', label: 'Average Provider Rating' },
];

const VALUES = [
  { icon: <Target size={18} />, title: 'Accountability', desc: 'Every deliverable is time-stamped and SLA-tracked.' },
  { icon: <Award size={18} />, title: 'Excellence', desc: 'We only work with providers who meet our quality bar.' },
  { icon: <Heart size={18} />, title: 'Brand-First', desc: 'Your brand growth is the metric that matters to us.' },
  { icon: <Zap size={18} />, title: 'Speed', desc: 'P0 issues resolved in under 4 hours. Always.' },
];

const AboutPage: React.FC = () => (
  <div className="min-h-screen bg-white">
    {/* ── Hero ── */}
    <div className="bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] pt-28 pb-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold text-violet-300 mb-6">
          Our Story
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight mb-5">
          Built to Fix the Agency<br />
          <span className="bg-gradient-to-r from-violet-400 to-sky-400 bg-clip-text text-transparent">
            Trust Deficit
          </span>
        </h1>
        <p className="text-surface-400 text-base max-w-2xl mx-auto leading-relaxed">
          Equinox was founded after watching hundreds of eCommerce brands lose revenue to missed deadlines,
          opaque billing, and agencies that over-promised and under-delivered.
          We built the infrastructure to make service accountability enforceable — not just expected.
        </p>
      </div>
    </div>

    {/* ── Stats bar ── */}
    <div className="bg-white border-b border-surface-100">
      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-3xl font-extrabold text-surface-900">{s.value}</p>
            <p className="text-xs text-surface-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>

    {/* ── Mission pillars ── */}
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-extrabold text-surface-900 mb-3">What We Stand For</h2>
        <p className="text-surface-500 text-sm max-w-xl mx-auto">
          Four principles guide every product decision we make.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {MISSION_PILLARS.map((p) => (
          <div key={p.title} className="bg-surface-50 rounded-2xl p-6 border border-surface-100 hover:border-surface-200 hover:shadow-sm transition-all">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${p.color}`}>
              {p.icon}
            </div>
            <h3 className="font-bold text-surface-900 mb-2 text-sm">{p.title}</h3>
            <p className="text-xs text-surface-500 leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>
    </div>

    {/* ── Story section ── */}
    <div className="bg-surface-50 border-y border-surface-100 py-16 px-4">
      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-surface-900 mb-4 leading-tight">
            The Problem We Set Out to Solve
          </h2>
          <div className="space-y-3 text-sm text-surface-600 leading-relaxed">
            <p>
              eCommerce brands — from ₹5L/month startups to ₹100Cr+ enterprises — spend a
              disproportionate amount of time managing service vendors instead of growing their business.
            </p>
            <p>
              Catalog errors go unresolved for weeks. Ad campaigns launch late. Account health crises
              take days to escalate. No single platform tracked any of this with accountability.
            </p>
            <p>
              <span className="font-semibold text-surface-800">Equinox changes that.</span>{' '}
              We enforce SLAs programmatically, track every task's status in real time, and give brands
              full financial transparency — from contract to invoice to payout.
            </p>
          </div>
          <div className="mt-6 space-y-2">
            {[
              'Contractual SLA timers on every task',
              'Escrow-style payments released on completion',
              'Full audit trail — contracts, invoices, reviews',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-surface-700">
                <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] rounded-3xl p-8 text-white">
          <p className="text-xs font-semibold text-violet-300 uppercase tracking-wider mb-4">Our Values</p>
          <div className="space-y-4">
            {VALUES.map((v) => (
              <div key={v.title} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {v.icon}
                </div>
                <div>
                  <p className="font-semibold text-sm">{v.title}</p>
                  <p className="text-xs text-surface-400 mt-0.5">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* ── CTA ── */}
    <div className="bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] py-16 px-4 text-center">
      <h2 className="text-2xl font-extrabold text-white mb-3">Ready to hold your providers accountable?</h2>
      <p className="text-surface-400 text-sm mb-7 max-w-md mx-auto">
        Join thousands of brands that run their eCommerce operations through Equinox.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/get-started" className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-bold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity">
          Start Free <ArrowRight size={14} />
        </Link>
        <Link to="/contact" className="inline-flex items-center gap-2 border border-white/20 text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-white/10 transition-colors">
          Talk to Sales
        </Link>
      </div>
    </div>
  </div>
);

export default AboutPage;
