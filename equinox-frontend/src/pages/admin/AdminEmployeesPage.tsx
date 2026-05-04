import React, { useState } from 'react';
import {
  Users, UserCheck, UserX, Calendar, Plus, X,
  CheckCircle, XCircle, AlertTriangle, Coffee,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { usersService, type WorkforceEmployee } from '../../services/users.service';
import { leaveService } from '../../services/leave.service';
import toast from 'react-hot-toast';

type Tab = 'employees' | 'leave' | 'workforce';

// ─── Priority capacity bar ────────────────────────────────────────────────────
const PriorityBar: React.FC<{
  label: string;
  active: number;
  cap: number;
  pct: number;
  color: string;
}> = ({ label, active, cap, pct, color }) => (
  <div className="flex items-center gap-2 min-w-0">
    <span className={`text-xs font-bold w-6 flex-shrink-0 ${color}`}>{label}</span>
    <div className="flex-1 bg-surface-100 rounded-full h-2 overflow-hidden min-w-[48px]">
      <div
        className={`h-2 rounded-full transition-all ${pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-400' : 'bg-green-400'}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
    <span className="text-xs text-surface-500 flex-shrink-0 w-10 text-right">
      {active}/{cap}
    </span>
  </div>
);

// ─── Workforce card ───────────────────────────────────────────────────────────
const WorkforceCard: React.FC<{ emp: WorkforceEmployee }> = ({ emp }) => {
  const atCapacity = emp.isAtCapacity;
  const onLeave = emp.isOnLeaveToday;

  return (
    <div className={`card p-4 border transition-colors ${atCapacity ? 'border-red-300 bg-red-50' : 'border-surface-200 bg-white'}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${atCapacity ? 'bg-red-200 text-red-700' : 'bg-purple-100 text-purple-700'}`}>
            {emp.name[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-surface-900 text-sm leading-tight">{emp.name}</p>
            <p className="text-xs text-surface-400">{emp.email}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {atCapacity && (
            <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
              <AlertTriangle size={11} /> At Capacity
            </span>
          )}
          {onLeave && (
            <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              <Coffee size={11} /> On Leave Today
            </span>
          )}
          {!atCapacity && !onLeave && (
            <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Available</span>
          )}
        </div>
      </div>

      {/* Department */}
      {(emp.employeeProfile?.department || emp.employeeProfile?.jobTitle) && (
        <p className="text-xs text-surface-500 mb-3">
          {[emp.employeeProfile?.jobTitle, emp.employeeProfile?.department].filter(Boolean).join(' · ')}
        </p>
      )}

      {/* Load bars */}
      <div className="space-y-1.5">
        <PriorityBar label="P0" active={emp.load.P0.active} cap={emp.load.P0.cap} pct={emp.load.P0.pct} color="text-red-500" />
        <PriorityBar label="P1" active={emp.load.P1.active} cap={emp.load.P1.cap} pct={emp.load.P1.pct} color="text-orange-500" />
        <PriorityBar label="P2" active={emp.load.P2.active} cap={emp.load.P2.cap} pct={emp.load.P2.pct} color="text-blue-500" />
        <PriorityBar label="P3" active={emp.load.P3.active} cap={emp.load.P3.cap} pct={emp.load.P3.pct} color="text-surface-400" />
      </div>

      {/* Footer totals */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-100">
        <span className="text-xs text-surface-500">Active Tasks</span>
        <span className={`text-sm font-bold ${atCapacity ? 'text-red-600' : 'text-surface-800'}`}>
          {emp.totalActive} &nbsp;
          <span className="text-xs font-normal text-surface-400">({emp.maxCapacityPct}% peak load)</span>
        </span>
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const AdminEmployeesPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('employees');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '' });
  const [submitting, setSubmitting] = useState(false);

  const { data: empRes, refetch: refetchEmp } = useApi(() => usersService.list({ role: 'EMPLOYEE', limit: 100 }), []);
  const { data: leaveRes, refetch: refetchLeave } = useApi(() => leaveService.list({ limit: 100 }), []);
  const { data: workforce, loading: workforceLoading } = useApi(
    () => usersService.getWorkforce(),
    [],
  );

  const employees: Record<string, unknown>[] = empRes?.data || [];
  const leaves: Record<string, unknown>[] = leaveRes?.data || [];
  const workforceList: WorkforceEmployee[] = workforce || [];

  const active = employees.filter(e => e.status === 'ACTIVE').length;
  const pendingLeave = leaves.filter(l => l.status === 'PENDING').length;
  const atCapacityCount = workforceList.filter(w => w.isAtCapacity).length;

  const handleStatus = async (id: string, status: string) => {
    try {
      await usersService.updateStatus(id, status);
      toast.success(`Employee ${status === 'ACTIVE' ? 'activated' : 'suspended'}`);
      refetchEmp();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleLeaveReview = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await leaveService.review(id, status);
      toast.success(`Leave ${status.toLowerCase()}`);
      refetchLeave();
    } catch {
      toast.error('Failed to review leave');
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await usersService.create({ ...form, role: 'EMPLOYEE' });
      toast.success('Employee created successfully');
      setShowModal(false);
      setForm({ name: '', email: '', password: '', company: '' });
      refetchEmp();
    } catch {
      toast.error('Failed to create employee');
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-700',
      SUSPENDED: 'bg-red-100 text-red-700',
      PENDING: 'bg-amber-100 text-amber-700',
      APPROVED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[status] || 'bg-surface-100 text-surface-600'}`}>
        {status}
      </span>
    );
  };

  const diffDays = (start: string, end: string) => {
    const s = new Date(start), e = new Date(end);
    return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const TAB_LABELS: Record<Tab, string> = {
    employees: 'Employees',
    leave: 'Leave Requests',
    workforce: 'Workforce',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Employee Management</h1>
          <p className="text-surface-500 text-sm mt-0.5">Manage employees, review leave requests, and monitor workforce capacity.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary text-sm flex items-center gap-2">
          <Plus size={15} /> Add Employee
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Users size={18} className="text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-surface-900">{employees.length}</p>
          <p className="text-sm text-surface-500">Total Employees</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">{active}</p>
          <p className="text-sm text-surface-500">Active</p>
        </div>
        <div className="card text-center">
          <div className="flex items-center justify-center gap-1">
            <p className="text-2xl font-bold text-amber-600">{pendingLeave}</p>
            {pendingLeave > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
          </div>
          <p className="text-sm text-surface-500">Pending Leave</p>
        </div>
        <div className="card text-center">
          <div className="flex items-center justify-center gap-1">
            <p className="text-2xl font-bold text-red-600">{atCapacityCount}</p>
            {atCapacityCount > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
          </div>
          <p className="text-sm text-surface-500">At Capacity</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 p-1 rounded-xl w-fit">
        {(['employees', 'leave', 'workforce'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'}`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* ── Employees tab ───────────────────────────────────────────────────── */}
      {tab === 'employees' && (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead className="bg-surface-50 border-b border-surface-200">
              <tr>
                <th className="table-th">Employee</th>
                <th className="table-th">Department</th>
                <th className="table-th">Status</th>
                <th className="table-th">Joined</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {employees.map(e => {
                const profile = e.employeeProfile as Record<string, unknown> | null;
                return (
                  <tr key={e.id as string} className="hover:bg-surface-50 transition-colors">
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {((e.name as string) || 'E')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-surface-800">{e.name as string}</p>
                          <p className="text-xs text-surface-400">{e.email as string}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-td text-surface-600 text-sm">
                      {(profile?.department as string) || (e.company as string) || 'N/A'}
                    </td>
                    <td className="table-td">{statusBadge(e.status as string)}</td>
                    <td className="table-td text-surface-500 text-sm">
                      {e.createdAt ? new Date(e.createdAt as string).toLocaleDateString() : '—'}
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        {e.status !== 'ACTIVE' && (
                          <button onClick={() => handleStatus(e.id as string, 'ACTIVE')} className="btn-primary text-sm flex items-center gap-1 py-1 px-2">
                            <UserCheck size={13} /> Activate
                          </button>
                        )}
                        {e.status !== 'SUSPENDED' && (
                          <button onClick={() => handleStatus(e.id as string, 'SUSPENDED')} className="btn-outline text-sm flex items-center gap-1 py-1 px-2 border-red-200 text-red-600 hover:bg-red-50">
                            <UserX size={13} /> Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {employees.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-surface-400">No employees found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Leave Requests tab ──────────────────────────────────────────────── */}
      {tab === 'leave' && (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead className="bg-surface-50 border-b border-surface-200">
              <tr>
                <th className="table-th">Employee</th>
                <th className="table-th">Leave Type</th>
                <th className="table-th">Dates</th>
                <th className="table-th">Days</th>
                <th className="table-th">Status</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {leaves.map(l => (
                <tr key={l.id as string} className="hover:bg-surface-50 transition-colors">
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center font-bold text-sm">
                        {((l.user as Record<string, string>)?.name || 'E')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-surface-800">{(l.user as Record<string, string>)?.name || '—'}</p>
                        <p className="text-xs text-surface-400">{(l.user as Record<string, string>)?.email || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-1">
                      <Calendar size={13} className="text-surface-400" />
                      <span className="text-sm text-surface-700">{l.type as string}</span>
                    </div>
                  </td>
                  <td className="table-td text-surface-600 text-sm">
                    {l.startDate ? new Date(l.startDate as string).toLocaleDateString() : '—'} →{' '}
                    {l.endDate ? new Date(l.endDate as string).toLocaleDateString() : '—'}
                  </td>
                  <td className="table-td text-surface-700 text-sm font-medium">
                    {l.startDate && l.endDate ? diffDays(l.startDate as string, l.endDate as string) : '—'} days
                  </td>
                  <td className="table-td">{statusBadge(l.status as string)}</td>
                  <td className="table-td">
                    {l.status === 'PENDING' && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleLeaveReview(l.id as string, 'APPROVED')} className="btn-primary text-sm flex items-center gap-1 py-1 px-2">
                          <CheckCircle size={13} /> Approve
                        </button>
                        <button onClick={() => handleLeaveReview(l.id as string, 'REJECTED')} className="btn-outline text-sm flex items-center gap-1 py-1 px-2 border-red-200 text-red-600 hover:bg-red-50">
                          <XCircle size={13} /> Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {leaves.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-surface-400">No leave requests found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Workforce tab ───────────────────────────────────────────────────── */}
      {tab === 'workforce' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-surface-500">
              Live task load per employee · caps: P0=2, P1=4, P2=8, P3=10
            </p>
            {atCapacityCount > 0 && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                <AlertTriangle size={14} />
                {atCapacityCount} employee{atCapacityCount > 1 ? 's' : ''} at capacity
              </span>
            )}
          </div>

          {workforceLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="card h-44 animate-pulse bg-surface-100" />
              ))}
            </div>
          ) : workforceList.length === 0 ? (
            <div className="card text-center py-16 text-surface-400">
              <Users size={32} className="mx-auto mb-3 opacity-30" />
              <p>No employees found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* At-capacity employees shown first */}
              {[...workforceList]
                .sort((a, b) => {
                  if (a.isAtCapacity && !b.isAtCapacity) return -1;
                  if (!a.isAtCapacity && b.isAtCapacity) return 1;
                  return b.maxCapacityPct - a.maxCapacityPct;
                })
                .map(emp => (
                  <WorkforceCard key={emp.id} emp={emp} />
                ))}
            </div>
          )}
        </div>
      )}

      {/* ── Add Employee Modal ──────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-surface-200">
              <h2 className="font-bold text-surface-900">Add Employee</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg hover:bg-surface-100 flex items-center justify-center">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateEmployee} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Full Name</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input-field text-sm w-full"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Email</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input-field text-sm w-full"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Password</label>
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input-field text-sm w-full"
                  placeholder="Temporary password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Department / Company</label>
                <input
                  value={form.company}
                  onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                  className="input-field text-sm w-full"
                  placeholder="Engineering"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline text-sm flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary text-sm flex-1">
                  {submitting ? 'Creating...' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmployeesPage;
