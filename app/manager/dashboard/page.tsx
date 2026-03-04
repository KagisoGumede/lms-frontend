'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ManagerLayout from '@/components/ManagerLayout';
import { useAuth } from '@/lib/AuthContext';
import { leaveAPI } from '@/lib/api';

export default function ManagerDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0, pendingLeaves: 0, approvedThisMonth: 0, totalLeaves: 0
  });
  const [myLeaveStats, setMyLeaveStats] = useState({
    pending: 0, approved: 0, total: 0
  });
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      leaveAPI.getDashboardStats(user.id),
      leaveAPI.getMyLeaves(user.id),
      leaveAPI.getBalances(user.id)
    ]).then(([statsRes, myLeavesRes, balRes]) => {
      if (statsRes.success) setStats(statsRes.data);
      if (myLeavesRes.success) {
        const leaves = myLeavesRes.data;
        setMyLeaveStats({
          total:    leaves.length,
          pending:  leaves.filter((l: any) => l.status === 'PENDING').length,
          approved: leaves.filter((l: any) => l.status === 'APPROVED').length,
        });
      }
      // Handle all response shapes
      if (balRes?.success && Array.isArray(balRes.data)) {
        setBalances(balRes.data);
      } else if (Array.isArray(balRes?.data)) {
        setBalances(balRes.data);
      } else if (Array.isArray(balRes)) {
        setBalances(balRes);
      }
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const statCards = [
    { label: 'Total Employees',      value: stats.totalEmployees,    sub: 'Under your management', accent: 'border-[#0f1f3d]' },
    { label: 'Pending Requests',     value: stats.pendingLeaves,     sub: 'Awaiting your review',  accent: 'border-amber-500' },
    { label: 'Approved This Month',  value: stats.approvedThisMonth, sub: 'Approved this month',   accent: 'border-emerald-500' },
    { label: 'Total Requests',       value: stats.totalLeaves,       sub: 'All time',              accent: 'border-blue-400' },
  ];

  const quickActions = [
    { label: 'Apply for Leave',       desc: 'Submit your personal leave',        path: '/manager/apply-leave' },
    { label: 'My Leave Requests',     desc: 'View your leave history',            path: '/manager/my-leaves' },
    { label: 'Review Leave Requests', desc: 'View and approve team requests',     path: '/manager/view-leaves' },
    { label: 'Add New User',          desc: 'Add employees or managers',          path: '/manager/add-user' },
    { label: 'View Reports',          desc: 'Department leave statistics',        path: '/manager/reports' },
    { label: 'Settings',              desc: 'Manage departments and leave types', path: '/manager/settings' },
  ];

  return (
    <ManagerLayout title="Dashboard">

      {/* Welcome */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#0f1f3d] mb-1">Welcome back, {user.name}</h2>
        <p className="text-gray-500 text-sm">{user.department} — Manager Portal</p>
      </div>

      {/* Pending team alert */}
      {!loading && stats.pendingLeaves > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="font-semibold text-amber-800 text-sm">
              {stats.pendingLeaves} leave request{stats.pendingLeaves > 1 ? 's' : ''} awaiting your review
            </p>
            <p className="text-amber-600 text-xs mt-0.5">Please review and take action</p>
          </div>
          <button onClick={() => router.push('/manager/view-leaves')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition w-fit">
            Review Now
          </button>
        </div>
      )}

      {/* Team Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(stat => (
          <div key={stat.label}
            className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${stat.accent} border border-gray-100`}>
            <p className="text-gray-500 text-xs font-medium mb-2">{stat.label}</p>
            <p className="text-3xl font-black text-[#0f1f3d]">
              {loading ? <span className="animate-pulse text-gray-200">—</span> : stat.value}
            </p>
            <p className="text-gray-400 text-xs mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* My Leave Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-[#0f1f3d]">My Leave Summary</h3>
          <div className="flex gap-2">
            <button onClick={() => router.push('/manager/my-leaves')}
              className="px-3 py-1.5 text-xs font-semibold text-[#0f1f3d] border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              View All
            </button>
            <button onClick={() => router.push('/manager/apply-leave')}
              className="px-3 py-1.5 text-xs font-semibold bg-[#0f1f3d] text-white rounded-lg hover:bg-[#1a3260] transition">
              Apply for Leave
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Requests', value: myLeaveStats.total,    accent: 'border-[#0f1f3d]' },
            { label: 'Pending',        value: myLeaveStats.pending,  accent: 'border-amber-500' },
            { label: 'Approved',       value: myLeaveStats.approved, accent: 'border-emerald-500' },
          ].map(s => (
            <div key={s.label} className={`bg-gray-50 rounded-xl p-4 border-l-4 ${s.accent}`}>
              <p className="text-gray-500 text-xs mb-1">{s.label}</p>
              <p className="text-2xl font-black text-[#0f1f3d]">
                {loading ? '—' : s.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* My Leave Balance */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-100 rounded w-1/4" />
            <div className="grid grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
            </div>
          </div>
        </div>
      ) : balances.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-[#0f1f3d]">My Leave Balance</h3>
              <p className="text-gray-400 text-xs mt-0.5">Your remaining days for this year</p>
            </div>
            <button onClick={() => router.push('/manager/apply-leave')}
              className="px-3 py-1.5 text-xs font-semibold bg-[#0f1f3d] text-white rounded-lg hover:bg-[#1a3260] transition">
              Apply for Leave
            </button>
          </div>

          {balances.some(b => b.isLow || b.isExhausted) && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-700 text-xs font-semibold">
                {balances.some(b => b.isExhausted)
                  ? 'You have exhausted leave balance for one or more leave types.'
                  : 'You are running low on leave days for one or more leave types.'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {balances.map((b: any) => {
              const barColor = b.isExhausted ? '#ef4444' : b.isLow ? '#f59e0b' : '#10b981';
              const badgeClass = b.isExhausted
                ? 'bg-red-50 text-red-600'
                : b.isLow
                ? 'bg-amber-50 text-amber-600'
                : 'bg-emerald-50 text-emerald-700';
              return (
                <div key={b.leaveType} className={`p-4 rounded-xl border ${
                  b.isExhausted ? 'border-red-100 bg-red-50/30' :
                  b.isLow       ? 'border-amber-100 bg-amber-50/30' :
                                  'border-gray-100 bg-gray-50'
                }`}>
                  <div className="flex items-start justify-between mb-3">
                    <p className="font-semibold text-gray-800 text-sm leading-tight">{b.leaveType}</p>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${badgeClass}`}>
                      {b.isExhausted ? 'Exhausted' : b.isLow ? 'Low' : 'Good'}
                    </span>
                  </div>
                  <div className="flex items-end gap-1 mb-2">
                    <p className="text-3xl font-black text-[#0f1f3d]">{b.remaining}</p>
                    <p className="text-gray-400 text-xs mb-1">/ {b.allocated} days left</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                    <div className="h-1.5 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(b.usedPercent, 100)}%`, backgroundColor: barColor }} />
                  </div>
                  <p className="text-gray-400 text-xs">{b.used} days used of {b.allocated}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-base font-bold text-[#0f1f3d] mb-2">My Leave Balance</h3>
          <p className="text-gray-400 text-sm">No leave balances configured yet. Contact your admin.</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-bold text-[#0f1f3d] mb-5">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map(action => (
            <button key={action.label} onClick={() => router.push(action.path)}
              className="p-4 bg-gray-50 hover:bg-[#0f1f3d] hover:text-white border border-gray-200 hover:border-[#0f1f3d] rounded-xl text-left transition-all duration-200 group">
              <p className="font-semibold text-sm text-[#0f1f3d] group-hover:text-white mb-1">{action.label}</p>
              <p className="text-xs text-gray-400 group-hover:text-blue-200">{action.desc}</p>
            </button>
          ))}
        </div>
      </div>

    </ManagerLayout>
  );
}