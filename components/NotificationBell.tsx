'use client';
import { useState, useEffect, useRef } from 'react';
import { leaveAPI } from '@/lib/api';

interface Props {
  userId: number;
}

const TYPE_STYLES: Record<string, { dot: string; icon: string }> = {
  LEAVE_APPLIED:   { dot: 'bg-blue-500',    icon: '📋' },
  LEAVE_APPROVED:  { dot: 'bg-emerald-500', icon: '✅' },
  LEAVE_REJECTED:  { dot: 'bg-red-500',     icon: '❌' },
  LEAVE_CANCELLED: { dot: 'bg-gray-400',    icon: '🚫' },
  USER_CREATED:    { dot: 'bg-purple-500',  icon: '👤' },
};

export default function NotificationBell({ userId }: Props) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Poll every 30 seconds for new notifications
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      const res = await leaveAPI.getNotifications(userId);
      if (res.success) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount);
      }
    } catch {}
  };

  const handleOpen = async () => {
    setOpen(prev => !prev);
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      await leaveAPI.markAllNotificationsRead(userId);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
    finally { setLoading(false); }
  };

  const handleMarkOneRead = async (notifId: number) => {
    try {
      await leaveAPI.markNotificationRead(notifId);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition">
        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="font-bold text-[#0f1f3d] text-sm">Notifications</p>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} disabled={loading}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition disabled:opacity-50">
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-2xl mb-2">🔔</p>
                <p className="text-gray-400 text-sm">No notifications yet</p>
                <p className="text-gray-300 text-xs mt-1">Activity will appear here</p>
              </div>
            ) : (
              notifications.map(n => {
                const style = TYPE_STYLES[n.type] ?? { dot: 'bg-gray-400', icon: '📌' };
                return (
                  <div key={n.id}
                    onClick={() => !n.read && handleMarkOneRead(n.id)}
                    className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer flex gap-3 ${
                      !n.read ? 'bg-blue-50/50' : ''
                    }`}>
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                      !n.read ? 'bg-[#0f1f3d]' : 'bg-gray-100'
                    }`}>
                      <span>{style.icon}</span>
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-semibold leading-tight ${!n.read ? 'text-[#0f1f3d]' : 'text-gray-700'}`}>
                          {n.title}
                        </p>
                        <span className="text-gray-400 text-xs flex-shrink-0">{formatTime(n.createdAt)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                    </div>
                    {/* Unread dot */}
                    {!n.read && (
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${style.dot}`} />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">{notifications.length} total notifications</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}