'use client';
import { useState, useEffect } from 'react';
import ManagerLayout from '@/components/ManagerLayout';
import { settingsAPI } from '@/lib/api';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'departments' | 'positions' | 'leavetypes'>('departments');
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [newDeptName, setNewDeptName] = useState('');
  const [newPosName, setNewPosName] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [newLtName, setNewLtName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const notify = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(''); }
    else { setSuccess(msg); setError(''); setTimeout(() => setSuccess(''), 3000); }
  };

  useEffect(() => {
    Promise.all([settingsAPI.getDepartments(), settingsAPI.getPositions(), settingsAPI.getLeaveTypes()])
      .then(([d, p, lt]) => {
        if (d.success) setDepartments(d.data);
        if (p.success) setPositions(p.data);
        if (lt.success) setLeaveTypes(lt.data);
      }).finally(() => setLoading(false));
  }, []);

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
    } catch { notify('Cannot connect to server.', true); }
  };

  const handleAddPos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeptId) { notify('Select a department first', true); return; }
    setSubmitting(true);
    try {
      const res = await settingsAPI.addPosition(newPosName, Number(selectedDeptId));
      if (res.success) { setPositions(p => [...p, res.data]); setNewPosName(''); notify('Position added.'); }
      else notify(res.message || 'Failed', true);
    } catch { notify('Cannot connect to server.', true); }
    finally { setSubmitting(false); }
  };

  const handleDeletePos = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const res = await settingsAPI.deletePosition(id);
      if (res.success) setPositions(p => p.filter(p => p.id !== id));
    } catch { notify('Cannot connect to server.', true); }
  };

  const handleAddLt = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const res = await settingsAPI.addLeaveType(newLtName);
      if (res.success) { setLeaveTypes(p => [...p, res.data]); setNewLtName(''); notify('Leave type added.'); }
      else notify(res.message || 'Failed', true);
    } catch { notify('Cannot connect to server.', true); }
    finally { setSubmitting(false); }
  };

  const handleDeleteLt = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const res = await settingsAPI.deleteLeaveType(id);
      if (res.success) setLeaveTypes(p => p.filter(lt => lt.id !== id));
    } catch { notify('Cannot connect to server.', true); }
  };

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0f1f3d] focus:border-[#0f1f3d]";
  const tabs = [{ key: 'departments', label: 'Departments' }, { key: 'positions', label: 'Positions' }, { key: 'leavetypes', label: 'Leave Types' }];

  const Alert = ({ msg, type }: { msg: string; type: 'success' | 'error' }) =>
    msg ? <div className={`mb-4 p-3 rounded-lg text-sm font-medium border ${type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>{msg}</div> : null;

  const ListItem = ({ name, onDelete }: { name: string; onDelete: () => void }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
      <p className="font-medium text-gray-800 text-sm">{name}</p>
      <button onClick={onDelete} className="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-semibold transition">Delete</button>
    </div>
  );

  return (
    <ManagerLayout title="Settings">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#0f1f3d] mb-1">System Settings</h2>
          <p className="text-gray-500 text-sm">Manage departments, positions and leave types</p>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key as any); setSuccess(''); setError(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === tab.key ? 'bg-[#0f1f3d] text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <Alert msg={success} type="success" />
        <Alert msg={error} type="error" />

        {activeTab === 'departments' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-[#0f1f3d] text-sm mb-4">Add Department</h3>
              <form onSubmit={handleAddDept} className="space-y-3">
                <input type="text" value={newDeptName} onChange={e => setNewDeptName(e.target.value)} className={inputClass} placeholder="e.g. Finance, Marketing" required />
                <button type="submit" disabled={submitting} className="w-full py-2.5 bg-[#0f1f3d] hover:bg-[#1a3260] text-white text-sm font-bold rounded-lg transition disabled:opacity-50">
                  {submitting ? 'Adding...' : 'Add Department'}
                </button>
              </form>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-[#0f1f3d] text-sm mb-4">All Departments <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{departments.length}</span></h3>
              {loading ? <p className="text-gray-400 text-sm text-center py-6">Loading...</p> :
                departments.length === 0 ? <p className="text-gray-400 text-sm text-center py-6">No departments yet</p> :
                <div className="space-y-2 max-h-72 overflow-y-auto">{departments.map(d => <ListItem key={d.id} name={d.name} onDelete={() => handleDeleteDept(d.id, d.name)} />)}</div>}
            </div>
          </div>
        )}

        {activeTab === 'positions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-[#0f1f3d] text-sm mb-4">Add Position</h3>
              <form onSubmit={handleAddPos} className="space-y-3">
                <select value={selectedDeptId} onChange={e => setSelectedDeptId(e.target.value)} className={inputClass} required>
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <input type="text" value={newPosName} onChange={e => setNewPosName(e.target.value)} className={inputClass} placeholder="e.g. Software Developer" required />
                <button type="submit" disabled={submitting} className="w-full py-2.5 bg-[#0f1f3d] hover:bg-[#1a3260] text-white text-sm font-bold rounded-lg transition disabled:opacity-50">
                  {submitting ? 'Adding...' : 'Add Position'}
                </button>
              </form>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-[#0f1f3d] text-sm mb-4">All Positions <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{positions.length}</span></h3>
              {loading ? <p className="text-gray-400 text-sm text-center py-6">Loading...</p> :
                positions.length === 0 ? <p className="text-gray-400 text-sm text-center py-6">No positions yet</p> :
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {positions.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{p.name}</p>
                        <p className="text-gray-400 text-xs">{p.departmentName}</p>
                      </div>
                      <button onClick={() => handleDeletePos(p.id, p.name)} className="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-semibold transition">Delete</button>
                    </div>
                  ))}
                </div>}
            </div>
          </div>
        )}

        {activeTab === 'leavetypes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-[#0f1f3d] text-sm mb-4">Add Leave Type</h3>
              <form onSubmit={handleAddLt} className="space-y-3">
                <input type="text" value={newLtName} onChange={e => setNewLtName(e.target.value)} className={inputClass} placeholder="e.g. Annual Leave" required />
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
                <button type="submit" disabled={submitting} className="w-full py-2.5 bg-[#0f1f3d] hover:bg-[#1a3260] text-white text-sm font-bold rounded-lg transition disabled:opacity-50">
                  {submitting ? 'Adding...' : 'Add Leave Type'}
                </button>
              </form>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-[#0f1f3d] text-sm mb-4">All Leave Types <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{leaveTypes.length}</span></h3>
              {loading ? <p className="text-gray-400 text-sm text-center py-6">Loading...</p> :
                leaveTypes.length === 0 ? <p className="text-gray-400 text-sm text-center py-6">No leave types yet</p> :
                <div className="space-y-2 max-h-72 overflow-y-auto">{leaveTypes.map(lt => <ListItem key={lt.id} name={lt.name} onDelete={() => handleDeleteLt(lt.id, lt.name)} />)}</div>}
            </div>
          </div>
        )}
      </div>
    </ManagerLayout>
  );
}