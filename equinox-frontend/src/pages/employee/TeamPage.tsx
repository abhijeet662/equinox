import React, { useState } from 'react';
import { Search, Users } from 'lucide-react';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { useApi } from '../../hooks/useApi';
import { usersService } from '../../services/users.service';
import { getInitials } from '../../utils/helpers';

const TeamPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data: usersRes, loading } = useApi(() => usersService.list({ role: 'EMPLOYEE', limit: 50 }), []);
  const allUsers: Record<string, unknown>[] = usersRes?.data || [];

  const filtered = allUsers.filter(u => {
    if (!search) return true;
    const name = (u.name as string || u.fullName as string || '').toLowerCase();
    const email = (u.email as string || '').toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Team Directory</h1>
        <p className="text-surface-500 text-sm mt-0.5">Browse and connect with your fellow team members.</p>
      </div>

      <div className="flex items-center gap-2 bg-white border border-surface-200 rounded-xl px-3 py-2.5 max-w-sm shadow-sm">
        <Search size={15} className="text-surface-400 flex-shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="bg-transparent text-sm outline-none flex-1 placeholder-surface-400"
        />
      </div>

      {loading ? (
        <div className="text-center py-16 text-surface-400 text-sm">Loading team members...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={search ? 'No results found' : 'No team members yet'}
          message={search ? `No employees match "${search}".` : 'Team members will appear here once added.'}
          icon={<Users size={24} />}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((u) => {
            const name = u.name as string || u.fullName as string || 'Unknown';
            const email = u.email as string || '';
            const status = (u.status as string || 'active').toLowerCase();
            const role = u.role as string || 'EMPLOYEE';
            const initials = getInitials(name);

            return (
              <div key={u.id as string} className="card hover:shadow-md transition-all duration-200 flex flex-col items-center text-center gap-3 py-6">
                <Avatar initials={initials} size="lg" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-surface-900 text-sm leading-tight">{name}</p>
                  <p className="text-xs text-surface-400 truncate max-w-[160px]">{email}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <Badge label={status} />
                  <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium capitalize">
                    {role.toLowerCase()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeamPage;
