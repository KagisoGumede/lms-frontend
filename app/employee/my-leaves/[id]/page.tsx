'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import EmployeeLayout from '@/components/EmployeeLayout';
import { useAuth } from '@/lib/AuthContext';
import { leaveAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function EmployeeLeaveDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [leave, setLeave] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!params?.id) return;
    leaveAPI.getLeaveById(Number(params.id)).then(res => {
      if (res.success) setLeave(res.data);
      else setLeave(null);
    }).catch(() => setLeave(null))
      .finally(() => setLoading(false));
  }, [params?.id]);

  if (!user) return null;

  const handleCancel = async () => {
    if (!confirm(`Cancel your "${leave.leaveType}" leave request? This cannot be undone.`)) return;
    setCancellingId(leave.id);
    setError(''); setSuccess('');
    try {
      const res = await leaveAPI.cancelLeave(leave.id, user.id);
      if (res.success) {
        setLeave(res.data);
        setSuccess('Leave request cancelled successfully.');
      } else {
        setError(res.message || 'Failed to cancel.');
      }
    } catch {
      setError('Cannot connect to server.');
    } finally {
      setCancellingId(null);
    }
  };

  const handleUploadDocument = async () => {
    if (!uploadFile) { setError('Please select a file first.'); return; }
    setUploading(true); setError(''); setSuccess('');
    try {
      const res = await leaveAPI.uploadRequiredDocument(leave.id, uploadFile);
      if (res.success) {
        setLeave(res.data);
        setUploadFile(null);
        if (fileRef.current) fileRef.current.value = '';
        setSuccess('Document uploaded successfully. Your manager will verify it.');
      } else {
        setError(res.message || 'Upload failed.');
      }
    } catch {
      setError('Cannot connect to server.');
    } finally {
      setUploading(false);
    }
  };

  const statusBadge = (s: string) =>
    s === 'APPROVED'  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
    s === 'REJECTED'  ? 'bg-red-50 text-red-700 border border-red-200' :
    s === 'CANCELLED' ? 'bg-gray-100 text-gray-500 border border-gray-200' :
    s === 'UNPAID'    ? 'bg-orange-50 text-orange-700 border border-orange-200' :
    'bg-amber-50 text-amber-700 border border-amber-200';

  if (loading) return (
    <EmployeeLayout title="Leave Details">
      <p className="text-center text-gray-400 py-20 animate-pulse">Loading...</p>
    </EmployeeLayout>
  );

  if (!leave) return (
    <EmployeeLayout title="Leave Details">
      <div className="text-center py-20">
        <p className="text-gray-400 mb-4">Leave request not found.</p>
        <button onClick={() => router.back()}
          className="px-4 py-2 bg-[#0f1f3d] text-white text-sm font-semibold rounded-lg hover:bg-[#1a3260] transition">
          Go Back
        </button>
      </div>
    </EmployeeLayout>
  );

  // Should show upload section?
  const showUpload = leave.documentRequired
    && leave.status === 'APPROVED'
    && (leave.documentStatus === 'PENDING' || leave.documentStatus === 'UPLOADED');

  // Timeline
  const timeline = [
    {
      label: 'Submitted',
      date: leave.submittedDate,
      by: 'You',
      detail: `Applied for ${leave.leaveType} (${leave.duration} day${leave.duration > 1 ? 's' : ''})`,
      color: 'bg-blue-500'
    },
    ...(leave.status !== 'PENDING' && leave.status !== 'CANCELLED' ? [{
      label: leave.status === 'APPROVED' || leave.status === 'UNPAID' ? 'Approved' : 'Rejected',
      date: leave.reviewDate,
      by: leave.reviewedByName || 'Manager',
      detail: (leave.managerComments || 'No comments')
            + (leave.documentRequired
                ? ` | Document required by ${leave.documentDeadline}` : ''),
      color: leave.status === 'REJECTED' ? 'bg-red-500' : 'bg-emerald-500'
    }] : []),
    ...(leave.documentRequired && leave.documentStatus && leave.documentStatus !== 'NOT_REQUIRED' ? [{
      label: leave.documentStatus === 'PENDING'  ? 'Document Required' :
             leave.documentStatus === 'UPLOADED' ? 'Document Uploaded' :
             leave.documentStatus === 'VERIFIED' ? 'Document Verified' : 'Document Rejected',
      date: null,
      by: leave.documentStatus === 'PENDING' ? 'Manager' : 'You',
      detail: leave.documentStatus === 'PENDING'
                ? `Upload your document by ${leave.documentDeadline} to keep this leave approved` :
              leave.documentStatus === 'UPLOADED'
                ? 'Waiting for manager to verify your document' :
              leave.documentStatus === 'VERIFIED'
                ? 'Your document was accepted — leave remains approved' :
                'Your document was rejected — leave marked as UNPAID',
      color: leave.documentStatus === 'VERIFIED' ? 'bg-emerald-500' :
             leave.documentStatus === 'REJECTED' ? 'bg-red-500' :
             leave.documentStatus === 'UPLOADED' ? 'bg-blue-500' : 'bg-amber-400'
    }] : []),
    ...(leave.status === 'UNPAID' ? [{
      label: 'Marked as Unpaid',
      date: null,
      by: 'System',
      detail: 'Leave converted to unpaid due to missing or rejected document',
      color: 'bg-orange-500'
    }] : []),
    ...(leave.status === 'CANCELLED' ? [{
      label: 'Cancelled',
      date: null,
      by: 'You',
      detail: 'You cancelled this leave request',
      color: 'bg-gray-400'
    }] : [])
  ];

  return (
    <EmployeeLayout title="Leave Details">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-[#0f1f3d]">Leave Request Details</h2>
            <p className="text-gray-500 text-sm">#{leave.id} — {leave.leaveType}</p>
          </div>
          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${statusBadge(leave.status)}`}>
            {leave.status}
          </span>
        </div>

        {success && (
          <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Document upload alert — shown when action required */}
        {showUpload && (
          <div className={`mb-5 p-4 rounded-xl border ${
            leave.documentStatus === 'UPLOADED'
              ? 'bg-blue-50 border-blue-200'
              : 'bg-amber-50 border-amber-200'
          }`}>
            <p className={`text-sm font-bold mb-1 ${
              leave.documentStatus === 'UPLOADED' ? 'text-blue-800' : 'text-amber-800'
            }`}>
              {leave.documentStatus === 'UPLOADED'
                ? 'Document uploaded — awaiting verification'
                : 'Action Required: Upload Supporting Document'}
            </p>
            <p className={`text-xs mb-3 ${
              leave.documentStatus === 'UPLOADED' ? 'text-blue-600' : 'text-amber-600'
            }`}>
              {leave.documentStatus === 'UPLOADED'
                ? 'Your manager will verify your document. You can replace it if needed.'
                : `You must upload a supporting document (e.g. doctor's letter) by ${formatDate(leave.documentDeadline)}. If you don't, your leave will be marked as UNPAID.`}
            </p>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={e => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-[#0f1f3d] file:text-white file:text-xs file:font-semibold" />
                {uploadFile && (
                  <p className="text-xs text-emerald-600 mt-1 font-medium">{uploadFile.name}</p>
                )}
              </div>
              <button
                onClick={handleUploadDocument}
                disabled={uploading || !uploadFile}
                className="px-4 py-2 bg-[#0f1f3d] hover:bg-[#1a3260] text-white text-xs font-bold rounded-lg transition disabled:opacity-50 flex-shrink-0">
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">

            {/* Leave Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Leave Details</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Leave Type',  value: leave.leaveType },
                  { label: 'Duration',    value: `${leave.duration} business day${leave.duration > 1 ? 's' : ''}` },
                  { label: 'Start Date',  value: formatDate(leave.startDate) },
                  { label: 'End Date',    value: formatDate(leave.endDate) },
                  { label: 'Applied On',  value: formatDate(leave.submittedDate) },
                  { label: 'Review Date', value: leave.reviewDate ? formatDate(leave.reviewDate) : 'Not yet reviewed' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-gray-800">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Your Reason</p>
                <p className="text-sm text-gray-700 leading-relaxed">{leave.reason}</p>
              </div>
            </div>

            {/* Manager Response */}
            {leave.status !== 'PENDING' && leave.status !== 'CANCELLED' && (
              <div className={`rounded-xl p-5 border ${
                leave.status === 'APPROVED' || leave.status === 'UNPAID'
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <p className={`text-sm font-bold mb-1 ${
                  leave.status === 'APPROVED' || leave.status === 'UNPAID'
                    ? 'text-emerald-800' : 'text-red-800'
                }`}>
                  {leave.status === 'REJECTED' ? 'Rejected' : 'Approved'} by {leave.reviewedByName}
                  {leave.reviewDate && ` on ${formatDate(leave.reviewDate)}`}
                </p>
                <p className={`text-sm ${
                  leave.status === 'APPROVED' || leave.status === 'UNPAID'
                    ? 'text-emerald-700' : 'text-red-700'
                }`}>
                  {leave.managerComments || 'No comments provided.'}
                </p>
              </div>
            )}

            {/* Unpaid warning */}
            {leave.status === 'UNPAID' && (
              <div className="rounded-xl p-5 border bg-orange-50 border-orange-200">
                <p className="text-sm font-bold text-orange-800 mb-1">Leave Marked as Unpaid</p>
                <p className="text-sm text-orange-700">
                  This leave was marked as unpaid because a valid supporting document
                  was not provided by the deadline. Please contact your manager if you
                  believe this is incorrect.
                </p>
              </div>
            )}

            {/* Cancel button — pending only */}
            {leave.status === 'PENDING' && (
              <button
                onClick={handleCancel}
                disabled={cancellingId === leave.id}
                className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-xl border border-red-200 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {cancellingId === leave.id ? (
                  <span className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {cancellingId === leave.id ? 'Cancelling...' : 'Cancel This Request'}
              </button>
            )}
          </div>

          {/* Right — Timeline */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-5">History</h3>
              <div className="relative">
                <div className="absolute left-3.5 top-4 bottom-0 w-0.5 bg-gray-100" />
                <div className="space-y-6">
                  {timeline.map((event, i) => (
                    <div key={i} className="relative flex gap-3">
                      <div className={`w-7 h-7 rounded-full ${event.color} flex items-center justify-center flex-shrink-0 z-10`}>
                        <div className="w-2 h-2 rounded-full bg-white opacity-80" />
                      </div>
                      <div className="flex-1 min-w-0 pb-1">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="text-sm font-bold text-[#0f1f3d]">{event.label}</p>
                          {event.date && (
                            <p className="text-xs text-gray-400 flex-shrink-0">
                              {formatDate(event.date)}
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 font-medium">{event.by}</p>
                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">{event.detail}</p>
                      </div>
                    </div>
                  ))}
                  {leave.status === 'PENDING' && (
                    <div className="relative flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-amber-100 border-2 border-amber-400 border-dashed flex items-center justify-center flex-shrink-0 z-10">
                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      </div>
                      <div className="flex-1 pb-1">
                        <p className="text-sm font-bold text-amber-600">Awaiting Review</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Your manager hasn't reviewed yet
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}