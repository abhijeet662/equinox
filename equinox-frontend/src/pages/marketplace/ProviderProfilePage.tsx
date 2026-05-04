import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star, CheckCircle, MapPin, Calendar,
  ArrowLeft, ExternalLink, MessageSquare, Heart,
  LogIn, UserPlus, BadgeCheck, Info, ShieldCheck,
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import ProgressBar from '../../components/ui/ProgressBar';
import { useApi } from '../../hooks/useApi';
import { providersService } from '../../services/providers.service';
import { contractsService } from '../../services/contracts.service';
import { leadsService } from '../../services/leads.service';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import toast from 'react-hot-toast';

// â”€â”€â”€ Which "mode" the modal is running in â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type SubmitMode = 'buyer' | 'guest' | 'wrong-role';

const ProviderProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useSelector((s: RootState) => s.auth.user);

  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: '', email: '', company: '', message: '', budget: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMode, setSubmitMode] = useState<SubmitMode>('guest');
  const [submittedProviderName, setSubmittedProviderName] = useState('');

  const { data: provider, loading } = useApi(() => providersService.getById(id!), [id]);

  // Determine the interaction mode whenever modal opens
  const openModal = () => {
    if (user?.role === 'buyer') {
      setSubmitMode('buyer');
    } else if (!user) {
      setSubmitMode('guest');
      // Pre-fill nothing â€” guest fills all fields
    } else {
      // Logged in as PROVIDER / EMPLOYEE / ADMIN
      setSubmitMode('wrong-role');
    }
    setShowLeadModal(true);
  };

  const closeModal = () => {
    setShowLeadModal(false);
    setSubmitted(false);
    setSubmitMode('guest');
  };

  if (loading) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold text-surface-800">Provider not found</p>
          <Link to="/providers" className="btn-primary mt-4 text-sm">Back to Providers</Link>
        </div>
      </div>
    );
  }

  const getName = () => (provider.businessName as string) || (provider.user as Record<string, string>)?.name || 'Provider';
  const getLogo = () => getName()[0]?.toUpperCase() || 'P';

  // â”€â”€â”€ Submit handler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);
    try {
      if (submitMode === 'buyer') {
        // â”€â”€ Path A: Logged-in BUYER â†’ create real contract â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        const providerUserId =
          (provider as Record<string, unknown>)?.userId as string ||
          ((provider as Record<string, unknown>)?.user as Record<string, string>)?.id;

        if (!providerUserId) {
          toast.error('Could not resolve provider ID. Please refresh and try again.');
          return;
        }

        await contractsService.create({
          title: `Proposal: ${leadForm.message.slice(0, 60)}`,
          providerId: providerUserId,
          type: 'PROJECT',
          value: 0,
          description: [
            leadForm.message,
            leadForm.budget ? `Budget: ${leadForm.budget}` : '',
            leadForm.company ? `Company: ${leadForm.company}` : '',
          ].filter(Boolean).join('\n'),
        });

        setSubmittedProviderName(getName());
        setSubmitted(true);

      } else {
        // â”€â”€ Path B: Guest (not logged in) â†’ save lead inquiry to backend â”€â”€â”€â”€â”€
        const result = await leadsService.create({
          name:       leadForm.name,
          email:      leadForm.email,
          company:    leadForm.company || undefined,
          message:    leadForm.message,
          budget:     leadForm.budget || undefined,
          providerId: id!,   // ProviderProfile ID
        });

        setSubmittedProviderName(result?.providerName || getName());
        setSubmitted(true);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to send. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // â”€â”€â”€ Modal content helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const guestBanner = (
    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
      <Info size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="text-xs text-amber-800 leading-relaxed">
        <span className="font-semibold">Browsing as guest.</span>{' '}
        Your inquiry will be delivered to the provider.{' '}
        <Link to="/signup" className="underline font-semibold hover:text-amber-900">
          Create a free Buyer account
        </Link>{' '}
        to manage contracts and track proposals.
      </div>
    </div>
  );

  const wrongRoleNotice = (
    <div className="text-center py-8 px-4">
      <div className="mb-4 flex justify-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center">
          <ShieldCheck size={28} className="text-amber-600" />
        </div>
      </div>
      <h3 className="font-bold text-surface-900 mb-2">Buyer Account Required</h3>
      <p className="text-sm text-surface-500 mb-5">
        Only Buyer accounts can send proposals and create contracts. You're currently logged in as{' '}
        <span className="font-semibold text-surface-700">{user?.role}</span>.
      </p>
      <div className="flex gap-3 justify-center">
        <Link to="/signup" className="btn-primary text-sm flex items-center gap-2">
          <UserPlus size={14} /> Create Buyer Account
        </Link>
        <button onClick={closeModal} className="btn-secondary text-sm">Close</button>
      </div>
    </div>
  );

  const successScreen = (
    <div className="text-center py-6 px-2">
      <div className="text-5xl mb-4">ðŸŽ‰</div>
      <h3 className="font-bold text-surface-900 text-lg mb-2">
        {submitMode === 'buyer' ? 'Proposal Sent!' : 'Inquiry Delivered!'}
      </h3>
      <p className="text-surface-500 text-sm mb-5 leading-relaxed">
        {submitMode === 'buyer'
          ? `A contract proposal has been created with ${submittedProviderName}. Check your Buyer dashboard to track progress.`
          : `Your message has been delivered to ${submittedProviderName}. They'll respond within 24 hours.`}
      </p>

      {submitMode !== 'buyer' && (
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 mb-5 text-left">
          <p className="text-xs font-semibold text-primary-800 mb-2">Want to do more?</p>
          <p className="text-xs text-primary-700 mb-3">
            Create your free Buyer account to track proposals, sign contracts, and manage payments â€” all in one place.
          </p>
          <div className="flex gap-2">
            <Link to="/signup" onClick={closeModal} className="flex-1 flex items-center justify-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold py-2 rounded-lg transition-colors">
              <UserPlus size={13} /> Create Free Account
            </Link>
            <Link to="/login" onClick={closeModal} className="flex-1 flex items-center justify-center gap-1.5 border border-primary-200 text-primary-700 hover:bg-primary-50 text-xs font-semibold py-2 rounded-lg transition-colors">
              <LogIn size={13} /> Sign In
            </Link>
          </div>
        </div>
      )}

      {submitMode === 'buyer' && (
        <Link to="/buyer/orders" onClick={closeModal} className="btn-primary text-sm">
          View in Dashboard
        </Link>
      )}

      <button onClick={closeModal} className={`${submitMode === 'buyer' ? 'ml-3' : ''} text-surface-400 hover:text-surface-600 text-sm underline`}>
        {submitMode === 'buyer' ? 'Close' : 'Maybe later'}
      </button>
    </div>
  );

  const proposalForm = (
    <form onSubmit={handleSubmitLead} className="space-y-4">
      {/* Guest banner â€” only shown when not logged in */}
      {submitMode === 'guest' && guestBanner}

      {/* Buyer context â€” brief note */}
      {submitMode === 'buyer' && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 mb-1">
          <BadgeCheck size={15} className="text-green-600 flex-shrink-0" />
          <p className="text-xs text-green-800">
            Submitting as <span className="font-semibold">{user?.name || 'Buyer'}</span>. This will create a trackable contract proposal.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-surface-600 mb-1 block">Full Name *</label>
          <input
            required
            className="input-field text-sm"
            placeholder="Your name"
            value={submitMode === 'buyer' ? (user?.name || '') : leadForm.name}
            readOnly={submitMode === 'buyer'}
            onChange={e => setLeadForm({ ...leadForm, name: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-surface-600 mb-1 block">Email *</label>
          <input
            required
            type="email"
            className="input-field text-sm"
            placeholder="you@company.com"
            value={submitMode === 'buyer' ? (user?.email || '') : leadForm.email}
            readOnly={submitMode === 'buyer'}
            onChange={e => setLeadForm({ ...leadForm, email: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-surface-600 mb-1 block">Company</label>
        <input
          className="input-field text-sm"
          placeholder="Company name"
          value={leadForm.company}
          onChange={e => setLeadForm({ ...leadForm, company: e.target.value })}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-surface-600 mb-1 block">Estimated Budget</label>
        <select
          className="input-field text-sm"
          value={leadForm.budget}
          onChange={e => setLeadForm({ ...leadForm, budget: e.target.value })}
        >
          <option value="">Select budget range</option>
          <option>{'< $5,000'}</option>
          <option>$5,000 â€“ $20,000</option>
          <option>$20,000 â€“ $50,000</option>
          <option>$50,000 â€“ $100,000</option>
          <option>{'> $100,000'}</option>
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-surface-600 mb-1 block">Project Description *</label>
        <textarea
          required
          rows={4}
          className="input-field text-sm resize-none"
          placeholder="Describe your project, goals, and timeline..."
          value={leadForm.message}
          onChange={e => setLeadForm({ ...leadForm, message: e.target.value })}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={closeModal} className="btn-secondary flex-1 justify-center text-sm">
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary flex-1 justify-center text-sm disabled:opacity-60"
        >
          {submitting
            ? 'Sendingâ€¦'
            : submitMode === 'buyer'
              ? 'Send Proposal'
              : 'Submit Inquiry'}
        </button>
      </div>

      {/* Bottom login nudge for guests only */}
      {submitMode === 'guest' && (
        <p className="text-center text-xs text-surface-400 pt-1">
          Already have an account?{' '}
          <Link to={`/login?redirect=/providers/${id}`} className="text-primary-600 font-semibold hover:underline">
            Sign in
          </Link>{' '}
          to send a full contract proposal.
        </p>
      )}
    </form>
  );

  // â”€â”€â”€ Page render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <div className="pt-20 min-h-screen bg-surface-50">
      {/* Back nav */}
      <div className="bg-white border-b border-surface-200">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-surface-500 hover:text-surface-800 transition-colors">
            <ArrowLeft size={16} /> Back to Providers
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* â”€â”€ Main content â”€â”€ */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header card */}
            <div className="bg-white rounded-2xl border border-surface-200 p-6 md:p-8">
              <div className="flex items-start gap-5">
                <div className="w-20 h-20 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-2xl flex-shrink-0">
                  {getLogo()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h1 className="text-2xl font-bold text-surface-900">{getName()}</h1>
                    {provider.verified && (
                      <span className="flex items-center gap-1 text-xs bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-2.5 py-1 rounded-full font-bold shadow-sm">
                        <BadgeCheck size={12} /> Equinox Verified
                      </span>
                    )}
                  </div>
                  <p className="text-primary-600 font-medium text-sm mb-3">{provider.category as string || 'Service Provider'}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-surface-500">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-amber-400 fill-amber-400" />
                      <span className="font-semibold text-surface-800">{(provider.rating as number || 0).toFixed(1)}</span>
                      <span>({provider.reviewCount as number || 0} reviews)</span>
                    </div>
                    {provider.location && <div className="flex items-center gap-1"><MapPin size={14} />{provider.location as string}</div>}
                    {provider.createdAt && (
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />Member since {new Date(provider.createdAt as string).getFullYear()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-surface-100">
                <div className="text-center">
                  <p className="text-2xl font-bold text-surface-900">{provider.completedJobs as number || 0}</p>
                  <p className="text-xs text-surface-500 mt-0.5">Jobs Completed</p>
                </div>
                <div className="text-center border-x border-surface-100">
                  <p className="text-2xl font-bold text-surface-900">{provider.reviewCount as number || 0}</p>
                  <p className="text-xs text-surface-500 mt-0.5">Reviews</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-surface-900">{(provider.rating as number || 0).toFixed(1)}</p>
                  <p className="text-xs text-surface-500 mt-0.5">Avg Rating</p>
                </div>
              </div>
            </div>

            {/* About */}
            {provider.description && (
              <div className="bg-white rounded-2xl border border-surface-200 p-6">
                <h2 className="text-lg font-bold text-surface-900 mb-3">About</h2>
                <p className="text-surface-600 leading-relaxed">{provider.description as string}</p>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white rounded-2xl border border-surface-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-surface-900">Client Reviews</h2>
                <div className="flex items-center gap-2">
                  <Star size={18} className="text-amber-400 fill-amber-400" />
                  <span className="text-xl font-bold text-surface-900">{(provider.rating as number || 0).toFixed(1)}</span>
                  <span className="text-surface-400 text-sm">/ 5</span>
                </div>
              </div>

              {/* Rating distribution */}
              <div className="mb-6 space-y-2">
                {[5, 4, 3, 2, 1].map(star => (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-xs text-surface-500 w-4">{star}</span>
                    <Star size={12} className="text-amber-400 fill-amber-400 flex-shrink-0" />
                    <ProgressBar value={star === 5 ? 70 : star === 4 ? 20 : star === 3 ? 7 : 2} className="flex-1" />
                    <span className="text-xs text-surface-400 w-6">{star === 5 ? '70%' : star === 4 ? '20%' : star === 3 ? '7%' : '2%'}</span>
                  </div>
                ))}
              </div>

              {/* Reviews list from backend */}
              {provider.reviews && (provider.reviews as Record<string, unknown>[]).length > 0 ? (
                <div className="space-y-4">
                  {(provider.reviews as Record<string, unknown>[]).map((r, i) => (
                    <div key={(r.id as string) || i} className="p-4 bg-surface-50 rounded-xl border border-surface-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-semibold text-xs">
                            {((r.buyer as Record<string, string>)?.name || 'U')[0]}
                          </div>
                          <span className="font-medium text-surface-800 text-sm">
                            {(r.buyer as Record<string, string>)?.name || 'Client'}
                          </span>
                        </div>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }, (_, j) => (
                            <Star key={j} size={12} className={j < (r.rating as number) ? 'text-amber-400 fill-amber-400' : 'text-surface-200'} />
                          ))}
                        </div>
                      </div>
                      {r.comment && <p className="text-sm text-surface-600">{r.comment as string}</p>}
                      <p className="text-xs text-surface-400 mt-1">{new Date(r.createdAt as string).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-surface-400 text-center py-4">No reviews yet</p>
              )}
            </div>
          </div>

          {/* â”€â”€ Sidebar â”€â”€ */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-surface-200 p-6 sticky top-24">
              <h3 className="font-bold text-surface-900 mb-2">Get a Quote</h3>
              <p className="text-sm text-surface-500 mb-5">
                {user?.role === 'buyer'
                  ? 'Send a contract proposal and start tracking deliverables immediately.'
                  : 'Send a free inquiry and get a response within 24 hours.'}
              </p>
              <button
                onClick={openModal}
                className="btn-primary w-full justify-center text-sm"
              >
                <MessageSquare size={16} />
                {user?.role === 'buyer' ? 'Send Proposal' : 'Request a Quote'}
              </button>
              <button className="btn-secondary w-full justify-center text-sm mt-3">
                <Heart size={16} /> Save Provider
              </button>

              {/* Show login/signup nudge for guests */}
              {!user && (
                <div className="mt-4 pt-4 border-t border-surface-100 flex gap-2">
                  <Link
                    to={`/login?redirect=/providers/${id}`}
                    className="flex-1 flex items-center justify-center gap-1 border border-surface-200 text-surface-600 hover:bg-surface-50 rounded-xl py-2 text-xs font-medium transition-colors"
                  >
                    <LogIn size={12} /> Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="flex-1 flex items-center justify-center gap-1 bg-surface-900 text-white hover:bg-surface-800 rounded-xl py-2 text-xs font-medium transition-colors"
                  >
                    <UserPlus size={12} /> Create Account
                  </Link>
                </div>
              )}

              {provider.website ? (
                <a
                  href={provider.website as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full justify-center text-sm text-surface-500 hover:text-surface-700 mt-3 transition-colors"
                >
                  <ExternalLink size={14} /> Visit Website
                </a>
              ) : (
                <button className="flex items-center gap-2 w-full justify-center text-sm text-surface-300 mt-3 cursor-default" disabled>
                  <ExternalLink size={14} /> Visit Website
                </button>
              )}

              <div className="mt-6 pt-5 border-t border-surface-100 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-surface-500">Response time</span>
                  <span className="font-medium text-surface-800">{'< 24 hours'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-surface-500">Jobs completed</span>
                  <span className="font-medium text-surface-800">{provider.completedJobs as number || 0}</span>
                </div>
                {(provider.activeContracts as number) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-500">Active contracts</span>
                    <span className="font-medium text-surface-800">{provider.activeContracts as number}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Trust indicators */}
            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-5">
              <h4 className="font-semibold text-primary-900 text-sm mb-3">Why Equinox?</h4>
              <ul className="space-y-2">
                {[
                  'Verified & vetted provider',
                  'Secure wallet payments',
                  'SLA-backed contracts',
                  '24/7 dispute resolution',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2 text-xs text-primary-700">
                    <CheckCircle size={13} className="text-primary-500 flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* â”€â”€ Proposal / Inquiry Modal â”€â”€ */}
      <Modal
        isOpen={showLeadModal}
        onClose={closeModal}
        title={
          submitted
            ? undefined
            : submitMode === 'buyer'
              ? `Send Proposal to ${getName()}`
              : submitMode === 'wrong-role'
                ? 'Account Type Required'
                : `Inquire with ${getName()}`
        }
        size="md"
      >
        {submitted
          ? successScreen
          : submitMode === 'wrong-role'
            ? wrongRoleNotice
            : proposalForm}
      </Modal>
    </div>
  );
};

export default ProviderProfilePage;


