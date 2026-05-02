'use client';

import Link from 'next/link';
import { useState } from 'react';
import { RevealOnScroll } from '@/components/ui/page-transition';
import { Hexagon, Diamond, ChartBar } from '@phosphor-icons/react';

// Icon components stay here — never pass them as props from Server Components
const quickActions = [
  { href: '/admin/tournaments/new', label: 'Create Tournament', desc: 'Set up new tournament events',          icon: Hexagon,  color: '#6520EE' },
  { href: '/admin/teams',           label: 'Verify Payments',   desc: 'Review and approve team registrations', icon: Diamond,  color: '#2BE900' },
  { href: '/admin/brackets',        label: 'Manage Brackets',   desc: 'Configure tournament brackets',         icon: ChartBar, color: '#6520EE' },
];

function ActionCard({ action }: { action: typeof quickActions[number] }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={action.href}
      className="group block rounded-lg p-5 transition-all duration-300 hover:-translate-y-1"
      style={{
        background:  hovered ? `${action.color}20` : `${action.color}10`,
        border:      `1px solid ${hovered ? `${action.color}60` : `${action.color}30`}`,
        boxShadow:   hovered ? `0 8px 24px ${action.color}20` : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"
        style={{ background: `${action.color}20` }}
      >
        <action.icon className="w-6 h-6" style={{ color: action.color }} weight="fill" />
      </div>
      <div className="text-white font-semibold font-[family-name:var(--font-body)] mb-1">
        {action.label}
      </div>
      <div className="text-gray-500 text-sm font-[family-name:var(--font-body)]">
        {action.desc}
      </div>
    </Link>
  );
}

export function AdminQuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {quickActions.map((action, i) => (
        <RevealOnScroll key={action.href} delay={500 + i * 80}>
          <ActionCard action={action} />
        </RevealOnScroll>
      ))}
    </div>
  );
}
