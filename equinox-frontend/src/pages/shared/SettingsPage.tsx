import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  User, Bell, Lock, CreditCard, Save, Camera,
  ShieldCheck, ShieldAlert, Clock, Plus, Trash2, ExternalLink, FileText,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/useAppSelector';
import { usersService } from '../../services/users.service';
import { authService } from '../../services/auth.service';
import { providersService } from '../../services/providers.service';
import { fetchMeAsync } from '../../store/slices/authSlice';
import { useApi } from '../../hooks/useApi';
import toast from 'react-hot-toast';

const BASE_TABS = [
  { id: 'profile',       label: 'Profile',       icon: <User size={16} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  { id: 'security',      label: 'Security',       icon: <Lock size={16} /> },
  { id: 'billing',       label: 'Billing',        icon: <CreditCard size={16} /> },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  UNVERIFIED: { label: 'Not Applied',   color: 'bg-surface-100 text-surface-600',  icon: <FileText size={14} /> },
  PENDING:    { label: 'Under Review',  color: 'bg-amber-100 text-amber-700',      icon: <Clock size={14} /> },
  VERIFIED:   { label: 'Verified',      color: 'bg-emerald-100 text-emerald-700',  icon: <ShieldCheck size={14} /> },
  REJECTED:   { label: 'Not Approved',  color: 'bg-red-100 text-red-700',          icon: <ShieldAlert size={14} /> },
};

// ─── Verification Tab ─────────────────────────────────────────────────────────

const VerificationTab: React.FC = () => {
  const { data: profile, refetch } = useApi(() => providersService.getMyProfile(), []);

  const verificationStatus = (profile as Record<string, unknown>)?.verificationStatus as string ?? 'UNVERIFIED';
  const rejectionReason    = (profile as Record<string, unknown>)?.rejectionReason    as string | undefined;
  const verifiedAt         = (profile as Record<string, unknown>)?.verifiedAt         as string | undefined;
  const storedDocs         = ((profile as Record<string, unknown>)?.documentUrls as string[]) ?? [];

  const [docUrls, setDocUrls] = useState<string[]>(['']);
  const [applying, setApplying]   = useState(false);
  const canApply = verificationStatus === 'UNVERIFIED' || verificationStatus === 'REJECTED';

  useEffect(() => {
    if (storedDocs.length > 0) setDocUrls(storedDocs);
  }, [storedDocs.join(',')]);

  const addRow    = () => setDocUrls(u => [...u, '']);
  const removeRow = (i: number) => setDocUrls(u => u.filter((_, idx) => idx !== i));
  const updateRow = (i: number, val: string) => setDocUrls(u => u.map((v, idx) => idx === i ? val : v));

  const handleApply = async () => {
    const clean = docUrls.map(u => u.trim()).filter(Boolean);
    if (clean.length === 0) { toast.error('Add at least one document link'); return; }
    setApplying(true);
    try {
      await providersService.applyForVerification(clean);
      toast.success('Verification request submitted! Our team will review within 1–2 business days.');
      refetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to submit request');
    } finally {
      setApplying(false);
    }
  };

  const statusCfg = STATUS_CONFIG[verificationStatus] ?? STATUS_CONFIG['UNVERIFIED'];

  return (
    <div className="card space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-bold text-surface-800">Provider Verification</h2>
          <p className="text-sm text-surface-500 mt-0.5">
            Verified providers appear in the public marketplace and can receive task assignments and issue invoices.
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${statusCfg.color}`}>
          {statusCfg.icon} {statusCfg.label}
        </span>
      </div>

      {/* Status-specific content */}
      {verificationStatus === 'VERIFIED' && (
        <div className="flex items-start gap-4 p-5 bg-emerald-50 border border-emerald-200 rounded-2xl">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
            <ShieldCheck size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-emerald-900">Account Verified</p>
            <p className="text-sm text-emerald-700 mt-0.5">
              Your provider account is verified and live in the Equinox marketplace.
              {verifiedAt && <> Approved on {new Date(verifiedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.</>}
            </p>
          </div>
        </div>
      )}

      {verificationStatus === 'PENDING' && (
        <div className="flex items-start gap-4 p-5 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <Clock size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-amber-900">Application Under Review</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Our Admin team is reviewing your submitted documents. You'll receive a notification once a decision is made (typically 1–2 business days).
            </p>
          </div>
        </div>
      )}

      {verificationStatus === 'REJECTED' && (
        <div className="flex items-start gap-4 p-5 bg-red-50 border border-red-200 rounded-2xl">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <ShieldAlert size={20} className="text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-red-900">Application Not Approved</p>
            {rejectionReason && (
              <p className="text-sm text-red-700 mt-0.5">
                Reason: <span className="font-medium">{rejectionReason}</span>
              </p>
            )}
            <p className="text-sm text-red-700 mt-1">
              Please address the issue, update your documents below, and re-apply.
            </p>
          </div>
        </div>
      )}

      {/* What you get */}
      {verificationStatus !== 'VERIFIED' && (
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { icon: '🛍️', title: 'Marketplace Visibility',  desc: 'Appear in public search results' },
            { icon: '📋', title: 'Task Assignments',        desc: 'Receive P0–P3 task assignments' },
            { icon: '🧾', title: 'Invoice Issuance',        desc: 'Create and send invoices to buyers' },
          ].map(b => (
            <div key={b.title} className="flex items-start gap-3 p-4 bg-surface-50 rounded-xl border border-surface-200">
              <span className="text-xl">{b.icon}</span>
              <div>
                <p className="text-xs font-semibold text-surface-800">{b.title}</p>
                <p className="text-xs text-surface-500 mt-0.5">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document submission — shown when can apply */}
      {canApply && (
        <div className="space-y-4 border-t border-surface-100 pt-4">
          <div>
            <h3 className="font-semibold text-surface-800 text-sm mb-1">Submit Verification Documents</h3>
            <p className="text-xs text-surface-500">
              Share links to your business registration certificate, tax documents, or government-issued ID.
              Use Google Drive, Dropbox, or OneDrive and ensure links are set to "Anyone with the link can view."
            </p>
          </div>

          <div className="space-y-2">
            {docUrls.map((url, i) => (
              <div key={i} className="flex items-center gap-2">
                <ExternalLink size={15} className="text-surface-400 shrink-0" />
                <input
                  type="url"
                  className="input-field text-sm flex-1"
                  placeholder="https://drive.google.com/file/d/..."
                  value={url}
                  onChange={e => updateRow(i, e.target.value)}
                />
                {docUrls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-surface-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-2 text-xs text-primary-600 hover:text-primary-700 font-medium mt-1"
            >
              <Plus size={13} /> Add another document
            </button>
          </div>

          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <FileText size={16} className="text-blue-600 shrink-0" />
            <p className="text-xs text-blue-700">
              Accepted: Business Registration Certificate, Trade License, Tax Registration Number (TRN), Government-issued ID of the director.
            </p>
          </div>

          <button
            onClick={handleApply}
            disabled={applying}
            className="btn-primary text-sm disabled:opacity-60"
          >
            {applying ? (
              <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Submitting…</>
            ) : (
              <><ShieldCheck size={15} /> {verificationStatus === 'REJECTED' ? 'Re-Apply for Verification' : 'Apply for Verification'}</>
            )}
          </button>
        </div>
      )}

      {/* Stored docs (read-only for PENDING/VERIFIED) */}
      {!canApply && storedDocs.length > 0 && (
        <div className="border-t border-surface-100 pt-4">
          <h3 className="font-semibold text-surface-800 text-sm mb-3">Submitted Documents</h3>
          <div className="space-y-2">
            {storedDocs.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 underline underline-offset-2"
              >
                <ExternalLink size={13} /> Document {i + 1}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main SettingsPage ────────────────────────────────────────────────────────

const SettingsPage: React.FC = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(s => s.auth);

  const isProvider = user?.role === 'provider';

  const TABS = [
    ...BASE_TABS,
    ...(isProvider ? [{ id: 'verification', label: 'Verification', icon: <ShieldCheck size={16} /> }] : []),
  ];

  // Support ?tab=verification deep-link from dashboard
  const defaultTab = (() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('tab');
    return TABS.find(tab => tab.id === t) ? t! : 'profile';
  })();

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [profile, setProfile] = useState({
    name: '', email: '', company: '', phone: '', timezone: 'GMT+4', language: 'English',
  });
  const [avatarSrc, setAvatarSrc] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    authService.me().then(u => {
      const avatar = (u as Record<string, unknown>).avatar as string | undefined;
      setProfile({
        name:     u.name     || '',
        email:    u.email    || '',
        company:  (u as Record<string, unknown>).company  as string || '',
        phone:    (u as Record<string, unknown>).phone    as string || '',
        timezone: (u as Record<string, unknown>).timezone as string || 'GMT+4',
        language: (u as Record<string, unknown>).language as string || 'English',
      });
      if (avatar && (avatar.startsWith('data:') || avatar.startsWith('http'))) setAvatarSrc(avatar);
    }).catch(() => {
      setProfile(p => ({ ...p, name: user?.name || '', email: user?.email || '' }));
    }).finally(() => setLoadingProfile(false));
  }, [user?.id]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 256;
        const ctx = canvas.getContext('2d')!;
        const min = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, 256, 256);
        setAvatarSrc(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await usersService.updateProfile({
        name: profile.name, company: profile.company, phone: profile.phone,
        timezone: profile.timezone, language: profile.language,
        ...(avatarSrc ? { avatar: avatarSrc } : {}),
      });
      await dispatch(fetchMeAsync());
      toast.success('Profile saved');
    } catch { toast.error('Failed to save profile'); }
    finally { setSaving(false); }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.current) { toast.error('Enter your current password'); return; }
    if (passwords.next.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    if (passwords.next !== passwords.confirm) { toast.error('Passwords do not match'); return; }
    setChangingPassword(true);
    try {
      await authService.changePassword(passwords.current, passwords.next);
      toast.success('Password updated — please log in again');
      setPasswords({ current: '', next: '', confirm: '' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to update password');
    } finally { setChangingPassword(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Settings</h1>
        <p className="text-surface-500 text-sm mt-0.5">Manage your account settings and preferences.</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="card p-3 lg:col-span-1 h-fit">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors mb-0.5 ${
                activeTab === tab.id ? 'bg-primary-600 text-white' : 'text-surface-600 hover:bg-surface-100'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-3">

          {/* ── Profile ─────────────────────────────────────────────────── */}
          {activeTab === 'profile' && (
            <div className="card space-y-5">
              <h2 className="font-bold text-surface-800">Profile Information</h2>
              {loadingProfile ? (
                <div className="flex items-center gap-2 text-surface-400 text-sm py-4">
                  <span className="w-4 h-4 border-2 border-surface-200 border-t-primary-500 rounded-full animate-spin" />
                  Loading profile…
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 pb-4 border-b border-surface-100">
                    <div className="relative group">
                      {avatarSrc ? (
                        <img src={avatarSrc} alt="avatar" className="w-16 h-16 rounded-2xl object-cover" />
                      ) : (
                        <div className="w-16 h-16 bg-primary-100 text-primary-700 rounded-2xl flex items-center justify-center text-xl font-bold">
                          {profile.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Camera size={18} className="text-white" />
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </div>
                    <div>
                      <p className="font-medium text-surface-800">{profile.name}</p>
                      <p className="text-sm text-surface-500 capitalize">{user?.role} Account</p>
                      <p className="text-xs text-surface-400 mt-0.5">{profile.email}</p>
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs text-primary-600 hover:underline mt-1">
                        Change photo
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-surface-600 mb-1.5 block">Full Name</label>
                      <input className="input-field text-sm" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-surface-600 mb-1.5 block">Email</label>
                      <input type="email" className="input-field text-sm bg-surface-50 text-surface-400 cursor-not-allowed" value={profile.email} readOnly />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-surface-600 mb-1.5 block">Company</label>
                      <input className="input-field text-sm" value={profile.company} onChange={e => setProfile({ ...profile, company: e.target.value })} placeholder="Your company name" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-surface-600 mb-1.5 block">Phone</label>
                      <input className="input-field text-sm" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} placeholder="+971 50 123 4567" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-surface-600 mb-1.5 block">Timezone</label>
                      <select className="input-field text-sm" value={profile.timezone} onChange={e => setProfile({ ...profile, timezone: e.target.value })}>
                        <option>GMT+4</option><option>GMT+3</option><option>GMT+0</option><option>GMT-5</option><option>GMT+5:30</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-surface-600 mb-1.5 block">Language</label>
                      <select className="input-field text-sm" value={profile.language} onChange={e => setProfile({ ...profile, language: e.target.value })}>
                        <option>English</option><option>Arabic</option><option>French</option><option>Hindi</option>
                      </select>
                    </div>
                  </div>

                  <button onClick={handleSaveProfile} disabled={saving} className="btn-primary text-sm disabled:opacity-60">
                    <Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── Notifications ────────────────────────────────────────────── */}
          {activeTab === 'notifications' && (
            <div className="card space-y-5">
              <h2 className="font-bold text-surface-800">Notification Preferences</h2>
              {[
                { label: 'New task assigned',    desc: 'Get notified when a task is assigned to you.' },
                { label: 'Contract updates',     desc: 'Alerts for contract status changes.' },
                { label: 'Invoice payments',     desc: 'Notifications when invoices are paid or overdue.' },
                { label: 'System announcements', desc: 'Platform updates and maintenance notices.' },
                { label: 'AI insights',          desc: 'Weekly AI-powered business insights.' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-3 border-b border-surface-100 last:border-0">
                  <div>
                    <p className="font-medium text-surface-800 text-sm">{item.label}</p>
                    <p className="text-xs text-surface-500 mt-0.5">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-10 h-5 bg-surface-200 rounded-full peer peer-checked:bg-primary-600 peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* ── Security ─────────────────────────────────────────────────── */}
          {activeTab === 'security' && (
            <div className="card space-y-5">
              <h2 className="font-bold text-surface-800">Security Settings</h2>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-surface-600 mb-1.5 block">Current Password</label>
                  <input type="password" className="input-field text-sm" placeholder="Enter current password" value={passwords.current} onChange={e => setPasswords({ ...passwords, current: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-surface-600 mb-1.5 block">New Password</label>
                  <input type="password" className="input-field text-sm" placeholder="Min. 8 characters" value={passwords.next} onChange={e => setPasswords({ ...passwords, next: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-surface-600 mb-1.5 block">Confirm New Password</label>
                  <input type="password" className="input-field text-sm" placeholder="Confirm new password" value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} />
                </div>
                <button type="submit" disabled={changingPassword} className="btn-primary text-sm disabled:opacity-60">
                  {changingPassword ? (
                    <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Updating…</>
                  ) : (
                    <><Save size={15} /> Update Password</>
                  )}
                </button>
              </form>
              <div className="border-t border-surface-200 pt-4">
                <h3 className="font-semibold text-surface-800 mb-3 text-sm">Two-Factor Authentication</h3>
                <div className="flex items-center justify-between p-4 bg-surface-50 rounded-xl border border-surface-200">
                  <div>
                    <p className="font-medium text-surface-800 text-sm">Authenticator App</p>
                    <p className="text-xs text-surface-500 mt-0.5">Use an app like Google Authenticator for 2FA.</p>
                  </div>
                  <button className="btn-outline text-xs py-1.5">Enable</button>
                </div>
              </div>
            </div>
          )}

          {/* ── Billing ──────────────────────────────────────────────────── */}
          {activeTab === 'billing' && (
            <div className="card space-y-5">
              <h2 className="font-bold text-surface-800">Billing & Subscription</h2>
              <div className="p-5 bg-primary-50 border border-primary-200 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="badge bg-primary-600 text-white">Pro Plan</span>
                  <span className="text-2xl font-bold text-primary-700">$149<span className="text-sm font-normal text-primary-500">/mo</span></span>
                </div>
                <p className="text-sm text-primary-600">Next billing date: May 1, 2026</p>
              </div>
              <div>
                <h3 className="font-semibold text-surface-800 mb-3 text-sm">Payment Methods</h3>
                {[{ label: 'Visa', last4: '4242', exp: '12/27' }, { label: 'Mastercard', last4: '8181', exp: '08/26' }].map(card => (
                  <div key={card.last4} className="flex items-center justify-between p-4 bg-surface-50 rounded-xl border border-surface-200 mb-2">
                    <div className="flex items-center gap-3">
                      <CreditCard size={18} className="text-surface-500" />
                      <div>
                        <p className="font-medium text-surface-800 text-sm">{card.label} ···· {card.last4}</p>
                        <p className="text-xs text-surface-500">Expires {card.exp}</p>
                      </div>
                    </div>
                    <button className="text-xs text-red-500 hover:underline">Remove</button>
                  </div>
                ))}
                <button className="btn-outline text-sm mt-2"><CreditCard size={15} /> Add Card</button>
              </div>
            </div>
          )}

          {/* ── Verification (PROVIDER only) ─────────────────────────────── */}
          {activeTab === 'verification' && isProvider && (
            <div className="card flex flex-col items-center gap-4 py-10 text-center">
              <ShieldCheck size={40} className="text-indigo-400" />
              <div>
                <p className="font-bold text-surface-800 text-lg">Verification has moved</p>
                <p className="text-sm text-surface-500 mt-1 max-w-sm">
                  The verification process now has its own dedicated page with a more detailed workflow.
                </p>
              </div>
              <a
                href="/provider/verification"
                className="btn-primary text-sm inline-flex items-center gap-2"
              >
                <ShieldCheck size={15} /> Go to Verification Page
              </a>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
