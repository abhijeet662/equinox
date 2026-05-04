import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CheckSquare, FileText, Users, BarChart2,
  Wallet, Brain, Settings, ChevronLeft,
  Building2, ShoppingBag, UserCheck, Calendar,
  AlertCircle, CreditCard, Bell, Package, TrendingUp, X,
  BookOpen, Award, Receipt, HardDrive, Star,
  Store, Shield, DollarSign, Video, Clock, ShieldCheck,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppSelector';
import { toggleSidebar, toggleSidebarCollapse } from '../../store/slices/uiSlice';
import type { UserRole } from '../../types';
import Avatar from '../ui/Avatar';
import { ROLE_CONFIG } from '../../utils/roleConfig';
import type { RoleKey } from '../../utils/roleConfig';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navByRole: Record<UserRole, NavItem[]> = {
  admin: [
    { label: 'Dashboard',      path: '/admin',                     icon: <LayoutDashboard size={18} /> },
    { label: 'Users',          path: '/admin/users',               icon: <Users size={18} /> },
    { label: 'Providers',      path: '/admin/providers',           icon: <Building2 size={18} /> },
    { label: 'Buyers',         path: '/admin/buyers',              icon: <ShoppingBag size={18} /> },
    { label: 'Employees',      path: '/admin/employees',           icon: <UserCheck size={18} /> },
    { label: 'Finance',        path: '/admin/finance',             icon: <DollarSign size={18} /> },
    { label: 'Invoices',       path: '/admin/invoices',            icon: <Receipt size={18} /> },
    { label: 'Payments',       path: '/admin/payments',            icon: <CreditCard size={18} /> },
    { label: 'Complaints',     path: '/admin/complaints',          icon: <AlertCircle size={18} /> },
    { label: 'Reviews',        path: '/admin/reviews',             icon: <Star size={18} /> },
    { label: 'Marketplace',    path: '/admin/marketplace-control', icon: <Store size={18} /> },
    { label: 'Assets',         path: '/admin/assets',              icon: <HardDrive size={18} /> },
    { label: 'Reports',        path: '/admin/reports',             icon: <BarChart2 size={18} /> },
    { label: 'Security',       path: '/admin/security',            icon: <Shield size={18} /> },
    { label: 'Training',       path: '/admin/training',            icon: <BookOpen size={18} /> },
    { label: 'Notifications',  path: '/admin/notifications',       icon: <Bell size={18} /> },
    { label: 'Settings',       path: '/admin/settings',            icon: <Settings size={18} /> },
  ],
  provider: [
    { label: 'Dashboard',    path: '/provider',          icon: <LayoutDashboard size={18} /> },
    { label: 'Clients',      path: '/provider/clients',  icon: <Users size={18} /> },
    { label: 'Tasks',        path: '/provider/tasks',    icon: <CheckSquare size={18} /> },
    { label: 'Team',         path: '/provider/team',     icon: <UserCheck size={18} /> },
    { label: 'Contracts',    path: '/provider/contracts',icon: <FileText size={18} /> },
    { label: 'Meetings',     path: '/provider/meetings', icon: <Calendar size={18} /> },
    { label: 'Sales',        path: '/provider/sales',    icon: <TrendingUp size={18} /> },
    { label: 'P&L Report',   path: '/provider/pl',       icon: <BarChart2 size={18} /> },
    { label: 'Invoices',     path: '/provider/invoices', icon: <Receipt size={18} /> },
    { label: 'Reviews',      path: '/provider/reviews',  icon: <Star size={18} /> },
    { label: 'Training',      path: '/provider/training',      icon: <BookOpen size={18} /> },
    { label: 'Verification', path: '/provider/verification',  icon: <ShieldCheck size={18} /> },
    { label: 'Get Featured', path: '/provider/featured',      icon: <Star size={18} /> },
    { label: 'Settings',     path: '/provider/settings',      icon: <Settings size={18} /> },
  ],
  buyer: [
    { label: 'Dashboard',    path: '/buyer',             icon: <LayoutDashboard size={18} /> },
    { label: 'Marketplace',  path: '/buyer/marketplace', icon: <Store size={18} /> },
    { label: 'My Providers', path: '/buyer/providers',   icon: <Building2 size={18} /> },
    { label: 'Services',     path: '/buyer/services',    icon: <ShoppingBag size={18} /> },
    { label: 'My Orders',    path: '/buyer/orders',      icon: <Package size={18} /> },
    { label: 'Tasks',        path: '/buyer/tasks',       icon: <CheckSquare size={18} /> },
    { label: 'Meetings',     path: '/buyer/meetings',    icon: <Calendar size={18} /> },
    { label: 'Wallet',       path: '/buyer/wallet',      icon: <Wallet size={18} /> },
    { label: 'Analytics',     path: '/buyer/analytics',     icon: <BarChart2 size={18} /> },
    { label: 'Integrations',  path: '/buyer/integrations',  icon: <Package size={18} /> },
    { label: 'Complaints',    path: '/buyer/complaints',    icon: <AlertCircle size={18} /> },
    { label: 'Reviews',      path: '/buyer/reviews',     icon: <Star size={18} /> },
    { label: 'AI Insights',  path: '/buyer/ai',          icon: <Brain size={18} /> },
    { label: 'Settings',     path: '/buyer/settings',    icon: <Settings size={18} /> },
  ],
  employee: [
    { label: 'Dashboard',   path: '/employee',            icon: <LayoutDashboard size={18} /> },
    { label: 'Task Board',  path: '/employee/tasks',      icon: <CheckSquare size={18} /> },
    { label: 'Attendance',  path: '/employee/attendance', icon: <Clock size={18} /> },
    { label: 'Leave',       path: '/employee/leave',      icon: <Calendar size={18} /> },
    { label: 'Meetings',    path: '/employee/meetings',   icon: <Video size={18} /> },
    { label: 'Performance', path: '/employee/performance',icon: <TrendingUp size={18} /> },
    { label: 'Learning',    path: '/employee/learning',   icon: <BookOpen size={18} /> },
    { label: 'Team',        path: '/employee/team',       icon: <UserCheck size={18} /> },
    { label: 'My Profile',  path: '/employee/profile',   icon: <Users size={18} /> },
    { label: 'Settings',    path: '/employee/settings',   icon: <Settings size={18} /> },
  ],
  guest: [],
};

const roleColors: Record<UserRole, string> = {
  admin: 'bg-purple-600',
  provider: 'bg-primary-600',
  buyer: 'bg-emerald-600',
  employee: 'bg-amber-600',
  guest: 'bg-surface-600',
};

const Sidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector(s => s.auth);
  const { sidebarOpen, sidebarCollapsed } = useAppSelector(s => s.ui);
  const role = user?.role as UserRole || 'guest';
  const navItems = navByRole[role] || [];

  if (!sidebarOpen) return null;

  return (
    <>
      {/* Mobile overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-30 md:hidden"
        onClick={() => dispatch(toggleSidebar())}
      />

      <aside className={`
        fixed top-0 left-0 h-full z-40
        bg-surface-900 text-white flex flex-col
        transition-all duration-300
        md:relative md:z-auto
        ${sidebarCollapsed ? 'w-16' : 'w-64'}
      `}>
        {/* Logo */}
        <div className={`flex items-center h-16 border-b border-surface-700 flex-shrink-0 ${sidebarCollapsed ? 'px-3 justify-center' : 'px-5 gap-3'}`}>
          {!sidebarCollapsed && (
            <>
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center font-bold text-white text-sm">EQ</div>
              <span className="font-bold text-white text-lg tracking-tight">Equinox</span>
            </>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center font-bold text-white text-sm">EQ</div>
          )}
          <div className="ml-auto flex items-center gap-1">
            {!sidebarCollapsed && (
              <button
                onClick={() => dispatch(toggleSidebarCollapse())}
                className="w-7 h-7 rounded-md hover:bg-surface-700 flex items-center justify-center text-surface-400 hidden md:flex"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            <button
              onClick={() => dispatch(toggleSidebar())}
              className="w-7 h-7 rounded-md hover:bg-surface-700 flex items-center justify-center text-surface-400 md:hidden"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Collapsed expand button */}
        {sidebarCollapsed && (
          <button
            onClick={() => dispatch(toggleSidebarCollapse())}
            className="mx-3 mt-3 w-10 h-8 rounded-md hover:bg-surface-700 flex items-center justify-center text-surface-400 hidden md:flex"
          >
            <ChevronLeft size={16} className="rotate-180" />
          </button>
        )}

        {/* User badge */}
        {!sidebarCollapsed && user && (
          <div className="mx-3 mt-4 mb-2 p-3 rounded-xl bg-surface-800 flex items-center gap-3">
            <Avatar initials={(user.name?.[0] || 'U').toUpperCase()} size="sm" color="bg-primary-500 text-white" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${roleColors[role]}`} />
                <span className="text-xs text-surface-400 truncate">
                  {ROLE_CONFIG[role as RoleKey]?.subtitle || role}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path.split('/').length === 2}
              onClick={() => { /* close on mobile */ }}
              className={({ isActive }) =>
                `sidebar-link mb-0.5 ${isActive ? 'bg-primary-600 text-white' : 'text-surface-300 hover:bg-surface-700 hover:text-white'}
                ${sidebarCollapsed ? 'justify-center px-0' : ''}`
              }
              title={sidebarCollapsed ? item.label : ''}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!sidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Go to Marketplace */}
        {!sidebarCollapsed && (
          <div className="px-3 py-3 border-t border-surface-700">
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-surface-400 hover:bg-surface-700 hover:text-white transition-colors"
            >
              <ShoppingBag size={14} />
              <span>Go to Marketplace</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
