'use client';
import { useState, useEffect, useRef } from 'react';
import ManagerLayout from '@/components/ManagerLayout';
import { useAuth } from '@/lib/AuthContext';
import { leaveAPI } from '@/lib/api';
import { exportManagerReportPDF, exportManagerReportExcel } from '@/lib/exportUtils';

export default function ReportsPage() {
  const { user } = useAuth();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'departments' | 'types' | 'trends' | 'employees'>('overview');

  const COLORS = ['#0f1f3d','#1e40af','#1d4ed8','#2563eb','#3b82f6','#60a5fa','#93c5fd','#bfdbfe'];

  useEffect(() => {
    if (!user) return;
    leaveAPI.getReports(user.id).then(res => {
      if (res.success) setReport(res.data);
    }).finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const handleExportPDF = async () => {
    if (!report) return;
    setExporting('pdf');
    setTimeout(() => {
      exportManagerReportPDF(report, `${user.name} ${user.surname}`);
      setExporting(null);
    }, 100);
  };

  const handleExportExcel = async () => {
    if (!report) return;
    setExporting('excel');
    setTimeout(() => {
      exportManagerReportExcel(report, `${user.name} ${user.surname}`);
      setExporting(null);
    }, 100);
  };

  const getMax = (obj: Record<string, number>) => Math.max(...Object.values(obj), 1);

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'departments', label: 'Departments' },
    { key: 'types', label: 'Leave Types' },
    { key: 'trends', label: 'Monthly Trends' },
    { key: 'employees', label: 'Employees' },
  ];

  const statCards = [
    { label: 'Total Employees', value: report?.totalEmployees, accent: 'border-[#0f1f3d]' },
    { label: 'Total Leaves', value: report?.totalLeaves, accent: 'border-blue-400' },
    { label: 'Pending', value: report?.pendingLeaves, accent: 'border-amber-500' },
    { label: 'Approved', value: report?.approvedLeaves, accent: 'border-emerald-500' },
    { label: 'Rejected', value: report?.rejectedLeaves, accent: 'border-red-400' },
  ];

  return (
    <ManagerLayout title="Reports">
      {/* Header row with export buttons */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#0f1f3d] mb-1">Leave Reports</h2>
          <p className="text-gray-500 text-sm">Overview of your team's leave activity</p>
        </div>
        {report && (
          <div className="flex gap-2">
            <button
              onClick={handleExportExcel}
              disabled={!!exporting}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-60"
            >
              {exporting === 'excel' ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              Excel
            </button>
            <button
              onClick={handleExportPDF}
              disabled={!!exporting}
              className="flex items-center gap-2 px-4 py-2 bg-[#0f1f3d] hover:bg-[#1a3260] text-white text-sm font-semibold rounded-lg transition disabled:opacity-60"
            >
              {exporting === 'pdf' ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              )}
              PDF
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400 animate-pulse">Loading reports...</div>
      ) : !report ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400">Failed to load reports.</div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            {statCards.map(s => (
              <div key={s.label} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${s.accent} border border-gray-100`}>
                <p className="text-gray-500 text-xs mb-1">{s.label}</p>
                <p className="text-2xl font-black text-[#0f1f3d]">{s.value ?? 0}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  activeTab === tab.key ? 'bg-[#0f1f3d] text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-[#0f1f3d] mb-5 text-sm uppercase tracking-wide">Leave Status</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Approved', value: report.approvedLeaves, color: '#10b981' },
                    { label: 'Pending', value: report.pendingLeaves, color: '#f59e0b' },
                    { label: 'Rejected', value: report.rejectedLeaves, color: '#ef4444' },
                  ].map(item => {
                    const pct = report.totalLeaves > 0 ? Math.round((item.value / report.totalLeaves) * 100) : 0;
                    return (
                      <div key={item.label}>
                        <div className="flex justify-between mb-1 text-sm">
                          <span className="font-medium text-gray-700">{item.label}</span>
                          <span className="text-gray-500">{item.value} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                        </div>
                      </div>
                    );
                  })}
                  {report.totalLeaves === 0 && <p className="text-gray-400 text-sm text-center py-4">No leave data yet</p>}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-[#0f1f3d] mb-5 text-sm uppercase tracking-wide">By Department</h3>
                {Object.keys(report.leavesByDepartment).length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">No data yet</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(report.leavesByDepartment as Record<string, number>)
                      .sort(([, a], [, b]) => b - a)
                      .map(([dept, count], i) => (
                        <div key={dept}>
                          <div className="flex justify-between mb-1 text-sm">
                            <span className="font-medium text-gray-700">{dept}</span>
                            <span className="text-gray-500">{count}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="h-2 rounded-full" style={{ width: `${Math.round((count / getMax(report.leavesByDepartment)) * 100)}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Departments */}
          {activeTab === 'departments' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-[#0f1f3d] mb-5 text-sm uppercase tracking-wide">Leaves by Department</h3>
              {Object.keys(report.leavesByDepartment).length === 0 ? (
                <p className="text-gray-400 text-center py-8">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(report.leavesByDepartment as Record<string, number>)
                    .sort(([, a], [, b]) => b - a)
                    .map(([dept, count], i) => {
                      const pct = Math.round((count / getMax(report.leavesByDepartment)) * 100);
                      const totalPct = report.totalLeaves > 0 ? Math.round((count / report.totalLeaves) * 100) : 0;
                      return (
                        <div key={dept} className="p-4 bg-gray-50 rounded-xl">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-gray-800 text-sm">{dept}</span>
                            <span className="text-sm text-gray-600">{count} leaves ({totalPct}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="h-2.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* Leave Types */}
          {activeTab === 'types' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-[#0f1f3d] mb-5 text-sm uppercase tracking-wide">Leaves by Type</h3>
              {Object.keys(report.leavesByType).length === 0 ? (
                <p className="text-gray-400 text-center py-8">No data yet</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(report.leavesByType as Record<string, number>)
                    .sort(([, a], [, b]) => b - a)
                    .map(([type, count], i) => {
                      const pct = report.totalLeaves > 0 ? Math.round((count / report.totalLeaves) * 100) : 0;
                      return (
                        <div key={type} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex justify-between items-center mb-2">
                            <p className="font-semibold text-gray-800 text-sm">{type}</p>
                            <p className="font-bold text-[#0f1f3d]">{count}</p>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{pct}% of total</p>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* Monthly Trends */}
          {activeTab === 'trends' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-[#0f1f3d] mb-1 text-sm uppercase tracking-wide">Monthly Trends</h3>
              <p className="text-gray-400 text-xs mb-6">Last 6 months</p>
              <div className="flex items-end gap-3 h-44">
                {Object.entries(report.leavesByMonth as Record<string, number>).map(([month, count], i) => {
                  const maxVal = getMax(report.leavesByMonth);
                  const h = maxVal > 0 ? (count / maxVal) * 100 : 0;
                  return (
                    <div key={month} className="flex-1 flex flex-col items-center gap-1">
                      <p className="text-xs font-bold text-gray-700">{count}</p>
                      <div className="w-full flex items-end" style={{ height: '120px' }}>
                        <div className="w-full rounded-t-lg transition-all duration-700" style={{ height: `${Math.max(h, count > 0 ? 5 : 0)}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                      </div>
                      <p className="text-xs text-gray-400 text-center leading-tight">{month}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Employees */}
          {activeTab === 'employees' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="font-bold text-[#0f1f3d] text-sm uppercase tracking-wide">Employee Summary</h3>
              </div>
              {!report.employeeSummaries?.length ? (
                <p className="text-gray-400 text-center py-12">No employees found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['Employee', 'Department', 'Total', 'Pending', 'Approved', 'Rejected'].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {report.employeeSummaries.map((emp: any, i: number) => (
                        <tr key={i} className="border-t border-gray-50 hover:bg-gray-50 transition">
                          <td className="px-5 py-3 font-semibold text-gray-800">{emp.employeeName}</td>
                          <td className="px-5 py-3 text-gray-500">{emp.department}</td>
                          <td className="px-5 py-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-bold">{emp.totalLeaves}</span></td>
                          <td className="px-5 py-3"><span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-bold">{emp.pendingLeaves}</span></td>
                          <td className="px-5 py-3"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs font-bold">{emp.approvedLeaves}</span></td>
                          <td className="px-5 py-3"><span className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs font-bold">{emp.rejectedLeaves}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </ManagerLayout>
  );
}