import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, FileText, CheckSquare, Receipt,
  Calendar, DollarSign, User, Clock, Tag,
  AlertCircle, CheckCircle2, Circle, Loader2,
  Building2, Hash, MessageSquare,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { contractsService } from '../../services/contracts.service';
import { tasksService } from '../../services/tasks.service';
import { invoicesService } from '../../services/invoices.service';
import Badge from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../utils/helpers';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-6 py-4 border-b border-surface-100 flex items-center gap-2">
        <span className="text-surface-400">{icon}</span>
        <h2 className="font-bold text-surface-800 text-sm">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-surface-50 last:border-0">
      <span className="text-xs text-surface-400 flex-shrink-0 w-32">{label}</span>
      <span className="text-sm text-surface-800 font-medium text-right">{value ?? '—'}</span>
    </div>
  );
}

const PRIORITY_STYLE: Record<string, string> = {
  P0: 'bg-red-100 text-red-700',
  P1: 'bg-orange-100 text-orange-700',
  P2: 'bg-blue-100 text-blue-700',
  P3: 'bg-gray-100 text-gray-600',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  DONE:        <CheckCircle2 size={14} className="text-emerald-500" />,
  IN_PROGRESS: <Loader2 size={14} className="text-blue-500" />,
  IN_REVIEW:   <AlertCircle size={14} className="text-amber-500" />,
  TODO:        <Circle size={14} className="text-gray-400" />,
};

// ─── Main page ────────────────────────────────────────────────────────────────

const BuyerOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: contract, loading: contractLoading } = useApi(
    () => contractsService.getById(id!),
    [id],
  );
  const { data: tasksRes, loading: tasksLoading } = useApi(
    () => tasksService.list({ contractId: id, limit: 50 }),
    [id],
  );
  const { data: invoicesRes, loading: invoicesLoading } = useApi(
    () => invoicesService.list({ limit: 200 }),
    [id],
  );

  const tasks: Record<string, unknown>[]   = tasksRes?.data   || [];
  const allInvoices: Record<string, unknown>[] = invoicesRes?.data || [];
  // Filter invoices belonging to this contract
  const invoices = allInvoices.filter(i => (i.contractId as string) === id);

  // Task stats
  const taskDone        = tasks.filter(t => t.status === 'DONE').length;
  const taskInProgress  = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const taskInReview    = tasks.filter(t => t.status === 'IN_REVIEW').length;
  const taskTodo        = tasks.filter(t => t.status === 'TODO').length;
  const progressPct     = tasks.length > 0 ? Math.round((taskDone / tasks.length) * 100) : 0;

  // Invoice stats
  const totalInvoiced = invoices.reduce((s, i) => s + ((i.totalAmount as number) || (i.amount as number) || 0), 0);
  const totalPaid     = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + ((i.totalAmount as number) || (i.amount as number) || 0), 0);

  if (contractLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-surface-400">
        <Loader2 className="animate-spin mr-2" size={20} /> Loading order…
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-20">
        <FileText size={40} className="mx-auto text-surface-300 mb-3" />
        <p className="text-surface-500 font-medium">Order not found</p>
        <Link to="/buyer/orders" className="text-sm text-primary-600 hover:underline mt-2 inline-block">
          ← Back to My Orders
        </Link>
      </div>
    );
  }

  const provider = contract.provider as Record<string, string> | null;
  const c = contract as Record<string, unknown>;

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Link
          to="/buyer/orders"
          className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 mb-4 transition-colors"
        >
          <ArrowLeft size={15} /> Back to My Orders
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-surface-900">{c.title as string}</h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge label={(c.status as string).toLowerCase()} />
              <span className="text-xs text-surface-400 bg-surface-100 px-2.5 py-1 rounded-full capitalize">
                {(c.type as string || '').toLowerCase()}
              </span>
              <span className="text-xs text-surface-400 flex items-center gap-1">
                <Hash size={11} /> {(c.id as string).slice(0, 8).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold text-surface-900">
              {c.value ? formatCurrency(c.value as number) : '—'}
            </p>
            <p className="text-xs text-surface-400 mt-0.5">Contract Value</p>
          </div>
        </div>
      </div>

      {/* Top stat pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Tasks',        value: tasks.length,   icon: <CheckSquare size={16} className="text-indigo-500" />,  bg: 'bg-indigo-50' },
          { label: 'Completed',    value: `${progressPct}%`, icon: <CheckCircle2 size={16} className="text-emerald-500" />, bg: 'bg-emerald-50' },
          { label: 'Total Billed', value: formatCurrency(totalInvoiced), icon: <Receipt size={16} className="text-amber-500" />, bg: 'bg-amber-50' },
          { label: 'Total Paid',   value: formatCurrency(totalPaid),     icon: <DollarSign size={16} className="text-green-600" />, bg: 'bg-green-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-surface-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>{s.icon}</div>
            <div>
              <p className="text-base font-bold text-surface-900">{s.value}</p>
              <p className="text-xs text-surface-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left col: contract info */}
        <div className="space-y-6">
          {/* Contract details */}
          <Section title="Contract Details" icon={<FileText size={16} />}>
            <div className="space-y-0">
              <InfoRow
                label="Provider"
                value={
                  <div className="flex items-center gap-1.5 justify-end">
                    <Building2 size={13} className="text-surface-400" />
                    {provider?.name || provider?.businessName || '—'}
                  </div>
                }
              />
              <InfoRow label="Type"       value={<span className="capitalize">{(c.type as string || '').toLowerCase()}</span>} />
              <InfoRow label="Status"     value={<Badge label={(c.status as string).toLowerCase()} />} />
              <InfoRow label="Currency"   value={c.currency as string} />
              <InfoRow label="Start Date" value={c.startDate ? formatDate(c.startDate as string) : '—'} />
              <InfoRow label="End Date"   value={c.endDate   ? formatDate(c.endDate   as string) : '—'} />
              <InfoRow label="Created"    value={formatDate(c.createdAt as string)} />
            </div>
          </Section>

          {/* Description */}
          {(c.description || c.terms) && (
            <Section title="Description & Terms" icon={<MessageSquare size={16} />}>
              {c.description && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-1.5">Description</p>
                  <p className="text-sm text-surface-700 leading-relaxed">{c.description as string}</p>
                </div>
              )}
              {c.terms && (
                <div>
                  <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-1.5">Terms</p>
                  <p className="text-sm text-surface-700 leading-relaxed whitespace-pre-wrap">{c.terms as string}</p>
                </div>
              )}
            </Section>
          )}

          {/* Task progress */}
          {tasks.length > 0 && (
            <Section title="Task Progress" icon={<CheckSquare size={16} />}>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-surface-500">Completion</span>
                  <span className="text-xs font-bold text-surface-800">{progressPct}%</span>
                </div>
                <div className="w-full h-2.5 bg-surface-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Done',        count: taskDone,       color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'In Progress', count: taskInProgress,  color: 'text-blue-600',   bg: 'bg-blue-50' },
                  { label: 'In Review',   count: taskInReview,    color: 'text-amber-600',  bg: 'bg-amber-50' },
                  { label: 'To Do',       count: taskTodo,        color: 'text-gray-500',   bg: 'bg-gray-50' },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                    <p className={`text-lg font-bold ${s.color}`}>{s.count}</p>
                    <p className="text-xs text-surface-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Right col: tasks + invoices */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tasks */}
          <Section title={`Tasks (${tasks.length})`} icon={<CheckSquare size={16} />}>
            {tasksLoading ? (
              <div className="text-center py-8 text-surface-400 text-sm">Loading tasks…</div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 text-surface-400 text-sm">No tasks linked to this order</div>
            ) : (
              <div className="space-y-2">
                {tasks.map(task => {
                  const t = task as Record<string, unknown>;
                  const assignee = t.assignedTo as Record<string, string> | null;
                  return (
                    <div
                      key={t.id as string}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 border border-transparent hover:border-surface-100 transition-all"
                    >
                      {STATUS_ICON[t.status as string] ?? <Circle size={14} className="text-gray-400" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-800 truncate">{t.title as string}</p>
                        {assignee && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <User size={10} className="text-surface-400" />
                            <span className="text-xs text-surface-400 truncate">{assignee.name || assignee.email}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {t.dueDate && (
                          <div className="flex items-center gap-1 text-xs text-surface-400">
                            <Clock size={11} />
                            {formatDate(t.dueDate as string)}
                          </div>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PRIORITY_STYLE[t.priority as string] ?? 'bg-gray-100 text-gray-600'}`}>
                          {t.priority as string}
                        </span>
                        <Badge label={(t.status as string).toLowerCase().replace('_', ' ')} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          {/* Invoices */}
          <Section title={`Invoices (${invoices.length})`} icon={<Receipt size={16} />}>
            {invoicesLoading ? (
              <div className="text-center py-8 text-surface-400 text-sm">Loading invoices…</div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-8 text-surface-400 text-sm">No invoices for this order yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-100">
                      <th className="table-th">Invoice #</th>
                      <th className="table-th">Date</th>
                      <th className="table-th">Due Date</th>
                      <th className="table-th">Amount</th>
                      <th className="table-th">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(inv => {
                      const i = inv as Record<string, unknown>;
                      return (
                        <tr key={i.id as string} className="border-b border-surface-50 hover:bg-surface-50 transition-colors">
                          <td className="table-td">
                            <div className="flex items-center gap-1.5">
                              <Tag size={12} className="text-surface-400" />
                              <span className="font-mono text-xs text-surface-700">
                                {i.invoiceNo as string || (i.id as string).slice(0, 8).toUpperCase()}
                              </span>
                            </div>
                          </td>
                          <td className="table-td text-surface-500">
                            {i.createdAt ? formatDate(i.createdAt as string) : '—'}
                          </td>
                          <td className="table-td text-surface-500">
                            {i.dueDate ? formatDate(i.dueDate as string) : '—'}
                          </td>
                          <td className="table-td font-semibold text-surface-900">
                            {formatCurrency((i.totalAmount as number) || (i.amount as number) || 0)}
                          </td>
                          <td className="table-td">
                            <Badge label={(i.status as string).toLowerCase()} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Invoice totals */}
                <div className="flex justify-end gap-8 pt-4 border-t border-surface-100 mt-2 text-sm">
                  <div className="text-right">
                    <p className="text-xs text-surface-400">Total Billed</p>
                    <p className="font-bold text-surface-900">{formatCurrency(totalInvoiced)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-surface-400">Total Paid</p>
                    <p className="font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-surface-400">Outstanding</p>
                    <p className={`font-bold ${totalInvoiced - totalPaid > 0 ? 'text-red-500' : 'text-surface-400'}`}>
                      {formatCurrency(Math.max(0, totalInvoiced - totalPaid))}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Section>

          {/* Timeline / milestones placeholder */}
          <Section title="Timeline" icon={<Calendar size={16} />}>
            <div className="space-y-3">
              {[
                { label: 'Contract Created', date: c.createdAt as string,  done: true },
                { label: 'Work Started',      date: c.startDate as string,  done: !!c.startDate },
                { label: 'Contract End',       date: c.endDate as string,    done: c.status === 'COMPLETED' || c.status === 'EXPIRED' },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0
                    ${step.done ? 'bg-emerald-100' : 'bg-surface-100'}`}>
                    {step.done
                      ? <CheckCircle2 size={14} className="text-emerald-600" />
                      : <Circle size={14} className="text-surface-400" />
                    }
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${step.done ? 'text-surface-800' : 'text-surface-400'}`}>
                      {step.label}
                    </p>
                  </div>
                  <span className="text-xs text-surface-400">
                    {step.date ? formatDate(step.date) : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default BuyerOrderDetailPage;
