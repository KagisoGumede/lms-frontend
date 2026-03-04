'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminAPI } from '@/lib/api';

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  LEAVE_APPLIED:   { label: 'Leave Applied',   color: 'bg-blue-50 text-blue-700' },
  LEAVE_APPROVED:  { label: 'Leave Approved',  color: 'bg-emerald-50 text-emerald-700' },
  LEAVE_REJECTED:  { label: 'Leave Rejected',  color: 'bg-red-50 text-red-700' },
  LEAVE_CANCELLED: { label: 'Leave Cancelled', color: 'bg-gray-100 text-gray-500' },
  USER_CREATED:    { label: 'User Created',    color: 'bg-purple-50 text-purple-700' },
  USER_DELETED:    { label: 'User Deleted',    color: 'bg-red-50 text-red-700' },
  PROFILE_UPDATED: { label: 'Profile Updated', color: 'bg-blue-50 text-blue-700' },
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN:    'bg-[#0f1f3d] text-white',
  MANAGER:  'bg-blue-50 text-blue-700',
  EMPLOYEE: 'bg-emerald-50 text-emerald-700',
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  const fetchLogs = async (p: number) => {
    setLoading(true);
    try {
      const res = await adminAPI.getAuditLogs(p, 50);
      if (res.success) {
        setLogs(res.data);
        setTotalPages(res.totalPages);
        setTotalElements(res.totalElements);
      }
    } catch {
      console.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    return {
      date: d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const actions = [
    'ALL', 'LEAVE_APPLIED', 'LEAVE_APPROVED', 'LEAVE_REJECTED',
    'LEAVE_CANCELLED', 'USER_CREATED', 'USER_DELETED'
  ];

  const filtered = logs.filter(l => {
    const matchSearch = search === '' ||
      `${l.performedBy} ${l.targetUser} ${l.details}`.toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === 'ALL' || l.action === actionFilter;
    return matchSearch && matchAction;
  });

  const counts = {
    LEAVE_APPLIED:   logs.filter(l => l.action === 'LEAVE_APPLIED').length,
    LEAVE_APPROVED:  logs.filter(l => l.action === 'LEAVE_APPROVED').length,
    LEAVE_REJECTED:  logs.filter(l => l.action === 'LEAVE_REJECTED').length,
    LEAVE_CANCELLED: logs.filter(l => l.action === 'LEAVE_CANCELLED').length,
    USER_CREATED:    logs.filter(l => l.action === 'USER_CREATED').length,
    USER_DELETED:    logs.filter(l => l.action === 'USER_DELETED').length,
  };

  return (
    <AdminLayout title="Audit Log">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#0f1f3d] mb-1">Audit Log</h2>
        <p className="text-gray-500 text-sm">Complete record of all system activity — who did what and when</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {[
          { label: 'Applied',   value: counts.LEAVE_APPLIED,   accent: 'border-blue-400' },
          { label: 'Approved',  value: counts.LEAVE_APPROVED,  accent: 'border-emerald-500' },
          { label: 'Rejected',  value: counts.LEAVE_REJECTED,  accent: 'border-red-400' },
          { label: 'Cancelled', value: counts.LEAVE_CANCELLED, accent: 'border-gray-400' },
          { label: 'Created',   value: counts.USER_CREATED,    accent: 'border-purple-400' },
          { label: 'Deleted',   value: counts.USER_DELETED,    accent: 'border-rose-400' },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${s.accent} border border-gray-100`}>
            <p className="text-gray-500 text-xs mb-1">{s.label}</p>
            <p className="text-2xl font-black text-[#0f1f3d]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by user, target or details..."
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0f1f3d]"
          />
          <div className="flex gap-2 flex-wrap">
            {actions.map(a => (
              <button key={a} onClick={() => setActionFilter(a)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  actionFilter === a
                    ? 'bg-[#0f1f3d] text-white shadow'
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}>
                {a === 'ALL' ? 'All' : ACTION_LABELS[a]?.label ?? a}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500 font-medium">
            Showing <span className="font-bold text-[#0f1f3d]">{filtered.length}</span> of{' '}
            <span className="font-bold text-[#0f1f3d]">{totalElements}</span> entries
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded disabled:opacity-40 transition">
              Prev
            </button>
            <span className="text-xs text-gray-500">Page {page + 1} of {totalPages || 1}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded disabled:opacity-40 transition">
              Next
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-12 animate-pulse">Loading audit logs...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">No audit log entries found.</p>
            <p className="text-gray-300 text-xs mt-1">Activity will appear here as users interact with the system.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Timestamp', 'Action', 'Performed By', 'Role', 'Target User', 'Details'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => {
                  const { date, time } = formatTimestamp(log.timestamp);
                  const actionInfo = ACTION_LABELS[log.action];
                  return (
                    <tr key={log.id ?? i} className="border-t border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <p className="text-gray-800 text-xs font-medium">{date}</p>
                        <p className="text-gray-400 text-xs">{time}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${actionInfo?.color ?? 'bg-gray-100 text-gray-600'}`}>
                          {actionInfo?.label ?? log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#0f1f3d] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {log.performedBy?.charAt(0)}
                          </div>
                          <p className="font-semibold text-gray-800 text-xs">{log.performedBy}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${ROLE_COLORS[log.performedByRole] ?? 'bg-gray-100 text-gray-600'}`}>
                          {log.performedByRole}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {log.targetUser || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs max-w-[200px] truncate" title={log.details}>
                        {log.details || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}