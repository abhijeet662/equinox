import React, { useState } from 'react';
import {
  HardDrive, Plus, Package, Laptop, Key, Smartphone, Server,
  Pencil, Trash2, UserX, ShieldOff, Search, X, AlertTriangle,
} from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { useApi } from '../../hooks/useApi';
import { assetsService } from '../../services/assets.service';
import type { Asset } from '../../services/assets.service';
import { usersService } from '../../services/users.service';
import toast from 'react-hot-toast';

const CATEGORY_FILTERS = ['All', 'HARDWARE', 'SOFTWARE'];

const ASSET_TYPES_HARDWARE = ['LAPTOP', 'DESKTOP', 'MOBILE', 'TABLET', 'PERIPHERAL', 'SERVER', 'OTHER_HARDWARE'];
const ASSET_TYPES_SOFTWARE = ['SOFTWARE_LICENSE', 'API_KEY', 'MARKETPLACE_CREDENTIAL', 'OTHER_SOFTWARE'];

const STATUS_BADGE: Record<string, string> = {
  AVAILABLE:   'bg-green-100 text-green-700',
  ASSIGNED:    'bg-blue-100 text-blue-700',
  MAINTENANCE: 'bg-amber-100 text-amber-700',
  REVOKED:     'bg-red-100 text-red-700',
  RETIRED:     'bg-surface-100 text-surface-500',
  LOST:        'bg-red-100 text-red-600',
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  LAPTOP:                <Laptop size={16} className="text-blue-500" />,
  DESKTOP:               <HardDrive size={16} className="text-blue-500" />,
  MOBILE:                <Smartphone size={16} className="text-blue-500" />,
  TABLET:                <Smartphone size={16} className="text-indigo-500" />,
  PERIPHERAL:            <Package size={16} className="text-surface-500" />,
  SERVER:                <Server size={16} className="text-purple-500" />,
  OTHER_HARDWARE:        <HardDrive size={16} className="text-surface-500" />,
  SOFTWARE_LICENSE:      <Package size={16} className="text-emerald-500" />,
  API_KEY:               <Key size={16} className="text-amber-500" />,
  MARKETPLACE_CREDENTIAL:<Key size={16} className="text-rose-500" />,
  OTHER_SOFTWARE:        <Package size={16} className="text-surface-400" />,
};

const emptyForm = {
  name: '', type: 'LAPTOP', category: 'HARDWARE' as 'HARDWARE' | 'SOFTWARE',
  serialNo: '', platform: '', description: '', status: 'AVAILABLE', assignedToId: '', notes: '',
};

const AdminAssetsPage: React.FC = () => {
  const [catFilter, setCatFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editAsset, setEditAsset] = useState<Asset | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Offboarding state ─────────────────────────────────────────────────────
  const [showOffboard, setShowOffboard] = useState(false);
  const [offboardUserId, setOffboardUserId] = useState('');
  const [offboardPreview, setOffboardPreview] = useState<{
    user: { id: string; name: string; email: string } | null;
    assets: Asset[];
    totalAssets: number;
  } | null>(null);
  const [offboardLoading, setOffboardLoading] = useState(false);
  const [offboardConfirm, setOffboardConfirm] = useState(false);
  const [offboardDone, setOffboardDone] = useState(false);

  const { data: assetsRes, refetch } = useApi(() => assetsService.list({ limit: 200 }), []);
  const assets: Asset[] = (assetsRes?.data as Asset[]) || [];

  const { data: usersRes } = useApi(() => usersService.list({ limit: 200 }), []);
  const users: Record<string, unknown>[] = (usersRes as Record<string, unknown>)?.data as Record<string, unknown>[] || [];

  // Stats
  const assigned   = assets.filter(a => a.status === 'ASSIGNED').length;
  const hardware   = assets.filter(a => a.category === 'HARDWARE').length;
  const software   = assets.filter(a => a.category === 'SOFTWARE').length;
  const revoked    = assets.filter(a => a.status === 'REVOKED').length;

  // Filtered list
  const filtered = assets.filter(a =>
    (catFilter === 'All' || a.category === catFilter) &&
    (search === '' ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.assignedTo?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.serialNo || '').toLowerCase().includes(search.toLowerCase())
    )
  );

  // ── Form helpers ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditAsset(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (a: Asset) => {
    setEditAsset(a);
    setForm({
      name: a.name, type: a.type, category: a.category,
      serialNo: a.serialNo || '', platform: a.platform || '',
      description: a.description || '', status: a.status,
      assignedToId: a.assignedToId || '', notes: a.notes || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Asset name is required'); return; }
    setSaving(true);
    try {
      if (editAsset) {
        await assetsService.update(editAsset.id, {
          ...form,
          assignedToId: form.assignedToId || null,
        });
        toast.success('Asset updated');
      } else {
        await assetsService.create({
          ...form,
          assignedToId: form.assignedToId || undefined,
        });
        toast.success('Asset registered');
      }
      setShowModal(false);
      refetch();
    } catch {
      toast.error('Failed to save asset');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this asset record?')) return;
    setDeletingId(id);
    try {
      await assetsService.remove(id);
      toast.success('Asset deleted');
      refetch();
    } catch {
      toast.error('Failed to delete asset');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Offboarding ───────────────────────────────────────────────────────────
  const handleOffboardPreview = async () => {
    if (!offboardUserId) { toast.error('Select a user first'); return; }
    setOffboardLoading(true);
    try {
      const result = await assetsService.getUserAssets(offboardUserId);
      setOffboardPreview(result);
      setOffboardConfirm(false);
      setOffboardDone(false);
    } catch {
      toast.error('Failed to load user assets');
    } finally {
      setOffboardLoading(false);
    }
  };

  const handleOffboardExecute = async () => {
    if (!offboardUserId) return;
    setOffboardLoading(true);
    try {
      const result = await assetsService.offboardUser(offboardUserId);
      setOffboardDone(true);
      setOffboardPreview(null);
      toast.success(`${result.revokedCount} asset(s) revoked — offboarding complete`);
      refetch();
    } catch {
      toast.error('Failed to offboard user');
    } finally {
      setOffboardLoading(false);
    }
  };

  const openOffboard = () => {
    setOffboardUserId('');
    setOffboardPreview(null);
    setOffboardConfirm(false);
    setOffboardDone(false);
    setShowOffboard(true);
  };

  const availableTypes = form.category === 'HARDWARE' ? ASSET_TYPES_HARDWARE : ASSET_TYPES_SOFTWARE;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Asset & Security Register</h1>
          <p className="text-surface-500 text-sm mt-0.5">Track hardware, software licences, API keys and credentials assigned to employees.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openOffboard}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium transition-colors"
          >
            <UserX size={15} /> Offboard User
          </button>
          <button onClick={openCreate} className="btn-primary text-sm">
            <Plus size={16} /> Register Asset
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Assets', value: assets.length, icon: <HardDrive size={18} className="text-primary-600" />, bg: 'bg-primary-50' },
          { label: 'Assigned', value: assigned, icon: <Package size={18} className="text-blue-600" />, bg: 'bg-blue-50' },
          { label: 'Hardware', value: hardware, icon: <Laptop size={18} className="text-emerald-600" />, bg: 'bg-emerald-50' },
          { label: 'Software / Keys', value: software, icon: <Key size={18} className="text-amber-600" />, bg: 'bg-amber-50' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center`}>{s.icon}</div>
              <div>
                <p className="text-2xl font-bold text-surface-900">{s.value}</p>
                <p className="text-sm text-surface-500">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex items-center gap-2 bg-surface-50 border border-surface-200 rounded-xl px-3 py-2 flex-1">
          <Search size={15} className="text-surface-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assets, employees, serial numbers..."
            className="bg-transparent text-sm outline-none flex-1 placeholder-surface-400" />
        </div>
        <div className="flex gap-2">
          {CATEGORY_FILTERS.map(f => (
            <button key={f} onClick={() => setCatFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${catFilter === f ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}>
              {f === 'All' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Asset Table */}
      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead className="bg-surface-50 border-b border-surface-200">
            <tr>
              <th className="table-th">Asset</th>
              <th className="table-th">Type</th>
              <th className="table-th">Assigned To</th>
              <th className="table-th">Status</th>
              <th className="table-th">Assigned On</th>
              <th className="table-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-surface-400">No assets found</td>
              </tr>
            )}
            {filtered.map(asset => (
              <tr key={asset.id} className="hover:bg-surface-50 transition-colors">
                <td className="table-td">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-surface-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {TYPE_ICON[asset.type] || <Package size={15} className="text-surface-400" />}
                    </div>
                    <div>
                      <p className="font-medium text-surface-800 text-sm">{asset.name}</p>
                      {asset.serialNo && <p className="text-xs text-surface-400">S/N: {asset.serialNo}</p>}
                      {asset.platform && <p className="text-xs text-surface-400">Platform: {asset.platform}</p>}
                    </div>
                  </div>
                </td>
                <td className="table-td">
                  <span className="text-xs text-surface-600 bg-surface-100 px-2 py-0.5 rounded font-medium">
                    {asset.type.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="table-td">
                  {asset.assignedTo ? (
                    <div>
                      <p className="text-sm font-medium text-surface-800">{asset.assignedTo.name}</p>
                      <p className="text-xs text-surface-400">{asset.assignedTo.email}</p>
                    </div>
                  ) : (
                    <span className="text-surface-400 text-sm">—</span>
                  )}
                </td>
                <td className="table-td">
                  <span className={`badge text-xs font-medium ${STATUS_BADGE[asset.status] || 'bg-surface-100 text-surface-600'}`}>
                    {asset.status}
                  </span>
                </td>
                <td className="table-td text-surface-500 text-sm">
                  {asset.assignedAt ? new Date(asset.assignedAt).toLocaleDateString() : '—'}
                  {asset.revokedAt && (
                    <div className="text-xs text-red-500">Revoked: {new Date(asset.revokedAt).toLocaleDateString()}</div>
                  )}
                </td>
                <td className="table-td">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => openEdit(asset)}
                      className="w-7 h-7 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-400 hover:text-primary-600 transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(asset.id)} disabled={deletingId === asset.id}
                      className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-surface-400 hover:text-red-500 transition-colors disabled:opacity-50">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Create / Edit Asset Modal ── */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editAsset ? 'Edit Asset' : 'Register New Asset'} size="md">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">Asset Name *</label>
            <input className="input-field text-sm" placeholder="e.g. MacBook Pro 16-inch"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Category *</label>
              <select className="input-field text-sm" value={form.category}
                onChange={e => {
                  const cat = e.target.value as 'HARDWARE' | 'SOFTWARE';
                  setForm({ ...form, category: cat, type: cat === 'HARDWARE' ? 'LAPTOP' : 'SOFTWARE_LICENSE' });
                }}>
                <option value="HARDWARE">Hardware</option>
                <option value="SOFTWARE">Software</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Type *</label>
              <select className="input-field text-sm" value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}>
                {availableTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">
                {form.category === 'HARDWARE' ? 'Serial Number' : 'Platform / Service'}
              </label>
              {form.category === 'HARDWARE' ? (
                <input className="input-field text-sm" placeholder="e.g. C02X9QNJJGH5"
                  value={form.serialNo} onChange={e => setForm({ ...form, serialNo: e.target.value })} />
              ) : (
                <input className="input-field text-sm" placeholder="e.g. AWS, Shopify, GitHub"
                  value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} />
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Status</label>
              <select className="input-field text-sm" value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}>
                {['AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'RETIRED', 'LOST'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">Assign To Employee</label>
            <select className="input-field text-sm" value={form.assignedToId}
              onChange={e => setForm({ ...form, assignedToId: e.target.value, status: e.target.value ? 'ASSIGNED' : form.status })}>
              <option value="">Unassigned</option>
              {users.filter(u => u.role === 'EMPLOYEE').map(u => (
                <option key={u.id as string} value={u.id as string}>{u.name as string} ({u.email as string})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-surface-600 mb-1 block">Notes</label>
            <textarea rows={2} className="input-field text-sm resize-none" placeholder="Optional notes about this asset..."
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-1">
            <button className="btn-secondary flex-1 justify-center text-sm" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary flex-1 justify-center text-sm disabled:opacity-60" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editAsset ? 'Save Changes' : 'Register Asset'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Offboarding Modal ── */}
      <Modal isOpen={showOffboard} onClose={() => setShowOffboard(false)} title="Employee Offboarding" size="md">
        {offboardDone ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
              <ShieldOff size={26} className="text-green-600" />
            </div>
            <p className="font-bold text-surface-800 text-lg">Offboarding Complete</p>
            <p className="text-sm text-surface-500">All assets have been revoked and access has been terminated.</p>
            <button className="btn-primary text-sm mt-2" onClick={() => setShowOffboard(false)}>Close</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl">
              <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">
                This action will <strong>revoke all assets</strong> assigned to the selected employee and mark them as terminated.
                This cannot be undone.
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-surface-600 mb-1 block">Select Employee to Offboard</label>
              <select className="input-field text-sm" value={offboardUserId}
                onChange={e => { setOffboardUserId(e.target.value); setOffboardPreview(null); setOffboardConfirm(false); }}>
                <option value="">— Select employee —</option>
                {users.filter(u => u.role === 'EMPLOYEE').map(u => (
                  <option key={u.id as string} value={u.id as string}>{u.name as string} ({u.email as string})</option>
                ))}
              </select>
            </div>

            {!offboardPreview && (
              <button className="btn-secondary w-full text-sm justify-center" onClick={handleOffboardPreview} disabled={offboardLoading || !offboardUserId}>
                {offboardLoading ? 'Loading...' : 'Preview Assets'}
              </button>
            )}

            {offboardPreview && (
              <div className="space-y-3">
                {offboardPreview.totalAssets === 0 ? (
                  <p className="text-sm text-surface-500 text-center py-4">No assets currently assigned to this employee.</p>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-surface-700">{offboardPreview.totalAssets} asset(s) will be revoked:</p>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {offboardPreview.assets.map(a => (
                        <div key={a.id} className="flex items-center gap-2.5 p-2.5 bg-surface-50 rounded-xl border border-surface-200">
                          <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center flex-shrink-0 border border-surface-200">
                            {TYPE_ICON[a.type] || <Package size={13} className="text-surface-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-surface-800 truncate">{a.name}</p>
                            <p className="text-[10px] text-surface-400">{a.type.replace(/_/g, ' ')}</p>
                          </div>
                          <span className={`badge text-[10px] font-medium ${STATUS_BADGE[a.status] || ''}`}>{a.status}</span>
                        </div>
                      ))}
                    </div>

                    {!offboardConfirm ? (
                      <button
                        className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                        onClick={() => setOffboardConfirm(true)}
                      >
                        <ShieldOff size={15} /> Revoke All Assets & Offboard
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-red-700 text-center">Are you sure? This cannot be undone.</p>
                        <div className="flex gap-2">
                          <button className="btn-secondary flex-1 text-sm justify-center" onClick={() => setOffboardConfirm(false)}>Cancel</button>
                          <button
                            disabled={offboardLoading}
                            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
                            onClick={handleOffboardExecute}
                          >
                            {offboardLoading ? 'Revoking...' : 'Confirm Offboard'}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminAssetsPage;
