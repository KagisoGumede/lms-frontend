'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminAPI, settingsAPI } from '@/lib/api';

export default function AdminTeamAvailabilityPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [deptFilter, setDeptFilter] = useState('all');

  useEffect(() => {
    Promise.all([
      adminAPI.getAllEmployees(),
      adminAPI.getAllLeaves(),
      settingsAPI.getPublicHolidays(),
    ]).then(([uRes, lRes, hRes]) => {
      if (uRes.success) setUsers(uRes.data);
      if (lRes.success) setLeaves(lRes.data.filter((l: any) =>
        l.status === 'APPROVED' || l.status === 'PENDING'));
      if (hRes.success) setHolidays(hRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const getWeekDays = (date: Date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay() + 1);
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

  const getStatusForDay = (emp: any, day: Date) => {
    const dateStr = formatDateStr(day);
    const fullName = `${emp.firstName} ${emp.surname}`;
    const empLeave = leaves.find(l =>
      l.employeeName === fullName &&
      dateStr >= l.startDate && dateStr <= l.endDate
    );
    if (empLeave) return empLeave.status;
    if (isHoliday(day)) return 'HOLIDAY';
    if (isWeekend(day)) return 'WEEKEND';
    return 'AVAILABLE';
  };

  const statusStyle = (s: string) => {
    switch (s) {
      case 'APPROVED': return 'bg-red-100 text-red-700 border border-red-200';
      case 'PENDING':  return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'HOLIDAY':  return 'bg-purple-100 text-purple-700 border border-purple-200';
      case 'WEEKEND':  return 'bg-gray-100 text-gray-400';
      default:         return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    }
  };

  const statusLabel = (s: string) => {
    switch (s) {
      case 'APPROVED': return 'On Leave';
      case 'PENDING':  return 'Pending';
      case 'HOLIDAY':  return 'Holiday';
      case 'WEEKEND':  return 'Weekend';
      default:         return 'Available';
    }
  };

  const departments = ['all', ...Array.from(new Set(users.map(u => u.department).filter(Boolean)))];
  const filteredUsers = deptFilter === 'all' ? users : users.filter(u => u.department === deptFilter);

  const todayStr = formatDateStr(today);
  const onLeaveToday = filteredUsers.filter(emp =>
    leaves.some(l => {
      const fullName = `${emp.firstName} ${emp.surname}`;
      return l.employeeName === fullName && l.status === 'APPROVED' &&
        todayStr >= l.startDate && todayStr <= l.endDate;
    })
  );

  // Absenteeism analysis
  const analyzePatterns = () => {
    return filteredUsers.map(emp => {
      const fullName = `${emp.firstName} ${emp.surname}`;
      const empLeaves = leaves.filter(l => l.employeeName === fullName && l.status === 'APPROVED');
      let mondayCount = 0, fridayCount = 0, totalDays = 0;
      empLeaves.forEach(l => {
        const cur = new Date(l.startDate);
        const end = new Date(l.endDate);
        while (cur <= end) {
          totalDays++;
          if (cur.getDay() === 1) mondayCount++;
          if (cur.getDay() === 5) fridayCount++;
          cur.setDate(cur.getDate() + 1);
        }
      });
      const patterns: string[] = [];
      if (mondayCount >= 3) patterns.push(`${mondayCount} Mondays`);
      if (fridayCount >= 3) patterns.push(`${fridayCount} Fridays`);
      if (empLeaves.length >= 5) patterns.push(`${empLeaves.length} requests`);
      if (totalDays >= 15) patterns.push(`${totalDays} days absent`);
      return {
        ...emp,
        totalLeaves: empLeaves.length,
        totalDays, mondayCount, fridayCount, patterns,
        riskLevel: patterns.length >= 2 ? 'HIGH' : patterns.length === 1 ? 'MEDIUM' : 'LOW',
      };
    }).sort((a, b) => b.totalDays - a.totalDays);
  };

  const patterns = analyzePatterns();
  const highRisk = patterns.filter(p => p.riskLevel === 'HIGH');

  const weekLabel = `${weekDays[0].toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' })} — ${weekDays[6].toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}`;

  const prevWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); };
  const nextWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); };

  return (
    <AdminLayout title="Team Availability">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#0f1f3d] mb-1">Company Availability</h2>
          <p className="text-gray-500 text-sm">Company-wide attendance and absence pattern overview</p>
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0f1f3d] w-fit">
          {departments.map(d => <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>)}
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Employees',  value: filteredUsers.length,                         accent: 'border-[#0f1f3d]' },
          { label: 'Available Today',  value: filteredUsers.length - onLeaveToday.length,   accent: 'border-emerald-500' },
          { label: 'On Leave Today',   value: onLeaveToday.length,                          accent: 'border-red-400' },
          { label: 'High Risk',        value: highRisk.length,                              accent: 'border-orange-400' },
        ].map(c => (
          <div key={c.label} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${c.accent} border border-gray-100`}>
            <p className="text-gray-500 text-xs mb-1">{c.label}</p>
            <p className="text-2xl font-black text-[#0f1f3d]">{loading ? '—' : c.value}</p>
          </div>
        ))}
      </div>

      {/* Week grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-[#0f1f3d]">Weekly Availability Grid</h3>
          <div className="flex items-center gap-2">
            <button onClick={prevWeek} className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600 font-bold text-sm">&larr;</button>
            <button onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition">
              Today
            </button>
            <span className="text-sm font-semibold text-gray-600 min-w-[200px] text-center">{weekLabel}</span>
            <button onClick={nextWeek} className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600 font-bold text-sm">&rarr;</button>
          </div>
        </div>

        <div className="flex gap-4 mb-4 flex-wrap">
          {[
            { label: 'Available', color: 'bg-emerald-400' },
            { label: 'On Leave',  color: 'bg-red-400' },
            { label: 'Pending',   color: 'bg-amber-400' },
            { label: 'Holiday',   color: 'bg-purple-400' },
            { label: 'Weekend',   color: 'bg-gray-300' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
              <span className="text-xs text-gray-500">{l.label}</span>
            </div>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-8 animate-pulse">Loading...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No employees found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide w-48">Employee</th>
                  {weekDays.map(d => {
                    const isToday = formatDateStr(d) === formatDateStr(today);
                    const holiday = holidays.find(h => h.date === formatDateStr(d));
                    return (
                      <th key={d.toISOString()} className={`px-2 py-2 text-center text-xs font-bold uppercase ${isToday ? 'text-[#0f1f3d]' : 'text-gray-400'}`}>
                        <div className={`rounded-lg py-1 ${isToday ? 'bg-[#0f1f3d]/10' : ''}`}>
                          <p>{d.toLocaleDateString('en-ZA', { weekday: 'short' })}</p>
                          <p className={`text-base font-black ${isToday ? 'text-[#0f1f3d]' : 'text-gray-600'}`}>{d.getDate()}</p>
                          {holiday && <p className="text-purple-500 text-xs truncate">{holiday.name.split(' ')[0]}</p>}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(emp => (
                  <tr key={emp.id} className="border-t border-gray-50">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#0f1f3d] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {emp.firstName?.charAt(0)}{emp.surname?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-xs">{emp.firstName} {emp.surname}</p>
                          <p className="text-gray-400 text-xs">{emp.department || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    {weekDays.map(d => {
                      const status = getStatusForDay(emp, d);
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

      {/* Absenteeism table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-[#0f1f3d]">Absence Pattern Detection</h3>
            <p className="text-gray-400 text-xs mt-0.5">Company-wide absenteeism analysis</p>
          </div>
          {highRisk.length > 0 && (
            <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-lg">
              {highRisk.length} High Risk Employee{highRisk.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {loading ? (
          <p className="text-center text-gray-400 py-8 animate-pulse">Analysing...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Employee', 'Dept', 'Total Leaves', 'Days Absent', 'Mondays', 'Fridays', 'Patterns', 'Risk'].map(h => (
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
                    <td className="px-4 py-3 text-gray-500 text-xs">{emp.department || 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.totalLeaves}</td>
                    <td className="px-4 py-3 text-gray-600">{emp.totalDays}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${emp.mondayCount >= 3 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                        {emp.mondayCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${emp.fridayCount >= 3 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                        {emp.fridayCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {emp.patterns.length === 0 ? (
                        <span className="text-gray-400 text-xs">None</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {emp.patterns.map((p: string) => (
                            <span key={p} className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-xs font-medium">{p}</span>
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
    </AdminLayout>
  );
}