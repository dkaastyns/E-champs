'use client';

import { CollapsibleSidebar } from '@/components/ui/collapsible-sidebar';
import { 
  SquaresFour,
  Tag,
  Users,
  Calendar,
  TreeStructure,
  Sword,
  UserGear
} from '@phosphor-icons/react';

interface AdminSidebarProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
}

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: SquaresFour },
  { href: '/admin/tournaments', label: 'Tournaments', icon: Tag },
  { href: '/admin/teams', label: 'Teams', icon: Users },
  { href: '/admin/schedule', label: 'Schedule', icon: Calendar },
  { href: '/admin/brackets', label: 'Brackets', icon: TreeStructure },
  { href: '/admin/matches', label: 'Matches', icon: Sword },
  { href: '/admin/users', label: 'Users', icon: UserGear },
];

export function AdminSidebar({ user }: AdminSidebarProps) {
  return (
    <CollapsibleSidebar
      user={user}
      navItems={navItems}
      logoSrc="/logo-echamps.png"
      logoAlt="E-CHAMPS Admin"
    />
  );
}
