import React from 'react';
import { ShoppingBag, Wallet, AlertCircle, FileText, Store, CheckSquare } from 'lucide-react';
import DashboardBanner from '../../components/ui/DashboardBanner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import { useApi } from '../../hooks/useApi';
import { walletService } from '../../services/wallet.service';
import { contractsService } from '../../services/contracts.service';
import { complaintsService } from '../../services/complaints.service';
import { invoicesService } from '../../services/invoices.service';
import { tasksService } from '../../services/tasks.service';
import { formatCurrency } from '../../utils/helpers';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const BuyerDashboard: React.FC = () => {
  const user = useSelector((s: RootState) => s.auth.user);

  const { data: wallet } = useApi(() => walletService.getMyWallet(), []);
  const { data: txRes } = useApi(() => walletService.getTransactions({ limit: 3 }), []);
  const { data: allTxRes } = useApi(() => walletService.getTransactions({ limit: 200 }), []);
  const { data: contractsRes } = useApi(() => contractsService.list({ status: 'ACTIVE', limit: 3 }), []);
  const { data: complaintsRes } = useApi(() => complaintsService.list({ limit: 3 }), []);
  const { data: invoicesRes } = useApi(() => invoicesService.list({ status: 'PENDING', limit: 5 }), []);
  const { data: tasksRes } = useApi(() => tasksService.list({ limit: 50 }), []);

  const transactions = txRes?.data || [];
  const allTransactions: Record<string, unknown>[] = allTxRes?.data || [];
  const contracts = contractsRes?.data || [];
  const complaints = complaintsRes?.data || [];
  const pendingInvoices = invoicesRes?.data || [];
  const allTasks: Record<string, unknown>[] = tasksRes?.data || [];
  const openComplaints = complaints.filter((c: Record<string, unknown>) => c.status === 'OPEN' || c.status === 'IN_REVIEW').length;
  const activeTasks = allTasks.filter(t => t.status === 'IN_PROGRESS').length;
  const recentTasks = allTasks.slice(0, 3);

  // Build spend chart from real DEBIT transactions (current year)
  const currentYear = new Date().getFullYear().toString();
  const monthlySpendMap: Record<string, number> = {};
  allTransactions.filter(tx => tx.type === 'DEBIT').forEach(tx => {
    const d = new Date(tx.createdAt as string);
    if (d.getFullYear().toString() === currentYear) {
      const m = MONTHS[d.getMonth()];
      monthlySpendMap[m] = (monthlySpendMap[m] || 0) + (tx.amount as number || 0);
    }
  });
  const spendData = MONTHS.slice(0, new Date().getMonth() + 1).map(month => ({
    month,
    spend: monthlySpendMap[month] || 0,
  }));

  return (
    <div className="space-y-6">
      <DashboardBanner cta={
        <Link to="/providers" className="bg-white/20 hover:bg-white/30 text-white border border-white/25 px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
          <Store size={15} /> Browse Providers
        </Link>
      } />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Wallet Balance" value={formatCurrency(wallet?.balance || 0)} change={5.2} icon={<Wallet size={20} className="text-emerald-600" />} iconBg="bg-emerald-50" />
        <StatCard title="Active Contracts" value={contracts.length} icon={<FileText size={20} className="text-primary-600" />} iconBg="bg-primary-50" />
        <StatCard title="Pending Invoices" value={pendingInvoices.length} icon={<FileText size={20} className="text-amber-500" />} iconBg="bg-amber-50" />
        <StatCard title="Open Complaints" value={openComplaints} icon={<AlertCircle size={20} className={openComplaints > 0 ? 'text-red-500' : 'text-green-500'} />} iconBg={openComplaints > 0 ? 'bg-red-50' : 'bg-green-50'} />
        <StatCard title="Tasks In Progress" value={activeTasks} icon={<CheckSquare size={20} className="text-blue-600" />} iconBg="bg-blue-50" />
        <StatCard title="Account Status" value={user?.status || 'ACTIVE'} icon={<ShoppingBag size={20} className="text-green-600" />} iconBg="bg-green-50" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Spend chart */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-surface-800">Monthly Spend</h2>
            <span className="text-xs text-surface-400 bg-surface-100 px-3 py-1 rounded-full">2026</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={spendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}k`} />
              <Tooltip formatter={(v: unknown) => formatCurrency(v as number)} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="spend" stroke="#10b981" strokeWidth={2.5} dot={false} name="Spend" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Wallet card */}
        <div className="card flex flex-col">
          <h2 className="font-bold text-surface-800 mb-4">Wallet</h2>
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white mb-4">
            <p className="text-xs text-emerald-100 mb-1">Available Balance</p>
            <p className="text-3xl font-bold">{formatCurrency(wallet?.balance || 0)}</p>
            <p className="text-xs text-emerald-100 mt-1">{wallet?.currency || 'USD'}</p>
          </div>
          <Link to="/buyer/wallet" className="btn-outline text-sm justify-center mb-3">Manage Wallet</Link>
          <div className="space-y-2 flex-1">
            <p className="text-xs font-semibold text-surface-500 mb-2">Recent Transactions</p>
            {transactions.length === 0 && <p className="text-xs text-surface-400">No transactions yet</p>}
            {transactions.map((tx: Record<string, unknown>) => (
              <div key={tx.id as string} className="flex items-center justify-between py-1.5">
                <p className="text-xs text-surface-600 truncate flex-1 mr-2">{tx.description as string || tx.reference as string}</p>
                <span className={`text-xs font-semibold ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(tx.amount as number)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active contracts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-surface-800">Active Contracts</h2>
            <Link to="/buyer/orders" className="text-xs text-primary-600 font-medium hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {contracts.length === 0 && <p className="text-surface-400 text-sm text-center py-4">No active contracts</p>}
            {contracts.map((c: Record<string, unknown>) => (
              <div key={c.id as string} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors">
                <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {((c.provider as Record<string, string>)?.name || 'P')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-800 truncate">{c.title as string}</p>
                  <p className="text-xs text-surface-400">{c.type as string} · {formatCurrency(c.value as number)}</p>
                </div>
                <Badge label={(c.status as string).toLowerCase()} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent complaints */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-surface-800">Recent Complaints</h2>
            <Link to="/buyer/complaints" className="text-xs text-primary-600 font-medium hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {complaints.length === 0 && <p className="text-surface-400 text-sm text-center py-4">No complaints filed</p>}
            {complaints.map((c: Record<string, unknown>) => (
              <div key={c.id as string} className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors">
                <AlertCircle size={16} className={`flex-shrink-0 mt-0.5 ${c.priority === 'HIGH' || c.priority === 'CRITICAL' ? 'text-red-500' : c.priority === 'MEDIUM' ? 'text-amber-500' : 'text-surface-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-800 truncate">{c.title as string}</p>
                  <p className="text-xs text-surface-400">{new Date(c.createdAt as string).toLocaleDateString()}</p>
                </div>
                <Badge label={(c.status as string).replace('_', ' ').toLowerCase()} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-surface-800">Recent Tasks</h2>
          <Link to="/buyer/tasks" className="text-xs text-primary-600 font-medium hover:underline">View all</Link>
        </div>
        <div className="space-y-3">
          {recentTasks.length === 0 && <p className="text-surface-400 text-sm text-center py-4">No tasks found</p>}
          {recentTasks.map((t: Record<string, unknown>) => (
            <div key={t.id as string} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors">
              <CheckSquare size={16} className="flex-shrink-0 text-blue-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-800 truncate">{t.title as string}</p>
                <p className="text-xs text-surface-400 capitalize">{(t.priority as string || '').toLowerCase()} priority</p>
              </div>
              <Badge label={(t.status as string).replace('_', ' ').toLowerCase()} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;
