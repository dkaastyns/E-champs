'use client';

import { useEffect, useState } from 'react';

export function TargetCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show custom cursor on desktop
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => setIsVisible(false);

    // Track hoverable elements
    const handleElementHover = () => {
      const hoverables = document.querySelectorAll('a, button, [role="button"], input, textarea, select, [data-cursor-target]');
      
      hoverables.forEach((el) => {
        el.addEventListener('mouseenter', () => setIsHovering(true));
        el.addEventListener('mouseleave', () => setIsHovering(false));
      });

      return () => {
        hoverables.forEach((el) => {
          el.removeEventListener('mouseenter', () => setIsHovering(true));
          el.removeEventListener('mouseleave', () => setIsHovering(false));
        });
      };
    };

    // Initial setup
    const cleanup = handleElementHover();

    // Re-run when DOM changes
    const observer = new MutationObserver(() => {
      cleanup?.();
      handleElementHover();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('mousemove', handleMouseMove);
    document.body.addEventListener('mouseenter', handleMouseEnter);
    document.body.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.removeEventListener('mouseenter', handleMouseEnter);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
      observer.disconnect();
      cleanup?.();
    };
  }, [isVisible]);

  // Don't render on mobile/touch devices
  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return null;
  }

  return (
    <>
      {/* Main cursor dot */}
      <div
        className={`fixed pointer-events-none z-[9999] mix-blend-difference transition-transform duration-150 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Target rings */}
        <div
          className={`relative transition-all duration-200 ${
            isHovering ? 'scale-150' : 'scale-100'
          }`}
        >
          {/* Outer ring */}
          <div
            className={`absolute rounded-full border-2 transition-all duration-200 ${
              isHovering
                ? 'w-12 h-12 -left-6 -top-6 border-[#2BE900]'
                : 'w-8 h-8 -left-4 -top-4 border-white/50'
            }`}
          />
          {/* Middle ring */}
          <div
            className={`absolute rounded-full border transition-all duration-200 ${
              isHovering
                ? 'w-8 h-8 -left-4 -top-4 border-[#6520EE]'
                : 'w-5 h-5 -left-2.5 -top-2.5 border-white/70'
            }`}
          />
          {/* Center dot */}
          <div
            className={`absolute rounded-full transition-all duration-150 ${
              isHovering
                ? 'w-2 h-2 -left-1 -top-1 bg-[#2BE900]'
                : 'w-1.5 h-1.5 -left-[3px] -top-[3px] bg-white'
            }`}
          />
          {/* Crosshair lines when hovering */}
          {isHovering && (
            <>
              <div className="absolute w-16 h-[2px] bg-[#2BE900]/30 -left-8 top-0" />
              <div className="absolute w-[2px] h-16 bg-[#2BE900]/30 left-0 -top-8" />
            </>
          )}
        </div>
      </div>

      {/* Hide default cursor */}
      <style jsx global>{`
        * {
          cursor: none !important;
        }
        @media (pointer: coarse) {
          * {
            cursor: auto !important;
          }
        }
      `}</style>
    </>
  );
}
