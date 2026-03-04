'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EmployeeLayout from '@/components/EmployeeLayout';
import { useAuth } from '@/lib/AuthContext';
import { leaveAPI, settingsAPI } from '@/lib/api';
import { calculateBusinessDays } from '@/lib/utils';

export default function ApplyLeavePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [leaveTypesLoading, setLeaveTypesLoading] = useState(true);
  const [formData, setFormData] = useState({ leaveType: '', startDate: '', endDate: '', reason: '' });
  const [duration, setDuration] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user) return;
    Promise.all([
      settingsAPI.getLeaveTypes(),
      leaveAPI.getBalances(user.id)
    ]).then(([ltRes, balRes]) => {
      if (ltRes.success) setLeaveTypes(ltRes.data);
      if (balRes.success) setBalances(balRes.data);
    }).finally(() => setLeaveTypesLoading(false));
  }, [user]);

  useEffect(() => {
    if (formData.startDate && formData.endDate)
      setDuration(calculateBusinessDays(formData.startDate, formData.endDate));
  }, [formData.startDate, formData.endDate]);

  const selectedBalance = balances.find(b => b.leaveType === formData.leaveType);
  const willExceed = selectedBalance && duration > selectedBalance.remaining;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true); setError(''); setSuccess('');
    try {
      const res = await leaveAPI.applyLeave({
        employeeId: user.id,
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        duration,
        reason: formData.reason
      });
      if (!res.success) { setError(res.message || 'Something went wrong'); return; }

      // FIX: Separate try/catch for file upload so a failed upload
      // does not trigger the "Cannot connect to server" error banner.
      if (file) {
        try {
          await leaveAPI.uploadDocument(res.data.id, file);
        } catch {
          setError('Leave submitted, but document upload failed. Try uploading it later.');
        }
      }

      setSuccess('Leave request submitted successfully.');
      setTimeout(() => router.push('/employee/my-leaves'), 1500);
    } catch {
      setError('Cannot connect to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0f1f3d] focus:border-[#0f1f3d] transition";

  return (
    <EmployeeLayout title="Apply for Leave">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#0f1f3d] mb-1">New Leave Request</h2>
          <p className="text-gray-500 text-sm">Submit a personal leave request</p>
        </div>

        {success && (
          <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">{success}</div>
        )}
        {error && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">{error}</div>
        )}

        <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm">
          Your leave request will be submitted and visible to the admin for record-keeping.
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Leave Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type <span className="text-red-500">*</span></label>
              {leaveTypesLoading ? (
                <div className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-gray-400 text-sm bg-gray-50">Loading leave types...</div>
              ) : leaveTypes.length === 0 ? (
                <div className="w-full px-3 py-2.5 border border-amber-200 rounded-lg bg-amber-50 text-amber-700 text-sm">
                  No leave types available. Ask your manager to add them in Settings.
                </div>
              ) : (
                <select value={formData.leaveType}
                  onChange={e => setFormData({ ...formData, leaveType: e.target.value })}
                  className={inputClass} required>
                  <option value="">Select Leave Type</option>
                  {leaveTypes.map((lt: any) => <option key={lt.id} value={lt.name}>{lt.name}</option>)}
                </select>
              )}

              {/* Balance indicator for selected type */}
              {selectedBalance && (
                <div className={`mt-2 p-3 rounded-lg text-xs font-medium flex items-center justify-between ${
                  selectedBalance.isExhausted ? 'bg-red-50 text-red-600 border border-red-200' :
                  selectedBalance.isLow      ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                  'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  <span>
                    {selectedBalance.isExhausted
                      ? 'Balance exhausted — you have no remaining days'
                      : `${selectedBalance.remaining} days remaining of ${selectedBalance.allocated} allocated`}
                  </span>
                  <span className="font-black text-lg">{selectedBalance.remaining}d</span>
                </div>
              )}
            </div>

            {/* Dates + Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date <span className="text-red-500">*</span></label>
                <input type="date" value={formData.startDate}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className={inputClass} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date <span className="text-red-500">*</span></label>
                <input type="date" value={formData.endDate}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  min={formData.startDate}
                  className={inputClass} required />
              </div>
              <div className={`rounded-xl p-4 text-center flex flex-col justify-center ${willExceed ? 'bg-red-600' : 'bg-[#0f1f3d]'}`}>
                <p className="text-blue-300 text-xs font-medium">Duration</p>
                <p className="text-3xl font-black text-white">{duration}</p>
                <p className="text-blue-200 text-xs">business days</p>
              </div>
            </div>

            {/* Exceed warning */}
            {willExceed && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-semibold">
                This request exceeds your remaining balance by {duration - selectedBalance.remaining} day{duration - selectedBalance.remaining > 1 ? 's' : ''}. Your manager will still receive it but may reject it.
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason <span className="text-red-500">*</span></label>
              <textarea value={formData.reason}
                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                rows={4} className={inputClass}
                placeholder="Explain the reason for your leave request..."
                required />
            </div>

            {/* Document */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supporting Document <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-[#0f1f3d] file:text-white file:text-xs file:font-semibold hover:file:bg-[#1a3260] transition" />
              {file && <p className="text-emerald-600 text-xs mt-1 font-medium">{file.name} selected</p>}
              <p className="text-gray-400 text-xs mt-1">Accepted: PDF, JPG, PNG, DOC (max 10MB)</p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button type="button" onClick={() => router.back()}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting || leaveTypes.length === 0}
                className="flex-1 py-2.5 bg-[#0f1f3d] hover:bg-[#1a3260] text-white text-sm font-bold rounded-lg transition disabled:opacity-50">
                {isSubmitting ? 'Submitting...' : 'Submit Leave Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </EmployeeLayout>
  );
}
