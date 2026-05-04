import React, { useState } from 'react';
import { Users, DollarSign, FileText, TrendingUp, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { contractsService } from '../../services/contracts.service';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { formatCurrency, formatDate } from '../../utils/helpers';

interface Buyer {
  id?: string;
  name: string;
  email: string;
}

interface Contract {
  id: string;
  title: string;
  type: string;
  value: number;
  status: string;
  startDate: string;
  buyer: Buyer;
}

interface ClientAgg {
  key: string;
  name: string;
  email: string;
  contracts: Contract[];
  totalValue: number;
  activeCount: number;
  lastDate: string;
}

const ProviderClientsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  const { data: contractsRes, loading } = useApi(() => contractsService.list({ limit: 100 }), []);
  const contracts: Contract[] = contractsRes?.data || [];

  // Group contracts by buyer
  const clientMap: Record<string, ClientAgg> = {};
  contracts.forEach(c => {
    const key = c.buyer?.id || c.buyer?.name || 'Unknown';
    if (!clientMap[key]) {
      clientMap[key] = {
        key,
        name: c.buyer?.name || 'Unknown',
        email: c.buyer?.email || '',
        contracts: [],
        totalValue: 0,
        activeCount: 0,
        lastDate: c.startDate,
      };
    }
    clientMap[key].contracts.push(c);
    clientMap[key].totalValue += c.value || 0;
    if (c.status === 'ACTIVE') clientMap[key].activeCount++;
    if (c.startDate > clientMap[key].lastDate) clientMap[key].lastDate = c.startDate;
  });

  const clients = Object.values(clientMap);
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.activeCount > 0).length;
  const totalValue = clients.reduce((s, c) => s + c.totalValue, 0);
  const avgValue = totalClients > 0 ? totalValue / totalClients : 0;

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Client Management</h1>
        <p className="text-surface-500 text-sm mt-1">Overview of your clients and contract relationships</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Clients', value: totalClients, icon: <Users size={20} className="text-primary-600" />, bg: 'bg-primary-50' },
          { title: 'Active Clients', value: activeClients, icon: <TrendingUp size={20} className="text-emerald-600" />, bg: 'bg-emerald-50' },
          { title: 'Total Contract Value', value: formatCurrency(totalValue), icon: <DollarSign size={20} className="text-amber-600" />, bg: 'bg-amber-50' },
          { title: 'Avg Contract Value', value: formatCurrency(avgValue), icon: <FileText size={20} className="text-purple-600" />, bg: 'bg-purple-50' },
        ].map(s => (
          <div key={s.title} className="card flex items-center gap-4">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>{s.icon}</div>
            <div>
              <p className="text-xl font-bold text-surface-900">{s.value}</p>
              <p className="text-xs text-surface-500">{s.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
        <input
          className="input-field pl-9"
          placeholder="Search clients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Client cards */}
      {loading ? (
        <div className="text-center py-12 text-surface-400">Loading clients...</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(client => (
            <div key={client.key} className="card space-y-4">
              <div className="flex items-start gap-3">
                <Avatar initials={getInitials(client.name)} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-surface-900 truncate">{client.name}</p>
                  <p className="text-xs text-surface-500 truncate">{client.email}</p>
                  <p className="text-xs text-surface-400 mt-1">
                    {client.contracts.length} contract{client.contracts.length !== 1 ? 's' : ''} · {formatCurrency(client.totalValue)} total
                  </p>
                </div>
                <Badge label={client.activeCount > 0 ? 'active' : 'completed'} />
              </div>

              <button
                className="btn-outline w-full text-sm flex items-center justify-center gap-2"
                onClick={() => setExpandedClient(expandedClient === client.key ? null : client.key)}
              >
                View Contracts
                {expandedClient === client.key ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {expandedClient === client.key && (
                <div className="space-y-2 border-t border-surface-100 pt-3">
                  {client.contracts.map(c => (
                    <div key={c.id} className="flex items-center justify-between text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="text-surface-800 truncate font-medium">{c.title}</p>
                        <p className="text-xs text-surface-400">{c.type} · {formatCurrency(c.value)}</p>
                      </div>
                      <Badge label={c.status.toLowerCase()} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-12 text-surface-400">No clients found</div>
          )}
        </div>
      )}

      {/* All Contracts Table */}
      <div className="card">
        <h2 className="font-bold text-surface-800 mb-4">All Contracts</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100">
                <th className="table-th">Client</th>
                <th className="table-th">Contract Title</th>
                <th className="table-th">Type</th>
                <th className="table-th">Value</th>
                <th className="table-th">Status</th>
                <th className="table-th">Start Date</th>
              </tr>
            </thead>
            <tbody>
              {contracts.length === 0 && (
                <tr><td colSpan={6} className="table-td text-center text-surface-400 py-8">No contracts found</td></tr>
              )}
              {contracts.map(c => (
                <tr key={c.id} className="border-b border-surface-50 hover:bg-surface-50">
                  <td className="table-td font-medium">{c.buyer?.name || '—'}</td>
                  <td className="table-td">{c.title}</td>
                  <td className="table-td text-surface-500">{c.type}</td>
                  <td className="table-td font-semibold">{formatCurrency(c.value)}</td>
                  <td className="table-td"><Badge label={c.status.toLowerCase()} /></td>
                  <td className="table-td text-surface-500">{formatDate(c.startDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProviderClientsPage;
