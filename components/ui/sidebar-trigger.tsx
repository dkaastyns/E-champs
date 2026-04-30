'use client';

import { useSidebar } from './sidebar-provider';
import { 
  CaretLeft, 
  CaretRight, 
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface SidebarTriggerProps {
  className?: string;
}

export function SidebarTrigger({ className }: SidebarTriggerProps) {
  const { collapsed, toggleSidebar } = useSidebar();

  return (
    <button
      onClick={toggleSidebar}
      className={cn(
        "w-8 h-8 rounded-full bg-[#6520EE] flex items-center justify-center text-white hover:bg-[#7c3aed] transition-colors shadow-lg",
        className
      )}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      {collapsed ? (
        <CaretRight weight="bold" className="w-4 h-4" />
      ) : (
        <CaretLeft weight="bold" className="w-4 h-4" />
      )}
    </button>
  );
}
