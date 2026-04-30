'use client';

import { type ReactNode } from 'react';
import { SidebarTrigger } from './sidebar-trigger';

interface SidebarContentProps {
  children: ReactNode;
}

export function SidebarContent({ children }: SidebarContentProps) {
  return (
    <main 
      className="flex-1 will-change-[margin-left]"
      style={{
        marginLeft: 'var(--sidebar-width)',
        transition: 'margin-left 500ms cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <div className="sticky top-0 z-40 bg-[#080808]/95 backdrop-blur-sm border-b border-[#1a1a1a]">
        <div className="flex items-center gap-4 h-16 px-8">
          <SidebarTrigger />
        </div>
      </div>
      
      <div className="p-8">
        {children}
      </div>
    </main>
  );
}
