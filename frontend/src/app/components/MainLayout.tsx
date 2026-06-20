import { useState } from 'react';
import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex bg-slate-100 dark:bg-slate-950 overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="flex-shrink-0 overflow-visible relative z-40">
          <Topbar onMenuToggle={() => setSidebarOpen(prev => !prev)} />
        </div>
        <main className="flex-1 overflow-y-auto bg-slate-100/70 dark:bg-slate-950 relative z-0">
          <div className="min-h-full px-2 md:px-3 py-3 md:py-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
