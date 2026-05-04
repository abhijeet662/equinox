import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ShieldCheck, BarChart3, Users, Globe, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

const FEATURES = [
  {
    icon: <ShieldCheck size={22} />,
    title: 'Custom SLA Configurations',
    desc: 'Define your own priority tiers, escalation paths, and breach penalties — beyond our standard P0–P3 framework.',
    color: 'bg-violet-100 text-violet-600',
  },
  {
    icon: <Users size={22} />,
    title: 'Multi-Brand Team Access',
    desc: 'Manage multiple brand entities and sub-teams under one enterprise account with role-based permissions.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: <BarChart3 size={22} />,
    title: 'Custom Reporting & BI Exports',
    desc: 'Pull spend reports, provider performance data, and SLA compliance metrics directly into your BI tools.',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: <Globe size={22} />,
    title: 'API & ERP Integrations',
    desc: 'Connect Equinox with your existing ERP, HRMS, or finance stack via our documented REST API.',
    color: 'bg-amber-100 text-amber-700',
  },
  {
    icon: <Lock size={22} />,
    title: 'SSO / SAML Authentication',
    desc: 'Enforce your corporate identity provider. Supports Okta, Azure AD, Google Workspace.',
    color: 'bg-rose-100 text-rose-600',
  },
  {
    icon: <Building2 size={22} />,
    title: 'Dedicated Account Manager',
    desc: 'A named Equinox success manager attends your QBRs, tracks onboarding, and escalates issues on your behalf.',
    color: 'bg-sky-100 text-sky-600',
  },
];

const EnterprisesPage: React.FC = () => (
  <div className="min-h-screen bg-white">
    <div className="bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] pt-28 pb-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold text-violet-300 mb-6">
          <Building2 size={12} /> For Enterprises
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-5">
          Enterprise-Grade Control<br />
          <span className="bg-gradient-to-r from-violet-400 to-sky-400 bg-clip-text text-transparent">
            at Marketplace Speed
          </span>
        </h1>
        <p className="text-surface-400 text-sm max-w-xl mx-auto leading-relaxed mb-8">
          Large brands running operations across dozens of providers need more than a marketplace.
          They need governance, auditability, and integrations. Equinox Enterprise delivers all three.
        </p>
        <Link to="/contact" className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-bold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity">
          Talk to Enterprise Sales <ArrowRight size={14} />
        </Link>
      </div>
    </div>

    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-2xl font-extrabold text-surface-900 mb-3">Built for Complex Operations</h2>
        <p className="text-surface-500 text-sm max-w-lg mx-auto">
          When you have 50+ active service relationships across multiple brands, you need infrastructure — not a spreadsheet.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((f) => (
          <div key={f.title} className="bg-surface-50 rounded-2xl p-6 border border-surface-100 hover:shadow-sm transition-all">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>{f.icon}</div>
            <h3 className="font-bold text-surface-900 text-sm mb-2">{f.title}</h3>
            <p className="text-xs text-surface-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-surface-50 border-t border-surface-100 py-14 px-4">
      <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h2 className="text-xl font-extrabold text-surface-900 mb-4">What's Included</h2>
          <ul className="space-y-2.5">
            {[
              'Unlimited active contracts across all brands',
              'Custom contract and NDA templates',
              'Spend analytics by provider, category & period',
              'On-site onboarding & training',
              '24/7 phone + dedicated Slack channel',
              'SLA breach auto-escalation workflows',
              'Bulk provider onboarding support',
            ].map(item => (
              <li key={item} className="flex items-center gap-2 text-sm text-surface-700">
                <CheckCircle2 size={14} className="text-primary-500 flex-shrink-0" /> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] rounded-3xl p-8 text-center">
          <p className="text-white font-bold text-lg mb-2">Custom Pricing</p>
          <p className="text-surface-400 text-xs mb-6 leading-relaxed">
            Enterprise plans are tailored to your team size, number of brands, and integration requirements.
          </p>
          <Link to="/contact" className="inline-flex items-center gap-2 bg-white text-surface-900 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-surface-100 transition-colors">
            Request a Demo <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  </div>
);

export default EnterprisesPage;
