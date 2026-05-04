import React, { useState } from 'react';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, FileText, CreditCard } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Modal from '../../components/ui/Modal';
import { useApi } from '../../hooks/useApi';
import { walletService } from '../../services/wallet.service';
import { invoicesService } from '../../services/invoices.service';
import toast from 'react-hot-toast';

const WalletPage: React.FC = () => {
  const [showTopup, setShowTopup] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState('');
  const [filter, setFilter] = useState('All');
  const [submitting, setSubmitting] = useState(false);
  const [autoRecharge, setAutoRecharge] = useState(false);
  const [autoThreshold, setAutoThreshold] = useState('500');
  const [autoAmount, setAutoAmount] = useState('1000');

  const QUICK_AMOUNTS = [500, 1000, 2500, 5000];

  const [payingInvoice, setPayingInvoice] = useState<string | null>(null);

  const { data: wallet, refetch: refetchWallet } = useApi(() => walletService.getMyWallet(), []);
  const { data: txRes, refetch: refetchTx } = useApi(() => walletService.getTransactions({ limit: 50 }), []);
  const { data: invoicesRes, refetch: refetchInvoices } = useApi(() => invoicesService.list({ limit: 50 }), []);
  const transactions: Record<string, unknown>[] = txRes?.data || [];
  const allInvoices: Record<string, unknown>[] = invoicesRes?.data || [];
  const pendingInvoices = allInvoices.filter(i => i.status === 'PENDING');

  const handlePayInvoice = async (invoiceId: string, total: number) => {
    if ((wallet?.balance || 0) < total) {
      toast.error('Insufficient wallet balance. Please top up first.');
      return;
    }
    if (!confirm(`Pay ${formatCurrency(total)} from your wallet?`)) return;
    setPayingInvoice(invoiceId);
    try {
      await invoicesService.pay(invoiceId);
      toast.success('Invoice paid successfully!');
      refetchWallet();
      refetchTx();
      refetchInvoices();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Payment failed');
    } finally {
      setPayingInvoice(null);
    }
  };

  const filtered = transactions.filter(t =>
    filter === 'All' || (t.type as string).toLowerCase() === filter.toLowerCase()
  );

  const totalCredits = transactions
    .filter(t => t.type === 'CREDIT')
    .reduce((s, t) => s + (t.amount as number || 0), 0);
  const totalDebits = transactions
    .filter(t => t.type === 'DEBIT')
    .reduce((s, t) => s + (t.amount as number || 0), 0);

  const handleTopUp = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) { toast.error('Enter a valid amount'); return; }
    setSubmitting(true);
    try {
      await walletService.topUp(val);
      toast.success(`${formatCurrency(val)} added to your wallet`);
      setShowTopup(false);
      setAmount('');
      refetchWallet();
      refetchTx();
    } catch {
      toast.error('Top up failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) { toast.error('Enter a valid amount'); return; }
    setSubmitting(true);
    try {
      await walletService.withdraw(val);
      toast.success(`${formatCurrency(val)} withdrawal initiated`);
      setShowWithdraw(false);
      setAmount('');
      refetchWallet();
      refetchTx();
    } catch {
      toast.error('Withdrawal failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Wallet</h1>
          <p className="text-surface-500 text-sm mt-0.5">Manage your funds and transaction history.</p>
        </div>
        <button onClick={() => { setAmount(''); setShowTopup(true); }} className="btn-primary text-sm"><Plus size={16} /> Add Funds</button>
      </div>

      {/* Balance card */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Wallet size={20} className="text-primary-200" />
            <span className="text-primary-100 text-sm font-medium">Available Balance</span>
          </div>
          <p className="text-5xl font-bold mb-1">{formatCurrency(wallet?.balance || 0)}</p>
          <p className="text-primary-200 text-sm">{wallet?.currency || 'USD'}</p>
          <div className="flex gap-4 mt-6">
            <button onClick={() => { setAmount(''); setShowTopup(true); }} className="bg-white text-primary-700 font-semibold px-5 py-2 rounded-xl text-sm hover:bg-primary-50 transition-colors flex items-center gap-2">
              <Plus size={15} /> Top Up
            </button>
            <button onClick={() => { setAmount(''); setShowWithdraw(true); }} className="bg-white/20 text-white font-medium px-5 py-2 rounded-xl text-sm hover:bg-white/30 transition-colors flex items-center gap-2">
              <ArrowUpRight size={15} /> Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2"><ArrowDownLeft size={18} className="text-green-600" /></div>
          <p className="text-xl font-bold text-green-600">{formatCurrency(totalCredits)}</p>
          <p className="text-sm text-surface-500 mt-0.5">Total Credits</p>
        </div>
        <div className="card text-center">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-2"><ArrowUpRight size={18} className="text-red-500" /></div>
          <p className="text-xl font-bold text-red-500">{formatCurrency(totalDebits)}</p>
          <p className="text-sm text-surface-500 mt-0.5">Total Debits</p>
        </div>
        <div className="card text-center">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-2"><Wallet size={18} className="text-primary-600" /></div>
          <p className="text-xl font-bold text-primary-600">{transactions.length}</p>
          <p className="text-sm text-surface-500 mt-0.5">Transactions</p>
        </div>
      </div>

      {/* Auto Recharge */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-surface-800">Auto Recharge</h2>
            <p className="text-xs text-surface-500 mt-0.5">Automatically top up when your balance runs low</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={autoRecharge}
              onChange={e => setAutoRecharge(e.target.checked)}
            />
            <div className="w-11 h-6 bg-surface-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
          </label>
        </div>
        {autoRecharge && (
          <div className="space-y-4 pt-2 border-t border-surface-100">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-surface-600 mb-1 block">Recharge when balance drops below ($)</label>
                <input
                  type="number"
                  className="input-field text-sm"
                  value={autoThreshold}
                  onChange={e => setAutoThreshold(e.target.value)}
                  placeholder="500"
                  min="0"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-surface-600 mb-1 block">Auto-add amount ($)</label>
                <input
                  type="number"
                  className="input-field text-sm"
                  value={autoAmount}
                  onChange={e => setAutoAmount(e.target.value)}
                  placeholder="1000"
                  min="1"
                />
              </div>
            </div>
            <p className="text-xs text-surface-400">
              When balance drops below <strong>${autoThreshold || '0'}</strong>, we'll automatically add <strong>${autoAmount || '0'}</strong> to your wallet.
            </p>
            <button
              onClick={() => toast.success('Auto recharge settings saved')}
              className="btn-primary text-sm"
            >
              Save Settings
            </button>
          </div>
        )}
      </div>

      {/* Pending Invoices */}
      {pendingInvoices.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} className="text-amber-600" />
            <h2 className="font-bold text-surface-800">Pending Invoices</h2>
            <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{pendingInvoices.length}</span>
          </div>
          <div className="space-y-3">
            {pendingInvoices.map(inv => {
              const provider = inv.provider as Record<string, string> | null;
              const total = inv.total as number || 0;
              const isPaying = payingInvoice === (inv.id as string);
              const canPay = (wallet?.balance || 0) >= total;
              return (
                <div key={inv.id as string} className="flex items-center gap-4 p-4 rounded-xl border border-amber-100 bg-amber-50">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText size={18} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-800 truncate">
                      {provider?.name || provider?.company || 'Provider'} — Invoice {(inv.invoiceNo as string) || (inv.id as string).slice(0,8).toUpperCase()}
                    </p>
                    <p className="text-xs text-surface-500 mt-0.5">
                      Due: {inv.dueDate ? formatDate(inv.dueDate as string) : 'No due date'}
                      {!canPay && <span className="ml-2 text-red-500">Insufficient balance</span>}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-surface-900">{formatCurrency(total)}</p>
                    <button
                      onClick={() => handlePayInvoice(inv.id as string, total)}
                      disabled={isPaying || !canPay}
                      className="mt-1 flex items-center gap-1 text-xs font-medium px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CreditCard size={11} /> {isPaying ? 'Paying…' : 'Pay Now'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-surface-800">Transaction History</h2>
          <div className="flex gap-2">
            {['All', 'Credit', 'Debit'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${filter === f ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}>{f}</button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {filtered.length === 0 && <p className="text-surface-400 text-sm text-center py-6">No transactions found</p>}
          {filtered.map(tx => (
            <div key={tx.id as string} className="flex items-center gap-4 p-4 rounded-xl hover:bg-surface-50 transition-colors border border-surface-100">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.type === 'CREDIT' ? 'bg-green-100' : 'bg-red-100'}`}>
                {tx.type === 'CREDIT' ? <ArrowDownLeft size={18} className="text-green-600" /> : <ArrowUpRight size={18} className="text-red-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-800 truncate">{(tx.description as string) || (tx.reference as string)}</p>
                <p className="text-xs text-surface-400">{new Date(tx.createdAt as string).toLocaleDateString()}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`font-semibold text-sm ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(tx.amount as number)}
                </p>
                <Badge label={(tx.status as string || 'completed').toLowerCase()} className="text-xs mt-0.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top-up Modal */}
      <Modal isOpen={showTopup} onClose={() => setShowTopup(false)} title="Add Funds" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-surface-500">Select an amount or enter a custom amount to add to your wallet.</p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_AMOUNTS.map(a => (
              <button key={a} onClick={() => setAmount(String(a))} className={`py-3 rounded-xl text-sm font-semibold border-2 transition-colors ${amount === String(a) ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-surface-200 hover:border-surface-300 text-surface-700'}`}>${a.toLocaleString()}</button>
            ))}
          </div>
          <div>
            <label className="text-xs font-medium text-surface-600 mb-1.5 block">Custom Amount (USD)</label>
            <input type="number" className="input-field text-sm" placeholder="Enter amount" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <button className="btn-primary w-full justify-center py-3 text-sm disabled:opacity-60" disabled={submitting} onClick={handleTopUp}>
            {submitting ? 'Processing...' : `Add ${amount ? formatCurrency(parseFloat(amount) || 0) : 'Funds'}`}
          </button>
        </div>
      </Modal>

      {/* Withdraw Modal */}
      <Modal isOpen={showWithdraw} onClose={() => setShowWithdraw(false)} title="Withdraw Funds" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-surface-500">Enter the amount you wish to withdraw from your wallet.</p>
          <div>
            <label className="text-xs font-medium text-surface-600 mb-1.5 block">Amount (USD)</label>
            <input type="number" className="input-field text-sm" placeholder="Enter amount" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <p className="text-xs text-surface-400">Available: {formatCurrency(wallet?.balance || 0)}</p>
          <button className="btn-primary w-full justify-center py-3 text-sm disabled:opacity-60" disabled={submitting} onClick={handleWithdraw}>
            {submitting ? 'Processing...' : `Withdraw ${amount ? formatCurrency(parseFloat(amount) || 0) : ''}`}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default WalletPage;
