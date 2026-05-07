'use client';

import { type ReactNode } from 'react';
import { SidebarTrigger } from './sidebar-trigger';

interface SidebarContentProps {
  children: ReactNode;
}

export function SidebarContent({ children }: SidebarContentProps) {
  return (
    <main className="flex-1 min-w-0 ml-[var(--sidebar-width)] transition-[margin] duration-500 min-h-screen flex flex-col">
      <div className="sticky top-0 z-40 bg-[#080808]/95 backdrop-blur-sm border-b border-[#1a1a1a]">
        <div className="flex items-center gap-4 h-16 px-4 md:px-8">
          <SidebarTrigger />
        </div>
      </div>

      <div className="flex-1 p-4 md:p-8">
        {children}
      </div>
    </main>
  );
}
