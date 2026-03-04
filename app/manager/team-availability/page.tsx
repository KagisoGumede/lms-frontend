'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ManagerLayout from '@/components/ManagerLayout';
import { useAuth } from '@/lib/AuthContext';
import { leaveAPI, userAPI, settingsAPI } from '@/lib/api';

export default function ManagerTeamAvailabilityPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (!user) return;
    Promise.all([
      userAPI.getUsersByManager(user.id),
      leaveAPI.getTeamLeaves(user.id),
      settingsAPI.getPublicHolidays(),
    ]).then(([eRes, lRes, hRes]) => {
      if (eRes.success) setEmployees(eRes.data);
      if (lRes.success) setLeaves(lRes.data.filter((l: any) =>
        l.status === 'APPROVED' || l.status === 'PENDING'));
      if (hRes.success) setHolidays(hRes.data);
    }).finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  // ── Week helpers ──────────────────────────────────────────────
  const getWeekDays = (date: Date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay() + 1); // Monday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  const weekDays = getWeekDays(currentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formatDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const isHoliday = (d: Date) => holidays.some(h => h.date === formatDateStr(d));
  const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

  const getEmployeeStatusForDay = (employeeId: number, day: Date) => {
    const dateStr = formatDateStr(day);
    const leave = leaves.find(l => {
      if (l.employeeId !== employeeId && l.id !== employeeId) {
        // match by name since we may not have employeeId in leave
        return false;
      }
      return dateStr >= l.startDate && dateStr <= l.endDate;
    });
    // Try matching by employeeName vs employee name
    const empLeave = leaves.find(l => {
      const emp = employees.find(e => e.id === employeeId);
      if (!emp) return false;
      const fullName = `${emp.firstName} ${emp.surname}`;
      return l.employeeName === fullName &&
        dateStr >= l.startDate && dateStr <= l.endDate;
    });
    if (empLeave) return empLeave.status;
    if (isHoliday(day)) return 'HOLIDAY';
    if (isWeekend(day)) return 'WEEKEND';
    return 'AVAILABLE';
  };

  const statusStyle = (status: string) => {
    switch (status) {
      case 'APPROVED':   return 'bg-red-100 text-red-700 border border-red-200';
      case 'PENDING':    return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'HOLIDAY':    return 'bg-purple-100 text-purple-700 border border-purple-200';
      case 'WEEKEND':    return 'bg-gray-100 text-gray-400';
      default:           return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'On Leave';
      case 'PENDING':  return 'Pending';
      case 'HOLIDAY':  return 'Holiday';
      case 'WEEKEND':  return 'Weekend';
      default:         return 'Available';
    }
  };

  // ── Summary stats ─────────────────────────────────────────────
  const todayStr = formatDateStr(today);
  const onLeaveToday = employees.filter(emp =>
    leaves.some(l => {
      const fullName = `${emp.firstName} ${emp.surname}`;
      return l.employeeName === fullName &&
        l.status === 'APPROVED' &&
        todayStr >= l.startDate && todayStr <= l.endDate;
    })
  );
  const availableToday = employees.filter(emp => !onLeaveToday.find(e => e.id === emp.id));
  const pendingCount = leaves.filter(l => l.status === 'PENDING').length;

  // ── Absenteeism Detection ─────────────────────────────────────
  const analyzePatterns = () => {
    return employees.map(emp => {
      const empLeaves = leaves.filter(l => {
        const fullName = `${emp.firstName} ${emp.surname}`;
        return l.employeeName === fullName && l.status === 'APPROVED';
      });

      let mondayCount = 0, fridayCount = 0, totalDays = 0;
      empLeaves.forEach(l => {
        const start = new Date(l.startDate);
        const end = new Date(l.endDate);
        const cur = new Date(start);
        while (cur <= end) {
          totalDays++;
          if (cur.getDay() === 1) mondayCount++;
          if (cur.getDay() === 5) fridayCount++;
          cur.setDate(cur.getDate() + 1);
        }
      });

      const patterns: string[] = [];
      if (mondayCount >= 3) patterns.push(`${mondayCount} Mondays off`);
      if (fridayCount >= 3) patterns.push(`${fridayCount} Fridays off`);
      if (empLeaves.length >= 5) patterns.push(`${empLeaves.length} leave requests`);
      if (totalDays >= 15) patterns.push(`${totalDays} total days absent`);

      return {
        ...emp,
        totalLeaves: empLeaves.length,
        totalDays,
        mondayCount,
        fridayCount,
        patterns,
        riskLevel: patterns.length >= 2 ? 'HIGH' : patterns.length === 1 ? 'MEDIUM' : 'LOW',
      };
    }).sort((a, b) => b.totalDays - a.totalDays);
  };

  const patterns = analyzePatterns();
  const highRisk = patterns.filter(p => p.riskLevel === 'HIGH');
  const mediumRisk = patterns.filter(p => p.riskLevel === 'MEDIUM');

  const prevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };
  const nextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };
  const goToday = () => setCurrentDate(new Date());

  const weekLabel = `${weekDays[0].toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' })} — ${weekDays[6].toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}`;

  return (
    <ManagerLayout title="Team Availability">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#0f1f3d] mb-1">Team Availability</h2>
        <p className="text-gray-500 text-sm">See who's in, who's out, and detect absence patterns</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Team',      value: employees.length,       accent: 'border-[#0f1f3d]', sub: 'team members' },
          { label: 'Available Today', value: availableToday.length,  accent: 'border-emerald-500', sub: 'in office' },
          { label: 'On Leave Today',  value: onLeaveToday.length,    accent: 'border-red-400', sub: 'absent today' },
          { label: 'Pending Leaves',  value: pendingCount,           accent: 'border-amber-500', sub: 'awaiting review' },
        ].map(c => (
          <div key={c.label} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${c.accent} border border-gray-100`}>
            <p className="text-gray-500 text-xs mb-1">{c.label}</p>
            <p className="text-2xl font-black text-[#0f1f3d]">{loading ? '—' : c.value}</p>
            <p className="text-gray-400 text-xs mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* On leave today alert */}
      {!loading && onLeaveToday.length > 0 && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-700 text-sm font-semibold mb-2">
            {onLeaveToday.length} team member{onLeaveToday.length > 1 ? 's' : ''} absent today
          </p>
          <div className="flex flex-wrap gap-2">
            {onLeaveToday.map(emp => (
              <span key={emp.id} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                {emp.firstName} {emp.surname}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Week grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-[#0f1f3d]">Weekly View</h3>
          <div className="flex items-center gap-2">
            <button onClick={prevWeek}
              className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600 font-bold text-sm">&larr;</button>
            <button onClick={goToday}
              className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition">
              Today
            </button>
            <span className="text-sm font-semibold text-gray-600 min-w-[200px] text-center">{weekLabel}</span>
            <button onClick={nextWeek}
              className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600 font-bold text-sm">&rarr;</button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mb-4 flex-wrap">
          {[
            { label: 'Available',  color: 'bg-emerald-400' },
            { label: 'On Leave',   color: 'bg-red-400' },
            { label: 'Pending',    color: 'bg-amber-400' },
            { label: 'Holiday',    color: 'bg-purple-400' },
            { label: 'Weekend',    color: 'bg-gray-300' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
              <span className="text-xs text-gray-500">{l.label}</span>
            </div>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-8 animate-pulse">Loading...</p>
        ) : employees.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No team members found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide w-40">Employee</th>
                  {weekDays.map(d => {
                    const isToday = formatDateStr(d) === formatDateStr(today);
                    const holiday = holidays.find(h => h.date === formatDateStr(d));
                    return (
                      <th key={d.toISOString()} className={`px-2 py-2 text-center text-xs font-bold uppercase tracking-wide ${
                        isToday ? 'text-[#0f1f3d]' : 'text-gray-400'
                      }`}>
                        <div className={`rounded-lg py-1 px-1 ${isToday ? 'bg-[#0f1f3d]/10' : ''}`}>
                          <p>{d.toLocaleDateString('en-ZA', { weekday: 'short' })}</p>
                          <p className={`text-base font-black ${isToday ? 'text-[#0f1f3d]' : 'text-gray-600'}`}>
                            {d.getDate()}
                          </p>
                          {holiday && <p className="text-purple-500 text-xs truncate">{holiday.name.split(' ')[0]}</p>}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id} className="border-t border-gray-50">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#0f1f3d] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {emp.firstName?.charAt(0)}{emp.surname?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-xs">{emp.firstName} {emp.surname}</p>
                          <p className="text-gray-400 text-xs">{emp.department || ''}</p>
                        </div>
                      </div>
                    </td>
                    {weekDays.map(d => {
                      const status = getEmployeeStatusForDay(emp.id, d);
                      return (
                        <td key={d.toISOString()} className="px-1 py-2 text-center">
                          <span className={`inline-block px-1.5 py-1 rounded-lg text-xs font-semibold min-w-[64px] ${statusStyle(status)}`}>
                            {statusLabel(status)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Absenteeism / Pattern Detection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-[#0f1f3d]">Absence Pattern Detection</h3>
            <p className="text-gray-400 text-xs mt-0.5">Flags employees with suspicious leave patterns</p>
          </div>
          {(highRisk.length > 0 || mediumRisk.length > 0) && (
            <div className="flex gap-2">
              {highRisk.length > 0 && (
                <span className="px-2 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-lg">
                  {highRisk.length} High Risk
                </span>
              )}
              {mediumRisk.length > 0 && (
                <span className="px-2 py-1 bg-amber-50 text-amber-600 text-xs font-bold rounded-lg">
                  {mediumRisk.length} Medium Risk
                </span>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-8 animate-pulse">Analysing patterns...</p>
        ) : employees.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No team members to analyse.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Employee', 'Total Leaves', 'Total Days', 'Mondays Off', 'Fridays Off', 'Patterns', 'Risk'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patterns.map(emp => (
                  <tr key={emp.id} className={`border-t border-gray-50 hover:bg-gray-50 transition ${
                    emp.riskLevel === 'HIGH' ? 'bg-red-50/30' :
                    emp.riskLevel === 'MEDIUM' ? 'bg-amber-50/30' : ''
                  }`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#0f1f3d] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {emp.firstName?.charAt(0)}{emp.surname?.charAt(0)}
                        </div>
                        <p className="font-semibold text-gray-800 text-sm">{emp.firstName} {emp.surname}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{emp.totalLeaves}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.totalDays}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        emp.mondayCount >= 3 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'
                      }`}>{emp.mondayCount}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        emp.fridayCount >= 3 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'
                      }`}>{emp.fridayCount}</span>
                    </td>
                    <td className="px-4 py-3">
                      {emp.patterns.length === 0 ? (
                        <span className="text-gray-400 text-xs">None detected</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {emp.patterns.map((p: string) => (
                            <span key={p} className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-xs font-medium">
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        emp.riskLevel === 'HIGH'   ? 'bg-red-100 text-red-700' :
                        emp.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-50 text-emerald-700'
                      }`}>{emp.riskLevel}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick action */}
      <button onClick={() => router.push('/manager/view-leaves')}
        className="w-full py-2.5 bg-[#0f1f3d] hover:bg-[#1a3260] text-white text-sm font-semibold rounded-xl transition">
        Review Pending Leave Requests
      </button>
    </ManagerLayout>
  );
}