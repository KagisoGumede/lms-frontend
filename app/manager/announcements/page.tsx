'use client';
import { useState, useEffect } from 'react';
import ManagerLayout from '@/components/ManagerLayout';
import { useAuth } from '@/lib/AuthContext';

const BASE_URL = 'http://localhost:8080/api';

const categoryStyles: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  GENERAL: { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-500',   label: 'General' },
  POLICY:  { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500', label: 'Policy' },
  HOLIDAY: { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500',  label: 'Holiday' },
  URGENT:  { bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500',    label: 'Urgent' },
};

export default function ManagerAnnouncements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    if (!user) return;
    fetch(`${BASE_URL}/announcements/user/${user.id}`)
      .then(r => {
        if (!r.ok) throw new Error('Server error');
        return r.text();
      })
      .then(text => {
        if (!text) return;
        const res = JSON.parse(text);
        if (res.success) setAnnouncements(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = filter === 'ALL'
    ? announcements
    : announcements.filter(a => a.category === filter);

  const pinned = filtered.filter(a => a.pinned);
  const regular = filtered.filter(a => !a.pinned);

  const formatDate = (dt: string) =>
    new Date(dt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });

  const AnnouncementCard = ({ a }: { a: any }) => {
    const style = categoryStyles[a.category] ?? categoryStyles.GENERAL;
    return (
      <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5 ${a.pinned ? 'border-l-4 border-l-[#0f1f3d]' : ''}`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {a.pinned && (
              <span className="flex items-center gap-1 text-xs font-semibold text-[#0f1f3d] bg-[#0f1f3d]/10 px-2 py-0.5 rounded-full">
                📌 Pinned
              </span>
            )}
            <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${style.bg} ${style.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
              {style.label}
            </span>
          </div>
          <p className="text-xs text-gray-400 whitespace-nowrap">{formatDate(a.createdAt)}</p>
        </div>
        <h3 className="font-bold text-[#0f1f3d] text-base mb-2">{a.title}</h3>
        <p className="text-gray-600 text-sm leading-relaxed">{a.content}</p>
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">Posted by <span className="font-medium text-gray-500">{a.createdByName}</span></p>
          {a.expiresAt && (
            <p className="text-xs text-gray-400">Expires: {formatDate(a.expiresAt)}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <ManagerLayout title="Announcements">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#0f1f3d] mb-1">Company Announcements</h2>
        <p className="text-gray-500 text-sm">Stay up to date with company news and updates</p>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {['ALL', 'GENERAL', 'POLICY', 'HOLIDAY', 'URGENT'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
              filter === f
                ? 'bg-[#0f1f3d] text-white'
                : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
            }`}>
            {f === 'ALL' ? 'All' : categoryStyles[f]?.label ?? f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="h-3 bg-gray-100 rounded w-1/4 mb-3" />
              <div className="h-5 bg-gray-100 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-full mb-1" />
              <div className="h-3 bg-gray-100 rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-4xl mb-3">📢</p>
          <p className="text-gray-500 font-medium">No announcements found</p>
          <p className="text-gray-400 text-sm mt-1">Check back later for updates</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pinned.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">📌 Pinned</p>
              <div className="space-y-4">
                {pinned.map(a => <AnnouncementCard key={a.id} a={a} />)}
              </div>
            </div>
          )}
          {regular.length > 0 && (
            <div>
              {pinned.length > 0 && (
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Latest</p>
              )}
              <div className="space-y-4">
                {regular.map(a => <AnnouncementCard key={a.id} a={a} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </ManagerLayout>
  );
}