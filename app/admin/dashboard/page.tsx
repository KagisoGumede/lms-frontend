'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/lib/AuthContext';
import { adminAPI } from '@/lib/api';

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await adminAPI.getStats();
      if (res.success) setStats(res.data);
    } catch (err) {
      console.error('Failed to load stats', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Managers', value: stats?.totalManagers, sub: 'Active managers', accent: 'border-[#0f1f3d]', path: '/admin/users' },
    { label: 'Total Employees', value: stats?.totalEmployees, sub: 'Active employees', accent: 'border-blue-400', path: '/admin/users' },
    { label: 'Total Leave Requests', value: stats?.totalLeaves, sub: 'All time', accent: 'border-indigo-400', path: '/admin/leaves' },
    { label: 'Pending Reviews', value: stats?.pendingLeaves, sub: 'Awaiting action', accent: 'border-amber-500', path: '/admin/leaves' },
    { label: 'Approved Leaves', value: stats?.approvedLeaves, sub: 'Total approved', accent: 'border-emerald-500', path: '/admin/leaves' },
    { label: 'Rejected Leaves', value: stats?.rejectedLeaves, sub: 'Total rejected', accent: 'border-red-400', path: '/admin/leaves' },
  ];

  const quickActions = [
    { label: 'Manage Users', desc: 'View, add or remove users', path: '/admin/users' },
    { label: 'Leave Requests', desc: 'All company leave requests', path: '/admin/leaves' },
    { label: 'System Reports', desc: 'Company-wide analytics', path: '/admin/reports' },
    { label: 'Settings', desc: 'Departments, positions, leave types', path: '/admin/settings' },
  ];

  return (
    <AdminLayout title="Dashboard">
      {/* Welcome */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#0f1f3d] mb-1">
          Welcome back, {user?.name}
        </h2>
        <p className="text-gray-500 text-sm">System Administrator — Full access</p>
      </div>

      {/* Pending alert */}
      {!loading && stats?.pendingLeaves > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="font-semibold text-amber-800 text-sm">
              {stats.pendingLeaves} leave request{stats.pendingLeaves > 1 ? 's' : ''} pending company-wide
            </p>
            <p className="text-amber-600 text-xs mt-0.5">Managers need to review these requests</p>
          </div>
          <button
            onClick={() => router.push('/admin/leaves')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition w-fit"
          >
            View Requests
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            onClick={() => router.push(stat.path)}
            className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${stat.accent} border border-gray-100 cursor-pointer hover:shadow-md transition-all duration-200`}
          >
            <p className="text-gray-500 text-xs font-medium mb-2">{stat.label}</p>
            <p className="text-3xl font-black text-[#0f1f3d]">
              {loading ? <span className="animate-pulse text-gray-200">—</span> : stat.value ?? 0}
            </p>
            <p className="text-gray-400 text-xs mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-bold text-[#0f1f3d] mb-5">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => router.push(action.path)}
              className="p-4 bg-gray-50 hover:bg-[#0f1f3d] hover:text-white border border-gray-200 hover:border-[#0f1f3d] rounded-xl text-left transition-all duration-200 group"
            >
              <p className="font-semibold text-sm text-[#0f1f3d] group-hover:text-white mb-1">{action.label}</p>
              <p className="text-xs text-gray-400 group-hover:text-blue-200">{action.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}