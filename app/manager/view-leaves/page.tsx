'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ManagerLayout from '@/components/ManagerLayout';
import { useAuth } from '@/lib/AuthContext';
import { leaveAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function ManagerViewLeavesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    leaveAPI.getTeamLeaves(user.id)
      .then(res => {
        if (res.success) setLeaves(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const filters = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'UNPAID'];

  const filtered = leaves.filter(l => {
    const matchesFilter = filter === 'ALL' || l.status === filter;
    const matchesSearch = search === '' ||
      l.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
      l.leaveType?.toLowerCase().includes(search.toLowerCase()) ||
      l.department?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total:    leaves.length,
    pending:  leaves.filter(l => l.status === 'PENDING').length,
    approved: leaves.filter(l => l.status === 'APPROVED').length,
    rejected: leaves.filter(l => l.status === 'REJECTED').length,
  };

  const statusBadge = (s: string) =>
    s === 'APPROVED'  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
    s === 'REJECTED'  ? 'bg-red-50 text-red-700 border border-red-200' :
    s === 'CANCELLED' ? 'bg-gray-100 text-gray-500 border border-gray-200' :
    s === 'UNPAID'    ? 'bg-orange-50 text-orange-700 border border-orange-200' :
    'bg-amber-50 text-amber-700 border border-amber-200';

  return (
    <ManagerLayout title="Leave Requests">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#0f1f3d] mb-1">Team Leave Requests</h2>
        <p className="text-gray-500 text-sm">Review and manage your team's leave applications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total',    value: stats.total,    accent: 'border-[#0f1f3d]' },
          { label: 'Pending',  value: stats.pending,  accent: 'border-amber-500' },
          { label: 'Approved', value: stats.approved, accent: 'border-emerald-500' },
          { label: 'Rejected', value: stats.rejected, accent: 'border-red-400' },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${s.accent} border border-gray-100`}>
            <p className="text-gray-500 text-xs font-medium mb-2">{s.label}</p>
            <p className="text-3xl font-black text-[#0f1f3d]">
              {loading ? <span className="animate-pulse text-gray-200">—</span> : s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by employee, leave type or department..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0f1f3d]"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {filters.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  filter === f
                    ? 'bg-[#0f1f3d] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {f}
                {f !== 'ALL' && (
                  <span className="ml-1 opacity-70">
                    ({leaves.filter(l => l.status === f).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-[#0f1f3d] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading leave requests...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-400 text-sm font-medium">
              {search ? 'No results match your search' : filter === 'ALL' ? 'No leave requests yet' : `No ${filter.toLowerCase()} requests`}
            </p>
            {filter !== 'ALL' && (
              <button onClick={() => setFilter('ALL')} className="mt-2 text-xs text-[#0f1f3d] font-semibold hover:underline">
                Clear filter
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Employee', 'Leave Type', 'Duration', 'Dates', 'Submitted', 'Status', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(leave => (
                  <tr key={leave.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#0f1f3d] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {leave.employeeName?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{leave.employeeName}</p>
                          <p className="text-xs text-gray-400">{leave.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700">{leave.leaveType}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700">{leave.duration} day{leave.duration > 1 ? 's' : ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-600">{formatDate(leave.startDate)}</p>
                      <p className="text-xs text-gray-400">to {formatDate(leave.endDate)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-500">{formatDate(leave.submittedDate)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold w-fit ${statusBadge(leave.status)}`}>
                          {leave.status}
                        </span>
                        {leave.documentRequired && (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium w-fit ${
                            leave.documentStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-600' :
                            leave.documentStatus === 'UPLOADED' ? 'bg-blue-50 text-blue-600' :
                            leave.documentStatus === 'REJECTED' ? 'bg-red-50 text-red-600' :
                            'bg-amber-50 text-amber-600'
                          }`}>
                            Doc: {leave.documentStatus}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => router.push(`/manager/view-leaves/${leave.id}`)}
                        className="px-3 py-1.5 bg-[#0f1f3d] hover:bg-[#1a3260] text-white text-xs font-semibold rounded-lg transition">
                        {leave.status === 'PENDING' ? 'Review' : 'View'}
                      </button>
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