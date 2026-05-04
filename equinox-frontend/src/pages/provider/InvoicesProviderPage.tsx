import React, { useState } from 'react';
import { Plus, Search, Download, X, Trash2 } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { useApi } from '../../hooks/useApi';
import { invoicesService } from '../../services/invoices.service';
import { contractsService } from '../../services/contracts.service';
import toast from 'react-hot-toast';

const STATUSES = ['All', 'PAID', 'PENDING', 'OVERDUE', 'DRAFT'];

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

const EMPTY_ITEM: LineItem = { description: '', quantity: 1, unitPrice: 0 };

const InvoicesProviderPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [buyerId, setBuyerId] = useState('');
  const [contractId, setContractId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItem[]>([{ ...EMPTY_ITEM }]);

  const { data: invoicesRes, refetch } = useApi(() => invoicesService.list({ limit: 100 }), []);
  const { data: contractsRes } = useApi(() => contractsService.list({ limit: 100 }), []);

  const invoices: Record<string, unknown>[] = invoicesRes?.data || [];
  const contracts: Record<string, unknown>[] = contractsRes?.data || [];

  // Derive unique buyers from contracts
  const buyerMap: Record<string, { id: string; name: string }> = {};
  contracts.forEach(c => {
    const b = c.buyer as Record<string, string> | undefined;
    if (b?.id) buyerMap[b.id] = { id: b.id, name: b.name || b.id };
  });
  const buyers = Object.values(buyerMap);

  const filtered = invoices.filter(i =>
    (filter === 'All' || i.status === filter) &&
    (search === '' ||
      ((i.buyer as Record<string, string>)?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.invoiceNo as string || '').toLowerCase().includes(search.toLowerCase()))
  );

  const totalPaid    = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + (i.total as number || 0), 0);
  const totalPending = invoices.filter(i => i.status === 'PENDING').reduce((s, i) => s + (i.total as number || 0), 0);
  const totalOverdue = invoices.filter(i => i.status === 'OVERDUE').reduce((s, i) => s + (i.total as number || 0), 0);

  // Line item helpers
  const updateItem = (idx: number, field: keyof LineItem, value: string | number) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };
  const addItem = () => setItems(prev => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));
  const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);

  const resetForm = () => {
    setBuyerId(''); setContractId(''); setDueDate(''); setNotes('');
    setItems([{ ...EMPTY_ITEM }]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerId) { toast.error('Select a client'); return; }
    if (items.some(it => !it.description.trim())) { toast.error('All items need a description'); return; }

    setSaving(true);
    try {
      await invoicesService.create({
        buyerId,
        contractId: contractId || undefined,
        dueDate: dueDate || undefined,
        notes: notes || undefined,
        items: items.map(it => ({
          description: it.description,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
        })),
      });
      toast.success('Invoice created');
      setShowModal(false);
      resetForm();
      refetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Invoices</h1>
          <p className="text-surface-500 text-sm mt-0.5">Manage and track all your invoices.</p>
        </div>
        <button className="btn-primary text-sm" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Create Invoice
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card"><p className="text-xl font-bold text-green-600">{formatCurrency(totalPaid)}</p><p className="text-sm text-surface-500 mt-0.5">Paid</p></div>
        <div className="card"><p className="text-xl font-bold text-amber-600">{formatCurrency(totalPending)}</p><p className="text-sm text-surface-500 mt-0.5">Pending</p></div>
        <div className="card"><p className="text-xl font-bold text-red-600">{formatCurrency(totalOverdue)}</p><p className="text-sm text-surface-500 mt-0.5">Overdue</p></div>
      </div>

      {/* Filter bar */}
      <div className="card p-4 flex flex-col md:flex-row gap-3">
        <div className="flex items-center gap-2 bg-surface-50 border border-surface-200 rounded-xl px-3 py-2 flex-1">
          <Search size={15} className="text-surface-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices..." className="bg-transparent text-sm outline-none flex-1 placeholder-surface-400" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors ${filter === s ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}>{s.toLowerCase()}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead className="bg-surface-50 border-b border-surface-200">
            <tr>
              <th className="table-th">Invoice #</th>
              <th className="table-th">Client</th>
              <th className="table-th">Amount</th>
              <th className="table-th">Issued</th>
              <th className="table-th">Due Date</th>
              <th className="table-th">Status</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {filtered.map(inv => (
              <tr key={inv.id as string} className="hover:bg-surface-50 transition-colors">
                <td className="table-td font-mono text-xs text-surface-700 font-medium">{(inv.invoiceNo as string) || (inv.id as string).slice(0, 8).toUpperCase()}</td>
                <td className="table-td font-medium text-surface-800">{(inv.buyer as Record<string, string>)?.name || '—'}</td>
                <td className="table-td font-semibold text-surface-900">{formatCurrency(inv.total as number || 0)}</td>
                <td className="table-td text-surface-500">{formatDate(inv.createdAt as string)}</td>
                <td className="table-td text-surface-500">{inv.dueDate ? formatDate(inv.dueDate as string) : '—'}</td>
                <td className="table-td"><Badge label={(inv.status as string).toLowerCase()} /></td>
                <td className="table-td">
                  <button className="w-7 h-7 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-400 hover:text-surface-700 transition-colors">
                    <Download size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-surface-400">No invoices found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 sticky top-0 bg-white z-10">
              <h2 className="font-bold text-surface-900">Create Invoice</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="w-8 h-8 rounded-lg hover:bg-surface-100 flex items-center justify-center text-surface-400">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-5">
              {/* Client & Contract */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-surface-600 mb-1.5 block">Client *</label>
                  <select className="input-field text-sm" value={buyerId} onChange={e => setBuyerId(e.target.value)} required>
                    <option value="">Select client…</option>
                    {buyers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-surface-600 mb-1.5 block">Contract (optional)</label>
                  <select className="input-field text-sm" value={contractId} onChange={e => setContractId(e.target.value)}>
                    <option value="">None</option>
                    {contracts.filter(c => !buyerId || (c.buyer as Record<string, string>)?.id === buyerId).map(c => (
                      <option key={c.id as string} value={c.id as string}>{c.title as string}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-surface-600 mb-1.5 block">Due Date</label>
                <input type="date" className="input-field text-sm" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>

              {/* Line items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-surface-600">Line Items *</label>
                  <button type="button" onClick={addItem} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                    <Plus size={12} /> Add item
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-surface-500 px-1">
                    <span className="col-span-6">Description</span>
                    <span className="col-span-2 text-center">Qty</span>
                    <span className="col-span-3 text-right">Unit Price</span>
                    <span className="col-span-1" />
                  </div>
                  {items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        className="input-field text-sm col-span-6"
                        placeholder="Description"
                        value={it.description}
                        onChange={e => updateItem(idx, 'description', e.target.value)}
                        required
                      />
                      <input
                        type="number"
                        min="1"
                        className="input-field text-sm col-span-2 text-center"
                        value={it.quantity}
                        onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input-field text-sm col-span-3 text-right"
                        placeholder="0.00"
                        value={it.unitPrice || ''}
                        onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))}
                      />
                      <button type="button" onClick={() => removeItem(idx)} disabled={items.length === 1} className="col-span-1 text-surface-300 hover:text-red-400 disabled:opacity-30 flex justify-center">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-3 pt-3 border-t border-surface-100">
                  <div className="text-right">
                    <p className="text-xs text-surface-500">Subtotal</p>
                    <p className="text-lg font-bold text-surface-900">{formatCurrency(subtotal)}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-surface-600 mb-1.5 block">Notes</label>
                <textarea rows={2} className="input-field text-sm resize-none" placeholder="Payment terms, notes…" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn-outline flex-1 justify-center text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center text-sm disabled:opacity-60">
                  {saving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creating…</> : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesProviderPage;
