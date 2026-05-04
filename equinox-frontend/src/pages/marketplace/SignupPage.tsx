import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, ArrowLeft, Check, CheckCircle } from 'lucide-react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../store';
import { registerAsync } from '../../store/slices/authSlice';
import type { UserRole } from '../../types';

// ─── Static data ──────────────────────────────────────────────────────────────

const SPECIALIZATIONS = [
  'Amazon', 'Flipkart', 'Shopify', 'Meesho', 'D2C / DTC',
  'Performance Marketing', 'SEO / Content', 'Design & Creative',
  'Tech & Integrations', 'Analytics & BI', 'Logistics & Ops', 'WhatsApp Commerce',
];

const MARKETPLACE_OPTIONS = [
  { id: 'amazon',   label: 'Amazon',   emoji: '📦' },
  { id: 'flipkart', label: 'Flipkart', emoji: '🛒' },
  { id: 'shopify',  label: 'Shopify',  emoji: '🏪' },
  { id: 'meesho',   label: 'Meesho',   emoji: '🧵' },
  { id: 'dtc',      label: 'Own D2C',  emoji: '🌐' },
  { id: 'other',    label: 'Other',    emoji: '➕' },
];

const INDUSTRIES = [
  'Fashion & Apparel', 'Electronics', 'Home & Living', 'Beauty & Personal Care',
  'Food & Beverage', 'Sports & Fitness', 'Automotive', 'Health & Wellness', 'Other',
];

// ─── Component ────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;

interface FormState {
  role: UserRole;
  providerType: string;
  name: string;
  email: string;
  password: string;
  company: string;
  location: string;
  industry: string;
  specializations: string[];
  marketplaces: string[];
}

const SignupPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<FormState>({
    role: 'buyer',
    providerType: 'provider',
    name: '',
    email: '',
    password: '',
    company: '',
    location: '',
    industry: '',
    specializations: [],
    marketplaces: [],
  });

  const set = (patch: Partial<FormState>) => setForm(f => ({ ...f, ...patch }));

  const toggleArr = (key: 'specializations' | 'marketplaces', value: string) => {
    set({
      [key]: form[key].includes(value)
        ? form[key].filter(v => v !== value)
        : [...form[key], value],
    });
  };

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    if (!form.password || form.password.length < 8) e.password = 'Password must be at least 8 characters';
    return e;
  };

  const handleNext = () => {
    if (step === 1) { setStep(2); return; }
    if (step === 2) {
      const errs = validateStep2();
      if (Object.keys(errs).length) { setErrors(errs); return; }
      setErrors({});
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    const result = await dispatch(registerAsync({
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role.toUpperCase(),
      company: form.company || undefined,
    }));
    if (registerAsync.fulfilled.match(result)) {
      navigate(form.role === 'provider' ? '/provider' : '/buyer');
    } else {
      setErrors({ submit: (result.payload as string) || 'Registration failed' });
      setStep(2);
    }
    setLoading(false);
  };

  // ── Step indicators ──────────────────────────────────────────────────────────

  const STEPS = ['Choose role', 'Account details', form.role === 'provider' ? 'Your profile' : 'Your brand'];

  return (
    <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl border border-surface-200 p-8">

      {/* Logo + back to login */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">EQ</div>
          <span className="text-xl font-bold text-surface-900">Equinox</span>
        </Link>
        <Link to="/login" className="flex items-center gap-1 text-xs text-surface-500 hover:text-primary-600 transition-colors">
          <ArrowLeft size={13} /> Sign in
        </Link>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-7">
        {STEPS.map((label, i) => {
          const n = (i + 1) as Step;
          const done = step > n;
          const active = step === n;
          return (
            <React.Fragment key={label}>
              <div className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                  done ? 'bg-green-500 text-white' : active ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-400'
                }`}>
                  {done ? <Check size={12} /> : n}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${active ? 'text-surface-800' : 'text-surface-400'}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px ${step > n ? 'bg-green-400' : 'bg-surface-200'}`} />}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Step 1: Role selection ─────────────────────────────────────────── */}
      {step === 1 && (
        <div>
          <h2 className="text-2xl font-bold text-surface-900 mb-1">Join Equinox</h2>
          <p className="text-surface-500 text-sm mb-6">How will you use the platform?</p>

          <div className="space-y-3 mb-6">
            {/* Buyer */}
            <button
              type="button"
              onClick={() => set({ role: 'buyer' })}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                form.role === 'buyer' ? 'border-emerald-500 bg-emerald-50' : 'border-surface-200 hover:border-surface-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">🛒</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`font-bold text-sm ${form.role === 'buyer' ? 'text-emerald-700' : 'text-surface-800'}`}>
                      Buyer
                    </p>
                    {form.role === 'buyer' && <CheckCircle size={14} className="text-emerald-600" />}
                  </div>
                  <p className="text-xs text-surface-500 mt-0.5">Hire providers, manage contracts, track delivery quality</p>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {['Browse providers', 'Sign contracts', 'Fund wallet', 'Track performance'].map(t => (
                      <span key={t} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </button>

            {/* Provider */}
            <button
              type="button"
              onClick={() => set({ role: 'provider' })}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                form.role === 'provider' ? 'border-primary-500 bg-primary-50' : 'border-surface-200 hover:border-surface-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">💼</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`font-bold text-sm ${form.role === 'provider' ? 'text-primary-700' : 'text-surface-800'}`}>
                      Provider
                    </p>
                    {form.role === 'provider' && <CheckCircle size={14} className="text-primary-600" />}
                  </div>
                  <p className="text-xs text-surface-500 mt-0.5">Offer services, manage tasks, track revenue & profitability</p>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {['Win contracts', 'Run tasks', 'Invoice clients', 'P&L dashboard'].map(t => (
                      <span key={t} className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </button>

            {/* Employee — invite only */}
            {/* <div className="w-full p-4 rounded-xl border-2 border-dashed border-surface-200 opacity-60">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <p className="font-bold text-sm text-surface-600">Employee</p>
                  <p className="text-xs text-surface-400 mt-0.5">Invite-only — ask your admin to send you an invite link</p>
                </div>
              </div>
            </div> */}
          </div>

          <button type="button" onClick={handleNext} className="btn-primary w-full justify-center py-3">
            Continue <ArrowRight size={16} />
          </button>

          <p className="text-center text-sm text-surface-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      )}

      {/* ── Step 2: Account details ────────────────────────────────────────── */}
      {step === 2 && (
        <div>
          <h2 className="text-2xl font-bold text-surface-900 mb-1">Create your account</h2>
          <p className="text-surface-500 text-sm mb-6">
            {form.role === 'provider' ? 'Set up your Provider account' : 'Set up your Buyer account'}
          </p>

          {errors.submit && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100 mb-4">{errors.submit}</div>
          )}

          <div className="space-y-4">
            {/* Name + Company */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-surface-700 mb-1.5 block">Full Name</label>
                <input
                  className={`input-field ${errors.name ? 'border-red-300' : ''}`}
                  placeholder="Your name"
                  value={form.name}
                  onChange={e => set({ name: e.target.value })}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-surface-700 mb-1.5 block">Company</label>
                <input
                  className="input-field"
                  placeholder="Company name"
                  value={form.company}
                  onChange={e => set({ company: e.target.value })}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-surface-700 mb-1.5 block">Work Email</label>
              <input
                type="email"
                className={`input-field ${errors.email ? 'border-red-300' : ''}`}
                placeholder="you@company.com"
                value={form.email}
                onChange={e => set({ email: e.target.value })}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-surface-700 mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className={`input-field pr-10 ${errors.password ? 'border-red-300' : ''}`}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={e => set({ password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button type="button" onClick={handleBack} className="btn-outline px-4 py-2.5">
              <ArrowLeft size={15} />
            </button>
            <button type="button" onClick={handleNext} className="btn-primary flex-1 justify-center py-2.5">
              Continue <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Role-specific details ─────────────────────────────────── */}
      {step === 3 && (
        <form onSubmit={handleSubmit}>
          {form.role === 'provider' ? (
            <div>
              <h2 className="text-2xl font-bold text-surface-900 mb-1">Provider profile</h2>
              <p className="text-surface-500 text-sm mb-5">Help buyers find and evaluate you on the marketplace</p>

              {/* KYC notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-5 flex gap-2.5">
                <span className="text-amber-500 text-lg flex-shrink-0">🔍</span>
                <div>
                  <p className="text-sm font-semibold text-amber-800">Admin review required</p>
                  <p className="text-xs text-amber-700 mt-0.5">Your provider profile will be reviewed and approved by our team before going live on the marketplace.</p>
                </div>
              </div>

              {/* Specializations */}
              <div className="mb-4">
                <label className="text-sm font-medium text-surface-700 mb-2 block">
                  Specializations <span className="text-surface-400 font-normal">(select all that apply)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALIZATIONS.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleArr('specializations', s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        form.specializations.includes(s)
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-surface-600 border-surface-200 hover:border-primary-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="mb-4">
                <label className="text-sm font-medium text-surface-700 mb-1.5 block">Location / City</label>
                <input
                  className="input-field"
                  placeholder="e.g. Mumbai, Dubai, Bangalore"
                  value={form.location}
                  onChange={e => set({ location: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-surface-900 mb-1">Buyer profile</h2>
              <p className="text-surface-500 text-sm mb-5">Tell us about your business so we can match the right providers</p>

              {/* Industry */}
              <div className="mb-4">
                <label className="text-sm font-medium text-surface-700 mb-2 block">Industry / Category</label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map(ind => (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => set({ industry: ind })}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        form.industry === ind
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-surface-600 border-surface-200 hover:border-emerald-300'
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>

              {/* Marketplace presence */}
              <div className="mb-4">
                <label className="text-sm font-medium text-surface-700 mb-2 block">
                  Marketplace presence <span className="text-surface-400 font-normal">(where do you sell?)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {MARKETPLACE_OPTIONS.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleArr('marketplaces', m.id)}
                      className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                        form.marketplaces.includes(m.id)
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-surface-200 hover:border-surface-300'
                      }`}
                    >
                      <span className="text-xl block mb-0.5">{m.emoji}</span>
                      <p className={`text-xs font-semibold ${form.marketplaces.includes(m.id) ? 'text-emerald-700' : 'text-surface-600'}`}>
                        {m.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-surface-400 mb-4">
            By signing up you agree to our{' '}
            <span className="text-primary-600 cursor-pointer hover:underline">Terms of Service</span>
            {' '}and{' '}
            <span className="text-primary-600 cursor-pointer hover:underline">Privacy Policy</span>.
          </p>

          <div className="flex gap-3">
            <button type="button" onClick={handleBack} className="btn-outline px-4 py-2.5">
              <ArrowLeft size={15} />
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center py-2.5 disabled:opacity-60">
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Creating account…
                </>
              ) : (
                <>Create Account <ArrowRight size={16} /></>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SignupPage;
