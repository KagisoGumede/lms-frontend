'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminAPI } from '@/lib/api';
import { exportAdminReportPDF, exportAdminReportExcel } from '@/lib/exportUtils';

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);
  const [activeTab, setActiveTab] = useState<'departments' | 'leavetypes' | 'monthly' | 'managers'>('departments');

  const COLORS = ['#0f1f3d','#1e40af','#2563eb','#3b82f6','#60a5fa','#10b981','#f59e0b','#ef4444'];

  useEffect(() => {
    adminAPI.getReports().then(res => {
      if (res.success) setReports(res.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <AdminLayout title="Reports">
      <p className="text-center text-gray-400 py-20 animate-pulse">Loading reports...</p>
    </AdminLayout>
  );

  const handleExportPDF = () => {
    if (!reports) return;
    setExporting('pdf');
    setTimeout(() => { exportAdminReportPDF(reports); setExporting(null); }, 100);
  };

  const handleExportExcel = () => {
    if (!reports) return;
    setExporting('excel');
    setTimeout(() => { exportAdminReportExcel(reports); setExporting(null); }, 100);
  };

  const getMax = (obj: Record<string, number>) => Math.max(...Object.values(obj), 1);

  const tabs = [
    { key: 'departments', label: 'Departments' },
    { key: 'leavetypes', label: 'Leave Types' },
    { key: 'monthly', label: 'Monthly Trends' },
    { key: 'managers', label: 'Manager Summary' },
  ];

  return (
    <AdminLayout title="Reports">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#0f1f3d] mb-1">Company-wide Analytics</h2>
          <p className="text-gray-500 text-sm">Full system reports across all managers and employees</p>
        </div>
        {reports && (
          <div className="flex gap-2">
            <button onClick={handleExportExcel} disabled={!!exporting}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-60">
              {exporting === 'excel' ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              )}
              Excel
            </button>
            <button onClick={handleExportPDF} disabled={!!exporting}
              className="flex items-center gap-2 px-4 py-2 bg-[#0f1f3d] hover:bg-[#1a3260] text-white text-sm font-semibold rounded-lg transition disabled:opacity-60">
              {exporting === 'pdf' ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              )}
              PDF
            </button>
          </div>
        )}
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

      {/* Departments */}
      {activeTab === 'departments' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-[#0f1f3d] text-sm uppercase tracking-wide mb-5">Leaves by Department</h3>
          {!reports?.leavesByDepartment || Object.keys(reports.leavesByDepartment).length === 0 ? (
            <p className="text-gray-400 text-center py-8">No data yet</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(reports.leavesByDepartment as Record<string, number>).sort(([, a], [, b]) => b - a).map(([dept, count], i) => {
                const pct = Math.round((count / getMax(reports.leavesByDepartment)) * 100);
                const totalPct = reports.totalLeaves > 0 ? Math.round((count / reports.totalLeaves) * 100) : 0;
                return (
                  <div key={dept} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-800 text-sm">{dept}</span>
                      <span className="text-sm text-gray-500">{count} leaves ({totalPct}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="h-2.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Leave Types */}
      {activeTab === 'leavetypes' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-[#0f1f3d] text-sm uppercase tracking-wide mb-5">Leaves by Type</h3>
          {!reports?.leavesByType || Object.keys(reports.leavesByType).length === 0 ? (
            <p className="text-gray-400 text-center py-8">No data yet</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(reports.leavesByType as Record<string, number>).sort(([, a], [, b]) => b - a).map(([type, count], i) => {
                const total = Object.values(reports.leavesByType as Record<string, number>).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={type} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-semibold text-gray-800 text-sm">{type}</p>
                      <p className="font-black text-[#0f1f3d]">{count}</p>
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

      {/* Monthly */}
      {activeTab === 'monthly' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-[#0f1f3d] text-sm uppercase tracking-wide mb-1">Monthly Trends</h3>
          <p className="text-gray-400 text-xs mb-6">Last 6 months</p>
          {!reports?.leavesByMonth ? (
            <p className="text-gray-400 text-center py-8">No data yet</p>
          ) : (
            <div className="flex items-end gap-3 h-44">
              {Object.entries(reports.leavesByMonth as Record<string, number>).map(([month, count], i) => {
                const max = getMax(reports.leavesByMonth);
                const h = max > 0 ? ((count as number) / max) * 100 : 0;
                return (
                  <div key={month} className="flex-1 flex flex-col items-center gap-1">
                    <p className="text-xs font-bold text-gray-700">{count}</p>
                    <div className="w-full flex items-end" style={{ height: '120px' }}>
                      <div className="w-full rounded-t-lg" style={{ height: `${Math.max(h, (count as number) > 0 ? 5 : 0)}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                    <p className="text-xs text-gray-400 text-center leading-tight">{month}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Manager Summary */}
      {activeTab === 'managers' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-bold text-[#0f1f3d] text-sm uppercase tracking-wide">Manager Summary</h3>
          </div>
          {!reports?.managerSummaries?.length ? (
            <p className="text-gray-400 text-center py-12">No managers found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Manager', 'Department', 'Employees', 'Total', 'Pending', 'Approved', 'Rejected'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reports.managerSummaries.map((m: any, i: number) => (
                    <tr key={i} className="border-t border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-semibold text-gray-800">{m.managerName}</td>
                      <td className="px-4 py-3 text-gray-500">{m.department}</td>
                      <td className="px-4 py-3 text-gray-600">{m.totalEmployees}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-bold">{m.totalLeaves}</span></td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-bold">{m.pendingLeaves}</span></td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs font-bold">{m.approvedLeaves}</span></td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs font-bold">{m.rejectedLeaves}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}