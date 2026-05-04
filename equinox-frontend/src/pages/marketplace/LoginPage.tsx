import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, ArrowRight,
  Shield, CheckCircle, BarChart2, Zap,
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../store';
import { loginAsync } from '../../store/slices/authSlice';

const ROLE_REDIRECT: Record<string, string> = {
  admin: '/admin', provider: '/provider', buyer: '/buyer', employee: '/employee', guest: '/',
};

const FEATURES = [
  { icon: <Shield size={15} />,      text: 'Verified service providers' },
  { icon: <CheckCircle size={15} />, text: 'SLA-backed contracts' },
  { icon: <BarChart2 size={15} />,   text: 'Real-time project tracking' },
  { icon: <Zap size={15} />,         text: 'AI-powered matching & insights' },
];

const LoginPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [form, setForm]         = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    const result = await dispatch(loginAsync({ email: form.email, password: form.password }));
    if (loginAsync.fulfilled.match(result)) {
      navigate(ROLE_REDIRECT[result.payload.role] || '/buyer');
    } else {
      setError((result.payload as string) || 'Invalid email or password');
    }
    setLoading(false);
  };

  return (
    <div className="flex rounded-3xl shadow-2xl overflow-hidden bg-white min-h-[600px]">

      {/* ── LEFT PANEL — brand ─────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col w-[420px] flex-shrink-0 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700 p-10 relative overflow-hidden">
        {/* decorative blobs */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute top-1/2 right-0 w-32 h-64 bg-white/3 rounded-full pointer-events-none" />

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 mb-12 relative z-10">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white font-bold text-sm border border-white/30">
            EQ
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">Equinox</span>
        </Link>

        <div className="flex-1 relative z-10">
          <h2 className="text-3xl font-bold text-white leading-tight mb-4">
            The enterprise marketplace for service excellence
          </h2>
          <p className="text-primary-200 text-sm leading-relaxed mb-10">
            Connect with 500+ verified providers across tech, design, marketing and more. Transparent pricing, guaranteed results.
          </p>

          <div className="space-y-3.5">
            {FEATURES.map(f => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-white flex-shrink-0">
                  {f.icon}
                </div>
                <span className="text-sm text-primary-100">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial card */}
        <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20 mt-10">
          <div className="flex gap-0.5 mb-3">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-amber-400 text-xs">★</span>
            ))}
          </div>
          <p className="text-white/90 text-sm leading-relaxed italic mb-4">
            "Equinox cut our vendor management overhead by 60%. The AI insights feature alone is worth the subscription."
          </p>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-semibold text-xs border border-white/20">
              RT
            </div>
            <div>
              <p className="text-white text-xs font-semibold">Rania Tarek</p>
              <p className="text-primary-300 text-xs">VP Marketing, Savola Group</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — form ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center p-8 md:p-12 bg-white">

        {/* Mobile logo */}
        <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">EQ</div>
          <span className="text-xl font-bold text-surface-900">Equinox</span>
        </Link>

        <div className="max-w-sm w-full mx-auto">
          <h2 className="text-2xl font-bold text-surface-900 mb-1">Welcome back</h2>
          <p className="text-surface-500 text-sm mb-8">Sign in to your Equinox account</p>

          {/* Email / password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100 flex items-start gap-2">
                <span className="mt-0.5 flex-shrink-0">⚠️</span>
                {error}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-surface-700 mb-1.5 block">Email address</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@company.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-surface-700">Password</label>
                <span className="text-xs text-primary-600 hover:underline cursor-pointer">Forgot password?</span>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-surface-500 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary-600 font-medium hover:underline">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
