'use client';
import { useState, useEffect } from 'react';
import ManagerLayout from '@/components/ManagerLayout';
import { useAuth } from '@/lib/AuthContext';
import { userAPI, leaveAPI } from '@/lib/api';

function ChangePasswordForm({ userId }: { userId: number }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);
  const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0f1f3d]";

  const reset = () => {
    setShow(false); setError('');
    setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

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
      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
          {success}
        </div>
      )}
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
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}
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

export default function ManagerProfilePage() {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ firstName: '', surname: '', emailAddress: '' });

  // Delegation state
  const [managers, setManagers] = useState<any[]>([]);
  const [activeDelegation, setActiveDelegation] = useState<any>(null);
  const [delegatedToMe, setDelegatedToMe] = useState<any[]>([]);
  const [delegateId, setDelegateId] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [delegating, setDelegating] = useState(false);
  const [delegationMsg, setDelegationMsg] = useState('');
  const [delegationErr, setDelegationErr] = useState('');

  useEffect(() => {
    if (!user) return;
    Promise.all([
      userAPI.getProfile(user.id),
      leaveAPI.getDashboardStats(user.id),
      userAPI.getAllManagers(),
      leaveAPI.getDelegation(user.id)
    ]).then(([p, s, m, d]) => {
      if (p.success) {
        setProfile(p.data);
        setFormData({ firstName: p.data.firstName, surname: p.data.surname, emailAddress: p.data.emailAddress });
      }
      if (s.success) setStats(s.data);
      if (m.success) setManagers(m.data.filter((mgr: any) => mgr.id !== user.id));
      if (d.success) {
        setActiveDelegation(Object.keys(d.data?.activeDelegation ?? {}).length > 0 ? d.data.activeDelegation : null);
        setDelegatedToMe(d.data?.delegatedToMe ?? []);
      }
    }).finally(() => setLoading(false));
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!formData.firstName.trim() || !formData.surname.trim() || !formData.emailAddress.trim()) {
      setError('All fields are required'); return;
    }
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

  const handleDelegate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegateId || !expiryDate) { setDelegationErr('Select a manager and expiry date'); return; }
    setDelegating(true); setDelegationErr(''); setDelegationMsg('');
    try {
      const res = await leaveAPI.setDelegation(user!.id, Number(delegateId), expiryDate);
      if (res.success) {
        setActiveDelegation(res.data);
        setDelegateId(''); setExpiryDate('');
        setDelegationMsg('Delegation set successfully.');
        setTimeout(() => setDelegationMsg(''), 3000);
      } else { setDelegationErr(res.message || 'Failed to set delegation'); }
    } catch { setDelegationErr('Cannot connect to server.'); }
    finally { setDelegating(false); }
  };

  const handleRemoveDelegation = async () => {
    if (!confirm('Remove the current delegation?')) return;
    try {
      const res = await leaveAPI.removeDelegation(user!.id);
      if (res.success) {
        setActiveDelegation(null);
        setDelegationMsg('Delegation removed.');
        setTimeout(() => setDelegationMsg(''), 3000);
      }
    } catch { setDelegationErr('Cannot connect to server.'); }
  };

  if (!user) return null;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const statCards = [
    { label: 'Total Employees',    value: stats?.totalEmployees,    accent: 'border-[#0f1f3d]' },
    { label: 'Pending Reviews',    value: stats?.pendingLeaves,     accent: 'border-amber-500' },
    { label: 'Approved This Month',value: stats?.approvedThisMonth, accent: 'border-emerald-500' },
    { label: 'Total Requests',     value: stats?.totalLeaves,       accent: 'border-blue-400' },
  ];

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0f1f3d]";

  return (
    <ManagerLayout title="My Profile">
      <div className="max-w-2xl mx-auto space-y-5">
        {loading ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-400 animate-pulse">Loading...</div>
        ) : (
          <>
            {/* Header card */}
            <div className="bg-[#0f1f3d] rounded-xl p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center text-xl font-black">
                  {profile?.firstName?.charAt(0)}{profile?.surname?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{profile?.firstName} {profile?.surname}</h2>
                  <p className="text-blue-200 text-sm">{profile?.emailAddress}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-medium">Manager</span>
                    <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-medium">{profile?.department || 'No department'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            {stats && (
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
              {error   && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
              {isEditing ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input type="text" value={formData.firstName}
                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                        className={inputClass} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Surname</label>
                      <input type="text" value={formData.surname}
                        onChange={e => setFormData({ ...formData, surname: e.target.value })}
                        className={inputClass} required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input type="email" value={formData.emailAddress}
                      onChange={e => setFormData({ ...formData, emailAddress: e.target.value })}
                      className={inputClass} required />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => { setIsEditing(false); setError(''); }}
                      className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition">
                      Cancel
                    </button>
                    <button type="submit" disabled={submitting}
                      className="flex-1 py-2.5 bg-[#0f1f3d] text-white text-sm font-bold rounded-lg hover:bg-[#1a3260] transition disabled:opacity-50">
                      {submitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-1">
                  {[
                    { label: 'First Name',    value: profile?.firstName },
                    { label: 'Surname',       value: profile?.surname },
                    { label: 'Email Address', value: profile?.emailAddress },
                    { label: 'Department',    value: profile?.department || 'N/A' },
                    { label: 'Role',          value: 'Manager' },
                  ].map(f => (
                    <div key={f.label} className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
                      <p className="text-gray-500 text-sm">{f.label}</p>
                      <p className="font-semibold text-gray-800 text-sm">{f.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Delegation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="mb-5">
                <h3 className="font-bold text-[#0f1f3d]">Delegate Approvals</h3>
                <p className="text-gray-400 text-xs mt-1">
                  Temporarily assign your team's leave approvals to another manager while you're away.
                </p>
              </div>
              {delegationMsg && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm font-medium">{delegationMsg}</div>}
              {delegationErr && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">{delegationErr}</div>}

              {activeDelegation && (
                <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start justify-between gap-3">
                  <div>
                    <p className="text-blue-800 text-sm font-semibold">Active Delegation</p>
                    <p className="text-blue-600 text-xs mt-1">
                      Delegated to <span className="font-bold">{activeDelegation.delegateName}</span>
                    </p>
                    <p className="text-blue-500 text-xs mt-0.5">
                      Expires: {new Date(activeDelegation.expiryDate).toLocaleDateString('en-ZA', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </p>
                  </div>
                  <button onClick={handleRemoveDelegation}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg transition flex-shrink-0">
                    Remove
                  </button>
                </div>
              )}

              {!activeDelegation && (
                <form onSubmit={handleDelegate} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delegate To</label>
                    <select value={delegateId} onChange={e => setDelegateId(e.target.value)}
                      className={inputClass} required>
                      <option value="">Select a manager...</option>
                      {managers.map((m: any) => (
                        <option key={m.id} value={m.id}>
                          {m.firstName} {m.surname} — {m.department}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expires On</label>
                    <input type="date" value={expiryDate} min={minDate}
                      onChange={e => setExpiryDate(e.target.value)}
                      className={inputClass} required />
                  </div>
                  <button type="submit" disabled={delegating}
                    className="w-full py-2.5 bg-[#0f1f3d] hover:bg-[#1a3260] text-white text-sm font-bold rounded-lg transition disabled:opacity-50">
                    {delegating ? 'Setting Delegation...' : 'Set Delegation'}
                  </button>
                </form>
              )}

              {delegatedToMe.length > 0 && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Delegated to You</p>
                  <div className="space-y-2">
                    {delegatedToMe.map((d: any) => (
                      <div key={d.id} className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="text-emerald-800 text-sm font-semibold">{d.delegatorName}'s team</p>
                          <p className="text-emerald-600 text-xs mt-0.5">
                            Until {new Date(d.expiryDate).toLocaleDateString('en-ZA', {
                              day: '2-digit', month: 'short', year: 'numeric'
                            })}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg">Active</span>
                      </div>
                    ))}
                  </div>
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
    </ManagerLayout>
  );
}