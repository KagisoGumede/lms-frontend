'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminAPI, settingsAPI, userAPI } from '@/lib/api';

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'managers' | 'employees' | 'create'>('all');
  const [users, setUsers] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  // Edit modal state
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ department: '', role: '', managerId: '' });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '', surname: '', emailAddress: '', password: '', department: ''
  });

  useEffect(() => {
    Promise.all([
      adminAPI.getAllUsers(),
      adminAPI.getAllManagers(),
      adminAPI.getAllEmployees(),
      settingsAPI.getDepartments()
    ]).then(([u, m, e, d]) => {
      if (u.success) setUsers(u.data);
      if (m.success) setManagers(m.data);
      if (e.success) setEmployees(e.data);
      if (d.success) setDepartments(d.data);
    }).finally(() => setLoading(false));
  }, []);

  const openEdit = (u: any) => {
    setEditingUser(u);
    setEditForm({
      department: u.department || '',
      role: u.role || '',
      managerId: u.managerId ? String(u.managerId) : '',
    });
    setError('');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditSubmitting(true); setError('');
    try {
      const payload: any = {
        department: editForm.department,
        role: editForm.role,
        managerId: editForm.managerId ? Number(editForm.managerId) : null,
      };
      const res = await userAPI.adminUpdateUser(editingUser.id, payload);
      if (res.success) {
        const updated = res.data;
        const updateList = (list: any[]) =>
          list.map(u => u.id === updated.id ? { ...u, ...updated } : u);
        setUsers(updateList);
        setManagers(prev => updated.role === 'MANAGER'
          ? updateList(prev).filter(u => u.role === 'MANAGER')
          : prev.filter(u => u.id !== updated.id));
        setEmployees(prev => updated.role === 'EMPLOYEE'
          ? updateList(prev).filter(u => u.role === 'EMPLOYEE')
          : prev.filter(u => u.id !== updated.id));
        setSuccess(`${updated.firstName} ${updated.surname} updated successfully.`);
        setEditingUser(null);
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(res.message || 'Failed to update user');
      }
    } catch { setError('Cannot connect to server.'); }
    finally { setEditSubmitting(false); }
  };

  const handleDeleteUser = async (id: number, name: string, role: string) => {
    const warningMsg = role === 'MANAGER'
      ? `Delete manager "${name}"?\n\nThis will:\n• Remove the manager account\n• Unassign all their employees\n• Delete all related leave requests\n\nThis cannot be undone.`
      : `Delete employee "${name}"?\n\nThis will:\n• Remove the employee account\n• Delete all their leave requests\n\nThis cannot be undone.`;
    if (!confirm(warningMsg)) return;
    setDeletingId(id); setError('');
    try {
      const res = await adminAPI.deleteUser(id);
      if (res.success) {
        setUsers(p => p.filter(u => u.id !== id));
        setManagers(p => p.filter(u => u.id !== id));
        setEmployees(p => p.filter(u => u.id !== id));
        setSuccess(`${name} has been deleted successfully.`);
        setTimeout(() => setSuccess(''), 4000);
      } else { setError(res.message || 'Failed to delete user'); }
    } catch { setError('Cannot connect to server.'); }
    finally { setDeletingId(null); }
  };

  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      const res = await adminAPI.createManager(formData);
      if (res.success) {
        setManagers(p => [...p, res.data]);
        setUsers(p => [...p, res.data]);
        setFormData({ firstName: '', surname: '', emailAddress: '', password: '', department: '' });
        setSuccess('Manager created successfully. Welcome email sent.');
        setActiveTab('managers');
        setTimeout(() => setSuccess(''), 4000);
      } else { setError(res.message || 'Failed to create manager'); }
    } catch { setError('Cannot connect to server.'); }
    finally { setSubmitting(false); }
  };

  const roleBadge = (role: string) =>
    role === 'ADMIN'   ? 'bg-[#0f1f3d] text-white' :
    role === 'MANAGER' ? 'bg-blue-50 text-blue-700' :
                         'bg-emerald-50 text-emerald-700';

  const filterList = (list: any[]) =>
    list.filter(u =>
      `${u.firstName} ${u.surname} ${u.emailAddress} ${u.department}`
        .toLowerCase().includes(search.toLowerCase())
    );

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0f1f3d] focus:border-[#0f1f3d]";

  const UserTable = ({ list }: { list: any[] }) => (
    list.length === 0 ? (
      <p className="text-center text-gray-400 py-12">No users found.</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Name', 'Email', 'Department', 'Role', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((u: any) => (
              <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50 transition">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#0f1f3d] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {u.firstName?.charAt(0)}{u.surname?.charAt(0)}
                    </div>
                    <p className="font-semibold text-gray-800">{u.firstName} {u.surname}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{u.emailAddress}</td>
                <td className="px-4 py-3 text-gray-500">{u.department || 'N/A'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${roleBadge(u.role)}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.role !== 'ADMIN' && (
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(u)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-semibold transition">
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id, `${u.firstName} ${u.surname}`, u.role)}
                        disabled={deletingId === u.id}
                        className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1">
                        {deletingId === u.id ? (
                          <>
                            <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                            </svg>
                            Deleting...
                          </>
                        ) : 'Delete'}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  );

  const tabList = [
    { key: 'all',       label: `All (${users.length})` },
    { key: 'managers',  label: `Managers (${managers.length})` },
    { key: 'employees', label: `Employees (${employees.length})` },
    { key: 'create',    label: 'Create Manager' },
  ];

  return (
    <AdminLayout title="User Management">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#0f1f3d] mb-1">User Management</h2>
        <p className="text-gray-500 text-sm">Manage all system users across the organisation</p>
      </div>

      {success && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm font-medium">{success}</div>}
      {error   && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">{error}</div>}

      <div className="mb-5">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email or department..."
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0f1f3d]" />
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {tabList.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === tab.key
                ? 'bg-[#0f1f3d] text-white shadow'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-400 py-12 animate-pulse">Loading...</p>
        ) : (
          <>
            {activeTab === 'all'       && <UserTable list={filterList(users)} />}
            {activeTab === 'managers'  && <UserTable list={filterList(managers)} />}
            {activeTab === 'employees' && <UserTable list={filterList(employees)} />}
            {activeTab === 'create'    && (
              <div className="p-6 max-w-lg mx-auto">
                <h3 className="font-bold text-[#0f1f3d] mb-1">Create New Manager</h3>
                <p className="text-gray-400 text-xs mb-5">A welcome email with login credentials will be sent automatically.</p>
                <form onSubmit={handleCreateManager} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">First Name *</label>
                      <input type="text" value={formData.firstName}
                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                        className={inputClass} placeholder="First name" required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Surname *</label>
                      <input type="text" value={formData.surname}
                        onChange={e => setFormData({ ...formData, surname: e.target.value })}
                        className={inputClass} placeholder="Surname" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email Address *</label>
                    <input type="email" value={formData.emailAddress}
                      onChange={e => setFormData({ ...formData, emailAddress: e.target.value })}
                      className={inputClass} placeholder="email@company.com" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Password <span className="font-normal text-gray-400">(leave blank to auto-generate)</span>
                    </label>
                    <input type="password" value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className={inputClass} placeholder="Auto-generated if blank" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
                    <select value={formData.department}
                      onChange={e => setFormData({ ...formData, department: e.target.value })}
                      className={inputClass}>
                      <option value="">Select department</option>
                      {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                    </select>
                  </div>
                  <button type="submit" disabled={submitting}
                    className="w-full py-2.5 bg-[#0f1f3d] hover:bg-[#1a3260] text-white text-sm font-bold rounded-lg transition disabled:opacity-50">
                    {submitting ? 'Creating...' : 'Create Manager'}
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#0f1f3d]">Edit User</h3>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {editingUser.firstName} {editingUser.surname} — {editingUser.role}
                  </p>
                </div>
                <button onClick={() => setEditingUser(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select value={editForm.department}
                  onChange={e => setEditForm({ ...editForm, department: e.target.value })}
                  className={inputClass}>
                  <option value="">No department</option>
                  {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={editForm.role}
                  onChange={e => setEditForm({ ...editForm, role: e.target.value, managerId: '' })}
                  className={inputClass}>
                  <option value="EMPLOYEE">Employee</option>
                  <option value="MANAGER">Manager</option>
                </select>
              </div>

              {editForm.role === 'EMPLOYEE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign Manager</label>
                  <select value={editForm.managerId}
                    onChange={e => setEditForm({ ...editForm, managerId: e.target.value })}
                    className={inputClass}>
                    <option value="">No manager</option>
                    {managers
                      .filter(m => m.id !== editingUser.id)
                      .map(m => (
                        <option key={m.id} value={m.id}>
                          {m.firstName} {m.surname} — {m.department || 'N/A'}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-700 text-xs font-medium">
                  Changing role from Manager to Employee will unassign their team members.
                </p>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition">
                  Cancel
                </button>
                <button type="submit" disabled={editSubmitting}
                  className="flex-1 py-2.5 bg-[#0f1f3d] text-white text-sm font-bold rounded-lg hover:bg-[#1a3260] transition disabled:opacity-50">
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}