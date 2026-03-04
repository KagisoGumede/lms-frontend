'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { settingsAPI, adminAPI } from '@/lib/api';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'departments' | 'positions' | 'leavetypes' | 'balances' | 'holidays'>('departments');
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [balanceInputs, setBalanceInputs] = useState<Record<string, string>>({});
  const [newDeptName, setNewDeptName] = useState('');
  const [newPosName, setNewPosName] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [newLtName, setNewLtName] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingBalance, setSavingBalance] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const notify = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(''); }
    else { setSuccess(msg); setError(''); setTimeout(() => setSuccess(''), 3000); }
  };

  useEffect(() => {
    Promise.all([
      settingsAPI.getDepartments(),
      settingsAPI.getPositions(),
      settingsAPI.getLeaveTypes(),
      adminAPI.getLeaveBalances(),
      settingsAPI.getPublicHolidays()
    ]).then(([d, p, lt, b, h]) => {
      if (d.success) setDepartments(d.data);
      if (p.success) setPositions(p.data);
      if (lt.success) setLeaveTypes(lt.data);
      if (b.success) {
        setBalances(b.data);
        const inputs: Record<string, string> = {};
        b.data.forEach((bal: any) => { inputs[bal.leaveType] = String(bal.allocatedDays); });
        setBalanceInputs(inputs);
      }
      if (h.success) setHolidays(h.data);
    }).finally(() => setLoading(false));
  }, []);

  const handleSaveBalance = async (leaveType: string) => {
    const days = parseInt(balanceInputs[leaveType] || '0');
    if (isNaN(days) || days < 0) { notify('Enter a valid number of days', true); return; }
    setSavingBalance(leaveType);
    try {
      const res = await adminAPI.setLeaveBalance(leaveType, days);
      if (res.success) {
        setBalances(prev => {
          const exists = prev.find(b => b.leaveType === leaveType);
          if (exists) return prev.map(b => b.leaveType === leaveType ? res.data : b);
          return [...prev, res.data];
        });
        notify(`Balance for "${leaveType}" saved.`);
      } else notify(res.message || 'Failed to save', true);
    } catch { notify('Cannot connect.', true); }
    finally { setSavingBalance(null); }
  };

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const res = await settingsAPI.addDepartment(newDeptName);
      if (res.success) { setDepartments(p => [...p, res.data]); setNewDeptName(''); notify('Department added.'); }
      else notify(res.message || 'Failed', true);
    } catch { notify('Cannot connect to server.', true); }
    finally { setSubmitting(false); }
  };

  const handleDeleteDept = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const res = await settingsAPI.deleteDepartment(id);
      if (res.success) { setDepartments(p => p.filter(d => d.id !== id)); setPositions(p => p.filter(p => p.departmentId !== id)); }
    } catch { notify('Cannot connect.', true); }
  };

  const handleAddPos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeptId) { notify('Select a department first', true); return; }
    setSubmitting(true);
    try {
      const res = await settingsAPI.addPosition(newPosName, Number(selectedDeptId));
      if (res.success) { setPositions(p => [...p, res.data]); setNewPosName(''); notify('Position added.'); }
      else notify(res.message || 'Failed', true);
    } catch { notify('Cannot connect.', true); }
    finally { setSubmitting(false); }
  };

  const handleDeletePos = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const res = await settingsAPI.deletePosition(id);
      if (res.success) setPositions(p => p.filter(p => p.id !== id));
    } catch { notify('Cannot connect.', true); }
  };

  const handleAddLt = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const res = await settingsAPI.addLeaveType(newLtName);
      if (res.success) { setLeaveTypes(p => [...p, res.data]); setNewLtName(''); notify('Leave type added.'); }
      else notify(res.message || 'Failed', true);
    } catch { notify('Cannot connect.', true); }
    finally { setSubmitting(false); }
  };

  const handleDeleteLt = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const res = await settingsAPI.deleteLeaveType(id);
      if (res.success) setLeaveTypes(p => p.filter(lt => lt.id !== id));
    } catch { notify('Cannot connect.', true); }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const res = await settingsAPI.addPublicHoliday(newHolidayName, newHolidayDate);
      if (res.success) {
        setHolidays(prev => [...prev, res.data].sort((a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
        ));
        setNewHolidayName(''); setNewHolidayDate('');
        notify('Public holiday added.');
      } else notify(res.message || 'Failed', true);
    } catch { notify('Cannot connect.', true); }
    finally { setSubmitting(false); }
  };

  const handleDeleteHoliday = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const res = await settingsAPI.deletePublicHoliday(id);
      if (res.success) setHolidays(p => p.filter(h => h.id !== id));
    } catch { notify('Cannot connect.', true); }
  };

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0f1f3d] focus:border-[#0f1f3d]";

  const tabs = [
    { key: 'departments', label: 'Departments' },
    { key: 'positions',   label: 'Positions' },
    { key: 'leavetypes',  label: 'Leave Types' },
    { key: 'balances',    label: 'Leave Balances' },
    { key: 'holidays',    label: 'Public Holidays' },
  ];

  const ListItem = ({ name, sub, onDelete }: { name: string; sub?: string; onDelete: () => void }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
      <div>
        <p className="font-medium text-gray-800 text-sm">{name}</p>
        {sub && <p className="text-gray-400 text-xs">{sub}</p>}
      </div>
      <button onClick={onDelete}
        className="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-semibold transition">
        Delete
      </button>
    </div>
  );

  // South African public holidays suggestions
  const saHolidays = [
    { name: "New Year's Day",          date: `${new Date().getFullYear()}-01-01` },
    { name: "Human Rights Day",        date: `${new Date().getFullYear()}-03-21` },
    { name: "Good Friday",             date: `${new Date().getFullYear()}-04-18` },
    { name: "Family Day",              date: `${new Date().getFullYear()}-04-21` },
    { name: "Freedom Day",             date: `${new Date().getFullYear()}-04-27` },
    { name: "Workers' Day",            date: `${new Date().getFullYear()}-05-01` },
    { name: "Youth Day",               date: `${new Date().getFullYear()}-06-16` },
    { name: "National Women's Day",    date: `${new Date().getFullYear()}-08-09` },
    { name: "Heritage Day",            date: `${new Date().getFullYear()}-09-24` },
    { name: "Day of Reconciliation",   date: `${new Date().getFullYear()}-12-16` },
    { name: "Christmas Day",           date: `${new Date().getFullYear()}-12-25` },
    { name: "Day of Goodwill",         date: `${new Date().getFullYear()}-12-26` },
  ];

  return (
    <AdminLayout title="Settings">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#0f1f3d] mb-1">System Settings</h2>
          <p className="text-gray-500 text-sm">Manage departments, positions, leave types, balances and public holidays</p>
        </div>

        <div className="flex gap-2 mb-5 flex-wrap">
          {tabs.map(tab => (
            <button key={tab.key}
              onClick={() => { setActiveTab(tab.key as any); setSuccess(''); setError(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === tab.key
                  ? 'bg-[#0f1f3d] text-white shadow'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}>
              {tab.label}
              {tab.key === 'holidays' && holidays.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                  {holidays.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {success && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">{success}</div>}
        {error   && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

        {/* Departments */}
        {activeTab === 'departments' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-[#0f1f3d] text-sm mb-4">Add Department</h3>
              <form onSubmit={handleAddDept} className="space-y-3">
                <input type="text" value={newDeptName} onChange={e => setNewDeptName(e.target.value)}
                  className={inputClass} placeholder="e.g. Finance, Marketing" required />
                <button type="submit" disabled={submitting}
                  className="w-full py-2.5 bg-[#0f1f3d] hover:bg-[#1a3260] text-white text-sm font-bold rounded-lg transition disabled:opacity-50">
                  {submitting ? 'Adding...' : 'Add Department'}
                </button>
              </form>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-[#0f1f3d] text-sm mb-4">
                All Departments <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{departments.length}</span>
              </h3>
              {loading ? <p className="text-gray-400 text-sm text-center py-6">Loading...</p> :
                departments.length === 0 ? <p className="text-gray-400 text-sm text-center py-6">No departments yet</p> :
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {departments.map(d => <ListItem key={d.id} name={d.name} onDelete={() => handleDeleteDept(d.id, d.name)} />)}
                </div>}
            </div>
          </div>
        )}

        {/* Positions */}
        {activeTab === 'positions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-[#0f1f3d] text-sm mb-4">Add Position</h3>
              <form onSubmit={handleAddPos} className="space-y-3">
                <select value={selectedDeptId} onChange={e => setSelectedDeptId(e.target.value)} className={inputClass} required>
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <input type="text" value={newPosName} onChange={e => setNewPosName(e.target.value)}
                  className={inputClass} placeholder="e.g. Software Developer" required />
                <button type="submit" disabled={submitting}
                  className="w-full py-2.5 bg-[#0f1f3d] hover:bg-[#1a3260] text-white text-sm font-bold rounded-lg transition disabled:opacity-50">
                  {submitting ? 'Adding...' : 'Add Position'}
                </button>
              </form>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-[#0f1f3d] text-sm mb-4">
                All Positions <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{positions.length}</span>
              </h3>
              {loading ? <p className="text-gray-400 text-sm text-center py-6">Loading...</p> :
                positions.length === 0 ? <p className="text-gray-400 text-sm text-center py-6">No positions yet</p> :
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {positions.map(p => <ListItem key={p.id} name={p.name} sub={p.departmentName} onDelete={() => handleDeletePos(p.id, p.name)} />)}
                </div>}
            </div>
          </div>
        )}

        {/* Leave Types */}
        {activeTab === 'leavetypes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-[#0f1f3d] text-sm mb-4">Add Leave Type</h3>
              <form onSubmit={handleAddLt} className="space-y-3">
                <input type="text" value={newLtName} onChange={e => setNewLtName(e.target.value)}
                  className={inputClass} placeholder="e.g. Annual Leave" required />
                <div className="flex flex-wrap gap-1.5">
                  {['Annual Leave','Sick Leave','Family Responsibility','Maternity Leave','Paternity Leave','Study Leave','Unpaid Leave','Compassionate Leave']
                    .filter(s => !leaveTypes.find(lt => lt.name === s))
                    .map(s => (
                      <button key={s} type="button" onClick={() => setNewLtName(s)}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-[#0f1f3d] hover:text-white text-gray-600 rounded text-xs font-medium transition">
                        {s}
                      </button>
                    ))}
                </div>
                <button type="submit" disabled={submitting}
                  className="w-full py-2.5 bg-[#0f1f3d] hover:bg-[#1a3260] text-white text-sm font-bold rounded-lg transition disabled:opacity-50">
                  {submitting ? 'Adding...' : 'Add Leave Type'}
                </button>
              </form>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-[#0f1f3d] text-sm mb-4">
                All Leave Types <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{leaveTypes.length}</span>
              </h3>
              {loading ? <p className="text-gray-400 text-sm text-center py-6">Loading...</p> :
                leaveTypes.length === 0 ? <p className="text-gray-400 text-sm text-center py-6">No leave types yet</p> :
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {leaveTypes.map(lt => <ListItem key={lt.id} name={lt.name} onDelete={() => handleDeleteLt(lt.id, lt.name)} />)}
                </div>}
            </div>
          </div>
        )}

        {/* Leave Balances */}
        {activeTab === 'balances' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="mb-5">
              <h3 className="font-bold text-[#0f1f3d] text-sm">Leave Day Allocations</h3>
              <p className="text-gray-400 text-xs mt-1">Set how many days per year each employee gets for each leave type.</p>
            </div>
            {loading ? (
              <p className="text-gray-400 text-sm text-center py-8 animate-pulse">Loading...</p>
            ) : leaveTypes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">No leave types configured yet.</p>
                <p className="text-gray-300 text-xs mt-1">Add leave types first in the Leave Types tab.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaveTypes.map(lt => {
                  const saved = balances.find(b => b.leaveType === lt.name);
                  const inputVal = balanceInputs[lt.name] ?? '';
                  const isDirty = inputVal !== String(saved?.allocatedDays ?? '');
                  return (
                    <div key={lt.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-sm">{lt.name}</p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          {saved ? `Currently: ${saved.allocatedDays} days/year` : 'Not configured yet'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="number" min="0" max="365" value={inputVal}
                          onChange={e => setBalanceInputs(prev => ({ ...prev, [lt.name]: e.target.value }))}
                          placeholder="Days"
                          className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center outline-none focus:ring-2 focus:ring-[#0f1f3d]" />
                        <span className="text-gray-400 text-xs">days</span>
                        <button onClick={() => handleSaveBalance(lt.name)}
                          disabled={savingBalance === lt.name || !inputVal || !isDirty}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition disabled:opacity-40 ${
                            isDirty && inputVal ? 'bg-[#0f1f3d] hover:bg-[#1a3260] text-white' : 'bg-gray-200 text-gray-500'
                          }`}>
                          {savingBalance === lt.name ? 'Saving...' : saved ? 'Update' : 'Set'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Public Holidays */}
        {activeTab === 'holidays' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-[#0f1f3d] text-sm mb-1">Add Public Holiday</h3>
              <p className="text-gray-400 text-xs mb-4">These dates are excluded from leave duration calculations.</p>
              <form onSubmit={handleAddHoliday} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Holiday Name</label>
                  <input type="text" value={newHolidayName}
                    onChange={e => setNewHolidayName(e.target.value)}
                    className={inputClass} placeholder="e.g. Christmas Day" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                  <input type="date" value={newHolidayDate}
                    onChange={e => setNewHolidayDate(e.target.value)}
                    className={inputClass} required />
                </div>
                <button type="submit" disabled={submitting}
                  className="w-full py-2.5 bg-[#0f1f3d] hover:bg-[#1a3260] text-white text-sm font-bold rounded-lg transition disabled:opacity-50">
                  {submitting ? 'Adding...' : 'Add Holiday'}
                </button>
              </form>

              {/* SA Holiday suggestions */}
              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                  SA Public Holidays {new Date().getFullYear()}
                </p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {saHolidays
                    .filter(h => !holidays.find(existing =>
                      existing.date === h.date || existing.name === h.name))
                    .map(h => (
                      <button key={h.date} type="button"
                        onClick={() => { setNewHolidayName(h.name); setNewHolidayDate(h.date); }}
                        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-[#0f1f3d] hover:text-white rounded-lg text-xs transition group">
                        <span className="font-medium">{h.name}</span>
                        <span className="text-gray-400 group-hover:text-blue-200">
                          {new Date(h.date + 'T00:00:00').toLocaleDateString('en-ZA', {
                            day: '2-digit', month: 'short'
                          })}
                        </span>
                      </button>
                    ))}
                  {saHolidays.every(h => holidays.find(existing => existing.name === h.name)) && (
                    <p className="text-gray-400 text-xs text-center py-2">All SA holidays added!</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-[#0f1f3d] text-sm mb-4">
                Public Holidays
                <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{holidays.length}</span>
              </h3>
              {loading ? (
                <p className="text-gray-400 text-sm text-center py-6">Loading...</p>
              ) : holidays.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-400 text-sm">No public holidays added yet.</p>
                  <p className="text-gray-300 text-xs mt-1">Use the suggestions on the left to quickly add SA holidays.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[480px] overflow-y-auto">
                  {holidays.map(h => (
                    <div key={h.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{h.name}</p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          {new Date(h.date + 'T00:00:00').toLocaleDateString('en-ZA', {
                            weekday: 'short', day: '2-digit', month: 'long', year: 'numeric'
                          })}
                        </p>
                      </div>
                      <button onClick={() => handleDeleteHoliday(h.id, h.name)}
                        className="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-semibold transition">
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}