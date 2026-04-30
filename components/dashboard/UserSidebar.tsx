'use client';

import { CollapsibleSidebar } from '@/components/ui/collapsible-sidebar';
import { 
  SquaresFour,
  Trophy,
  Users,
  Sword,
  User
} from '@phosphor-icons/react';

interface UserSidebarProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: SquaresFour },
  { href: '/tournaments', label: 'Tournaments', icon: Trophy },
  { href: '/my-teams', label: 'My Teams', icon: Users },
  { href: '/my-matches', label: 'My Matches', icon: Sword },
  { href: '/profile', label: 'Profile', icon: User },
];

export function UserSidebar({ user }: UserSidebarProps) {
  return (
    <CollapsibleSidebar
      user={user}
      navItems={navItems}
      logoSrc="/logo-echamps.png"
      logoAlt="E-CHAMPS Logo"
    />
  );
}
