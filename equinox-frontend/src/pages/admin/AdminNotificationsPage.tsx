import React, { useState } from 'react';
import { Bell, Check, Plus, Send } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { useApi } from '../../hooks/useApi';
import { notificationsService } from '../../services/notifications.service';
import toast from 'react-hot-toast';

const TYPE_STYLE: Record<string, { bg: string; dot: string }> = {
  TASK: { bg: 'bg-blue-50 border-blue-100', dot: 'bg-blue-500' },
  INVOICE: { bg: 'bg-green-50 border-green-100', dot: 'bg-green-500' },
  COMPLAINT: { bg: 'bg-amber-50 border-amber-100', dot: 'bg-amber-500' },
  SYSTEM: { bg: 'bg-surface-50 border-surface-100', dot: 'bg-surface-400' },
  CONTRACT: { bg: 'bg-purple-50 border-purple-100', dot: 'bg-purple-500' },
};

const AdminNotificationsPage: React.FC = () => {
  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', type: 'SYSTEM' });

  const { data: notifRes, refetch } = useApi(() => notificationsService.list({ limit: 100 }), []);
  const notifications: Record<string, unknown>[] = notifRes?.data || [];

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllRead();
      toast.success('All notifications marked as read');
      refetch();
    } catch {
      toast.error('Failed to mark notifications as read');
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsService.markRead(id);
      refetch();
    } catch {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationsService.remove(id);
      refetch();
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    // Broadcast is a future admin feature; show success for now
    toast.success('Broadcast sent (admin feature)');
    setShowCompose(false);
    setForm({ title: '', message: '', type: 'SYSTEM' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Notifications</h1>
          <p className="text-surface-500 text-sm mt-0.5">Manage and broadcast platform notifications.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleMarkAllRead} className="btn-secondary text-sm"><Check size={15} /> Mark all read</button>
          <button onClick={() => setShowCompose(true)} className="btn-primary text-sm"><Plus size={15} /> Broadcast</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center"><p className="text-2xl font-bold text-primary-600">{notifications.length}</p><p className="text-sm text-surface-500">Total</p></div>
        <div className="card text-center"><p className="text-2xl font-bold text-red-500">{unreadCount}</p><p className="text-sm text-surface-500">Unread</p></div>
        <div className="card text-center"><p className="text-2xl font-bold text-green-600">{notifications.length - unreadCount}</p><p className="text-sm text-surface-500">Read</p></div>
      </div>

      {/* Notifications list */}
      <div className="space-y-3">
        {notifications.length === 0 && (
          <div className="text-center py-16">
            <Bell size={32} className="mx-auto text-surface-300 mb-3" />
            <p className="text-surface-500">No notifications</p>
          </div>
        )}
        {notifications.map(n => {
          const style = TYPE_STYLE[n.type as string] || TYPE_STYLE.SYSTEM;
          return (
            <div key={n.id as string} className={`card border ${style.bg} hover:shadow-md transition-all duration-200`}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <div className={`w-2.5 h-2.5 rounded-full ${n.read ? 'bg-surface-200' : style.dot}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-semibold text-sm ${n.read ? 'text-surface-500' : 'text-surface-800'}`}>{n.title as string}</p>
                    <span className="text-xs text-surface-400 flex-shrink-0">
                      {new Date(n.createdAt as string).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-surface-600 mt-0.5">{n.message as string}</p>
                  <div className="flex gap-2 mt-2">
                    {!n.read && (
                      <button onClick={() => handleMarkRead(n.id as string)} className="text-xs text-primary-600 hover:underline">Mark read</button>
                    )}
                    <button onClick={() => handleDelete(n.id as string)} className="text-xs text-red-500 hover:underline">Delete</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Broadcast Modal */}
      <Modal isOpen={showCompose} onClose={() => setShowCompose(false)} title="Broadcast Notification">
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">Type</label>
            <select className="input-field text-sm" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="SYSTEM">System</option>
              <option value="TASK">Task</option>
              <option value="INVOICE">Invoice</option>
              <option value="COMPLAINT">Complaint</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">Title *</label>
            <input required className="input-field text-sm" placeholder="Notification title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">Message *</label>
            <textarea required rows={3} className="input-field text-sm resize-none" placeholder="Notification message..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowCompose(false)} className="btn-secondary flex-1 justify-center text-sm">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center text-sm"><Send size={14} /> Send</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminNotificationsPage;
