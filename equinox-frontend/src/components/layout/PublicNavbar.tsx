import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Building2, TrendingUp, Briefcase, Globe } from 'lucide-react';

interface DropdownItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  desc: string;
}

const SOLUTIONS: DropdownItem[] = [
  { to: '/solutions/enterprises', icon: <Building2 size={15} />, label: 'For Enterprises', desc: 'Multi-brand ops & SSO' },
  { to: '/solutions/smbs',        icon: <TrendingUp size={15} />, label: 'For SMBs',         desc: 'Grow without headcount' },
  { to: '/solutions/freelancers', icon: <Briefcase size={15} />,  label: 'For Freelancers',  desc: 'Get paid on delivery' },
  { to: '/integrations',          icon: <Globe size={15} />,      label: 'Integrations',     desc: 'Amazon, Shopify & more' },
];

const PublicNavbar: React.FC = () => {
  const [menuOpen, setMenuOpen]   = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); setSolutionsOpen(false); }, [location]);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const linkCls = (path: string) =>
    `text-sm font-medium transition-colors ${
      isActive(path) ? 'text-primary-600' : 'text-surface-600 hover:text-primary-600'
    }`;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md' : 'bg-white/90 backdrop-blur-md'}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
              EQ
            </div>
            <span className="text-xl font-bold text-surface-900 tracking-tight">Equinox</span>
          </Link>

          {/* ── Desktop Nav ── */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/providers" className={`${linkCls('/providers')} px-3 py-2 rounded-lg hover:bg-surface-50`}>
              Find Providers
            </Link>

            {/* Solutions dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setSolutionsOpen(true)}
              onMouseLeave={() => setSolutionsOpen(false)}
            >
              <button className={`flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-lg hover:bg-surface-50 transition-colors ${
                location.pathname.startsWith('/solutions') || location.pathname === '/integrations'
                  ? 'text-primary-600'
                  : 'text-surface-600 hover:text-primary-600'
              }`}>
                Solutions <ChevronDown size={13} className={`transition-transform ${solutionsOpen ? 'rotate-180' : ''}`} />
              </button>
              {solutionsOpen && (
                <div className="absolute top-full left-0 w-64 bg-white rounded-2xl shadow-xl border border-surface-200 py-2 mt-1 z-50">
                  {SOLUTIONS.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-surface-50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-surface-100 flex items-center justify-center text-surface-500 flex-shrink-0 mt-0.5">
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-surface-800">{item.label}</p>
                        <p className="text-xs text-surface-400">{item.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link to="/pricing" className={`${linkCls('/pricing')} px-3 py-2 rounded-lg hover:bg-surface-50`}>
              Pricing
            </Link>
            <Link to="/about" className={`${linkCls('/about')} px-3 py-2 rounded-lg hover:bg-surface-50`}>
              About
            </Link>
            <Link to="/contact" className={`${linkCls('/contact')} px-3 py-2 rounded-lg hover:bg-surface-50`}>
              Contact
            </Link>
          </div>

          {/* ── CTA ── */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-surface-700 hover:text-primary-600 transition-colors px-3 py-2 rounded-lg hover:bg-surface-50">
              Sign In
            </Link>
            <Link to="/get-started" className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:opacity-90 text-white font-bold text-sm px-4 py-2 rounded-xl transition-opacity shadow-sm">
              Get Started
            </Link>
          </div>

          {/* ── Mobile toggle ── */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-100 text-surface-600"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* ── Mobile Menu ── */}
        {menuOpen && (
          <div className="md:hidden border-t border-surface-200 py-3 space-y-1 pb-4">
            <Link to="/providers" className="block px-3 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-50 rounded-lg">
              Find Providers
            </Link>
            <Link to="/pricing" className="block px-3 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-50 rounded-lg">
              Pricing
            </Link>
            <Link to="/about" className="block px-3 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-50 rounded-lg">
              About
            </Link>
            <Link to="/contact" className="block px-3 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-50 rounded-lg">
              Contact
            </Link>

            {/* Solutions sub-group */}
            <button
              onClick={() => setSolutionsOpen(!solutionsOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-50 rounded-lg"
            >
              Solutions <ChevronDown size={14} className={`transition-transform ${solutionsOpen ? 'rotate-180' : ''}`} />
            </button>
            {solutionsOpen && (
              <div className="ml-3 space-y-1 border-l-2 border-surface-100 pl-3">
                {SOLUTIONS.map((item) => (
                  <Link key={item.to} to={item.to} className="block px-2 py-2 text-sm text-surface-600 hover:text-primary-600 hover:bg-surface-50 rounded-lg">
                    {item.label}
                  </Link>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-3 border-t border-surface-100 mt-2">
              <Link to="/login" className="flex-1 text-center py-2.5 text-sm font-medium text-surface-700 border border-surface-200 rounded-xl">
                Sign In
              </Link>
              <Link to="/get-started" className="flex-1 text-center py-2.5 text-sm font-bold bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default PublicNavbar;
