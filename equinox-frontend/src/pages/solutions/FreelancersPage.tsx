import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Wallet, Star, ShieldCheck, ArrowRight, CheckCircle2, Zap } from 'lucide-react';

const BENEFITS = [
  {
    icon: <Briefcase size={22} />,
    title: 'Qualified Brand Pipeline',
    desc: 'Stop chasing cold leads. Equinox sends active project briefs from vetted eCommerce brands directly to your profile.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: <Wallet size={22} />,
    title: 'Guaranteed Payments',
    desc: 'Client funds are held in escrow before you start. Deliver the work, get paid. No chasing invoices.',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: <Star size={22} />,
    title: 'Build Your Reputation',
    desc: 'Every completed contract adds verified ratings to your public profile. Your track record sells for you.',
    color: 'bg-amber-100 text-amber-700',
  },
  {
    icon: <ShieldCheck size={22} />,
    title: 'Clear Scope & SLAs',
    desc: 'Contracts define deliverables, timelines, and revision policies upfront. No scope creep ambiguity.',
    color: 'bg-violet-100 text-violet-600',
  },
];

const STEPS = [
  { step: '01', title: 'Apply as a Provider', desc: 'Submit your profile, portfolio, and service categories. Our team reviews within 48 hours.' },
  { step: '02', title: 'Get Listed', desc: 'Once approved, your profile appears in search results for relevant brand queries.' },
  { step: '03', title: 'Receive Proposals', desc: 'Brands send you project briefs. Accept, negotiate, and finalise scope inside the platform.' },
  { step: '04', title: 'Deliver & Get Paid', desc: 'Complete deliverables, get client sign-off, and receive payment directly to your bank.' },
];

const FreelancersPage: React.FC = () => (
  <div className="min-h-screen bg-white">
    <div className="bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] pt-28 pb-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold text-violet-300 mb-6">
          <Zap size={12} /> For Freelancers & Agencies
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-5">
          Get Paid What You Are Worth.<br />
          <span className="bg-gradient-to-r from-violet-400 to-emerald-400 bg-clip-text text-transparent">
            On Time. Every Time.
          </span>
        </h1>
        <p className="text-surface-400 text-sm max-w-xl mx-auto leading-relaxed mb-8">
          Equinox connects eCommerce specialists with brands that have real budgets and real briefs.
          No bidding wars. No unpaid invoices. Just structured, accountable work.
        </p>
        <Link to="/contact?inquiry=provider" className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-bold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity">
          Apply as a Provider <ArrowRight size={14} />
        </Link>
      </div>
    </div>

    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-2xl font-extrabold text-surface-900 mb-3">Why Top Providers Choose Equinox</h2>
      </div>
      <div className="grid sm:grid-cols-2 gap-6">
        {BENEFITS.map((b) => (
          <div key={b.title} className="bg-surface-50 rounded-2xl p-6 border border-surface-100 flex gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${b.color}`}>{b.icon}</div>
            <div>
              <h3 className="font-bold text-surface-900 text-sm mb-1.5">{b.title}</h3>
              <p className="text-xs text-surface-500 leading-relaxed">{b.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-surface-50 border-y border-surface-100 py-14 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-extrabold text-surface-900 text-center mb-10">How It Works</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s) => (
            <div key={s.step} className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-extrabold text-sm shadow-md shadow-primary-200">
                {s.step}
              </div>
              <h3 className="font-bold text-surface-900 text-sm mb-2">{s.title}</h3>
              <p className="text-xs text-surface-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="py-14 px-4">
      <div className="max-w-3xl mx-auto bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] rounded-3xl p-10 text-center">
        <h2 className="text-xl font-bold text-white mb-3">Provider Eligibility</h2>
        <p className="text-surface-400 text-xs mb-6 max-w-sm mx-auto leading-relaxed">
          We accept individual specialists, boutique agencies, and larger service firms.
          You must operate in at least one of our supported eCommerce service categories.
        </p>
        <ul className="text-left inline-block space-y-2 mb-6">
          {['Amazon Seller Central / Vendor Central', 'Flipkart Seller Hub', 'Shopify / D2C website management', 'Performance marketing (PPC / social)', 'Catalog, content & creative', 'Logistics, FBA, and returns'].map(item => (
            <li key={item} className="flex items-center gap-2 text-xs text-surface-300">
              <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" /> {item}
            </li>
          ))}
        </ul>
        <br />
        <Link to="/contact" className="inline-flex items-center gap-2 bg-white text-surface-900 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-surface-100 transition-colors">
          Apply Now <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  </div>
);

export default FreelancersPage;
