/**
 * AuthGateModal — shown when a guest clicks a protected marketplace action.
 *
 * Features:
 *   • Full-screen backdrop with backdrop-blur
 *   • Deep navy / Equinox purple design
 *   • Inline login (email + password) or quick registration
 *   • Toggle between Sign In and Create Account modes
 *   • Dispatches loginAsync / registerAsync to the Redux auth slice
 *   • On success: calls onAuthenticated() so the parent can retry the action
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, X, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../store';
import { loginAsync, registerAsync, clearError } from '../../store/slices/authSlice';

interface AuthGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after successful login/register so the parent can retry the protected action */
  onAuthenticated?: () => void;
  /** Contextual message for why auth is required */
  actionText?: string;
}

const AuthGateModal: React.FC<AuthGateModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
  actionText = 'access this feature',
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((s: RootState) => s.auth);

  const [mode, setMode]               = useState<'login' | 'register'>('login');
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [localError, setLocalError]   = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setForm({ name: '', email: '', password: '', confirm: '' });
    setLocalError('');
    dispatch(clearError());
  };

  const switchMode = (next: 'login' | 'register') => {
    resetForm();
    setMode(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    dispatch(clearError());

    if (mode === 'register') {
      if (form.password !== form.confirm) {
        setLocalError('Passwords do not match.');
        return;
      }
      if (form.password.length < 8) {
        setLocalError('Password must be at least 8 characters.');
        return;
      }
      const res = await dispatch(registerAsync({
        name: form.name,
        email: form.email,
        password: form.password,
        role: 'BUYER',
      }));
      if (registerAsync.fulfilled.match(res)) {
        resetForm();
        onAuthenticated?.();
        onClose();
      }
    } else {
      const res = await dispatch(loginAsync({ email: form.email, password: form.password }));
      if (loginAsync.fulfilled.match(res)) {
        resetForm();
        onAuthenticated?.();
        onClose();
      }
    }
  };

  const displayError = localError || error || '';

  return (
    <>
      {/* ── Backdrop ─────────────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-50 bg-[#0f172a]/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* ── Card ──────────────────────────────────────────────────────────── */}
        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

          {/* Header gradient bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-primary-500 via-secondary-500 to-violet-500" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-surface-100 hover:bg-surface-200 flex items-center justify-center transition-colors z-10"
          >
            <X size={15} className="text-surface-600" />
          </button>

          <div className="p-8">
            {/* Icon + headline */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-200">
                <ShieldCheck size={28} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-surface-900 mb-1">
                {mode === 'login' ? 'Welcome Back' : 'Create Your Buyer Account'}
              </h2>
              <p className="text-xs text-surface-500 leading-relaxed max-w-xs mx-auto">
                To protect our ecosystem and your brand data, please sign in to {actionText}.
              </p>
            </div>

            {/* Tab toggle */}
            <div className="flex gap-1 bg-surface-100 p-1 rounded-xl mb-6">
              {(['login', 'register'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                    mode === m
                      ? 'bg-white text-surface-900 shadow-sm'
                      : 'text-surface-500 hover:text-surface-700'
                  }`}
                >
                  {m === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>

            {/* Error */}
            {displayError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2.5 mb-4">
                {displayError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'register' && (
                <div>
                  <label className="text-xs font-medium text-surface-600 mb-1 block">Full Name</label>
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="input-field text-sm w-full"
                    placeholder="Your name"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-surface-600 mb-1 block">Email</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input-field text-sm w-full"
                  placeholder="you@brand.com"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-surface-600 mb-1 block">Password</label>
                <div className="relative">
                  <input
                    required
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="input-field text-sm w-full pr-10"
                    placeholder={mode === 'register' ? 'Min. 8 characters' : 'Your password'}
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

              {mode === 'register' && (
                <div>
                  <label className="text-xs font-medium text-surface-600 mb-1 block">Confirm Password</label>
                  <div className="relative">
                    <input
                      required
                      type={showConfirm ? 'text' : 'password'}
                      value={form.confirm}
                      onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                      className="input-field text-sm w-full pr-10"
                      placeholder="Repeat password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                    >
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-60 mt-2"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    {mode === 'login' ? 'Sign In' : 'Create Buyer Account'}
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-5 pt-5 border-t border-surface-100 text-center space-y-2">
              {mode === 'login' ? (
                <p className="text-xs text-surface-500">
                  Don't have an account?{' '}
                  <button onClick={() => switchMode('register')} className="text-primary-600 font-semibold hover:underline">
                    Sign up free
                  </button>
                </p>
              ) : (
                <p className="text-xs text-surface-500">
                  Already have an account?{' '}
                  <button onClick={() => switchMode('login')} className="text-primary-600 font-semibold hover:underline">
                    Sign in
                  </button>
                </p>
              )}
              <p className="text-xs text-surface-400">
                Or{' '}
                <Link to="/get-started" onClick={onClose} className="text-secondary-600 font-semibold hover:underline">
                  start the guided onboarding
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthGateModal;
