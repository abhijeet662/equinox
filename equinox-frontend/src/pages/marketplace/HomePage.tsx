import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Search, Star, CheckCircle, ShieldCheck, Zap, Wallet, GraduationCap,
  Clock, TrendingUp, Users, ChevronRight, BadgeCheck, Award, AlertCircle,
  MessageSquare, FileText, Globe2, Package, Sparkles, Lock,
  HeadphonesIcon, Store, Megaphone, Palette, Database, LineChart,
  Tag, ShoppingCart, Boxes, ArrowRight, Play, BarChart3,
  Shirt, Heart, UtensilsCrossed, Building2, Rocket, Cloud, Crown, Layers,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { providersService } from '../../services/providers.service';

// ─── Framer helpers ────────────────────────────────────────────────────────────
const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  return (
    <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? 'show' : 'hidden'} className={className}>
      {children}
    </motion.div>
  );
}

// ─── Static data ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { label: 'Amazon Management',  icon: ShoppingCart, color: '#F59E0B' },
  { label: 'Flipkart Services',  icon: Store,        color: '#3B82F6' },
  { label: 'Shopify Development',icon: Boxes,        color: '#10B981' },
  { label: 'Performance Marketing', icon: Megaphone, color: '#EC4899' },
  { label: 'Catalogue & SEO',    icon: Tag,          color: '#8B5CF6' },
  { label: 'Design & Creative',  icon: Palette,      color: '#F97316' },
  { label: 'Data & Analytics',   icon: LineChart,    color: '#06B6D4' },
  { label: 'AI & Automation',    icon: Database,     color: '#6366F1' },
];

const TRUSTED_BY = [
  { name: 'StyleKart',      icon: Shirt,            color: '#8B5CF6', bg: '#EDE9FE' },
  { name: 'BeautyBay India',icon: Heart,            color: '#EC4899', bg: '#FCE7F3' },
  { name: 'Krave Foods',    icon: UtensilsCrossed,  color: '#F97316', bg: '#FFF7ED' },
  { name: 'UrbanMart',      icon: Building2,        color: '#3B82F6', bg: '#EFF6FF' },
  { name: 'TrendNova',      icon: Rocket,           color: '#10B981', bg: '#ECFDF5' },
  { name: 'CloudRetail',    icon: Cloud,            color: '#06B6D4', bg: '#ECFEFF' },
  { name: 'NexaStore',      icon: Layers,           color: '#6366F1', bg: '#EEF2FF' },
  { name: 'PrimeSeller',    icon: Crown,            color: '#F59E0B', bg: '#FFFBEB' },
];

const STATS = [
  { value: '10+',   label: 'Certified Agencies',  icon: Users,       accent: '#6366F1' },
  { value: '99%',   label: 'SLA Success Rate',     icon: ShieldCheck, accent: '#10B981' },
  { value: '$40k+', label: 'Revenue Managed',      icon: TrendingUp,  accent: '#8B5CF6' },
  { value: '< 4h',  label: 'Avg. P0 Response',     icon: Clock,       accent: '#F59E0B' },
  { value: '18+',   label: 'Platforms Covered',    icon: Globe2,      accent: '#EC4899' },
];

const HOW_IT_WORKS = [
  { n: '1', icon: Search,     title: 'Search & Filter',    desc: 'Browse LMS-certified experts by category, SLA tier, rating, and platform speciality.' },
  { n: '2', icon: FileText,   title: 'Review & Contract',  desc: 'Compare scorecards, reviews, and sign a digital contract with SLA clauses built in.' },
  { n: '3', icon: ShieldCheck,title: 'Track & Pay',        desc: 'Monitor every task in real time. Wallet payments settle automatically on milestone completion.' },
];

const SLA_TIERS = [
  { p: 'P0', label: 'Critical', time: '4h',  desc: 'Account suspension, listing takedowns, urgent violations.', color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
  { p: 'P1', label: 'High',     time: '8h',  desc: 'Campaign launches, pricing errors, inventory sync issues.',  color: '#F97316', bg: '#FFF7ED', border: '#FED7AA' },
  { p: 'P2', label: 'Medium',   time: '48h', desc: 'Content updates, A+ content, catalogue enrichment.',        color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
  { p: 'P3', label: 'Low',      time: '96h', desc: 'Routine reports, competitor analysis, strategy reviews.',   color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB' },
];

const WHY_US = [
  { icon: Lock,           title: 'Contractual SLAs',      desc: 'Binding response tiers enforced by the platform watchdog — not just promises.' },
  { icon: BadgeCheck,     title: 'Pre-Vetted Experts',    desc: 'Every provider passes our internal LMS certification before going live.' },
  { icon: Wallet,         title: 'Transparent Billing',   desc: 'Single wallet, instant invoices, zero hidden fees. Full real-time audit trail.' },
  { icon: MessageSquare,  title: 'Real-Time Tracking',    desc: 'Dashboard visibility into every task, milestone, and provider message.' },
  { icon: HeadphonesIcon, title: 'Watchdog Alerts',       desc: 'Automated SLA breach notifications sent instantly to both parties and admins.' },
  { icon: Sparkles,       title: 'AI-Powered Insights',   desc: 'AI meeting summaries, smart KPIs, and automated task prioritisation.' },
];

const TESTIMONIALS = [
  { quote: 'Our Amazon account was at risk of suspension — Equinox had a P0 specialist on it within 2 hours. Absolute lifesaver.', name: 'Rohit Malhotra', role: 'Head of eCommerce, StyleKart', initials: 'RM', platform: 'Amazon', stars: 5 },
  { quote: 'We cut vendor management overhead by 60%. The Wallet + Invoice system means zero reconciliation headaches every month.', name: 'Priya Venkatesh', role: 'VP Growth, BeautyBay India', initials: 'PV', platform: 'Flipkart', stars: 5 },
  { quote: 'Every provider here is LMS-certified and knows exactly what they\'re doing. The first marketplace where quality is consistent.', name: 'Arjun Mehra', role: 'Founder, Krave Foods', initials: 'AM', platform: 'Shopify', stars: 5 },
];

const getName = (p: Record<string, unknown>) => (p.businessName as string) || (p.user as Record<string, string>)?.name || 'Provider';
const getCategory = (p: Record<string, unknown>) => (p.category as string) || 'General';

// ─── Page ─────────────────────────────────────────────────────────────────────
const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const { data: providersRes } = useApi(() => providersService.list({ limit: 6 }), []);
  const featuredProviders: Record<string, unknown>[] = providersRes?.data || [];
  const totalCount: number = providersRes?.meta?.total || featuredProviders.length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/providers${query.trim() ? `?search=${encodeURIComponent(query)}` : ''}`);
  };

  return (
    <div className="bg-white">

      {/* ═══════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #312e81 100%)' }}>
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        {/* Glow blobs */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background: '#6366f1' }} />
        <div className="absolute -bottom-20 right-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-15" style={{ background: '#3b82f6' }} />

        <div className="relative max-w-7xl mx-auto px-4 md:px-8 pt-28 pb-20 z-10">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 mb-7 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-sm"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              The SLA-Driven eCommerce Marketplace
            </motion.div>

            {/* Headline */}
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}
              className="text-4xl sm:text-5xl md:text-[3.75rem] font-extrabold text-white leading-[1.1] tracking-tight mb-5"
            >
              Find Expert Help for Your{' '}
              <span style={{ background: 'linear-gradient(90deg, #93c5fd, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                eCommerce Brand
              </span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
              className="text-blue-200/80 text-lg mb-9 leading-relaxed"
            >
              LMS-certified agencies. Contractual SLA guarantees. P0 issues resolved in under 4 hours.
            </motion.p>

            {/* Search bar */}
            <motion.form onSubmit={handleSearch} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
              className="flex items-center bg-white rounded-2xl shadow-2xl overflow-hidden mb-5 ring-4 ring-white/10"
            >
              <Search size={18} className="ml-5 text-gray-400 shrink-0" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search for Amazon management, Shopify dev, A+ content…"
                className="flex-1 px-4 py-4 text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent"
              />
              <button type="submit" className="shrink-0 m-1.5 px-7 py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                Search
              </button>
            </motion.form>

            {/* Popular searches */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
              className="flex flex-wrap items-center justify-center gap-2 text-xs text-white/50"
            >
              <span className="font-medium">Popular:</span>
              {['Amazon FBA', 'Shopify Store', 'A+ Content', 'PPC Ads', 'Catalogue Management'].map(t => (
                <button key={t} onClick={() => navigate(`/providers?search=${encodeURIComponent(t)}`)}
                  className="text-white/70 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-3 py-1 transition-colors"
                >
                  {t}
                </button>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Wave */}
        <svg viewBox="0 0 1440 60" className="w-full block -mb-px" preserveAspectRatio="none">
          <path d="M0,30 C480,60 960,0 1440,30 L1440,60 L0,60 Z" fill="white" />
        </svg>
      </section>

      {/* ═══════════════════════════════════════════
          TRUSTED BY  — marquee strip
      ═══════════════════════════════════════════ */}
      <section className="py-8 bg-gray-50 border-y border-gray-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8 mb-4">
          <p className="text-xs font-semibold text-gray-400 text-center uppercase tracking-widest">Trusted by growing brands</p>
        </div>
        {/* Infinite scroll marquee */}
        <div className="relative flex overflow-hidden select-none" style={{ maskImage: 'linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)' }}>
          {[0, 1].map(clone => (
            <div key={clone} className="flex shrink-0 gap-4 pr-4 animate-[marquee_32s_linear_infinite]">
              {TRUSTED_BY.map(brand => (
                <div key={brand.name} className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-5 py-3.5 shadow-sm whitespace-nowrap hover:shadow-md transition-shadow">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: brand.bg }}>
                    <brand.icon size={17} style={{ color: brand.color }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-800">{brand.name}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CATEGORIES  — rich cards
      ═══════════════════════════════════════════ */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <Section>
            <motion.div variants={fadeUp} className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">Browse by Service</p>
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Popular Services</h2>
                <p className="text-sm text-gray-400 mt-1">Find certified experts for every eCommerce need</p>
              </div>
              <Link to="/providers" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 border border-indigo-100 hover:border-indigo-300 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-all">
                See all services <ChevronRight size={14} />
              </Link>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {CATEGORIES.map((cat, i) => (
                <motion.div key={cat.label} variants={fadeUp}>
                  <Link
                    to={`/providers?category=${encodeURIComponent(cat.label)}`}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 h-36 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                    style={{ backgroundColor: cat.color + '12', border: `1.5px solid ${cat.color}28` }}
                  >
                    {/* Big faded bg icon */}
                    <div className="absolute -bottom-3 -right-3 opacity-10 transition-all duration-300 group-hover:opacity-20 group-hover:scale-110">
                      <cat.icon size={72} style={{ color: cat.color }} />
                    </div>

                    {/* Icon badge */}
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-md"
                      style={{ background: `linear-gradient(135deg, ${cat.color}ee, ${cat.color}99)` }}>
                      <cat.icon size={20} className="text-white" />
                    </div>

                    {/* Label + arrow */}
                    <div>
                      <p className="font-bold text-gray-900 text-sm leading-tight mb-1">{cat.label}</p>
                      <div className="flex items-center gap-1 text-xs font-semibold transition-all duration-200 group-hover:gap-2"
                        style={{ color: cat.color }}>
                        Explore <ArrowRight size={11} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          STATS STRIP
      ═══════════════════════════════════════════ */}
      <section className="py-12 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {STATS.map(s => (
              <div key={s.label} className="flex flex-col items-center text-center gap-2">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.accent + '15' }}>
                  <s.icon size={20} style={{ color: s.accent }} />
                </div>
                <p className="text-2xl md:text-3xl font-extrabold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FEATURED PROVIDERS
      ═══════════════════════════════════════════ */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <Section>
            <motion.div variants={fadeUp} className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">Provider Directory</p>
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                  Top-Rated Certified Experts
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {totalCount > 0 ? totalCount : '10'}+ verified agencies. Real ratings from signed contracts.
                </p>
              </div>
              <Link to="/providers" className="hidden md:flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700 border border-indigo-200 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-colors">
                View all <ChevronRight size={14} />
              </Link>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredProviders.length > 0
                ? featuredProviders.map(p => {
                    const name = getName(p);
                    const cat  = getCategory(p);
                    const rating = (p.rating as number) || 0;
                    const reviews = (p.reviewCount as number) || 0;
                    const jobs = (p.completedJobs as number) || 0;
                    const catDef = CATEGORIES.find(c => c.label.toLowerCase().includes(cat.toLowerCase()));
                    const CatIcon = catDef?.icon ?? Store;
                    const accent = catDef?.color ?? '#6366f1';
                    const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

                    return (
                      <motion.div key={p.id as string} variants={fadeUp}
                        className="group bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-xl transition-all duration-300 overflow-hidden"
                      >
                        {/* Top accent line */}
                        <div className="h-1" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />

                        <div className="p-6">
                          {/* Header */}
                          <div className="flex items-start gap-4 mb-4">
                            {/* Avatar */}
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-lg text-white shrink-0 shadow-md"
                              style={{ background: `linear-gradient(135deg, ${accent}, ${accent}bb)` }}>
                              {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className="font-bold text-gray-900 text-sm group-hover:text-indigo-700 transition-colors truncate">{name}</h3>
                                {p.verified && <BadgeCheck size={14} className="text-indigo-500 shrink-0" />}
                                {(p as Record<string, unknown>).effectiveFeatured && (
                                  <Star size={12} className="text-amber-400 fill-amber-400 shrink-0" />
                                )}
                              </div>
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mt-1"
                                style={{ backgroundColor: accent + '15', color: accent }}>
                                <CatIcon size={10} /> {cat}
                              </span>
                            </div>
                          </div>

                          {/* Description */}
                          {p.description && (
                            <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">{p.description as string}</p>
                          )}

                          {/* Rating + jobs */}
                          <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-1">
                              <Star size={13} className="text-amber-400 fill-amber-400" />
                              <span className="text-sm font-bold text-gray-900">{rating.toFixed(1)}</span>
                              <span className="text-xs text-gray-400">({reviews})</span>
                            </div>
                            <span className="text-xs text-gray-400">{jobs} jobs done</span>
                          </div>

                          {/* Divider */}
                          <div className="border-t border-gray-100 pt-4 flex gap-2">
                            <Link to={`/providers/${p.id as string}`}
                              className="flex-1 text-center text-xs font-semibold text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 py-2.5 rounded-xl transition-colors">
                              View Profile
                            </Link>
                            <Link to={`/providers/${p.id as string}`}
                              className="flex-1 flex items-center justify-center gap-1 text-xs font-bold text-white py-2.5 rounded-xl transition-opacity hover:opacity-90"
                              style={{ background: `linear-gradient(135deg, #4f46e5, #7c3aed)` }}>
                              <Package size={12} /> Hire Now
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                : Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                      <div className="flex gap-4 mb-4">
                        <div className="w-14 h-14 bg-gray-100 rounded-2xl shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-100 rounded w-3/4" />
                          <div className="h-3 bg-gray-100 rounded w-1/2" />
                        </div>
                      </div>
                      <div className="h-3 bg-gray-100 rounded mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-4/5 mb-5" />
                      <div className="h-10 bg-gray-100 rounded-xl" />
                    </div>
                  ))
              }
            </div>
          </Section>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════ */}
      <section className="py-16 md:py-20 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <Section>
            <motion.div variants={fadeUp} className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">Simple Process</p>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Get Started in 3 Steps</h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 relative">
              {/* Connector */}
              <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px border-t-2 border-dashed border-gray-200" />

              {HOW_IT_WORKS.map((step, i) => (
                <motion.div key={step.n} variants={fadeUp}
                  className="bg-white rounded-2xl border border-gray-100 p-8 text-center hover:shadow-lg hover:border-indigo-100 transition-all duration-200 relative"
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center shadow-md">
                    {i + 1}
                  </div>
                  <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 8px 24px #4f46e530' }}>
                    <step.icon size={26} className="text-white" />
                  </div>
                  <h3 className="font-extrabold text-gray-900 text-base mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          WHY EQUINOX  (split layout)
      ═══════════════════════════════════════════ */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left text */}
            <Section>
              <motion.div variants={fadeUp}>
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-3">Why Equinox</p>
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-5 leading-tight">
                  Everything a Marketplace Should Be —{' '}
                  <span style={{ background: 'linear-gradient(90deg, #4f46e5, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    With Accountability
                  </span>
                </h2>
                <p className="text-gray-500 text-base leading-relaxed mb-8">
                  Unlike generic freelance platforms, every Equinox provider is LMS-certified, bound by contractual SLA tiers, and accountable through our automated watchdog system.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link to="/providers"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                    Browse Providers <ArrowRight size={15} />
                  </Link>
                  <Link to="/signup"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-gray-700 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all">
                    <Play size={13} className="text-indigo-500" /> See How It Works
                  </Link>
                </div>
              </motion.div>
            </Section>

            {/* Right grid of 6 features */}
            <Section className="grid sm:grid-cols-2 gap-4">
              {WHY_US.map(item => (
                <motion.div key={item.title} variants={fadeUp}
                  className="flex gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-indigo-50/40 hover:border-indigo-200 transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                    <item.icon size={18} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm mb-0.5">{item.title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </Section>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SLA TIERS
      ═══════════════════════════════════════════ */}
      <section className="py-16 md:py-20 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <Section>
            <motion.div variants={fadeUp} className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">SLA Framework</p>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3">
                Every Task Has a Deadline. We Enforce It.
              </h2>
              <p className="text-sm text-gray-500 max-w-lg mx-auto">
                Tasks are automatically classified by business impact and bound to strict turnaround times — by contract.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {SLA_TIERS.map(tier => (
                <motion.div key={tier.p} variants={fadeUp}
                  className="rounded-2xl p-6 border-2 hover:shadow-md transition-shadow duration-200"
                  style={{ backgroundColor: tier.bg, borderColor: tier.border }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-black px-2.5 py-1 rounded-lg text-white"
                      style={{ backgroundColor: tier.color }}>
                      {tier.p}
                    </span>
                    <span className="text-xs font-semibold text-gray-600">{tier.label}</span>
                    <span className="ml-auto text-xs font-medium text-gray-400">≤</span>
                  </div>
                  <p className="text-4xl font-extrabold mb-1" style={{ color: tier.color }}>{tier.time}</p>
                  <p className="text-xs text-gray-500 font-medium mb-3">guaranteed response</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{tier.desc}</p>
                </motion.div>
              ))}
            </div>

            <motion.p variants={fadeUp} className="text-center text-xs text-gray-400 mt-8 flex items-center justify-center gap-2">
              <AlertCircle size={12} className="text-indigo-400" />
              SLA breaches trigger instant alerts to both parties via the Equinox automated watchdog engine.
            </motion.p>
          </Section>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════════ */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <Section>
            <motion.div variants={fadeUp} className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">Client Stories</p>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                Brands That Scaled with Equinox
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {TESTIMONIALS.map(t => (
                <motion.div key={t.name} variants={fadeUp}
                  className="bg-white border border-gray-100 rounded-2xl p-7 hover:shadow-xl hover:border-indigo-100 transition-all duration-300 flex flex-col"
                >
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-gray-700 text-sm leading-relaxed flex-1 mb-6">"{t.quote}"</p>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-5 border-t border-gray-100">
                    <div className="w-10 h-10 rounded-full text-white text-sm font-bold flex items-center justify-center shrink-0"
                      style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                      {t.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                      <p className="text-xs text-gray-400 truncate">{t.role}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 shrink-0">
                      {t.platform}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CTA BANNER
      ═══════════════════════════════════════════ */}
      <section className="py-16 md:py-24" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #312e81 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 mb-6 rounded-full border border-white/20 bg-white/8 px-4 py-1.5 text-xs font-semibold text-white/70">
              <Sparkles size={11} className="text-amber-400" /> Start for free — no credit card required
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-5 leading-tight">
              Ready to Scale Your{' '}
              <span style={{ background: 'linear-gradient(90deg, #93c5fd, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                eCommerce Business?
              </span>
            </h2>
            <p className="text-blue-200/70 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Join top brands already growing on Amazon, Flipkart, and Shopify with zero service ambiguity. Free to join — pay only when you contract.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
              <Link to="/providers"
                className="group inline-flex items-center justify-center gap-2 bg-white px-8 py-4 rounded-xl text-sm font-bold text-indigo-700 hover:bg-indigo-50 shadow-2xl transition-all duration-200 hover:scale-[1.02]"
              >
                <BadgeCheck size={16} className="text-indigo-500" />
                Browse Certified Providers
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-semibold text-white border border-white/25 hover:bg-white/10 backdrop-blur-sm transition-all"
              >
                Create Free Account
              </Link>
            </div>

            {/* Trust signals */}
            <div className="flex items-center justify-center gap-8 flex-wrap">
              {[
                { icon: ShieldCheck, label: 'SLA-backed contracts' },
                { icon: Wallet,      label: 'Secure wallet payments' },
                { icon: Award,       label: 'LMS-certified experts' },
                { icon: Zap,         label: 'AI-powered platform' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-1.5 text-white/40 text-xs">
                  <s.icon size={12} className="text-indigo-300" />
                  {s.label}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
