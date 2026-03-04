'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/lib/AuthContext';

const BASE_URL = 'http://localhost:8080/api';

const categoryStyles: Record<string, { bg: string; text: string; label: string }> = {
  GENERAL: { bg: 'bg-blue-50',   text: 'text-blue-700',   label: 'General' },
  POLICY:  { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Policy' },
  HOLIDAY: { bg: 'bg-green-50',  text: 'text-green-700',  label: 'Holiday' },
  URGENT:  { bg: 'bg-red-50',    text: 'text-red-700',    label: 'Urgent' },
};

const emptyForm = {
  title: '', content: '', category: 'GENERAL',
  targetAudience: 'ALL', targetDepartment: '', targetRole: '',
  pinned: false, expiresAt: '',
};

export default function AdminAnnouncements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('ALL');

  const fetchAll = () => {
    fetch(`${BASE_URL}/announcements`)
      .then(r => r.json())
      .then(res => { if (res.success) setAnnouncements(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditItem(null); setShowModal(true); };

  const openEdit = (a: any) => {
    setEditItem(a);
    setForm({
      title: a.title, content: a.content, category: a.category,
      targetAudience: a.targetAudience, targetDepartment: a.targetDepartment ?? '',
      targetRole: a.targetRole ?? '', pinned: a.pinned,
      expiresAt: a.expiresAt ? a.expiresAt.slice(0, 16) : '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    const body = {
      ...form,
      expiresAt: form.expiresAt ? form.expiresAt + ':00' : null,
      createdByUserId: user?.id,
    };
    const url = editItem
      ? `${BASE_URL}/announcements/${editItem.id}`
      : `${BASE_URL}/announcements`;
    const method = editItem ? 'PUT' : 'POST';

    await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setShowModal(false);
    fetchAll();
  };

  const handlePin = async (id: number) => {
    await fetch(`${BASE_URL}/announcements/${id}/pin`, { method: 'PATCH' });
    fetchAll();
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm('Deactivate this announcement?')) return;
    await fetch(`${BASE_URL}/announcements/${id}/deactivate`, { method: 'PATCH' });
    fetchAll();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Permanently delete this announcement?')) return;
    await fetch(`${BASE_URL}/announcements/${id}`, { method: 'DELETE' });
    fetchAll();
  };

  const formatDate = (dt: string) =>
    new Date(dt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });

  const filtered = filter === 'ALL' ? announcements : announcements.filter(a => a.category === filter);

  return (
    <AdminLayout title="Announcements">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0f1f3d] mb-1">Announcements</h2>
          <p className="text-gray-500 text-sm">Create and manage company-wide announcements</p>
        </div>
        <button onClick={openCreate}
          className="px-4 py-2 bg-[#0f1f3d] text-white text-sm font-semibold rounded-lg hover:bg-[#1a3260] transition">
          + New Announcement
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: announcements.length, color: 'border-[#0f1f3d]' },
          { label: 'Active', value: announcements.filter(a => a.active).length, color: 'border-emerald-500' },
          { label: 'Pinned', value: announcements.filter(a => a.pinned).length, color: 'border-blue-500' },
          { label: 'Urgent', value: announcements.filter(a => a.category === 'URGENT').length, color: 'border-red-500' },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 border-l-4 ${s.color}`}>
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className="text-3xl font-black text-[#0f1f3d]">{loading ? '—' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-4">
        {['ALL', 'GENERAL', 'POLICY', 'HOLIDAY', 'URGENT'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
              filter === f ? 'bg-[#0f1f3d] text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
            }`}>
            {f === 'ALL' ? 'All' : categoryStyles[f]?.label ?? f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">📢</p>
            <p className="text-gray-500 font-medium">No announcements yet</p>
            <p className="text-gray-400 text-sm mt-1">Click "New Announcement" to create one</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Target</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(a => {
                  const style = categoryStyles[a.category] ?? categoryStyles.GENERAL;
                  return (
                    <tr key={a.id} className={`hover:bg-gray-50 transition ${!a.active ? 'opacity-50' : ''}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {a.pinned && <span title="Pinned">📌</span>}
                          <span className="font-semibold text-[#0f1f3d]">{a.title}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{a.content}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
                          {style.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-500 text-xs">
                        {a.targetAudience === 'ALL' ? 'Everyone' :
                         a.targetAudience === 'DEPARTMENT' ? `Dept: ${a.targetDepartment}` :
                         `Role: ${a.targetRole}`}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          a.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {a.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-400 text-xs">{formatDate(a.createdAt)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(a)}
                            className="px-2.5 py-1 text-xs font-medium text-[#0f1f3d] bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                            Edit
                          </button>
                          <button onClick={() => handlePin(a.id)}
                            title={a.pinned ? 'Unpin' : 'Pin'}
                            className="px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition">
                            {a.pinned ? 'Unpin' : 'Pin'}
                          </button>
                          {a.active && (
                            <button onClick={() => handleDeactivate(a.id)}
                              className="px-2.5 py-1 text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition">
                              Hide
                            </button>
                          )}
                          <button onClick={() => handleDelete(a.id)}
                            className="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-[#0f1f3d] text-lg">
                {editItem ? 'Edit Announcement' : 'New Announcement'}
              </h3>
              <button onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Announcement title"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0f1f3d]/20 focus:border-[#0f1f3d]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Content *</label>
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                  rows={4} placeholder="Write your announcement..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0f1f3d]/20 focus:border-[#0f1f3d] resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0f1f3d]/20 focus:border-[#0f1f3d]">
                    <option value="GENERAL">General</option>
                    <option value="POLICY">Policy</option>
                    <option value="HOLIDAY">Holiday</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Target Audience</label>
                  <select value={form.targetAudience} onChange={e => setForm({ ...form, targetAudience: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0f1f3d]/20 focus:border-[#0f1f3d]">
                    <option value="ALL">Everyone</option>
                    <option value="DEPARTMENT">Department</option>
                    <option value="ROLE">Role</option>
                  </select>
                </div>
              </div>
              {form.targetAudience === 'DEPARTMENT' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Department Name</label>
                  <input value={form.targetDepartment} onChange={e => setForm({ ...form, targetDepartment: e.target.value })}
                    placeholder="e.g. Engineering"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0f1f3d]/20 focus:border-[#0f1f3d]" />
                </div>
              )}
              {form.targetAudience === 'ROLE' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Role</label>
                  <select value={form.targetRole} onChange={e => setForm({ ...form, targetRole: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0f1f3d]/20 focus:border-[#0f1f3d]">
                    <option value="">Select role</option>
                    <option value="EMPLOYEE">Employee</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Expiry Date (optional)</label>
                <input type="datetime-local" value={form.expiresAt}
                  onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0f1f3d]/20 focus:border-[#0f1f3d]" />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setForm({ ...form, pinned: !form.pinned })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                    form.pinned
                      ? 'bg-[#0f1f3d] text-white border-[#0f1f3d]'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}>
                  📌 {form.pinned ? 'Pinned' : 'Pin to top'}
                </button>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || !form.title.trim() || !form.content.trim()}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#0f1f3d] hover:bg-[#1a3260] rounded-lg transition disabled:opacity-50">
                {saving ? 'Saving...' : editItem ? 'Save Changes' : 'Create Announcement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}