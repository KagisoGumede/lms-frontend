'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ManagerLayout from '@/components/ManagerLayout';
import { useAuth } from '@/lib/AuthContext';
import { leaveAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function LeaveDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [leave, setLeave] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [docRequired, setDocRequired] = useState(false);
  const [docDeadline, setDocDeadline] = useState('');

  useEffect(() => {
    if (!params?.id) return;
    leaveAPI.getLeaveById(Number(params.id)).then(res => {
      if (res.success) {
        setLeave(res.data);
        setComment(res.data.managerComments || '');
        setDocRequired(res.data.documentRequired || false);
        setDocDeadline(res.data.documentDeadline || '');
      } else {
        setLeave(null);
      }
    }).catch(() => setLeave(null))
      .finally(() => setLoading(false));
  }, [params?.id]);

  const handleReview = async (status: 'APPROVED' | 'REJECTED') => {
    if (status === 'REJECTED' && !comment.trim()) {
      setError('Please enter a reason for rejection.');
      return;
    }
    if (docRequired && !docDeadline) {
      setError('Please set a document deadline.');
      return;
    }
    setSubmitting(true); setError(''); setSuccess('');
    try {
      const res = await leaveAPI.reviewLeave(leave.id, {
        managerId:        user!.id,
        status,
        managerComments:  comment,
        documentRequired: docRequired,
        documentDeadline: docRequired ? docDeadline : ''
      });
      if (res.success) {
        setLeave(res.data);
        setSuccess(`Leave ${status.toLowerCase()} successfully.`);
      } else {
        setError(res.message || 'Something went wrong.');
      }
    } catch {
      setError('Cannot connect to server.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyDocument = async (verified: boolean) => {
    setVerifying(true); setError(''); setSuccess('');
    try {
      const res = await leaveAPI.verifyDocument(leave.id, user!.id, verified);
      if (res.success) {
        setLeave(res.data);
        setSuccess(verified
          ? 'Document verified. Leave remains approved.'
          : 'Document rejected. Leave marked as UNPAID.');
      } else {
        setError(res.message || 'Something went wrong.');
      }
    } catch {
      setError('Cannot connect to server.');
    } finally {
      setVerifying(false);
    }
  };

  const statusBadge = (s: string) =>
    s === 'APPROVED'  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
    s === 'REJECTED'  ? 'bg-red-50 text-red-700 border border-red-200' :
    s === 'CANCELLED' ? 'bg-gray-100 text-gray-500 border border-gray-200' :
    s === 'UNPAID'    ? 'bg-orange-50 text-orange-700 border border-orange-200' :
    'bg-amber-50 text-amber-700 border border-amber-200';

  const docStatusBadge = (s: string) =>
    s === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
    s === 'REJECTED' ? 'bg-red-50 text-red-700 border border-red-200' :
    s === 'UPLOADED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
    s === 'PENDING'  ? 'bg-amber-50 text-amber-700 border border-amber-200' :
    'bg-gray-50 text-gray-500 border border-gray-200';

  if (!user) return null;

  if (loading) return (
    <ManagerLayout title="Leave Details">
      <p className="text-center text-gray-400 py-20 animate-pulse">Loading...</p>
    </ManagerLayout>
  );

  if (!leave) return (
    <ManagerLayout title="Leave Details">
      <div className="text-center py-20">
        <p className="text-gray-400 mb-4">Leave request not found.</p>
        <button onClick={() => router.push('/manager/view-leaves')}
          className="px-4 py-2 bg-[#0f1f3d] text-white text-sm font-semibold rounded-lg hover:bg-[#1a3260] transition">
          Back to Leave Requests
        </button>
      </div>
    </ManagerLayout>
  );

  const timeline = [
    {
      label: 'Submitted',
      date: leave.submittedDate,
      by: leave.employeeName,
      role: 'Employee',
      detail: `Applied for ${leave.leaveType} (${leave.duration} day${leave.duration > 1 ? 's' : ''})`,
      color: 'bg-blue-500'
    },
    ...(leave.status !== 'PENDING' && leave.status !== 'CANCELLED' ? [{
      label: leave.status === 'APPROVED' || leave.status === 'UNPAID' ? 'Approved' : 'Rejected',
      date: leave.reviewDate,
      by: leave.reviewedByName || 'Manager',
      role: 'Manager',
      detail: (leave.managerComments || 'No comments')
            + (leave.documentRequired ? ` | Document required by ${leave.documentDeadline}` : ''),
      color: leave.status === 'REJECTED' ? 'bg-red-500' : 'bg-emerald-500'
    }] : []),
    ...(leave.documentRequired && leave.documentStatus && leave.documentStatus !== 'NOT_REQUIRED' ? [{
      label: leave.documentStatus === 'PENDING'  ? 'Document Awaited' :
             leave.documentStatus === 'UPLOADED' ? 'Document Uploaded' :
             leave.documentStatus === 'VERIFIED' ? 'Document Verified' : 'Document Rejected',
      date: null,
      by: leave.documentStatus === 'UPLOADED' || leave.documentStatus === 'VERIFIED'
            ? leave.employeeName : 'System',
      role: leave.documentStatus === 'VERIFIED' || leave.documentStatus === 'REJECTED'
            ? 'Manager' : 'Employee',
      detail: leave.documentStatus === 'PENDING'  ? `Must upload by ${leave.documentDeadline}` :
              leave.documentStatus === 'UPLOADED' ? 'Awaiting manager verification' :
              leave.documentStatus === 'VERIFIED' ? 'Document accepted — leave remains approved' :
              'Document rejected — leave marked UNPAID',
      color: leave.documentStatus === 'VERIFIED' ? 'bg-emerald-500' :
             leave.documentStatus === 'REJECTED' ? 'bg-red-500' :
             leave.documentStatus === 'UPLOADED' ? 'bg-blue-500' : 'bg-amber-400'
    }] : []),
    ...(leave.status === 'UNPAID' ? [{
      label: 'Marked as Unpaid',
      date: null,
      by: 'System',
      role: 'System',
      detail: 'Leave converted to unpaid due to missing or rejected document',
      color: 'bg-orange-500'
    }] : []),
    ...(leave.status === 'CANCELLED' ? [{
      label: 'Cancelled',
      date: null,
      by: leave.employeeName,
      role: 'Employee',
      detail: 'Leave request was cancelled',
      color: 'bg-gray-400'
    }] : [])
  ];

  return (
    <ManagerLayout title="Leave Details">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push('/manager/view-leaves')}
            className="p-2 hover:bg-gray-100 rounded-lg transition">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-[#0f1f3d]">Leave Request Details</h2>
            <p className="text-gray-500 text-sm">#{leave.id} — {leave.employeeName}</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left */}
          <div className="lg:col-span-2 space-y-5">

            {/* Employee */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Employee</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0f1f3d] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {leave.employeeName?.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-[#0f1f3d]">{leave.employeeName}</p>
                  <p className="text-gray-400 text-xs">{leave.department}</p>
                </div>
              </div>
            </div>

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
                  { label: 'Review Date', value: leave.reviewDate ? formatDate(leave.reviewDate) : '—' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-gray-800">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Reason</p>
                <p className="text-sm text-gray-700 leading-relaxed">{leave.reason}</p>
              </div>
            </div>

            {/* Document Status Banner — only when doc required */}
            {leave.documentRequired && (
              <div className={`rounded-xl p-5 border ${
                leave.documentStatus === 'VERIFIED' ? 'bg-emerald-50 border-emerald-200' :
                leave.documentStatus === 'REJECTED' ? 'bg-red-50 border-red-200' :
                leave.documentStatus === 'UPLOADED' ? 'bg-blue-50 border-blue-200' :
                'bg-amber-50 border-amber-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-gray-800">Supporting Document Required</p>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${docStatusBadge(leave.documentStatus)}`}>
                    {leave.documentStatus}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Deadline: <span className="font-semibold text-gray-700">{formatDate(leave.documentDeadline)}</span>
                </p>

                {/* View uploaded document */}
                {leave.documentUrl && (
                  <a href={`http://localhost:8080${leave.documentUrl}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-[#0f1f3d] hover:bg-gray-50 transition mb-3">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                    View Uploaded Document
                  </a>
                )}

                {/* Verify / Reject buttons — only when uploaded */}
                {leave.documentStatus === 'UPLOADED' && (
                  <div className="flex gap-3 mt-2">
                    <button onClick={() => handleVerifyDocument(true)} disabled={verifying}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition disabled:opacity-50">
                      {verifying ? 'Processing...' : 'Verify Document'}
                    </button>
                    <button onClick={() => handleVerifyDocument(false)} disabled={verifying}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition disabled:opacity-50">
                      {verifying ? 'Processing...' : 'Reject — Mark Unpaid'}
                    </button>
                  </div>
                )}

                {leave.documentStatus === 'PENDING' && (
                  <p className="text-xs text-amber-700 font-medium mt-1">
                    Waiting for employee to upload before {formatDate(leave.documentDeadline)}.
                  </p>
                )}
                {leave.documentStatus === 'VERIFIED' && (
                  <p className="text-xs text-emerald-700 font-medium mt-1">
                    Document accepted. Leave is fully approved.
                  </p>
                )}
              </div>
            )}

            {/* Original document — uploaded at apply time */}
            {!leave.documentRequired && leave.documentUrl && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
                  Supporting Document
                </h3>
                <a href={`http://localhost:8080${leave.documentUrl}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-[#0f1f3d] hover:bg-gray-100 transition">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                  View Document
                </a>
              </div>
            )}

            {/* Review Action — PENDING only */}
            {leave.status === 'PENDING' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">
                  Review This Request
                </h3>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Comment <span className="text-gray-400 font-normal">(required for rejection)</span>
                  </label>
                  <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
                    placeholder="Add a comment or reason..."
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0f1f3d] resize-none" />
                </div>

                {/* Optional document required toggle */}
                <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={docRequired}
                      onChange={e => setDocRequired(e.target.checked)}
                      className="w-4 h-4 accent-[#0f1f3d]" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">
                        Require Supporting Document
                      </p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        Optional — employee must upload proof or leave becomes UNPAID
                      </p>
                    </div>
                  </label>
                  {docRequired && (
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Document Deadline <span className="text-red-500">*</span>
                      </label>
                      <input type="date" value={docDeadline}
                        onChange={e => setDocDeadline(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0f1f3d]" />
                      <p className="text-xs text-gray-400 mt-1">
                        Leave will be marked UNPAID if no document uploaded by this date.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => handleReview('APPROVED')} disabled={submitting}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition disabled:opacity-50">
                    {submitting ? 'Processing...' : 'Approve'}
                  </button>
                  <button onClick={() => handleReview('REJECTED')} disabled={submitting}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition disabled:opacity-50">
                    {submitting ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </div>
            )}

            {/* Already reviewed */}
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
                {leave.managerComments && (
                  <p className={`text-sm ${
                    leave.status === 'APPROVED' || leave.status === 'UNPAID'
                      ? 'text-emerald-700' : 'text-red-700'
                  }`}>
                    "{leave.managerComments}"
                  </p>
                )}
              </div>
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
                        <p className="text-xs text-gray-500 font-medium">{event.by} · {event.role}</p>
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
                        <p className="text-xs text-gray-400 mt-1">Pending manager decision</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}