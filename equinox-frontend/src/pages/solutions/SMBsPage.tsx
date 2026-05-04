import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Wallet, ShieldCheck, Clock, ArrowRight, CheckCircle2, Star } from 'lucide-react';

const BENEFITS = [
  {
    icon: <TrendingUp size={22} />,
    title: 'Grow Without Headcount',
    desc: 'Hire verified specialists for catalog, ads, and account management — without the overhead of full-time employees.',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: <Wallet size={22} />,
    title: 'Pay on Delivery',
    desc: 'Escrow-backed payments mean you only release funds when the work is done and you are satisfied.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: <ShieldCheck size={22} />,
    title: 'SLA Protection',
    desc: 'Every task has an enforceable deadline. Late delivery triggers automatic escalation — not a polite email.',
    color: 'bg-violet-100 text-violet-600',
  },
  {
    icon: <Clock size={22} />,
    title: 'Quick Turnaround',
    desc: 'Our P1/P2 SLA tiers mean critical catalog updates and campaign fixes happen within hours, not days.',
    color: 'bg-amber-100 text-amber-700',
  },
];

const SMBsPage: React.FC = () => (
  <div className="min-h-screen bg-white">
    <div className="bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] pt-28 pb-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold text-violet-300 mb-6">
          <TrendingUp size={12} /> For SMBs
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-5">
          Agency Quality.<br />
          <span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
            Startup Budget.
          </span>
        </h1>
        <p className="text-surface-400 text-sm max-w-xl mx-auto leading-relaxed mb-8">
          Small and mid-size eCommerce brands deserve the same level of service accountability that large enterprises get.
          Equinox makes it accessible — no retainers, no lock-ins, no surprises.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/get-started" className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-bold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity">
            Start Free <ArrowRight size={14} />
          </Link>
          <Link to="/providers" className="inline-flex items-center gap-2 border border-white/20 text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-white/10 transition-colors">
            Browse Providers
          </Link>
        </div>
      </div>
    </div>

    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-2xl font-extrabold text-surface-900 mb-3">Why SMBs Choose Equinox</h2>
        <p className="text-surface-500 text-sm max-w-lg mx-auto">
          You do not need a procurement team to manage vendors professionally.
        </p>
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
      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="text-xl font-extrabold text-surface-900 mb-4">What You Get on the Free Plan</h2>
          <ul className="space-y-2.5">
            {[
              'Browse all 500+ verified providers',
              'Up to 2 active service contracts',
              'P2 & P3 SLA task tracking',
              'Contract templates included',
              'Secure in-app messaging',
              'Provider ratings & reviews access',
            ].map(item => (
              <li key={item} className="flex items-center gap-2 text-sm text-surface-700">
                <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" /> {item}
              </li>
            ))}
          </ul>
          <Link to="/pricing" className="inline-flex items-center gap-2 mt-6 text-primary-600 font-semibold text-sm hover:underline">
            Compare all plans <ArrowRight size={13} />
          </Link>
        </div>
        <div className="space-y-4">
          {[
            { name: 'Priya M.', brand: 'Home Décor Brand', quote: 'Finally a platform where the agency actually has to deliver or face consequences. Game changer for us.', rating: 5 },
            { name: 'Rahul S.', brand: 'Fitness Supplements', quote: 'Set up in 20 minutes, had our first contract signed the same day. The SLA tracker keeps everyone honest.', rating: 5 },
          ].map((t) => (
            <div key={t.name} className="bg-white rounded-2xl p-5 border border-surface-200 shadow-sm">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={12} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-surface-700 italic leading-relaxed mb-3">"{t.quote}"</p>
              <p className="text-xs font-semibold text-surface-800">{t.name} <span className="text-surface-400 font-normal">— {t.brand}</span></p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default SMBsPage;
