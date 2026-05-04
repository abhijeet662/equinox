import React from 'react';
import { Link } from 'react-router-dom';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-lg font-bold text-surface-900 mb-3">{title}</h2>
    <div className="text-sm text-surface-600 leading-relaxed space-y-3">{children}</div>
  </div>
);

const PrivacyPolicyPage: React.FC = () => (
  <div className="min-h-screen bg-white">
    <div className="bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] pt-28 pb-14 px-4 text-center">
      <h1 className="text-3xl font-extrabold text-white mb-2">Privacy Policy</h1>
      <p className="text-surface-400 text-sm">Last updated: 1 April 2026</p>
    </div>

    <div className="max-w-3xl mx-auto px-4 py-14">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-10 text-sm text-amber-800">
        <strong>Summary:</strong> We collect only the data necessary to operate Equinox. We do not sell your personal information to third parties. Ever.
      </div>

      <Section title="1. Who We Are">
        <p>Equinox Platform ("Equinox", "we", "us", "our") is an eCommerce service marketplace connecting brands with verified service providers. Our registered address is [Company Address], India.</p>
      </Section>

      <Section title="2. Information We Collect">
        <p><strong>Account data:</strong> name, email address, phone number, company name, and role (Buyer / Provider) when you register.</p>
        <p><strong>Transaction data:</strong> contract details, invoice records, wallet balances, and payment history processed through the platform.</p>
        <p><strong>Usage data:</strong> pages visited, features used, session duration, device type, and IP address — collected via server logs and analytics cookies.</p>
        <p><strong>Communication data:</strong> messages sent through the in-platform messaging system and support tickets.</p>
      </Section>

      <Section title="3. How We Use Your Information">
        <p>We use collected data to: operate and improve the Equinox platform; process contracts, invoices, and wallet transactions; send transactional notifications (SLA alerts, payment confirmations); respond to support requests; prevent fraud and ensure platform security; comply with applicable Indian law.</p>
        <p>We do <em>not</em> use your data for unsolicited marketing without your explicit consent.</p>
      </Section>

      <Section title="4. Data Sharing">
        <p>We share data with the counterparty to a contract (e.g., Buyer details shared with the Provider you engage and vice versa), payment processors (Razorpay) for transaction processing, cloud infrastructure providers (AWS) under data processing agreements, and when required by law or a valid court order.</p>
        <p>We never sell personal data to data brokers, advertisers, or third-party marketing platforms.</p>
      </Section>

      <Section title="5. Data Retention">
        <p>Account data is retained for as long as your account is active. On account deletion, personal data is anonymised within 30 days, except where retention is required by law (e.g., GST-regulated invoice records are retained for 7 years).</p>
      </Section>

      <Section title="6. Your Rights">
        <p>You have the right to access, correct, or delete your personal data by contacting us at privacy@equinox.ai. You may also request a machine-readable export of your data. Requests are processed within 30 days.</p>
      </Section>

      <Section title="7. Cookies">
        <p>We use strictly necessary cookies for session management, and optional analytics cookies (Google Analytics) to understand platform usage. You can manage cookie preferences in your browser settings or via our <Link to="/cookies" className="text-primary-600 hover:underline">Cookie Policy</Link>.</p>
      </Section>

      <Section title="8. Security">
        <p>All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Access to production databases is restricted to authorised engineers via MFA-protected VPN. We conduct periodic security audits.</p>
      </Section>

      <Section title="9. Changes to This Policy">
        <p>We may update this policy from time to time. We will notify registered users of material changes via email at least 14 days before they take effect.</p>
      </Section>

      <Section title="10. Contact">
        <p>Privacy questions? Email us at <a href="mailto:privacy@equinox.ai" className="text-primary-600 hover:underline">privacy@equinox.ai</a> or use our <Link to="/contact" className="text-primary-600 hover:underline">contact form</Link>.</p>
      </Section>
    </div>
  </div>
);

export default PrivacyPolicyPage;
