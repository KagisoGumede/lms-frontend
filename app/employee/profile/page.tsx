'use client';
import { useState, useEffect } from 'react';
import EmployeeLayout from '@/components/EmployeeLayout';
import { useAuth } from '@/lib/AuthContext';
import { userAPI } from '@/lib/api';

function ChangePasswordForm({ userId }: { userId: number }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);
  const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0f1f3d]";

  const reset = () => { setShow(false); setError(''); setForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    setSubmitting(true); setError(''); setSuccess('');
    try {
      const res = await userAPI.changePassword(userId, form);
      if (res.success) {
        setSuccess('Password changed successfully.');
        reset();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(res.message || 'Failed to change password');
      }
    } catch { setError('Cannot connect to server.'); }
    finally { setSubmitting(false); }
  };

  return (
    <>
      {success && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">{success}</div>}
      {!show ? (
        <div className="flex items-center justify-between">
          <p className="text-gray-500 text-sm">Update your account password securely.</p>
          <button onClick={() => setShow(true)}
            className="px-4 py-2 bg-[#0f1f3d] hover:bg-[#1a3260] text-white text-xs font-semibold rounded-lg transition">
            Change Password
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input type="password" value={form.currentPassword}
              onChange={e => setForm({ ...form, currentPassword: e.target.value })}
              className={inputClass} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input type="password" value={form.newPassword}
              onChange={e => setForm({ ...form, newPassword: e.target.value })}
              className={inputClass} required />
            <p className="text-gray-400 text-xs mt-1">Minimum 6 characters</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input type="password" value={form.confirmPassword}
              onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              className={inputClass} required />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={reset}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-2.5 bg-[#0f1f3d] text-white text-sm font-bold rounded-lg hover:bg-[#1a3260] transition disabled:opacity-50">
              {submitting ? 'Saving...' : 'Update Password'}
            </button>
          </div>
        </form>
      )}
    </>
  );
}

export default function ProfilePage() {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ firstName: '', surname: '', emailAddress: '' });

  useEffect(() => {
    if (!user) return;
    userAPI.getProfile(user.id).then(res => {
      if (res.success) {
        setProfile(res.data);
        setFormData({ firstName: res.data.firstName, surname: res.data.surname, emailAddress: res.data.emailAddress });
      }
    }).finally(() => setLoading(false));
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!formData.firstName.trim() || !formData.surname.trim() || !formData.emailAddress.trim()) { setError('All fields are required'); return; }
    setSubmitting(true);
    try {
      const res = await userAPI.updateProfile(user!.id, formData);
      if (res.success) {
        setProfile((prev: any) => ({ ...prev, ...formData }));
        login({ ...user!, name: formData.firstName, surname: formData.surname, email: formData.emailAddress });
        setSuccess('Profile updated successfully.');
        setIsEditing(false);
        setTimeout(() => setSuccess(''), 3000);
      } else { setError(res.message || 'Failed to update'); }
    } catch { setError('Cannot connect to server.'); }
    finally { setSubmitting(false); }
  };

  if (!user) return null;

  const statCards = [
    { label: 'Total Leaves', value: profile?.leaveSummary?.total,    accent: 'border-[#0f1f3d]' },
    { label: 'Pending',      value: profile?.leaveSummary?.pending,  accent: 'border-amber-500' },
    { label: 'Approved',     value: profile?.leaveSummary?.approved, accent: 'border-emerald-500' },
    { label: 'Rejected',     value: profile?.leaveSummary?.rejected, accent: 'border-red-400' },
  ];

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0f1f3d] focus:border-[#0f1f3d]";

  return (
    <EmployeeLayout title="My Profile">
      <div className="max-w-2xl mx-auto space-y-5">
        {loading ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-400 animate-pulse">Loading...</div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-[#0f1f3d] rounded-xl p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center text-xl font-black flex-shrink-0">
                  {profile?.firstName?.charAt(0)}{profile?.surname?.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold">{profile?.firstName} {profile?.surname}</h2>
                  <p className="text-blue-200 text-sm truncate">{profile?.emailAddress}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-medium">{profile?.role}</span>
                    <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-medium">{profile?.department || 'No department'}</span>
                  </div>
                </div>
              </div>
              {profile?.managerName && profile?.managerName !== 'N/A' && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-blue-300 text-xs">Reports to</p>
                  <p className="font-semibold text-sm">{profile?.managerName}</p>
                </div>
              )}
            </div>

            {/* Stats */}
            {profile?.leaveSummary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {statCards.map(s => (
                  <div key={s.label} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${s.accent} border border-gray-100`}>
                    <p className="text-gray-500 text-xs mb-1">{s.label}</p>
                    <p className="text-2xl font-black text-[#0f1f3d]">{s.value ?? 0}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Personal Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-bold text-[#0f1f3d]">Personal Information</h3>
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-[#0f1f3d] text-white text-xs font-semibold rounded-lg hover:bg-[#1a3260] transition">
                    Edit Profile
                  </button>
                )}
              </div>
              {success && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">{success}</div>}
              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
              {isEditing ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input type="text" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} className={inputClass} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Surname</label>
                      <input type="text" value={formData.surname} onChange={e => setFormData({ ...formData, surname: e.target.value })} className={inputClass} required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input type="email" value={formData.emailAddress} onChange={e => setFormData({ ...formData, emailAddress: e.target.value })} className={inputClass} required />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => { setIsEditing(false); setError(''); }}
                      className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition">Cancel</button>
                    <button type="submit" disabled={submitting}
                      className="flex-1 py-2.5 bg-[#0f1f3d] text-white text-sm font-bold rounded-lg hover:bg-[#1a3260] transition disabled:opacity-50">
                      {submitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-1">
                  {[
                    { label: 'First Name',  value: profile?.firstName },
                    { label: 'Surname',     value: profile?.surname },
                    { label: 'Email',       value: profile?.emailAddress },
                    { label: 'Department',  value: profile?.department || 'N/A' },
                    { label: 'Role',        value: profile?.role },
                    { label: 'Reports To',  value: profile?.managerName || 'N/A' },
                  ].map(f => (
                    <div key={f.label} className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
                      <p className="text-gray-500 text-sm">{f.label}</p>
                      <p className="font-semibold text-gray-800 text-sm">{f.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-[#0f1f3d] mb-5">Change Password</h3>
              <ChangePasswordForm userId={user.id} />
            </div>
          </>
        )}
      </div>
    </EmployeeLayout>
  );
}