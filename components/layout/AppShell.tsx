'use client';
import { useEffect } from 'react';
import { Sidebar, MobileNav } from './Sidebar';
import { AIChat } from '@/components/ai/AIChat';
import { useStore } from '@/store/useStore';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { loadAll } = useStore();

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        {children}
      </main>
      <AIChat />
      <MobileNav />
    </div>
  );
}
