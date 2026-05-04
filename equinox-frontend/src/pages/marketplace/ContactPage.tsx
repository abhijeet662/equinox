/**
 * ContactPage — /contact
 *
 * Two-column layout:
 *   Left  — department routing cards + trust badges
 *   Right — inquiry form (Name, Email, Brand, Message, Inquiry Type)
 *
 * On submit → contactsService.submit() → admin notification bell (live)
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  Handshake,
  CreditCard,
  Wrench,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  Mail,
  Building2,
  Users,
  ShieldCheck,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { contactsService, type InquiryType } from '../../services/contacts.service';

// ─── Department cards ──────────────────────────────────────────────────────────

interface DeptCard {
  type: InquiryType;
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;          // Tailwind bg classes for icon backdrop
  border: string;         // hover ring class
}

const DEPTS: DeptCard[] = [
  {
    type: 'provider',
    icon: <Store size={22} />,
    label: 'Become a Provider',
    description: 'List your agency or freelance services on the Equinox marketplace.',
    color: 'bg-violet-100 text-violet-600',
    border: 'hover:border-violet-300',
  },
  {
    type: 'partnership',
    icon: <Handshake size={22} />,
    label: 'Brand Partnerships',
    description: 'Strategic integrations, co-marketing, and enterprise agreements.',
    color: 'bg-blue-100 text-blue-600',
    border: 'hover:border-blue-300',
  },
  {
    type: 'billing',
    icon: <CreditCard size={22} />,
    label: 'Billing & Payments',
    description: 'Invoice disputes, wallet queries, payout schedules.',
    color: 'bg-emerald-100 text-emerald-600',
    border: 'hover:border-emerald-300',
  },
  {
    type: 'technical',
    icon: <Wrench size={22} />,
    label: 'Technical Support',
    description: 'API issues, integration errors, platform bugs.',
    color: 'bg-amber-100 text-amber-700',
    border: 'hover:border-amber-300',
  },
  {
    type: 'general',
    icon: <MessageSquare size={22} />,
    label: 'General Inquiry',
    description: 'Anything else — we read every message.',
    color: 'bg-surface-100 text-surface-600',
    border: 'hover:border-surface-300',
  },
];

const INQUIRY_LABELS: Record<InquiryType, string> = {
  provider: 'Become a Provider',
  partnership: 'Brand Partnerships',
  billing: 'Billing & Payments',
  technical: 'Technical Support',
  general: 'General Inquiry',
};

// ─── Component ────────────────────────────────────────────────────────────────

const ContactPage: React.FC = () => {
  const [selectedType, setSelectedType] = useState<InquiryType>('general');
  const [form, setForm] = useState({ name: '', email: '', brandName: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await contactsService.submit({
        name: form.name,
        email: form.email,
        brandName: form.brandName || undefined,
        message: form.message,
        inquiryType: selectedType,
      });
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50">
      {/* ── Hero strip ──────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold text-violet-300 mb-6">
            <Mail size={13} /> Get in Touch
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
            We Route Every Message<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-sky-400">
              to the Right Team
            </span>
          </h1>
          <p className="text-surface-400 text-sm max-w-xl mx-auto leading-relaxed">
            Whether you're joining as a service provider, resolving a payment, or exploring a partnership —
            select your department below and we'll respond within one business day.
          </p>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-12 grid lg:grid-cols-[1fr_440px] gap-10 items-start">

        {/* ── Left column ─────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-base font-bold text-surface-800 mb-4">Select a Department</h2>
          <div className="space-y-3">
            {DEPTS.map((d) => (
              <button
                key={d.type}
                onClick={() => setSelectedType(d.type)}
                className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                  selectedType === d.type
                    ? 'border-primary-500 bg-primary-50 shadow-sm'
                    : `border-surface-200 bg-white ${d.border}`
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${d.color}`}>
                  {d.icon}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${selectedType === d.type ? 'text-primary-700' : 'text-surface-800'}`}>
                    {d.label}
                  </p>
                  <p className="text-xs text-surface-500 mt-0.5 leading-relaxed">{d.description}</p>
                </div>
                {selectedType === d.type && (
                  <CheckCircle2 size={18} className="text-primary-500 ml-auto flex-shrink-0 mt-0.5" />
                )}
              </button>
            ))}
          </div>

          {/* Trust badges */}
          <div className="mt-10 space-y-3">
            <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Why Equinox</p>
            {[
              { icon: <ShieldCheck size={16} />, text: 'SLA-backed service guarantees on every contract' },
              { icon: <Building2 size={16} />, text: 'Trusted by brands selling on Amazon, Flipkart & Shopify' },
              { icon: <Users size={16} />, text: 'Vetted provider network — not a gig free-for-all' },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-3 text-xs text-surface-600">
                <div className="w-7 h-7 rounded-lg bg-surface-100 flex items-center justify-center text-surface-500 flex-shrink-0">
                  {b.icon}
                </div>
                {b.text}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right column — Form ──────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-surface-200 shadow-sm overflow-hidden">
          {/* gradient bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-primary-500 via-secondary-500 to-violet-500" />

          <div className="p-8">
            {submitted ? (
              /* ── Success state ── */
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-100">
                  <CheckCircle2 size={30} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-surface-900 mb-2">Message Received!</h3>
                <p className="text-sm text-surface-500 leading-relaxed mb-6 max-w-xs mx-auto">
                  Your inquiry has been routed to our{' '}
                  <span className="font-semibold text-surface-700">{INQUIRY_LABELS[selectedType]}</span>{' '}
                  team. Expect a reply within one business day.
                </p>
                <div className="space-y-2">
                  <Link
                    to="/providers"
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-bold py-3 rounded-xl text-sm hover:from-primary-700 hover:to-secondary-700 transition-all"
                  >
                    Browse Providers <ArrowRight size={14} />
                  </Link>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', brandName: '', message: '' }); }}
                    className="w-full py-2.5 text-sm text-surface-500 hover:text-surface-700 transition-colors"
                  >
                    Send another message
                  </button>
                </div>
              </div>
            ) : (
              /* ── Form ── */
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-surface-900">
                    {INQUIRY_LABELS[selectedType]}
                  </h3>
                  <p className="text-xs text-surface-500 mt-1">
                    All fields marked * are required.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2.5 mb-4">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name + Email */}
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-surface-600 mb-1 block">Full Name *</label>
                      <input
                        required
                        value={form.name}
                        onChange={set('name')}
                        className="input-field text-sm w-full"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-surface-600 mb-1 block">Work Email *</label>
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={set('email')}
                        className="input-field text-sm w-full"
                        placeholder="you@brand.com"
                      />
                    </div>
                  </div>

                  {/* Brand name */}
                  <div>
                    <label className="text-xs font-medium text-surface-600 mb-1 block">
                      Brand / Company Name{' '}
                      <span className="text-surface-400 font-normal">(optional)</span>
                    </label>
                    <input
                      value={form.brandName}
                      onChange={set('brandName')}
                      className="input-field text-sm w-full"
                      placeholder="e.g. Ferns & Petals"
                    />
                  </div>

                  {/* Inquiry type — visual select */}
                  <div>
                    <label className="text-xs font-medium text-surface-600 mb-1 block">Inquiry Type *</label>
                    <div className="relative">
                      <select
                        value={selectedType}
                        onChange={e => setSelectedType(e.target.value as InquiryType)}
                        className="input-field text-sm w-full appearance-none pr-10 cursor-pointer"
                      >
                        {DEPTS.map(d => (
                          <option key={d.type} value={d.type}>{d.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="text-xs font-medium text-surface-600 mb-1 block">Message *</label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={set('message')}
                      className="input-field text-sm w-full resize-none"
                      placeholder="Describe your request in detail…"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-60"
                  >
                    {submitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>Send Message <ArrowRight size={14} /></>
                    )}
                  </button>

                  <p className="text-center text-xs text-surface-400">
                    Prefer to explore first?{' '}
                    <Link to="/get-started" className="text-secondary-600 font-semibold hover:underline">
                      Start the onboarding wizard
                    </Link>
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
