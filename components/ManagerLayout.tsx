'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useEffect, useState } from 'react';
import NotificationBell from '@/components/NotificationBell';

interface ManagerLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function ManagerLayout({ children, title }: ManagerLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'manager') router.push('/');
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== 'manager') return null;

  const menuItems = [
  { name: 'Dashboard',           path: '/manager/dashboard' },
  { name: 'Add User',            path: '/manager/add-user' },
  { name: 'Leave Requests',      path: '/manager/view-leaves' },
  { name: 'Apply for Leave',     path: '/manager/apply-leave' },
  { name: 'My Leave Requests',   path: '/manager/my-leaves' },
  { name: 'Leave Calendar',      path: '/manager/calendar' },
  { name: 'Team Availability',   path: '/manager/team-availability' },
  { name: 'Reports',             path: '/manager/reports' },
  { name: 'Settings',            path: '/manager/settings' },
  { name: 'Announcements',       path: '/manager/announcements' },
  { name: 'Messages',            path: '/manager/messages' },
  { name: 'My Profile',          path: '/manager/profile' },
];
  const Sidebar = () => (
    <aside className="w-64 bg-[#0f1f3d] text-white flex flex-col h-full shadow-xl">
      <div className="px-6 py-8 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <span className="text-[#0f1f3d] font-black text-lg">LMS</span>
          </div>
          <div>
            <p className="font-bold text-white text-sm">Leave Management</p>
            <p className="text-xs text-blue-300">System</p>
          </div>
        </div>
      </div>
      <nav className="mt-5 flex-1 px-3">
        <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest px-4 mb-3">Main Menu</p>
        {menuItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
          return (
            <button key={item.path} onClick={() => { router.push(item.path); setSidebarOpen(false); }}
              className={`w-full flex items-center px-4 py-3 mb-1 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive ? 'bg-white text-[#0f1f3d] shadow font-semibold' : 'text-blue-100 hover:bg-white/10'
              }`}>
              {item.name}
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3 px-1 cursor-pointer hover:opacity-80 transition"
          onClick={() => { router.push('/manager/profile'); setSidebarOpen(false); }}>
          <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user.name.charAt(0)}{user.surname.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">{user.name} {user.surname}</p>
            <p className="text-xs text-blue-300">Manager</p>
          </div>
        </div>
        <button onClick={() => { logout(); router.push('/'); }}
          className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-lg transition border border-white/10">
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden lg:flex fixed h-full w-64 z-30"><Sidebar /></div>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 z-50"><Sidebar /></div>
        </div>
      )}
      <div className="flex-1 flex flex-col lg:ml-64">
        <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 flex justify-between items-center sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition">
              <div className="w-5 h-0.5 bg-gray-600 mb-1 rounded" />
              <div className="w-5 h-0.5 bg-gray-600 mb-1 rounded" />
              <div className="w-5 h-0.5 bg-gray-600 rounded" />
            </button>
            <h1 className="font-bold text-lg lg:text-xl text-[#0f1f3d]">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell userId={user.id} />
            <span className="text-xs text-white bg-[#0f1f3d] px-3 py-1.5 rounded-full font-semibold tracking-wide">
              Manager Portal
            </span>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}