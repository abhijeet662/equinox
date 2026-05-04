import React from 'react';
import { Link } from 'react-router-dom';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-lg font-bold text-surface-900 mb-3">{title}</h2>
    <div className="text-sm text-surface-600 leading-relaxed space-y-3">{children}</div>
  </div>
);

interface CookieRow { name: string; type: string; purpose: string; duration: string; }

const COOKIES: CookieRow[] = [
  { name: 'equinox_access', type: 'Strictly Necessary', purpose: 'Stores the JWT access token to keep you logged in.', duration: 'Session' },
  { name: 'equinox_refresh', type: 'Strictly Necessary', purpose: 'Stores the refresh token to renew sessions without re-login.', duration: '7 days' },
  { name: '_ga', type: 'Analytics', purpose: 'Google Analytics — distinguishes unique users.', duration: '2 years' },
  { name: '_ga_*', type: 'Analytics', purpose: 'Google Analytics 4 — stores session state.', duration: '2 years' },
  { name: 'equinox_prefs', type: 'Functional', purpose: 'Remembers UI preferences (e.g., dark mode, language).', duration: '1 year' },
];

const CookiePolicyPage: React.FC = () => (
  <div className="min-h-screen bg-white">
    <div className="bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] pt-28 pb-14 px-4 text-center">
      <h1 className="text-3xl font-extrabold text-white mb-2">Cookie Policy</h1>
      <p className="text-surface-400 text-sm">Last updated: 1 April 2026</p>
    </div>

    <div className="max-w-3xl mx-auto px-4 py-14">
      <Section title="What Are Cookies?">
        <p>Cookies are small text files stored on your device when you visit a website. They help us recognise your browser, remember your preferences, and understand how you use the Equinox platform.</p>
      </Section>

      <Section title="How We Use Cookies">
        <p><strong>Strictly Necessary:</strong> Required for the platform to function. These cannot be disabled — they handle authentication and session security.</p>
        <p><strong>Functional:</strong> Remember your preferences (language, UI settings). Disabling these won't break the platform but may reset your preferences on each visit.</p>
        <p><strong>Analytics:</strong> Help us understand which features are used most and how we can improve. We use Google Analytics with IP anonymisation enabled.</p>
        <p>We do <em>not</em> use advertising or third-party tracking cookies.</p>
      </Section>

      <Section title="Cookies We Set">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-surface-50 border border-surface-200">
                <th className="text-left px-3 py-2.5 font-semibold text-surface-700">Cookie</th>
                <th className="text-left px-3 py-2.5 font-semibold text-surface-700">Type</th>
                <th className="text-left px-3 py-2.5 font-semibold text-surface-700">Purpose</th>
                <th className="text-left px-3 py-2.5 font-semibold text-surface-700">Duration</th>
              </tr>
            </thead>
            <tbody>
              {COOKIES.map((c, i) => (
                <tr key={c.name} className={`border border-surface-200 ${i % 2 === 0 ? 'bg-white' : 'bg-surface-50/50'}`}>
                  <td className="px-3 py-2.5 font-mono text-surface-800">{c.name}</td>
                  <td className="px-3 py-2.5 text-surface-600">{c.type}</td>
                  <td className="px-3 py-2.5 text-surface-600">{c.purpose}</td>
                  <td className="px-3 py-2.5 text-surface-600">{c.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Managing Cookies">
        <p>You can manage or delete cookies through your browser settings:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies and other site data</li>
          <li><strong>Firefox:</strong> Preferences → Privacy and Security → Cookies and Site Data</li>
          <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
          <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
        </ul>
        <p>Note: disabling strictly necessary cookies will prevent you from logging into Equinox.</p>
      </Section>

      <Section title="Changes to This Policy">
        <p>We may update this Cookie Policy to reflect changes in technology or regulation. The "last updated" date at the top of this page will reflect the most recent revision.</p>
      </Section>

      <Section title="Contact">
        <p>Cookie-related questions? Email <a href="mailto:privacy@equinox.ai" className="text-primary-600 hover:underline">privacy@equinox.ai</a> or use our <Link to="/contact" className="text-primary-600 hover:underline">contact form</Link>.</p>
      </Section>
    </div>
  </div>
);

export default CookiePolicyPage;
