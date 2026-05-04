import React from 'react';
import { Users, Building2, DollarSign, AlertCircle, ShieldCheck } from 'lucide-react';
import DashboardBanner from '../../components/ui/DashboardBanner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Link } from 'react-router-dom';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { formatCurrency } from '../../utils/helpers';
import { useApi } from '../../hooks/useApi';
import { usersService } from '../../services/users.service';
import { providersService } from '../../services/providers.service';
import { invoicesService } from '../../services/invoices.service';
import { complaintsService } from '../../services/complaints.service';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const AdminDashboard: React.FC = () => {
  const { data: usersRes } = useApi(() => usersService.list({ limit: 5 }), []);
  const { data: userStats } = useApi(() => usersService.getStats(), []);
  const { data: providersRes } = useApi(() => providersService.list({ limit: 5 }), []);
  const { data: invoicesRes } = useApi(() => invoicesService.list({ limit: 200 }), []);
  const { data: complaintsRes } = useApi(() => complaintsService.list({ limit: 100 }), []);

  const users: Record<string, unknown>[] = usersRes?.data || [];
  const providers: Record<string, unknown>[] = providersRes?.data || [];
  const invoices: Record<string, unknown>[] = invoicesRes?.data || [];
  const complaints: Record<string, unknown>[] = complaintsRes?.data || [];

  const totalUsers = userStats?.totalUsers || users.length;
  const paidInvoices = invoices.filter(i => i.status === 'PAID');
  const totalRevenue = paidInvoices.reduce((s, i) => s + (i.total as number || 0), 0);
  const openIssues = complaints.filter(c => c.status === 'OPEN' || c.status === 'IN_REVIEW').length;

  // Build monthly revenue chart from real paid invoices (current year)
  const currentYear = new Date().getFullYear().toString();
  const monthlyRevMap: Record<string, number> = {};
  paidInvoices.forEach(inv => {
    const d = new Date(inv.createdAt as string);
    if (d.getFullYear().toString() === currentYear) {
      const m = MONTHS[d.getMonth()];
      monthlyRevMap[m] = (monthlyRevMap[m] || 0) + (inv.total as number || 0);
    }
  });
  const revenueChartData = MONTHS.slice(0, new Date().getMonth() + 1).map(month => ({
    month,
    revenue: monthlyRevMap[month] || 0,
  }));

  // Category distribution from providers
  const categoryMap: Record<string, number> = {};
  providers.forEach(p => {
    const cat = (p.category as string) || 'Other';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const serviceCategories = Object.entries(categoryMap).map(([name, count]) => ({ name, providers: count }));

  return (
    <div className="space-y-6">
      <DashboardBanner cta={
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-white/80 bg-white/10 border border-white/20 px-3 py-1.5 rounded-full font-medium">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            All systems operational
          </span>
          <Link to="/admin/users" className="bg-white/20 hover:bg-white/30 text-white border border-white/25 px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
            <ShieldCheck size={15} /> Manage Users
          </Link>
        </div>
      } />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Users" value={totalUsers} change={8.1} changeLabel="this month" icon={<Users size={20} className="text-primary-600" />} iconBg="bg-primary-50" />
        <StatCard title="Active Providers" value={providers.length} change={12.4} changeLabel="this month" icon={<Building2 size={20} className="text-purple-600" />} iconBg="bg-purple-50" />
        <StatCard title="Total Buyers" value={userStats?.buyers || users.filter(u => u.role === 'BUYER').length} change={5.2} changeLabel="this month" icon={<Users size={20} className="text-blue-600" />} iconBg="bg-blue-50" />
        <StatCard title="Collected Revenue" value={formatCurrency(totalRevenue)} change={18.9} changeLabel="this year" icon={<DollarSign size={20} className="text-emerald-600" />} iconBg="bg-emerald-50" />
        <StatCard title="Open Issues" value={openIssues} icon={<AlertCircle size={20} className={openIssues > 0 ? 'text-red-500' : 'text-green-500'} />} iconBg={openIssues > 0 ? 'bg-red-50' : 'bg-green-50'} />
        <StatCard title="Pending Approvals" value={providers.filter(p => !p.verified).length} icon={<ShieldCheck size={20} className="text-amber-500" />} iconBg="bg-amber-50" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-bold text-surface-800 mb-5">Platform Revenue</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}k`} />
              <Tooltip formatter={(v: unknown) => formatCurrency(v as number)} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2.5} dot={false} name="Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="font-bold text-surface-800 mb-5">Providers by Category</h2>
          {serviceCategories.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={serviceCategories} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="providers" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Providers" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-surface-400 text-sm text-center py-8">No provider data</p>
          )}
        </div>
      </div>

      {/* Recent Users + Providers */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-surface-800">Recent Users</h2>
            <Link to="/admin/users" className="text-xs text-primary-600 font-medium hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {users.length === 0 && <p className="text-surface-400 text-sm text-center py-4">No users found</p>}
            {users.map(user => (
              <div key={user.id as string} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-50 transition-colors">
                <Avatar initials={(user.name as string)?.[0] || 'U'} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-800 truncate">{user.name as string}</p>
                  <p className="text-xs text-surface-400">{user.email as string}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-surface-100 text-surface-600 px-2 py-0.5 rounded capitalize">{(user.role as string).toLowerCase()}</span>
                  <Badge label={(user.status as string).toLowerCase()} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-surface-800">Top Providers</h2>
            <Link to="/admin/providers" className="text-xs text-primary-600 font-medium hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {providers.length === 0 && <p className="text-surface-400 text-sm text-center py-4">No providers found</p>}
            {providers.map(p => (
              <div key={p.id as string} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-50 transition-colors">
                <div className="w-9 h-9 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {(p.companyName as string || p.user as string)?.[0] || 'P'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-800 truncate">
                    {p.companyName as string || (p.user as Record<string, string>)?.name || '—'}
                  </p>
                  <p className="text-xs text-surface-400">{p.category as string || 'Provider'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-surface-800">{(p.rating as number || 0).toFixed(1)} ⭐</p>
                  <p className="text-xs text-surface-400">{p.reviewCount as number || 0} reviews</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System health */}
      <div className="card">
        <h2 className="font-bold text-surface-800 mb-4">System Health</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'API Uptime', value: '99.98%', status: 'Operational', color: 'text-green-600' },
            { label: 'Avg Response', value: '142ms', status: 'Good', color: 'text-green-600' },
            { label: 'DB Load', value: '34%', status: 'Normal', color: 'text-green-600' },
            { label: 'Error Rate', value: '0.02%', status: 'Nominal', color: 'text-green-600' },
          ].map(item => (
            <div key={item.label} className="bg-surface-50 rounded-xl p-4 text-center border border-surface-100">
              <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-surface-500 mt-0.5">{item.label}</p>
              <span className="badge bg-green-100 text-green-700 text-xs mt-1">{item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
