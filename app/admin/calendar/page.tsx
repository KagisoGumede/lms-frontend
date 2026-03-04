'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminAPI, settingsAPI } from '@/lib/api';

export default function AdminCalendarPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [deptFilter, setDeptFilter] = useState('all');

  useEffect(() => {
    Promise.all([
      adminAPI.getAllLeaves(),
      settingsAPI.getPublicHolidays()
    ]).then(([lRes, hRes]) => {
      if (lRes.success) setLeaves(lRes.data.filter((l: any) => l.status !== 'REJECTED'));
      if (hRes.success) setHolidays(hRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const departments = ['all', ...Array.from(new Set(leaves.map(l => l.department).filter(Boolean)))];
  const filteredLeaves = deptFilter === 'all' ? leaves : leaves.filter(l => l.department === deptFilter);

  const getLeavesForDay = (day: number) => {
    const date = new Date(year, month, day);
    return filteredLeaves.filter(l => {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      return date >= start && date <= end;
    });
  };

  const getHolidayForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidays.find(h => h.date === dateStr) || null;
  };

  const statusColor = (status: string) => status === 'APPROVED' ? 'bg-emerald-500' : 'bg-amber-500';
  const selectedDayLeaves = selectedDay ? getLeavesForDay(selectedDay) : [];
  const selectedDayHoliday = selectedDay ? getHolidayForDay(selectedDay) : null;

  return (
    <AdminLayout title="Leave Calendar">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#0f1f3d] mb-1">Company Leave Calendar</h2>
          <p className="text-gray-500 text-sm">Company-wide leave schedule overview</p>
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0f1f3d] w-fit">
          {departments.map(d => <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>)}
        </select>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-5 flex-wrap">
        {[
          { label: 'Approved',        color: 'bg-emerald-500' },
          { label: 'Pending',         color: 'bg-amber-500' },
          { label: 'Public Holiday',  color: 'bg-red-400' },
          { label: 'Today',           color: 'bg-[#0f1f3d]' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${l.color}`} />
            <span className="text-xs text-gray-500 font-medium">{l.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600 font-bold">&larr;</button>
            <h3 className="font-bold text-[#0f1f3d] text-lg">{monthName} {year}</h3>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600 font-bold">&rarr;</button>
          </div>
          <div className="grid grid-cols-7 mb-2">
            {days.map(d => <div key={d} className="text-center text-xs font-bold text-gray-400 uppercase py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayLeaves = getLeavesForDay(day);
              const holiday = getHolidayForDay(day);
              const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
              const isSelected = selectedDay === day;
              const isWeekend = new Date(year, month, day).getDay() === 0 || new Date(year, month, day).getDay() === 6;

              return (
                <div key={day} onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                  className={`relative min-h-[52px] p-1.5 rounded-lg cursor-pointer transition-all border ${
                    isSelected    ? 'border-[#0f1f3d] bg-[#0f1f3d]/5' :
                    holiday       ? 'border-red-200 bg-red-50' :
                    isToday       ? 'border-[#0f1f3d] bg-[#0f1f3d]/10' :
                    isWeekend     ? 'border-transparent bg-gray-50' :
                    'border-transparent hover:border-gray-200 hover:bg-gray-50'
                  }`}>
                  <span className={`text-xs font-semibold block text-center mb-1 w-6 h-6 flex items-center justify-center rounded-full mx-auto ${
                    isToday   ? 'bg-[#0f1f3d] text-white' :
                    holiday   ? 'text-red-500' :
                    isWeekend ? 'text-gray-300' : 'text-gray-700'
                  }`}>{day}</span>
                  <div className="space-y-0.5">
                    {holiday && (
                      <div className="h-1.5 rounded-full bg-red-400" title={holiday.name} />
                    )}
                    {dayLeaves.slice(0, holiday ? 1 : 2).map((l, idx) => (
                      <div key={idx} className={`h-1.5 rounded-full ${statusColor(l.status)}`} />
                    ))}
                    {dayLeaves.length > (holiday ? 1 : 2) && (
                      <p className="text-xs text-gray-400 text-center">+{dayLeaves.length - (holiday ? 1 : 2)}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-[#0f1f3d] text-sm mb-3">
              {selectedDay ? `${monthName} ${selectedDay}, ${year}` : 'Select a day'}
            </h3>
            {!selectedDay ? (
              <p className="text-gray-400 text-sm">Click a day to see who is on leave</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {/* Holiday banner */}
                {selectedDayHoliday && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-700 text-sm">{selectedDayHoliday.name}</p>
                      <p className="text-red-500 text-xs">Public Holiday</p>
                    </div>
                  </div>
                )}
                {selectedDayLeaves.length === 0 && !selectedDayHoliday && (
                  <p className="text-gray-400 text-sm">No leave on this day</p>
                )}
                {selectedDayLeaves.map((l, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-gray-800 text-sm">{l.employeeName}</p>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        l.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>{l.status}</span>
                    </div>
                    <p className="text-xs text-gray-500">{l.leaveType}</p>
                    <p className="text-xs text-gray-400">{l.department}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{l.startDate} — {l.endDate}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* This month summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-[#0f1f3d] text-sm mb-3">This Month</h3>
            {loading ? <p className="text-gray-400 text-sm animate-pulse">Loading...</p> : (() => {
              const monthLeaves = filteredLeaves.filter(l => {
                const start = new Date(l.startDate);
                const end = new Date(l.endDate);
                return start <= new Date(year, month + 1, 0) && end >= new Date(year, month, 1);
              });
              const monthHolidays = holidays.filter(h => {
                const d = new Date(h.date);
                return d.getFullYear() === year && d.getMonth() === month;
              });
              return (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Total on leave</span><span className="font-bold text-[#0f1f3d]">{monthLeaves.length}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Approved</span><span className="font-bold text-emerald-600">{monthLeaves.filter(l => l.status === 'APPROVED').length}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Pending</span><span className="font-bold text-amber-600">{monthLeaves.filter(l => l.status === 'PENDING').length}</span></div>
                  <div className="flex justify-between text-sm pt-1 border-t border-gray-100"><span className="text-gray-500">Public Holidays</span><span className="font-bold text-red-500">{monthHolidays.length}</span></div>
                </div>
              );
            })()}
          </div>

          {/* Upcoming holidays */}
          {holidays.filter(h => {
            const d = new Date(h.date);
            return d.getFullYear() === year && d.getMonth() === month;
          }).length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-[#0f1f3d] text-sm mb-3">Holidays This Month</h3>
              <div className="space-y-2">
                {holidays
                  .filter(h => { const d = new Date(h.date); return d.getFullYear() === year && d.getMonth() === month; })
                  .map(h => (
                    <div key={h.id} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-red-700">{h.name}</p>
                        <p className="text-xs text-red-400">
                          {new Date(h.date + 'T00:00:00').toLocaleDateString('en-ZA', {
                            weekday: 'short', day: '2-digit', month: 'short'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}