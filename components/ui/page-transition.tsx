'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Wraps page content with a fade-up entrance animation on mount.
 * Use `delay` (ms) to stagger sibling sections.
 */
export function PageTransition({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={`page-enter ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/**
 * Reveals children with a fade-up animation when they scroll into view.
 * `delay` staggers multiple siblings (ms).
 */
export function RevealOnScroll({
  children,
  className = '',
  delay = 0,
  threshold = 0.15,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={`${visible ? 'animate-fade-up' : 'opacity-0'} ${className}`}
      style={{ animationDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}
