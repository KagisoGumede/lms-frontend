'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ManagerLayout from '@/components/ManagerLayout';
import { useAuth } from '@/lib/AuthContext';
import { leaveAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function ManagerMyLeavesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    leaveAPI.getMyLeaves(user.id).then(res => {
      if (res.success) setLeaves(res.data);
    }).finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const handleCancel = async (leaveId: number, leaveType: string) => {
    if (!confirm(`Cancel your "${leaveType}" leave request? This cannot be undone.`)) return;
    setCancellingId(leaveId);
    setError(''); setSuccess('');
    try {
      const res = await leaveAPI.cancelLeave(leaveId, user.id);
      if (res.success) {
        setLeaves(prev => prev.map(l =>
          l.id === leaveId ? { ...l, status: 'CANCELLED' } : l
        ));
        setSuccess('Leave request cancelled successfully.');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(res.message || 'Failed to cancel leave request.');
      }
    } catch {
      setError('Cannot connect to server.');
    } finally {
      setCancellingId(null);
    }
  };

  const filtered = statusFilter === 'all'
    ? leaves
    : leaves.filter(l => l.status === statusFilter);

  const counts = {
    total:     leaves.length,
    pending:   leaves.filter(l => l.status === 'PENDING').length,
    approved:  leaves.filter(l => l.status === 'APPROVED').length,
    rejected:  leaves.filter(l => l.status === 'REJECTED').length,
    cancelled: leaves.filter(l => l.status === 'CANCELLED').length,
  };

  const statusBadge = (s: string) =>
    s === 'APPROVED'  ? 'bg-emerald-50 text-emerald-700' :
    s === 'REJECTED'  ? 'bg-red-50 text-red-700' :
    s === 'CANCELLED' ? 'bg-gray-100 text-gray-500' :
    'bg-amber-50 text-amber-700';

  return (
    <ManagerLayout title="My Leave Requests">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#0f1f3d] mb-1">My Leave Requests</h2>
          <p className="text-gray-500 text-sm">View and manage your personal leave requests</p>
        </div>
        <button onClick={() => router.push('/manager/apply-leave')}
          className="px-4 py-2 bg-[#0f1f3d] hover:bg-[#1a3260] text-white text-sm font-semibold rounded-lg transition w-fit">
          Apply for Leave
        </button>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm font-medium">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
        {[
          { label: 'Total',     value: counts.total,     accent: 'border-[#0f1f3d]' },
          { label: 'Pending',   value: counts.pending,   accent: 'border-amber-500' },
          { label: 'Approved',  value: counts.approved,  accent: 'border-emerald-500' },
          { label: 'Rejected',  value: counts.rejected,  accent: 'border-red-400' },
          { label: 'Cancelled', value: counts.cancelled, accent: 'border-gray-400' },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${s.accent} border border-gray-100`}>
            <p className="text-gray-500 text-xs mb-1">{s.label}</p>
            <p className="text-2xl font-black text-[#0f1f3d]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { key: 'all',       label: 'All' },
          { key: 'PENDING',   label: 'Pending' },
          { key: 'APPROVED',  label: 'Approved' },
          { key: 'REJECTED',  label: 'Rejected' },
          { key: 'CANCELLED', label: 'Cancelled' },
        ].map(f => (
          <button key={f.key} onClick={() => setStatusFilter(f.key)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusFilter === f.key
                ? 'bg-[#0f1f3d] text-white shadow'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-400 py-12 animate-pulse">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-3">No leave requests found.</p>
            <button onClick={() => router.push('/manager/apply-leave')}
              className="px-4 py-2 bg-[#0f1f3d] text-white text-sm font-semibold rounded-lg hover:bg-[#1a3260] transition">
              Apply for Leave
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Leave Type', 'Start Date', 'End Date', 'Duration', 'Status', 'Comments', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(req => (
                  <tr key={req.id} className={`border-t border-gray-50 hover:bg-gray-50 transition ${
                    req.status === 'CANCELLED' ? 'opacity-60' : ''
                  }`}>
                    <td className="px-4 py-3 font-semibold text-gray-800">{req.leaveType}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(req.startDate)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(req.endDate)}</td>
                    <td className="px-4 py-3 text-gray-600">{req.duration}d</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${statusBadge(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs italic">
                      {req.managerComments || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {req.status === 'PENDING' && (
                        <button
                          onClick={() => handleCancel(req.id, req.leaveType)}
                          disabled={cancellingId === req.id}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg transition disabled:opacity-50 flex items-center gap-1">
                          {cancellingId === req.id ? (
                            <span className="w-3 h-3 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                          ) : (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                          {cancellingId === req.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ManagerLayout>
  );
}