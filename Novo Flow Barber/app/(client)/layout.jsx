'use client';

import { ReactNode } from 'react';
import ClientBottomNav from '@/components/client/ClientBottomNav';
import { AppProvider } from '@/lib/contexts/AppContext';

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <div className="min-h-screen bg-[var(--bg-primary)] max-w-md mx-auto">
        <main className="pb-24 min-h-screen">{children}</main>
        <ClientBottomNav />
      </div>
    </AppProvider>
  );
}
