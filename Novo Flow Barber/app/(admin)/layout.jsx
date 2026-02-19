'use client';

import { ReactNode } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { AppProvider } from '@/lib/contexts/AppContext';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <div className="flex min-h-screen bg-[var(--bg-primary)]">
        <AdminSidebar />
        <main className="flex-1 md:ml-64 pb-6">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </AppProvider>
  );
}
