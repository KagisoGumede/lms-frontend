'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminAPI, leaveAPI } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { formatDate } from '@/lib/utils';

export default function AdminLeavesPage() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Review modal
  const [reviewingLeave, setReviewingLeave] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    adminAPI.getAllLeaves().then(res => {
      if (res.success) setLeaves(res.data);
    }).finally(() => setLoading(false));
  }, []);

  const handleReview = async (status: 'APPROVED' | 'REJECTED') => {
    if (!user || !reviewingLeave) return;
    if (status === 'REJECTED' && !comment.trim()) {
      setError('Please enter a reason for rejection.');
      return;
    }
    setSubmitting(true); setError('');
    try {
      const res = await leaveAPI.reviewLeave(reviewingLeave.id, {
        managerId: user.id,
        status,
        managerComments: comment,
      });
      if (res.success) {
        setLeaves(prev => prev.map(l => l.id === reviewingLeave.id ? res.data : l));
        setSuccess(`Leave ${status.toLowerCase()} successfully.`);
        setReviewingLeave(null);
        setComment('');
      } else {
        setError(res.message || 'Something went wrong.');
      }
    } catch {
      setError('Cannot connect to server.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (s: string) =>
    s === 'APPROVED'  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
    s === 'REJECTED'  ? 'bg-red-50 text-red-700 border border-red-200' :
    s === 'CANCELLED' ? 'bg-gray-100 text-gray-500 border border-gray-200' :
    s === 'UNPAID'    ? 'bg-orange-50 text-orange-700 border border-orange-200' :
    'bg-amber-50 text-amber-700 border border-amber-200';

  const roleBadge = (role: string) =>
    role === 'MANAGER'
      ? 'bg-purple-50 text-purple-700 border border-purple-200'
      : 'bg-blue-50 text-blue-700 border border-blue-200';

  const counts = {
    ALL:      leaves.length,
    PENDING:  leaves.filter(l => l.status === 'PENDING').length,
    APPROVED: leaves.filter(l => l.status === 'APPROVED').length,
    REJECTED: leaves.filter(l => l.status === 'REJECTED').length,
    MANAGER:  leaves.filter(l => l.employeeRole === 'MANAGER').length,
  };

  const filtered = leaves.filter(l => {
    const matchSearch = `${l.employeeName} ${l.leaveType} ${l.department}`
      .toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL'
      || l.status === statusFilter
      || (statusFilter === 'MANAGER' && l.employeeRole === 'MANAGER');
    return matchSearch && matchStatus;
  });

  return (
    <AdminLayout title="Leave Requests">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#0f1f3d] mb-1">All Leave Requests</h2>
        <p className="text-gray-500 text-sm">Company-wide view — including manager leave requests</p>
      </div>

      {success && (
        <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">
          {success}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
        {[
          { label: 'Total',    value: counts.ALL,      accent: 'border-[#0f1f3d]' },
          { label: 'Pending',  value: counts.PENDING,  accent: 'border-amber-500' },
          { label: 'Approved', value: counts.APPROVED, accent: 'border-emerald-500' },
          { label: 'Rejected', value: counts.REJECTED, accent: 'border-red-400' },
          { label: 'Managers', value: counts.MANAGER,  accent: 'border-purple-400' },
        ].map(s => (
          <div key={s.label}
            className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${s.accent} border border-gray-100`}>
            <p className="text-gray-500 text-xs mb-1">{s.label}</p>
            <p className="text-2xl font-black text-[#0f1f3d]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by employee, leave type or department..."
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0f1f3d]" />
          <div className="flex gap-2 flex-wrap">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'MANAGER'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  statusFilter === s
                    ? 'bg-[#0f1f3d] text-white shadow'
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}>
                {s} ({counts[s]})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-400 py-12 animate-pulse">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No leave requests found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Employee', 'Role', 'Department', 'Leave Type', 'Dates', 'Days', 'Status', 'Reviewed By', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((leave: any) => (
                  <tr key={leave.id} className={`border-t border-gray-50 hover:bg-gray-50 transition ${
                    leave.employeeRole === 'MANAGER' ? 'bg-purple-50/30' : ''
                  }`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#0f1f3d] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {leave.employeeName?.charAt(0)}
                        </div>
                        <p className="font-semibold text-gray-800">{leave.employeeName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold border ${roleBadge(leave.employeeRole || 'EMPLOYEE')}`}>
                        {leave.employeeRole || 'EMPLOYEE'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{leave.department || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{leave.leaveType}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      <p>{formatDate(leave.startDate)}</p>
                      <p className="text-gray-400">to {formatDate(leave.endDate)}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{leave.duration}d</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold border ${statusBadge(leave.status)}`}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{leave.reviewedByName || '—'}</td>
                    <td className="px-4 py-3">
                      {leave.status === 'PENDING' ? (
                        <button
                          onClick={() => { setReviewingLeave(leave); setComment(''); setError(''); }}
                          className="px-3 py-1.5 bg-[#0f1f3d] hover:bg-[#1a3260] text-white text-xs font-semibold rounded-lg transition">
                          Review
                        </button>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewingLeave && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#0f1f3d]">Review Leave Request</h3>
                  <p className="text-gray-400 text-xs mt-0.5">
                    #{reviewingLeave.id} — {reviewingLeave.employeeName}
                  </p>
                </div>
                <button onClick={() => setReviewingLeave(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Leave summary */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                {[
                  { label: 'Employee',   value: reviewingLeave.employeeName },
                  { label: 'Role',       value: reviewingLeave.employeeRole || 'EMPLOYEE' },
                  { label: 'Leave Type', value: reviewingLeave.leaveType },
                  { label: 'Duration',   value: `${reviewingLeave.duration} business days` },
                  { label: 'Dates',      value: `${formatDate(reviewingLeave.startDate)} → ${formatDate(reviewingLeave.endDate)}` },
                  { label: 'Reason',     value: reviewingLeave.reason },
                ].map(({ label, value }) => (
                  <div key={label} className="flex gap-2">
                    <p className="text-xs text-gray-400 w-24 flex-shrink-0">{label}</p>
                    <p className="text-xs font-semibold text-gray-700">{value}</p>
                  </div>
                ))}
              </div>

              {/* Manager notice */}
              {reviewingLeave.employeeRole === 'MANAGER' && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-purple-700 text-xs font-semibold">
                    This is a manager leave request — you are reviewing as Admin.
                  </p>
                </div>
              )}

              {/* Comment */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Comment <span className="text-gray-400 font-normal">(required for rejection)</span>
                </label>
                <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
                  placeholder="Add a comment or reason..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0f1f3d] resize-none" />
              </div>

              {error && <p className="text-red-600 text-xs font-medium">{error}</p>}

              <div className="flex gap-3">
                <button onClick={() => handleReview('APPROVED')} disabled={submitting}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition disabled:opacity-50">
                  {submitting ? 'Processing...' : 'Approve'}
                </button>
                <button onClick={() => handleReview('REJECTED')} disabled={submitting}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition disabled:opacity-50">
                  {submitting ? 'Processing...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}