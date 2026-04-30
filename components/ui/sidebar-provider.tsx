'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const STORAGE_KEY = 'echamps-sidebar-collapsed';

interface SidebarProviderProps {
  children: ReactNode;
  defaultCollapsed?: boolean;
}

export function SidebarProvider({ 
  children, 
  defaultCollapsed = false 
}: SidebarProviderProps) {
  const [collapsed, setCollapsedState] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return defaultCollapsed;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== null ? stored === 'true' : defaultCollapsed;
  });

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(value));
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed, setCollapsed]);

  const sidebarWidth = collapsed ? '5rem' : '16rem';
  const sidebarWidthCollapsed = '5rem';
  const sidebarWidthExpanded = '16rem';

  const style = {
    '--sidebar-width': sidebarWidth,
    '--sidebar-width-collapsed': sidebarWidthCollapsed,
    '--sidebar-width-expanded': sidebarWidthExpanded,
  } as React.CSSProperties;

  return (
    <div style={style}>
      <SidebarContext.Provider value={{ collapsed, setCollapsed, toggleSidebar }}>
        {children}
      </SidebarContext.Provider>
    </div>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
