import React, { useState } from 'react';
import { Menu, Bell, Search, ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppSelector';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { logout, logoutAsync } from '../../store/slices/authSlice';
import Avatar from '../ui/Avatar';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { notificationsService } from '../../services/notifications.service';
import toast from 'react-hot-toast';

const Topbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector(s => s.auth);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const { data: notifRes, refetch: refetchNotifs } = useApi(
    () => notificationsService.list({ limit: 10 }),
    []
  );
  const notifications: Record<string, unknown>[] = notifRes?.data || [];
  const unreadCount = Array.isArray(notifications) ? notifications.filter((n: any) => !n.read).length
  : 0;

  const handleLogout = async () => {
    dispatch(logout()); // instant UI clear
    navigate('/');
    try {
      await dispatch(logoutAsync());
    } catch {
      // server-side cleanup failed silently
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllRead();
      refetchNotifs();
    } catch {
      toast.error('Failed to mark notifications as read');
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsService.markRead(id);
      refetchNotifs();
    } catch {
      // silent
    }
  };

  return (
    <header className="h-16 bg-white border-b border-surface-200 flex items-center justify-between px-4 md:px-6 flex-shrink-0 sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="w-9 h-9 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-500 md:hidden"
        >
          <Menu size={20} />
        </button>
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="w-9 h-9 rounded-lg hover:bg-surface-100 hidden md:flex items-center justify-center text-surface-500"
        >
          <Menu size={20} />
        </button>
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-surface-50 border border-surface-200 rounded-lg px-3 py-2 w-72">
          <Search size={16} className="text-surface-400" />
          <input
            type="text"
            placeholder="Search anything..."
            className="bg-transparent text-sm text-surface-700 placeholder-surface-400 outline-none flex-1"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }}
            className="w-9 h-9 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-500 relative"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          {showNotif && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-surface-200 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-surface-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-surface-800">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-primary-600 font-medium hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 && (
                  <p className="text-sm text-surface-400 text-center py-6">No notifications</p>
                )}
                {notifications.map(n => (
                  <div
                    key={n.id as string}
                    onClick={() => !n.read && handleMarkRead(n.id as string)}
                    className={`px-4 py-3 border-b border-surface-50 hover:bg-surface-50 cursor-pointer ${!n.read ? 'bg-blue-50/40' : ''}`}
                  >
                    <p className="text-sm font-medium text-surface-800">{n.title as string}</p>
                    <p className="text-xs text-surface-500 mt-0.5">{n.message as string}</p>
                    <p className="text-xs text-surface-400 mt-1">
                      {new Date(n.createdAt as string).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 text-center">
                <span
                  className="text-xs text-primary-600 font-medium cursor-pointer hover:underline"
                  onClick={() => {
                    setShowNotif(false);
                    const role = user?.role?.toLowerCase() || 'admin';
                    navigate(`/${role}/notifications`);
                  }}
                >
                  View all notifications
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-surface-100 transition-colors"
          >
            <Avatar
              initials={user?.name?.[0] || 'U'}
              src={user?.avatar && (user.avatar.startsWith('data:') || user.avatar.startsWith('http')) ? user.avatar : undefined}
              size="sm"
            />
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-surface-800 leading-tight">{user?.name}</p>
              <p className="text-xs text-surface-400 capitalize">{user?.role}</p>
            </div>
            <ChevronDown size={14} className="text-surface-400 hidden md:block" />
          </button>
          {showProfile && (
            <div className="absolute right-0 top-12 w-52 bg-white rounded-xl shadow-xl border border-surface-200 z-50 py-1 overflow-hidden">
              <div className="px-4 py-2 border-b border-surface-100">
                <p className="text-sm font-medium text-surface-800">{user?.name}</p>
                <p className="text-xs text-surface-500">{user?.email}</p>
              </div>
              <button
                onClick={() => { setShowProfile(false); navigate(`/${user?.role}/settings`); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50"
              >
                <User size={15} /> My Profile
              </button>
              <button
                onClick={() => { setShowProfile(false); navigate(`/${user?.role}/settings`); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50"
              >
                <Settings size={15} /> Settings
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-surface-100"
              >
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Close dropdowns on outside click */}
      {(showNotif || showProfile) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowNotif(false); setShowProfile(false); }} />
      )}
    </header>
  );
};

export default Topbar;
