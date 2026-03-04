'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EmployeeLayout from '@/components/EmployeeLayout';
import { useAuth } from '@/lib/AuthContext';
import { userAPI, leaveAPI } from '@/lib/api';

export default function EmployeeDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      userAPI.getProfile(user.id),
      leaveAPI.getBalances(user.id)
    ]).then(([profileRes, balanceRes]) => {
      if (profileRes.success) setProfile(profileRes.data);
      // Handle both response shapes: { success, data } and { data } directly
      if (balanceRes?.success && Array.isArray(balanceRes.data)) {
        setBalances(balanceRes.data);
      } else if (Array.isArray(balanceRes?.data)) {
        setBalances(balanceRes.data);
      } else if (Array.isArray(balanceRes)) {
        setBalances(balanceRes);
      }
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const summary = profile?.leaveSummary;

  const statCards = [
    { label: 'Total Leaves',  value: summary?.total,    accent: 'border-[#0f1f3d]' },
    { label: 'Pending',       value: summary?.pending,  accent: 'border-amber-500' },
    { label: 'Approved',      value: summary?.approved, accent: 'border-emerald-500' },
    { label: 'Rejected',      value: summary?.rejected, accent: 'border-red-400' },
  ];

  const quickActions = [
    { label: 'Apply for Leave',   desc: 'Submit a new leave request', path: '/employee/apply-leave' },
    { label: 'My Leave Requests', desc: 'View your leave history',    path: '/employee/my-leaves' },
    { label: 'My Profile',        desc: 'View and edit your profile', path: '/employee/profile' },
  ];

  return (
    <EmployeeLayout title="Dashboard">

      {/* Welcome */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#0f1f3d] mb-1">Welcome back, {user.name}</h2>
        <p className="text-gray-500 text-sm">{user.department} — Employee Portal</p>
      </div>

      {/* Pending alert */}
      {!loading && summary?.pending > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="font-semibold text-amber-800 text-sm">
              {summary.pending} leave request{summary.pending > 1 ? 's' : ''} currently pending
            </p>
            <p className="text-amber-600 text-xs mt-0.5">Your manager has not reviewed them yet</p>
          </div>
          <button onClick={() => router.push('/employee/my-leaves')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition w-fit">
            View Requests
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(stat => (
          <div key={stat.label}
            className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${stat.accent} border border-gray-100`}>
            <p className="text-gray-500 text-xs font-medium mb-2">{stat.label}</p>
            <p className="text-3xl font-black text-[#0f1f3d]">
              {loading
                ? <span className="animate-pulse text-gray-200">—</span>
                : stat.value ?? 0}
            </p>
          </div>
        ))}
      </div>

      {/* Leave Balance */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-100 rounded w-1/4" />
            <div className="grid grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
            </div>
          </div>
        </div>
      ) : balances.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-[#0f1f3d]">Leave Balance</h3>
              <p className="text-gray-400 text-xs mt-0.5">Your remaining days for this year</p>
            </div>
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
              const pct = b.usedPercent;
              const barColor = b.isExhausted ? '#ef4444' : b.isLow ? '#f59e0b' : '#10b981';
              const badgeClass = b.isExhausted
                ? 'bg-red-50 text-red-600'
                : b.isLow
                ? 'bg-amber-50 text-amber-600'
                : 'bg-emerald-50 text-emerald-700';
              return (
                <div key={b.leaveType} className={`p-4 rounded-xl border ${
                  b.isExhausted
                    ? 'border-red-100 bg-red-50/30'
                    : b.isLow
                    ? 'border-amber-100 bg-amber-50/30'
                    : 'border-gray-100 bg-gray-50'
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
                      style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }} />
                  </div>
                  <p className="text-gray-400 text-xs">{b.used} days used of {b.allocated}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h3 className="text-base font-bold text-[#0f1f3d] mb-2">Leave Balance</h3>
          <p className="text-gray-400 text-sm">
            No leave balances configured yet. Contact your admin to set up leave allocations.
          </p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-bold text-[#0f1f3d] mb-5">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickActions.map(action => (
            <button key={action.label} onClick={() => router.push(action.path)}
              className="p-4 bg-gray-50 hover:bg-[#0f1f3d] hover:text-white border border-gray-200 hover:border-[#0f1f3d] rounded-xl text-left transition-all duration-200 group">
              <p className="font-semibold text-sm text-[#0f1f3d] group-hover:text-white mb-1">{action.label}</p>
              <p className="text-xs text-gray-400 group-hover:text-blue-200">{action.desc}</p>
            </button>
          ))}
        </div>
      </div>

    </EmployeeLayout>
  );
}