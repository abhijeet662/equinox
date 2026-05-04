/**
 * GetStartedPage — /get-started
 *
 * 3-step brand onboarding wizard:
 *   Step 1 — Business Profile  (brand name, website, monthly revenue, platform)
 *   Step 2 — Needs Assessment  (services needed, team size, pain point)
 *   Step 3 — Account Creation  (name, email, password → registerAsync as BUYER)
 *
 * Framer Motion slide transitions between steps.
 * On success: dispatches registerAsync then redirects to /buyer.
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Globe,
  TrendingUp,
  ShoppingBag,
  CheckSquare,
  Users,
  Zap,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../store';
import { registerAsync, clearError } from '../../store/slices/authSlice';

// ─── Constants ────────────────────────────────────────────────────────────────

const REVENUE_OPTIONS = [
  'Under ₹5L / month',
  '₹5L – ₹25L / month',
  '₹25L – ₹1Cr / month',
  'Over ₹1Cr / month',
  'Not yet selling',
];

const PLATFORM_OPTIONS = [
  { id: 'amazon',   label: 'Amazon' },
  { id: 'flipkart', label: 'Flipkart' },
  { id: 'shopify',  label: 'Shopify' },
  { id: 'meesho',   label: 'Meesho' },
  { id: 'myntra',   label: 'Myntra' },
  { id: 'nykaa',    label: 'Nykaa' },
  { id: 'own',      label: 'Own website' },
  { id: 'other',    label: 'Other' },
];

const SERVICE_OPTIONS = [
  { id: 'catalog',     label: 'Catalog & Content', icon: '📋' },
  { id: 'ads',         label: 'Ads & Performance', icon: '📈' },
  { id: 'account',     label: 'Account Management', icon: '🛡️' },
  { id: 'logistics',   label: 'Logistics & FBA', icon: '📦' },
  { id: 'design',      label: 'Creative & Design', icon: '🎨' },
  { id: 'returns',     label: 'Returns Management', icon: '🔄' },
  { id: 'analytics',   label: 'Analytics & Reporting', icon: '📊' },
  { id: 'compliance',  label: 'Compliance & Legal', icon: '⚖️' },
];

const TEAM_SIZES = ['Just me', '2–5', '6–20', '21–50', '50+'];

const PAIN_POINTS = [
  "Wasted budget on ads that don't convert",
  'Inconsistent catalog quality across platforms',
  'No visibility into performance metrics',
  'Struggled with managing multiple agencies',
  'SLA breaches costing time and revenue',
  'Scaling without trusted service partners',
];

// ─── Animation variants ───────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface OptionChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  icon?: string;
}

const OptionChip: React.FC<OptionChipProps> = ({ label, selected, onClick, icon }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
      selected
        ? 'border-primary-500 bg-primary-50 text-primary-700'
        : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300 hover:bg-surface-50'
    }`}
  >
    {icon && <span>{icon}</span>}
    {label}
    {selected && <CheckCircle2 size={13} className="text-primary-500 ml-auto" />}
  </button>
);

// ─── Step progress bar ─────────────────────────────────────────────────────────

interface StepBarProps { current: number; total: number; }

const StepBar: React.FC<StepBarProps> = ({ current, total }) => (
  <div className="flex items-center gap-2 mb-8">
    {Array.from({ length: total }).map((_, i) => (
      <React.Fragment key={i}>
        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
          i < current
            ? 'bg-primary-600 text-white'
            : i === current
            ? 'bg-gradient-to-br from-primary-600 to-secondary-600 text-white shadow-md shadow-primary-200'
            : 'bg-surface-100 text-surface-400'
        }`}>
          {i < current ? <CheckCircle2 size={14} /> : i + 1}
        </div>
        {i < total - 1 && (
          <div className={`flex-1 h-0.5 rounded-full transition-all ${i < current ? 'bg-primary-500' : 'bg-surface-200'}`} />
        )}
      </React.Fragment>
    ))}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const GetStartedPage: React.FC = () => {
  const navigate   = useNavigate();
  const dispatch   = useDispatch<AppDispatch>();
  const { loading, error: authError } = useSelector((s: RootState) => s.auth);

  const [step, setStep]   = useState(0);
  const [dir, setDir]     = useState(1);
  const [showPass, setShowPass] = useState(false);
  const [localError, setLocalError] = useState('');

  // Step 1 state
  const [brandName, setBrandName]   = useState('');
  const [website, setWebsite]       = useState('');
  const [revenue, setRevenue]       = useState('');
  const [platforms, setPlatforms]   = useState<string[]>([]);

  // Step 2 state
  const [services, setServices]     = useState<string[]>([]);
  const [teamSize, setTeamSize]     = useState('');
  const [painPoint, setPainPoint]   = useState('');

  // Step 3 state
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const toggleArr = (arr: string[], val: string, set: (v: string[]) => void) => {
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const goNext = () => { setDir(1); setStep(s => s + 1); };
  const goBack = () => { setDir(-1); setStep(s => s - 1); };

  const step1Valid = brandName.trim().length > 0 && revenue !== '' && platforms.length > 0;
  const step2Valid = services.length > 0 && teamSize !== '';

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    dispatch(clearError());

    if (password !== confirm) { setLocalError('Passwords do not match.'); return; }
    if (password.length < 8)  { setLocalError('Password must be at least 8 characters.'); return; }

    const res = await dispatch(registerAsync({
      name,
      email,
      password,
      role: 'BUYER',
    }));

    if (registerAsync.fulfilled.match(res)) {
      navigate('/buyer');
    }
  };

  const displayError = localError || authError || '';

  const STEP_LABELS = ['Business Profile', 'Needs Assessment', 'Create Account'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] flex flex-col items-center justify-center px-4 py-12">

      {/* Logo strip */}
      <Link to="/" className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
          <Zap size={16} className="text-white" />
        </div>
        <span className="text-white font-bold text-lg tracking-tight">Equinox</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Gradient bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary-500 via-secondary-500 to-violet-500" />

        <div className="p-8">
          {/* Header */}
          <div className="mb-2">
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">
              Step {step + 1} of {STEP_LABELS.length}
            </p>
            <h1 className="text-2xl font-extrabold text-surface-900 tracking-tight">
              {STEP_LABELS[step]}
            </h1>
          </div>

          <StepBar current={step} total={STEP_LABELS.length} />

          {/* Animated step content */}
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeInOut' }}
            >
              {/* ── STEP 1: Business Profile ─────────────────────────────── */}
              {step === 0 && (
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-medium text-surface-600 mb-1 block flex items-center gap-1.5">
                      <Building2 size={12} /> Brand / Company Name *
                    </label>
                    <input
                      value={brandName}
                      onChange={e => setBrandName(e.target.value)}
                      className="input-field text-sm w-full"
                      placeholder="e.g. Ferns & Petals"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-surface-600 mb-1 block flex items-center gap-1.5">
                      <Globe size={12} /> Website{' '}
                      <span className="text-surface-400 font-normal">(optional)</span>
                    </label>
                    <input
                      value={website}
                      onChange={e => setWebsite(e.target.value)}
                      className="input-field text-sm w-full"
                      placeholder="https://yourbrand.com"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-surface-600 mb-1.5 block flex items-center gap-1.5">
                      <TrendingUp size={12} /> Monthly Revenue Range *
                    </label>
                    <div className="flex flex-col gap-1.5">
                      {REVENUE_OPTIONS.map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRevenue(r)}
                          className={`text-left px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                            revenue === r
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-surface-200 text-surface-600 hover:border-surface-300'
                          }`}
                        >
                          {r}
                          {revenue === r && <CheckCircle2 size={13} className="inline ml-2 text-primary-500" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-surface-600 mb-1.5 block flex items-center gap-1.5">
                      <ShoppingBag size={12} /> Primary Sales Platform(s) *
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PLATFORM_OPTIONS.map(p => (
                        <OptionChip
                          key={p.id}
                          label={p.label}
                          selected={platforms.includes(p.id)}
                          onClick={() => toggleArr(platforms, p.id, setPlatforms)}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={goNext}
                    disabled={!step1Valid}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md disabled:opacity-40 mt-2"
                  >
                    Next: Needs Assessment <ArrowRight size={14} />
                  </button>
                </div>
              )}

              {/* ── STEP 2: Needs Assessment ─────────────────────────────── */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-medium text-surface-600 mb-1.5 block flex items-center gap-1.5">
                      <CheckSquare size={12} /> Which services do you need? * (pick all that apply)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {SERVICE_OPTIONS.map(s => (
                        <OptionChip
                          key={s.id}
                          label={s.label}
                          icon={s.icon}
                          selected={services.includes(s.id)}
                          onClick={() => toggleArr(services, s.id, setServices)}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-surface-600 mb-1.5 block flex items-center gap-1.5">
                      <Users size={12} /> Team Size *
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {TEAM_SIZES.map(t => (
                        <OptionChip
                          key={t}
                          label={t}
                          selected={teamSize === t}
                          onClick={() => setTeamSize(t)}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-surface-600 mb-1.5 block">
                      Biggest Pain Point{' '}
                      <span className="text-surface-400 font-normal">(optional — helps us match providers)</span>
                    </label>
                    <div className="flex flex-col gap-1.5">
                      {PAIN_POINTS.map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPainPoint(prev => prev === p ? '' : p)}
                          className={`text-left px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                            painPoint === p
                              ? 'border-secondary-500 bg-secondary-50 text-secondary-700'
                              : 'border-surface-200 text-surface-600 hover:border-surface-300'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={goBack}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-surface-200 text-sm font-semibold text-surface-600 hover:bg-surface-50 transition-all"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <button
                      onClick={goNext}
                      disabled={!step2Valid}
                      className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md disabled:opacity-40"
                    >
                      Next: Create Account <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 3: Account Creation ─────────────────────────────── */}
              {step === 2 && (
                <form onSubmit={handleRegister} className="space-y-4">
                  {/* Context recap */}
                  <div className="bg-surface-50 rounded-2xl p-3 flex gap-3 items-start border border-surface-200">
                    <ShieldCheck size={16} className="text-primary-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-surface-600 leading-relaxed">
                      Creating a <span className="font-semibold text-surface-800">Buyer account</span> for{' '}
                      <span className="font-semibold text-surface-800">{brandName || 'your brand'}</span>.
                      You'll be able to browse providers, send proposals, and manage contracts.
                    </p>
                  </div>

                  {displayError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2.5">
                      {displayError}
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-medium text-surface-600 mb-1 block flex items-center gap-1.5">
                      <User size={12} /> Full Name *
                    </label>
                    <input
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="input-field text-sm w-full"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-surface-600 mb-1 block flex items-center gap-1.5">
                      <Mail size={12} /> Work Email *
                    </label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="input-field text-sm w-full"
                      placeholder="you@brand.com"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-surface-600 mb-1 block flex items-center gap-1.5">
                      <Lock size={12} /> Password *
                    </label>
                    <div className="relative">
                      <input
                        required
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="input-field text-sm w-full pr-10"
                        placeholder="Min. 8 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                      >
                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-surface-600 mb-1 block">Confirm Password *</label>
                    <input
                      required
                      type="password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      className="input-field text-sm w-full"
                      placeholder="Repeat password"
                    />
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={goBack}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-surface-200 text-sm font-semibold text-surface-600 hover:bg-surface-50 transition-all"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md disabled:opacity-60"
                    >
                      {loading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <>Create Buyer Account <ArrowRight size={14} /></>
                      )}
                    </button>
                  </div>

                  <p className="text-center text-xs text-surface-400 pt-1">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary-600 font-semibold hover:underline">Sign in</Link>
                  </p>
                </form>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer note */}
      <p className="mt-6 text-xs text-surface-500 text-center">
        By creating an account you agree to Equinox's{' '}
        <span className="text-surface-300 hover:underline cursor-pointer">Terms of Service</span>
        {' '}and{' '}
        <span className="text-surface-300 hover:underline cursor-pointer">Privacy Policy</span>.
      </p>
    </div>
  );
};

export default GetStartedPage;
