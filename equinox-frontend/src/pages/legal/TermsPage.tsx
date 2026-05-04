import React from 'react';
import { Link } from 'react-router-dom';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-lg font-bold text-surface-900 mb-3">{title}</h2>
    <div className="text-sm text-surface-600 leading-relaxed space-y-3">{children}</div>
  </div>
);

const TermsPage: React.FC = () => (
  <div className="min-h-screen bg-white">
    <div className="bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] pt-28 pb-14 px-4 text-center">
      <h1 className="text-3xl font-extrabold text-white mb-2">Terms of Service</h1>
      <p className="text-surface-400 text-sm">Last updated: 1 April 2026</p>
    </div>

    <div className="max-w-3xl mx-auto px-4 py-14">
      <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 mb-10 text-sm text-blue-800">
        <strong>In plain English:</strong> Use Equinox fairly, don't misuse other users' data, and honour your contracts. If there's a dispute, we'll help mediate.
      </div>

      <Section title="1. Acceptance of Terms">
        <p>By creating an account or using any Equinox service, you agree to these Terms of Service and our <Link to="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>. If you are registering on behalf of a company, you represent that you have authority to bind that company.</p>
      </Section>

      <Section title="2. Eligibility">
        <p>You must be at least 18 years old and legally capable of entering into contracts under applicable Indian law. Equinox is available to residents of India and selected international territories.</p>
      </Section>

      <Section title="3. Account Responsibilities">
        <p>You are responsible for maintaining the confidentiality of your login credentials and all activities that occur under your account. Notify us immediately at support@equinox.ai if you suspect unauthorised access.</p>
        <p>You may not share accounts, create multiple accounts for the same entity without authorisation, or impersonate another user.</p>
      </Section>

      <Section title="4. Buyer Obligations">
        <p>Buyers agree to: provide accurate brief and scope information to providers; fund wallet balances before contracts commence where required; release payment promptly upon satisfactory delivery; not engage providers outside the platform to circumvent service fees.</p>
      </Section>

      <Section title="5. Provider Obligations">
        <p>Providers agree to: maintain the accuracy of their profile, portfolio, and service descriptions; deliver work within agreed SLA timelines; not misrepresent qualifications or platform performance history; not solicit platform users for off-platform engagement within 12 months of a contract.</p>
      </Section>

      <Section title="6. SLA Framework">
        <p>The platform enforces SLA timers (P0: 4h, P1: 8h, P2: 48h, P3: 96h) as contractual targets. SLA breaches do not automatically trigger refunds but do trigger escalation workflows. Financial remedies for breaches must be specified in individual contracts.</p>
      </Section>

      <Section title="7. Payments & Wallet">
        <p>All transactions are processed in Indian Rupees (INR) unless otherwise specified. Platform service fees apply per transaction. Wallet funds are held in escrow and released per contract milestones. Refund eligibility is governed by the individual contract terms and Equinox's dispute resolution process.</p>
      </Section>

      <Section title="8. Intellectual Property">
        <p>Deliverables created under a contract become the property of the Buyer upon full payment, unless the contract specifies otherwise. Equinox does not claim ownership of any deliverables.</p>
        <p>The Equinox brand, platform design, and proprietary software remain the exclusive property of Equinox Platform.</p>
      </Section>

      <Section title="9. Prohibited Conduct">
        <p>You must not: submit false reviews or ratings; upload malware or exploit platform vulnerabilities; use automated scripts to scrape provider or brand data; harass, threaten, or discriminate against other users.</p>
        <p>Violations may result in account suspension or permanent termination without notice.</p>
      </Section>

      <Section title="10. Limitation of Liability">
        <p>Equinox is a marketplace intermediary. We are not a party to contracts between Buyers and Providers. To the maximum extent permitted by law, our aggregate liability for any claim is limited to the platform fees paid by you in the 3 months preceding the claim.</p>
      </Section>

      <Section title="11. Governing Law & Disputes">
        <p>These Terms are governed by the laws of India. Disputes will first be referred to Equinox's internal mediation process. Unresolved disputes shall be subject to the exclusive jurisdiction of courts in Bengaluru, Karnataka.</p>
      </Section>

      <Section title="12. Changes to Terms">
        <p>We reserve the right to update these Terms at any time. Continued use of the platform after changes take effect constitutes acceptance. Material changes will be communicated via email with 14 days' notice.</p>
      </Section>

      <Section title="13. Contact">
        <p>Legal queries: <a href="mailto:legal@equinox.ai" className="text-primary-600 hover:underline">legal@equinox.ai</a> or via our <Link to="/contact" className="text-primary-600 hover:underline">contact form</Link>.</p>
      </Section>
    </div>
  </div>
);

export default TermsPage;
