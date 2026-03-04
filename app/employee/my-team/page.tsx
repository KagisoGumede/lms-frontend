'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EmployeeLayout from '@/components/EmployeeLayout';
import { useAuth } from '@/lib/AuthContext';
import { userAPI, leaveAPI, messageAPI } from '@/lib/api';

export default function MyTeamPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [teammates, setTeammates] = useState<any[]>([]);
  const [manager, setManager] = useState<any>(null);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    userAPI.getProfile(user.id).then(async profileRes => {
      if (!profileRes.success) return;
      const profile = profileRes.data;

      // Get all users to find teammates (same manager)
      const allUsersRes = await userAPI.getAllUsers();
      const managersRes = await userAPI.getAllManagers();

      if (managersRes.success) {
        // Find this employee's manager
        const myManager = managersRes.data.find((m: any) =>
          `${m.firstName} ${m.surname}` === profile.managerName
        );
        if (myManager) {
          setManager(myManager);
          // Get teammates (same manager, exclude self)
          const teamRes = await userAPI.getUsersByManager(myManager.id);
          if (teamRes.success) {
            setTeammates(teamRes.data.filter((t: any) => t.id !== user.id));
            // Get team leaves
            const leavesRes = await leaveAPI.getTeamLeaves(myManager.id);
            if (leavesRes.success) {
              setLeaves(leavesRes.data.filter((l: any) => l.status === 'APPROVED'));
            }
          }
        }
      }
    }).finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const isOnLeaveToday = (emp: any) => {
    const fullName = `${emp.firstName} ${emp.surname}`;
    return leaves.some(l =>
      l.employeeName === fullName &&
      todayStr >= l.startDate && todayStr <= l.endDate
    );
  };

  const getCurrentLeave = (emp: any) => {
    const fullName = `${emp.firstName} ${emp.surname}`;
    return leaves.find(l =>
      l.employeeName === fullName &&
      todayStr >= l.startDate && todayStr <= l.endDate
    );
  };

  const getUpcomingLeave = (emp: any) => {
    const fullName = `${emp.firstName} ${emp.surname}`;
    return leaves
      .filter(l => l.employeeName === fullName && l.startDate > todayStr)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  };

  const filtered = teammates.filter(t =>
    `${t.firstName} ${t.surname} ${t.department}`
      .toLowerCase().includes(search.toLowerCase())
  );

  const onLeaveCount = teammates.filter(isOnLeaveToday).length;
  const availableCount = teammates.length - onLeaveCount;

  return (
    <EmployeeLayout title="My Team">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#0f1f3d] mb-1">My Team</h2>
        <p className="text-gray-500 text-sm">View your colleagues and their availability</p>
      </div>

      {/* Manager card */}
      {manager && (
        <div className="bg-[#0f1f3d] rounded-xl p-5 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white font-black text-lg">
              {manager.firstName?.charAt(0)}{manager.surname?.charAt(0)}
            </div>
            <div>
              <p className="text-xs text-blue-300 font-medium mb-0.5">Your Manager</p>
              <p className="text-white font-bold">{manager.firstName} {manager.surname}</p>
              <p className="text-blue-200 text-xs">{manager.department} — {manager.emailAddress}</p>
            </div>
          </div>
          <button
            onClick={() => router.push(`/employee/messages?to=${manager.id}`)}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-lg transition">
            Message
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Team Size',       value: teammates.length,  accent: 'border-[#0f1f3d]' },
          { label: 'Available Today', value: availableCount,    accent: 'border-emerald-500' },
          { label: 'On Leave Today',  value: onLeaveCount,      accent: 'border-red-400' },
        ].map(c => (
          <div key={c.label} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${c.accent} border border-gray-100`}>
            <p className="text-gray-500 text-xs mb-1">{c.label}</p>
            <p className="text-2xl font-black text-[#0f1f3d]">{loading ? '—' : c.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search colleagues..."
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0f1f3d]" />
      </div>

      {/* Team grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 animate-pulse">
              <div className="h-16 bg-gray-100 rounded-lg mb-3" />
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <p className="text-gray-400">
            {teammates.length === 0
              ? 'No teammates found. You may not be assigned to a manager yet.'
              : 'No colleagues match your search.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(emp => {
            const onLeave = isOnLeaveToday(emp);
            const currentLeave = getCurrentLeave(emp);
            const upcomingLeave = getUpcomingLeave(emp);
            return (
              <div key={emp.id} className={`bg-white rounded-xl p-5 shadow-sm border ${
                onLeave ? 'border-red-200 bg-red-50/20' : 'border-gray-100'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#0f1f3d] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {emp.firstName?.charAt(0)}{emp.surname?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{emp.firstName} {emp.surname}</p>
                      <p className="text-gray-400 text-xs">{emp.department || 'N/A'}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${
                    onLeave ? 'bg-red-100 text-red-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {onLeave ? 'On Leave' : 'Available'}
                  </span>
                </div>

                <p className="text-xs text-gray-400 mb-3">{emp.emailAddress}</p>

                {onLeave && currentLeave && (
                  <div className="mb-3 p-2 bg-red-50 border border-red-100 rounded-lg">
                    <p className="text-red-700 text-xs font-semibold">{currentLeave.leaveType}</p>
                    <p className="text-red-500 text-xs">
                      Until {new Date(currentLeave.endDate + 'T00:00:00').toLocaleDateString('en-ZA', {
                        day: '2-digit', month: 'short'
                      })}
                    </p>
                  </div>
                )}

                {!onLeave && upcomingLeave && (
                  <div className="mb-3 p-2 bg-amber-50 border border-amber-100 rounded-lg">
                    <p className="text-amber-700 text-xs font-semibold">Upcoming: {upcomingLeave.leaveType}</p>
                    <p className="text-amber-500 text-xs">
                      From {new Date(upcomingLeave.startDate + 'T00:00:00').toLocaleDateString('en-ZA', {
                        day: '2-digit', month: 'short'
                      })}
                    </p>
                  </div>
                )}

                <button
                  onClick={() => router.push(`/employee/messages?to=${emp.id}`)}
                  className="w-full py-2 bg-[#0f1f3d] hover:bg-[#1a3260] text-white text-xs font-semibold rounded-lg transition">
                  Send Message
                </button>
              </div>
            );
          })}
        </div>
      )}
    </EmployeeLayout>
  );
}