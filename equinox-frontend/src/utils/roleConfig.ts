/**
 * Single source of truth for role identity metadata.
 * Matches the canonical role table:
 *
 *  Role      │ Who Are They       │ Main Job
 *  ──────────┼────────────────────┼───────────────
 *  Admin     │ Platform Owner     │ Manage system
 *  Provider  │ Agency/Freelancer  │ Give services
 *  Buyer     │ Customer/Brand     │ Buy services
 *  Employee  │ Team Worker        │ Do tasks
 */

export const ROLE_CONFIG = {
  admin: {
    subtitle:  'Platform Owner',
    mainJob:   'Manage system',
    emoji:     '🏢',
    gradient:  'bg-gradient-to-r from-purple-600 to-violet-700',
    lightBg:   'bg-purple-50',
    badgeCls:  'bg-purple-100 text-purple-700',
    dotCls:    'bg-purple-500',
    textCls:   'text-purple-700',
    borderCls: 'border-purple-200',
  },
  provider: {
    subtitle:  'Agency / Freelancer',
    mainJob:   'Give services',
    emoji:     '💼',
    gradient:  'bg-gradient-to-r from-blue-600 to-primary-700',
    lightBg:   'bg-primary-50',
    badgeCls:  'bg-primary-100 text-primary-700',
    dotCls:    'bg-primary-500',
    textCls:   'text-primary-700',
    borderCls: 'border-primary-200',
  },
  buyer: {
    subtitle:  'Customer / Brand',
    mainJob:   'Buy services',
    emoji:     '🛒',
    gradient:  'bg-gradient-to-r from-emerald-600 to-teal-600',
    lightBg:   'bg-emerald-50',
    badgeCls:  'bg-emerald-100 text-emerald-700',
    dotCls:    'bg-emerald-500',
    textCls:   'text-emerald-700',
    borderCls: 'border-emerald-200',
  },
  employee: {
    subtitle:  'Team Worker',
    mainJob:   'Do tasks',
    emoji:     '⚡',
    gradient:  'bg-gradient-to-r from-amber-500 to-orange-500',
    lightBg:   'bg-amber-50',
    badgeCls:  'bg-amber-100 text-amber-700',
    dotCls:    'bg-amber-500',
    textCls:   'text-amber-700',
    borderCls: 'border-amber-200',
  },
} as const;

export type RoleKey = keyof typeof ROLE_CONFIG;
