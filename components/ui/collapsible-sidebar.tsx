'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { useSidebar } from './sidebar-provider';
import { cn } from '@/lib/utils';
import {
  SignOut,
  type Icon as PhosphorIcon
} from '@phosphor-icons/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface NavItem {
  href: string;
  label: string;
  icon: PhosphorIcon;
}

interface CollapsibleSidebarProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
  navItems: NavItem[];
  logoSrc: string;
  logoAlt: string;
}

export function CollapsibleSidebar({
  user,
  navItems,
  logoSrc,
  logoAlt,
}: CollapsibleSidebarProps) {
  const { collapsed } = useSidebar();
  const pathname = usePathname();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const handleLogout = async () => {
    await authClient.signOut();
    window.location.href = '/';
  };

  const openLogoutDialog = () => {
    setIsLogoutDialogOpen(true);
  };

  const closeLogoutDialog = () => {
    setIsLogoutDialogOpen(false);
  };

  return (
    <aside
      className="group fixed left-0 top-0 h-full bg-[#0d0d0d] rounded-r-3xl z-50 flex flex-col will-change-[width]"
      style={{
        width: 'var(--sidebar-width)',
        transition: 'width 500ms cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      data-state={collapsed ? 'collapsed' : 'expanded'}
    >
        <div className="p-6 flex items-center justify-center min-h-[88px]">
          <Link href="/dashboard" className="flex items-center gap-3 group-data-[state=collapsed]:gap-0">
            <Image
              src={logoSrc}
              alt={logoAlt}
              width={48}
              height={48}
              className="w-12 h-12 flex-shrink-0"
            />
            <span
              className={cn(
                "font-[family-name:var(--font-display)] text-2xl tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out",
                "group-data-[state=collapsed]:opacity-0 group-data-[state=collapsed]:w-0 group-data-[state=collapsed]:max-w-0"
              )}
            >
              <span className="text-[#6520EE]">E</span>
              <span className="text-white">-</span>
              <span className="text-[#2BE900]">CHAMPS</span>
            </span>
          </Link>
        </div>

        <div className="mx-4 border-t border-[#5A5A5A]/50" />

        <nav className="flex-1 flex flex-col justify-center px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(`${item.href}/`));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-300 ease-in-out",
                  "group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:gap-0 group-data-[state=expanded]:justify-start",
                  isActive
                    ? 'bg-white/5 text-[#6520EE]'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon className="w-6 h-6 flex-shrink-0 transition-transform duration-300" weight={isActive ? 'fill' : 'regular'} />
                <span
                  className={cn(
                    "font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out",
                    "group-data-[state=collapsed]:opacity-0 group-data-[state=collapsed]:w-0 group-data-[state=collapsed]:max-w-0"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mx-4 border-t border-white/10" />

        <div className="p-4">
          <div className="flex items-center gap-3 transition-all duration-300 group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:gap-0 group-data-[state=expanded]:px-3">
            <div className="w-10 h-10 rounded-full bg-[#6520EE] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || 'User'}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                user.name?.charAt(0).toUpperCase() || 'U'
              )}
            </div>

            <div
              className={cn(
                "flex-1 min-w-0 overflow-hidden transition-all duration-300 ease-in-out",
                "group-data-[state=collapsed]:opacity-0 group-data-[state=collapsed]:w-0 group-data-[state=collapsed]:max-w-0"
              )}
            >
              <p className="text-white font-medium text-sm truncate">{user.name}</p>
              <p className="text-white/50 text-xs truncate">{user.email}</p>
            </div>

            <div
              className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                "group-data-[state=collapsed]:opacity-0 group-data-[state=collapsed]:w-0 group-data-[state=collapsed]:max-w-0"
              )}
            >
              <button
                onClick={openLogoutDialog}
                className="flex items-center justify-center w-10 h-10 rounded-xl text-white/70 hover:text-red-400 hover:bg-white/5 transition-all duration-300"
                aria-label="Sign Out"
              >
                <SignOut className="w-5 h-5 flex-shrink-0" />
              </button>
            </div>
          </div>
        </div>

        <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sign Out?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to sign out? You will be redirected to the home page.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={closeLogoutDialog}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
                Sign Out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </aside>
  );
}
