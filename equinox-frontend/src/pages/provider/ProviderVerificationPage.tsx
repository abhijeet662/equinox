import { useState, useEffect } from 'react';
import {
  ShieldCheck, ShieldAlert, Clock, FileText,
  Plus, Trash2, ExternalLink, CheckCircle2,
  ArrowRight, Loader2, RefreshCw, AlertTriangle,
  Building2, BadgeCheck, Store, Receipt,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { providersService } from '../../services/providers.service';
import toast from 'react-hot-toast';

// ─── Step config ──────────────────────────────────────────────────────────────

const BENEFITS = [
  { icon: <Store size={20} className="text-indigo-600" />,   bg: 'bg-indigo-50',  title: 'Marketplace Visibility',   desc: 'Appear in public search results and get discovered by buyers' },
  { icon: <BadgeCheck size={20} className="text-emerald-600" />, bg: 'bg-emerald-50', title: 'Verified Badge',          desc: 'Display a trust badge on your profile and proposals' },
  { icon: <FileText size={20} className="text-blue-600" />,    bg: 'bg-blue-50',    title: 'Task Assignments',         desc: 'Receive P0–P3 priority task assignments from buyers' },
  { icon: <Receipt size={20} className="text-amber-600" />,   bg: 'bg-amber-50',   title: 'Invoice Issuance',         desc: 'Create and send invoices to buyers for completed work' },
  { icon: <Building2 size={20} className="text-purple-600" />, bg: 'bg-purple-50',  title: 'Contract Access',          desc: 'Sign and manage service contracts on the platform' },
  { icon: <ShieldCheck size={20} className="text-rose-600" />, bg: 'bg-rose-50',    title: 'Priority Support',         desc: 'Get dedicated account support and faster response times' },
];

const ACCEPTED_DOCS = [
  { label: 'Business Registration Certificate', note: 'Issued by your local authority' },
  { label: 'Trade License',                     note: 'Valid and current' },
  { label: 'Tax Registration Number (TRN)',     note: 'Government-issued document' },
  { label: "Director's Government-issued ID",   note: 'Passport, national ID, or driving licence' },
];

const STATUS_MAP = {
  UNVERIFIED: {
    color: 'text-gray-600',
    bg:    'bg-gray-100',
    border:'border-gray-200',
    label: 'Not Applied',
    icon:  <FileText size={16} />,
  },
  PENDING: {
    color: 'text-amber-700',
    bg:    'bg-amber-100',
    border:'border-amber-200',
    label: 'Under Review',
    icon:  <Clock size={16} />,
  },
  VERIFIED: {
    color: 'text-emerald-700',
    bg:    'bg-emerald-100',
    border:'border-emerald-200',
    label: 'Verified',
    icon:  <ShieldCheck size={16} />,
  },
  REJECTED: {
    color: 'text-red-700',
    bg:    'bg-red-100',
    border:'border-red-200',
    label: 'Not Approved',
    icon:  <ShieldAlert size={16} />,
  },
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProviderVerificationPage() {
  const { data: profile, loading: profileLoading, refetch } = useApi(
    () => providersService.getMyProfile(),
    [],
  );

  const verificationStatus: string = (profile as Record<string, unknown>)?.verificationStatus as string ?? 'UNVERIFIED';
  const rejectionReason             = (profile as Record<string, unknown>)?.rejectionReason    as string | undefined;
  const verifiedAt                  = (profile as Record<string, unknown>)?.verifiedAt         as string | undefined;
  const storedDocs                  = ((profile as Record<string, unknown>)?.documentUrls      as string[]) ?? [];

  const [docUrls,   setDocUrls]   = useState<string[]>(['']);
  const [applying,  setApplying]  = useState(false);

  const canApply = verificationStatus === 'UNVERIFIED' || verificationStatus === 'REJECTED';
  const statusCfg = STATUS_MAP[verificationStatus as keyof typeof STATUS_MAP] ?? STATUS_MAP.UNVERIFIED;

  // Pre-fill stored docs when profile loads
  useEffect(() => {
    if (storedDocs.length > 0) setDocUrls(storedDocs);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedDocs.join(',')]);

  const addRow    = () => setDocUrls(u => [...u, '']);
  const removeRow = (i: number) => setDocUrls(u => u.filter((_, idx) => idx !== i));
  const updateRow = (i: number, val: string) =>
    setDocUrls(u => u.map((v, idx) => (idx === i ? val : v)));

  const handleApply = async () => {
    const clean = docUrls.map(u => u.trim()).filter(Boolean);
    if (clean.length === 0) {
      toast.error('Please add at least one document link before submitting');
      return;
    }
    setApplying(true);
    try {
      await providersService.applyForVerification(clean);
      toast.success('Verification request submitted! Our team will review within 1–2 business days.', { duration: 5000 });
      refetch();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to submit verification request';
      toast.error(msg);
    } finally {
      setApplying(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-surface-400">
        <Loader2 className="animate-spin mr-2" size={22} />
        Loading verification status…
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
            <ShieldCheck size={24} className="text-indigo-600" />
            Provider Verification
          </h1>
          <p className="text-surface-500 text-sm mt-1">
            Get verified to unlock the full Equinox marketplace, task assignments, and invoicing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
            {statusCfg.icon} {statusCfg.label}
          </span>
          <button
            onClick={refetch}
            className="p-2 rounded-lg border border-surface-200 hover:bg-surface-50 transition-colors text-surface-500"
            title="Refresh status"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* ── Status banner ─────────────────────────────────────────────────────── */}
      {verificationStatus === 'VERIFIED' && (
        <div className="flex items-center gap-4 p-5 bg-emerald-50 border border-emerald-200 rounded-2xl">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
            <ShieldCheck size={24} className="text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-emerald-900 text-lg">Your account is verified ✓</p>
            <p className="text-sm text-emerald-700 mt-0.5">
              You are live on the Equinox marketplace and can receive task assignments and issue invoices.
              {verifiedAt && (
                <> Approved on {new Date(verifiedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.</>
              )}
            </p>
          </div>
          <CheckCircle2 size={32} className="text-emerald-400 shrink-0" />
        </div>
      )}

      {verificationStatus === 'PENDING' && (
        <div className="flex items-start gap-4 p-5 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <Clock size={24} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-amber-900">Application Under Review</p>
            <p className="text-sm text-amber-700 mt-1">
              Your documents have been submitted and are being reviewed by our compliance team.
              This typically takes <strong>1–2 business days</strong>. You'll receive a notification once a
              decision is made.
            </p>
            {storedDocs.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-xs font-semibold text-amber-800">Submitted documents:</p>
                {storedDocs.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-900 hover:underline"
                  >
                    <ExternalLink size={11} /> Document {i + 1}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {verificationStatus === 'REJECTED' && (
        <div className="flex items-start gap-4 p-5 bg-red-50 border border-red-200 rounded-2xl">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <ShieldAlert size={24} className="text-red-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-red-900">Application Not Approved</p>
            {rejectionReason && (
              <p className="text-sm text-red-700 mt-1">
                <strong>Reason:</strong> {rejectionReason}
              </p>
            )}
            <p className="text-sm text-red-700 mt-1">
              Please review the feedback above, update your documents in the form below, and re-apply.
            </p>
          </div>
          <AlertTriangle size={24} className="text-red-400 shrink-0" />
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-8">
        {/* ── Left: form ──────────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-6">

          {/* Document submission form */}
          {canApply && (
            <div className="card space-y-5">
              <div>
                <h2 className="font-bold text-surface-800 flex items-center gap-2">
                  <FileText size={18} className="text-indigo-500" />
                  {verificationStatus === 'REJECTED' ? 'Update & Re-submit Documents' : 'Submit Verification Documents'}
                </h2>
                <p className="text-xs text-surface-500 mt-1">
                  Share publicly-accessible links to your documents (Google Drive, Dropbox, OneDrive).
                  Set sharing to <em>"Anyone with the link can view."</em>
                </p>
              </div>

              {/* Accepted doc types */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-blue-800 mb-2">Accepted document types:</p>
                {ACCEPTED_DOCS.map(d => (
                  <div key={d.label} className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="text-blue-500 mt-0.5 shrink-0" />
                    <span className="text-xs text-blue-700">
                      <strong>{d.label}</strong> — {d.note}
                    </span>
                  </div>
                ))}
              </div>

              {/* URL rows */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-surface-600">Document links</p>
                {docUrls.map((url, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-surface-100 flex items-center justify-center text-xs font-bold text-surface-500 shrink-0">
                      {i + 1}
                    </div>
                    <div className="relative flex-1">
                      <ExternalLink size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
                      <input
                        type="url"
                        className="input-field text-sm pl-9 w-full"
                        placeholder="https://drive.google.com/file/d/..."
                        value={url}
                        onChange={e => updateRow(i, e.target.value)}
                      />
                    </div>
                    {docUrls.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-surface-400 hover:text-red-500 transition-colors shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addRow}
                  className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium mt-2 transition-colors"
                >
                  <Plus size={13} /> Add another document
                </button>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Ensure all links remain accessible throughout the review period. Expired or broken links will delay approval.
                </p>
              </div>

              {/* Submit button */}
              <button
                onClick={handleApply}
                disabled={applying}
                className="btn-primary w-full text-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {applying ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    {verificationStatus === 'REJECTED' ? 'Re-Apply for Verification' : 'Apply for Verification'}
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          )}

          {/* How it works */}
          <div className="card space-y-4">
            <h2 className="font-bold text-surface-800">How Verification Works</h2>
            <div className="space-y-4">
              {[
                { step: '1', title: 'Submit Documents',    desc: 'Upload links to your business registration or trade license.' },
                { step: '2', title: 'Admin Review',        desc: 'Our compliance team reviews your documents within 1–2 business days.' },
                { step: '3', title: 'Get Notified',        desc: "You'll receive an in-app notification and email with the decision." },
                { step: '4', title: 'Go Live',             desc: 'Once approved, your profile is live and you can start earning.' },
              ].map((s, i, arr) => (
                <div key={s.step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold shrink-0">
                      {s.step}
                    </div>
                    {i < arr.length - 1 && <div className="w-px flex-1 bg-surface-200 mt-1" />}
                  </div>
                  <div className="pb-4">
                    <p className="font-semibold text-surface-800 text-sm">{s.title}</p>
                    <p className="text-xs text-surface-500 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: benefits ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <h2 className="font-bold text-surface-800 mb-4">
              {verificationStatus === 'VERIFIED' ? 'Your Verified Benefits' : 'What You Unlock'}
            </h2>
            <div className="space-y-3">
              {BENEFITS.map(b => (
                <div key={b.title} className="flex items-start gap-3">
                  <div className={`w-9 h-9 ${b.bg} rounded-xl flex items-center justify-center shrink-0`}>
                    {b.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-surface-800 flex items-center gap-1">
                      {b.title}
                      {verificationStatus === 'VERIFIED' && (
                        <CheckCircle2 size={13} className="text-emerald-500" />
                      )}
                    </p>
                    <p className="text-xs text-surface-500 mt-0.5">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SLA note */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-indigo-800 mb-1">Review SLA</p>
            <p className="text-xs text-indigo-700">
              All verification requests are reviewed within <strong>1–2 business days</strong>.
              Submissions received after 5 PM UAE time will be processed the next business day.
            </p>
          </div>

          {/* FAQ */}
          <div className="card space-y-3">
            <p className="text-xs font-bold text-surface-700 uppercase tracking-wide">FAQ</p>
            {[
              {
                q: 'Can I work without being verified?',
                a: 'You can set up your profile but you won\'t appear in marketplace search or receive task assignments until verified.',
              },
              {
                q: 'How many documents do I need?',
                a: 'At least one valid business document is required. Providing more improves approval speed.',
              },
              {
                q: 'What if my application is rejected?',
                a: 'You\'ll receive a reason. Address the issue, update your documents, and re-apply — there\'s no limit on attempts.',
              },
            ].map(faq => (
              <div key={faq.q} className="border-b border-surface-100 pb-3 last:border-0 last:pb-0">
                <p className="text-xs font-semibold text-surface-700">{faq.q}</p>
                <p className="text-xs text-surface-500 mt-1">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
