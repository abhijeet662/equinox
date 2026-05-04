import React from 'react';
import { useAppSelector } from '../../hooks/useAppSelector';
import { ROLE_CONFIG } from '../../utils/roleConfig';
import type { RoleKey } from '../../utils/roleConfig';

interface Props {
  /** Optional CTA button rendered on the right (hidden on mobile) */
  cta?: React.ReactNode;
}

const DashboardBanner: React.FC<Props> = ({ cta }) => {
  const user = useAppSelector(s => s.auth.user);
  const role  = (user?.role || 'guest') as string;
  const cfg   = ROLE_CONFIG[role as RoleKey];

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (!cfg) return null;

  return (
    <div className={`rounded-2xl p-5 relative overflow-hidden ${cfg.gradient}`}>
      {/* Decorative blobs */}
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
      <div className="absolute right-6 bottom-0 w-20 h-20 bg-white/5 rounded-full pointer-events-none" />

      <div className="relative flex items-center justify-between gap-4">
        {/* Left: emoji + greeting */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center text-2xl border border-white/20 flex-shrink-0 backdrop-blur-sm">
            {cfg.emoji}
          </div>
          <div>
            {/* Role identity pill */}
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 bg-white/10 px-2.5 py-0.5 rounded-full mb-1.5 border border-white/15">
              {cfg.subtitle}
              <span className="text-white/30">·</span>
              {cfg.mainJob}
            </span>
            {/* Greeting */}
            <h1 className="text-xl font-bold text-white leading-tight">
              {greeting}, {user?.name?.split(' ')[0] || 'there'}! 👋
            </h1>
          </div>
        </div>

        {/* Right: CTA */}
        {cta && (
          <div className="hidden md:block flex-shrink-0">
            {cta}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardBanner;
