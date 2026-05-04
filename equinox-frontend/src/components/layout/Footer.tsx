import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Zap } from 'lucide-react';

interface FooterCol {
  heading: string;
  links: { label: string; to: string }[];
}

const COLS: FooterCol[] = [
  {
    heading: 'Platform',
    links: [
      { label: 'Find Providers',     to: '/providers' },
      { label: 'Browse Marketplace', to: '/marketplace/browse' },
      { label: 'Pricing',            to: '/pricing' },
      { label: 'About Us',           to: '/about' },
      { label: 'Contact',            to: '/contact' },
    ],
  },
  {
    heading: 'Solutions',
    links: [
      { label: 'For Enterprises',  to: '/solutions/enterprises' },
      { label: 'For SMBs',         to: '/solutions/smbs' },
      { label: 'For Freelancers',  to: '/solutions/freelancers' },
      { label: 'Integrations',     to: '/integrations' },
      { label: 'Get Started',      to: '/get-started' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy',   to: '/privacy' },
      { label: 'Terms of Service', to: '/terms' },
      { label: 'Cookie Policy',    to: '/cookies' },
      { label: 'Contact Us',       to: '/contact' },
    ],
  },
];

const Footer: React.FC = () => (
  <footer className="bg-[#0f172a] text-surface-300">
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-14">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-8">

        {/* ── Brand ── */}
        <div className="col-span-2">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center shadow-sm">
              <Zap size={15} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Equinox</span>
          </Link>
          <p className="text-sm text-surface-400 leading-relaxed max-w-xs">
            The SLA-driven hub for eCommerce brands. Connecting Amazon, Flipkart, and Shopify sellers
            with accountable, verified service providers.
          </p>

          {/* Social */}
          <div className="flex gap-2.5 mt-6">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter / X"
              className="w-9 h-9 rounded-xl bg-surface-800 hover:bg-primary-600 flex items-center justify-center text-surface-400 hover:text-white transition-all text-sm font-bold"
            >
              𝕏
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="w-9 h-9 rounded-xl bg-surface-800 hover:bg-primary-600 flex items-center justify-center text-surface-400 hover:text-white transition-all text-sm font-bold"
            >
              in
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="w-9 h-9 rounded-xl bg-surface-800 hover:bg-primary-600 flex items-center justify-center text-surface-400 hover:text-white transition-all text-xs font-bold"
            >
              gh
            </a>
            <Link
              to="/contact"
              aria-label="Contact"
              className="w-9 h-9 rounded-xl bg-surface-800 hover:bg-primary-600 flex items-center justify-center text-surface-400 hover:text-white transition-all"
            >
              <Mail size={15} />
            </Link>
          </div>
        </div>

        {/* ── Link columns ── */}
        {COLS.map((col) => (
          <div key={col.heading}>
            <h4 className="text-sm font-semibold text-white mb-4">{col.heading}</h4>
            <ul className="space-y-2.5 text-sm">
              {col.links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-surface-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-surface-800 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
        <p className="text-xs text-surface-500">© 2026 Equinox Platform. All rights reserved.</p>
        <div className="flex items-center gap-4 text-xs text-surface-500">
          <Link to="/privacy" className="hover:text-surface-300 transition-colors">Privacy</Link>
          <span>·</span>
          <Link to="/terms" className="hover:text-surface-300 transition-colors">Terms</Link>
          <span>·</span>
          <Link to="/cookies" className="hover:text-surface-300 transition-colors">Cookies</Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
