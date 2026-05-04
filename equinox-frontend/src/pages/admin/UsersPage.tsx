import React, { useState } from 'react';
import { Search, Plus, UserCheck, UserX, Shield, X } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { formatDate } from '../../utils/helpers';
import { useApi } from '../../hooks/useApi';
import { usersService } from '../../services/users.service';
import toast from 'react-hot-toast';

const ROLES = ['All', 'ADMIN', 'PROVIDER', 'BUYER', 'EMPLOYEE'];
const STATUSES = ['All', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'];

const ROLE_COLOR: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  PROVIDER: 'bg-blue-100 text-blue-700',
  BUYER: 'bg-emerald-100 text-emerald-700',
  EMPLOYEE: 'bg-amber-100 text-amber-700',
};

const EMPTY_FORM = { name: '', email: '', password: '', role: 'BUYER', company: '', phone: '' };

const UsersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [roleEditUser, setRoleEditUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [newRole, setNewRole] = useState('');

  const { data: usersRes, refetch } = useApi(
    () => usersService.list({ limit: 100, role: roleFilter !== 'All' ? roleFilter : undefined }),
    [roleFilter]
  );
  const users: Record<string, unknown>[] = usersRes?.data || [];

  const filtered = users.filter(u =>
    (statusFilter === 'All' || u.status === statusFilter) &&
    (search === '' ||
      (u.name as string).toLowerCase().includes(search.toLowerCase()) ||
      (u.email as string).toLowerCase().includes(search.toLowerCase()))
  );

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await usersService.updateStatus(id, status);
      toast.success(`User ${status.toLowerCase()}`);
      refetch();
    } catch {
      toast.error('Failed to update user status');
    }
  };

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    if (!form.password || form.password.length < 8) e.password = 'Minimum 8 characters';
    return e;
  };

  const handleRoleEdit = (user: Record<string, unknown>) => {
    setRoleEditUser({ id: user.id as string, name: user.name as string, role: user.role as string });
    setNewRole(user.role as string);
  };

  const handleRoleSave = async () => {
    if (!roleEditUser) return;
    try {
      await usersService.updateRole(roleEditUser.id, newRole);
      toast.success(`Role updated to ${newRole.toLowerCase()}`);
      setRoleEditUser(null);
      refetch();
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true);
    try {
      await usersService.create({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        company: form.company || undefined,
        phone: form.phone || undefined,
      });
      toast.success('User created successfully');
      setShowModal(false);
      setForm(EMPTY_FORM);
      setFormErrors({});
      refetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to create user');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">User Management</h1>
          <p className="text-surface-500 text-sm mt-0.5">Manage all platform users and their roles.</p>
        </div>
        <button onClick={() => { setShowModal(true); setForm(EMPTY_FORM); setFormErrors({}); }} className="btn-primary text-sm">
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* ── Add User Modal ─────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
              <h2 className="font-bold text-surface-900">Add New User</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-400">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-surface-700 mb-1.5 block">Full Name</label>
                  <input
                    className={`input-field ${formErrors.name ? 'border-red-300' : ''}`}
                    placeholder="John Doe"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                  {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-surface-700 mb-1.5 block">Role</label>
                  <select
                    className="input-field"
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  >
                    {['ADMIN', 'PROVIDER', 'BUYER', 'EMPLOYEE'].map(r => (
                      <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-surface-700 mb-1.5 block">Email</label>
                <input
                  type="email"
                  className={`input-field ${formErrors.email ? 'border-red-300' : ''}`}
                  placeholder="user@company.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
                {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-surface-700 mb-1.5 block">Password</label>
                  <input
                    type="password"
                    className={`input-field ${formErrors.password ? 'border-red-300' : ''}`}
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  />
                  {formErrors.password && <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-surface-700 mb-1.5 block">Phone</label>
                  <input
                    className="input-field"
                    placeholder="+1-555-0100"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-surface-700 mb-1.5 block">Company <span className="text-surface-400 font-normal">(optional)</span></label>
                <input
                  className="input-field"
                  placeholder="Company name"
                  value={form.company}
                  onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline flex-1 justify-center py-2.5">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center py-2.5 disabled:opacity-60">
                  {saving ? (
                    <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creating…</>
                  ) : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {ROLES.slice(1).map(role => {
          const count = users.filter(u => u.role === role).length;
          return (
            <div key={role} className="card text-center">
              <p className="text-2xl font-bold text-surface-900">{count}</p>
              <span className={`badge capitalize mt-1 ${ROLE_COLOR[role] || 'bg-surface-100 text-surface-600'}`}>{role.toLowerCase()}s</span>
            </div>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="card p-4 flex flex-col md:flex-row gap-3">
        <div className="flex items-center gap-2 bg-surface-50 border border-surface-200 rounded-xl px-3 py-2 flex-1">
          <Search size={15} className="text-surface-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="bg-transparent text-sm outline-none flex-1 placeholder-surface-400" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-field text-sm w-36 capitalize">
          {ROLES.map(r => <option key={r} value={r}>{r === 'All' ? 'All Roles' : r.toLowerCase()}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field text-sm w-36">
          {STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s.toLowerCase()}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="px-4 py-3 border-b border-surface-200 flex items-center justify-between">
          <span className="text-sm font-medium text-surface-500">{filtered.length} users</span>
        </div>
        <table className="w-full">
          <thead className="bg-surface-50 border-b border-surface-200">
            <tr>
              <th className="table-th">User</th>
              <th className="table-th">Role</th>
              <th className="table-th">Status</th>
              <th className="table-th">Joined</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {filtered.map(user => (
              <tr key={user.id as string} className="hover:bg-surface-50 transition-colors">
                <td className="table-td">
                  <div className="flex items-center gap-3">
                    <Avatar initials={(user.name as string)?.[0] || 'U'} size="sm" />
                    <div>
                      <p className="font-medium text-surface-800">{user.name as string}</p>
                      <p className="text-xs text-surface-400">{user.email as string}</p>
                    </div>
                  </div>
                </td>
                <td className="table-td">
                  <span className={`badge capitalize ${ROLE_COLOR[user.role as string] || 'bg-surface-100 text-surface-600'}`}>{(user.role as string).toLowerCase()}</span>
                </td>
                <td className="table-td"><Badge label={(user.status as string).toLowerCase()} /></td>
                <td className="table-td text-surface-500">{formatDate(user.createdAt as string)}</td>
                <td className="table-td">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStatusChange(user.id as string, 'ACTIVE')}
                      className="w-7 h-7 rounded-lg hover:bg-green-50 flex items-center justify-center text-surface-400 hover:text-green-600 transition-colors"
                      title="Activate"
                    >
                      <UserCheck size={14} />
                    </button>
                    <button
                      onClick={() => handleStatusChange(user.id as string, 'SUSPENDED')}
                      className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-surface-400 hover:text-red-500 transition-colors"
                      title="Suspend"
                    >
                      <UserX size={14} />
                    </button>
                    <button
                      onClick={() => handleRoleEdit(user)}
                      className="w-7 h-7 rounded-lg hover:bg-purple-50 flex items-center justify-center text-surface-400 hover:text-purple-600 transition-colors"
                      title="Edit role"
                    >
                      <Shield size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="text-center py-12 text-surface-400">No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Role Edit Modal */}
      {roleEditUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
              <h2 className="font-bold text-surface-900">Edit Role</h2>
              <button onClick={() => setRoleEditUser(null)} className="w-8 h-8 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-400">
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-surface-600">Change role for <strong>{roleEditUser.name}</strong></p>
              <div>
                <label className="text-xs font-medium text-surface-600 mb-1.5 block">Role</label>
                <select className="input-field" value={newRole} onChange={e => setNewRole(e.target.value)}>
                  {['ADMIN', 'PROVIDER', 'BUYER', 'EMPLOYEE'].map(r => (
                    <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setRoleEditUser(null)} className="btn-outline flex-1 justify-center text-sm">Cancel</button>
                <button onClick={handleRoleSave} className="btn-primary flex-1 justify-center text-sm">Save Role</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
