import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, CheckCircle2, Globe } from 'lucide-react';

interface Integration {
  name: string;
  abbr: string;
  category: string;
  color: string;
  desc: string;
  status: 'live' | 'beta' | 'coming';
}

const INTEGRATIONS: Integration[] = [
  { name: 'Amazon Seller Central', abbr: 'AM', category: 'Marketplace', color: 'from-amber-400 to-orange-500', desc: 'Sync tasks, health alerts, and performance data from your Amazon account.', status: 'live' },
  { name: 'Flipkart Seller Hub', abbr: 'FK', category: 'Marketplace', color: 'from-blue-400 to-blue-600', desc: 'Monitor listings, catalog health, and order SLAs from Flipkart.', status: 'live' },
  { name: 'Shopify', abbr: 'SH', category: 'D2C Platform', color: 'from-green-400 to-emerald-600', desc: 'Pull store analytics and task triggers from your Shopify admin.', status: 'live' },
  { name: 'Meesho', abbr: 'ME', category: 'Marketplace', color: 'from-pink-400 to-rose-500', desc: 'Track catalog updates and fulfillment SLAs on Meesho.', status: 'beta' },
  { name: 'Myntra', abbr: 'MY', category: 'Marketplace', color: 'from-fuchsia-400 to-purple-600', desc: 'Sync brand portal data and creative deadlines.', status: 'beta' },
  { name: 'Nykaa', abbr: 'NY', category: 'Marketplace', color: 'from-pink-300 to-rose-400', desc: 'Catalog and campaign management sync for beauty brands.', status: 'coming' },
  { name: 'Slack', abbr: 'SL', category: 'Notifications', color: 'from-purple-400 to-indigo-500', desc: 'Get SLA breach alerts and task updates in your Slack workspace.', status: 'live' },
  { name: 'Google Sheets', abbr: 'GS', category: 'Reporting', color: 'from-green-500 to-teal-500', desc: 'Export contract, task, and spend data to Sheets on a schedule.', status: 'live' },
  { name: 'Razorpay', abbr: 'RZ', category: 'Payments', color: 'from-sky-400 to-blue-600', desc: 'Secure card and UPI payments for brand subscriptions.', status: 'live' },
  { name: 'Tally', abbr: 'TL', category: 'Finance', color: 'from-indigo-400 to-violet-500', desc: 'Export invoices and payment records directly to Tally ERP.', status: 'beta' },
  { name: 'Zoho CRM', abbr: 'ZH', category: 'CRM', color: 'from-orange-400 to-red-500', desc: 'Sync provider contacts and deal stages with Zoho CRM.', status: 'coming' },
  { name: 'REST API', abbr: 'API', category: 'Developer', color: 'from-slate-500 to-slate-700', desc: 'Fully documented REST API for custom integrations and automation.', status: 'live' },
];

const statusStyle: Record<Integration['status'], string> = {
  live:   'bg-emerald-100 text-emerald-700',
  beta:   'bg-amber-100 text-amber-700',
  coming: 'bg-surface-100 text-surface-500',
};

const statusLabel: Record<Integration['status'], string> = {
  live:   'Live',
  beta:   'Beta',
  coming: 'Coming Soon',
};

const IntegrationsPage: React.FC = () => (
  <div className="min-h-screen bg-white">
    <div className="bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] pt-28 pb-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold text-violet-300 mb-6">
          <Globe size={12} /> Integrations
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-5">
          Connect Every Tool<br />
          <span className="bg-gradient-to-r from-violet-400 to-sky-400 bg-clip-text text-transparent">
            In Your Stack
          </span>
        </h1>
        <p className="text-surface-400 text-sm max-w-xl mx-auto leading-relaxed">
          Equinox integrates with the marketplaces, payment processors, and productivity tools your team already uses.
          No more copy-pasting data between platforms.
        </p>
      </div>
    </div>

    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="flex flex-wrap gap-2 justify-center mb-10">
        {['All', 'Marketplace', 'Payments', 'Reporting', 'Notifications', 'Developer'].map(cat => (
          <span key={cat} className="px-3 py-1.5 rounded-full border border-surface-200 text-xs font-medium text-surface-600 bg-surface-50 cursor-pointer hover:border-primary-300 hover:text-primary-600 transition-colors">
            {cat}
          </span>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {INTEGRATIONS.map((intg) => (
          <div key={intg.name} className="bg-white rounded-2xl border border-surface-200 p-5 hover:shadow-sm transition-all flex gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${intg.color} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
              {intg.abbr}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="font-semibold text-sm text-surface-900 truncate">{intg.name}</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${statusStyle[intg.status]}`}>
                  {statusLabel[intg.status]}
                </span>
              </div>
              <p className="text-xs text-surface-400 mb-1">{intg.category}</p>
              <p className="text-xs text-surface-600 leading-relaxed">{intg.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-surface-50 border-t border-surface-100 py-14 px-4">
      <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="text-xl font-extrabold text-surface-900 mb-4">Build Your Own Integration</h2>
          <p className="text-sm text-surface-600 leading-relaxed mb-4">
            Our documented REST API gives you full access to contracts, tasks, invoices, providers, and SLA data.
            Use it to build custom dashboards, automate workflows, or connect Equinox to your internal tools.
          </p>
          <ul className="space-y-2">
            {['RESTful API with JWT auth', 'Webhook support for real-time events', 'Sandbox environment for testing', 'SDKs for Node.js and Python (beta)'].map(item => (
              <li key={item} className="flex items-center gap-2 text-sm text-surface-700">
                <CheckCircle2 size={14} className="text-primary-500 flex-shrink-0" /> {item}
              </li>
            ))}
          </ul>
          <Link to="/contact" className="inline-flex items-center gap-2 mt-5 text-primary-600 font-semibold text-sm hover:underline">
            Request API access <ArrowRight size={13} />
          </Link>
        </div>
        <div className="bg-[#0f172a] rounded-2xl p-6 font-mono text-xs text-emerald-400 leading-relaxed overflow-hidden">
          <p className="text-surface-500 mb-2">// Fetch SLA status for a task</p>
          <p><span className="text-blue-400">GET</span> /api/tasks/:id/sla</p>
          <p className="text-surface-500 mt-3 mb-1">Authorization: Bearer {'<token>'}</p>
          <br />
          <p className="text-surface-400">{'{'}</p>
          <p className="ml-4"><span className="text-amber-400">"sla_status"</span>: <span className="text-emerald-400">"on_track"</span>,</p>
          <p className="ml-4"><span className="text-amber-400">"hours_remaining"</span>: <span className="text-violet-400">6.5</span>,</p>
          <p className="ml-4"><span className="text-amber-400">"priority"</span>: <span className="text-emerald-400">"P1"</span>,</p>
          <p className="ml-4"><span className="text-amber-400">"deadline"</span>: <span className="text-emerald-400">"2026-04-28T14:00:00Z"</span></p>
          <p className="text-surface-400">{'}'}</p>
        </div>
      </div>
    </div>

    <div className="py-12 px-4 text-center">
      <p className="text-surface-600 text-sm mb-4">Need a custom integration or can't find your platform?</p>
      <Link to="/contact" className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-bold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity">
        <Zap size={14} /> Request an Integration
      </Link>
    </div>
  </div>
);

export default IntegrationsPage;
