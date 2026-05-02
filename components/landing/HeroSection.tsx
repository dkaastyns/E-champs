'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatCompact } from '@indodev/toolkit/currency';

function useCountUp(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function StatItem({
  value,
  label,
  color,
  delay,
  isVisible,
}: {
  value: string;
  label: string;
  color?: string;
  delay: string;
  isVisible: boolean;
}) {
  return (
    <div
      className={`flex items-baseline gap-2 ${isVisible ? `animate-fade-up ${delay}` : 'opacity-0'}`}
    >
      <span
        className={`font-[family-name:var(--font-display)] text-4xl ${color ?? 'text-white'}`}
      >
        {value}
      </span>
      <span className="text-gray-500 text-sm font-[family-name:var(--font-body)]">{label}</span>
    </div>
  );
}

export function HeroSection() {
  const [offset, setOffset] = useState(0);
  const [statsVisible, setStatsVisible] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  // Trigger content entrance on mount
  useEffect(() => {
    const t = setTimeout(() => setContentVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Parallax on scroll
  useEffect(() => {
    const handleScroll = () => setOffset(window.scrollY * 0.3);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Stats IntersectionObserver
  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStatsVisible(true); obs.disconnect(); } },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const prizeCount = useCountUp(500000000, 1800, statsVisible);
  const teamsCount = useCountUp(192, 1400, statsVisible);

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#080808]">

      {/* Scrolling banner strips */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ transform: `translateY(${offset}px)` }}
      >
        <div className="absolute -left-20 top-1/4 w-[200vw] h-12 bg-[#2BE900]/20 -rotate-12 flex items-center">
          <div className="animate-marquee whitespace-nowrap">
            {'PLAY FOR PURPOSE • PLAY FOR PURPOSE • PLAY FOR PURPOSE • PLAY FOR PURPOSE • '.repeat(10)}
          </div>
        </div>
        <div className="absolute -right-20 top-1/2 w-[200vw] h-8 bg-[#2BE900]/10 -rotate-12 flex items-center">
          <div className="animate-marquee-reverse whitespace-nowrap text-xs tracking-widest text-[#2BE900]/40">
            {'LEVEL UP • COMPETE • WIN • LEVEL UP • COMPETE • WIN • '.repeat(15)}
          </div>
        </div>
      </div>

      {/* Ambient glow */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#6520EE]/30 rounded-full blur-[150px] pointer-events-none animate-pulse" />
      {/* Extra top-left accent glow */}
      <div className="absolute -left-32 top-0 w-[400px] h-[400px] bg-[#2BE900]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* --- LEFT: Text content --- */}
          <div className="relative">
            {/* Badge */}
            <div className={`inline-flex items-center gap-2 mb-8 ${contentVisible ? 'animate-fade-left delay-0' : 'opacity-0'}`}>
              <span className="w-2 h-2 bg-[#2BE900] rounded-full animate-ping absolute" />
              <span className="w-2 h-2 bg-[#2BE900] rounded-full relative" />
              <span className="text-[#2BE900] text-sm font-bold tracking-widest font-[family-name:var(--font-body)] ml-1">
                REGISTRATION OPEN
              </span>
            </div>

            {/* Headline — staggered per word */}
            <h1 className="font-[family-name:var(--font-display)] text-[120px] md:text-[180px] lg:text-[220px] leading-[0.85] tracking-tight text-white uppercase">
              <span className={`block ${contentVisible ? 'animate-fade-up delay-100' : 'opacity-0'}`}>PLAY</span>
              <span className={`block text-[#6520EE] ${contentVisible ? 'animate-fade-up delay-200' : 'opacity-0'}`}>FOR</span>
              <span className={`block relative ${contentVisible ? 'animate-fade-up delay-300' : 'opacity-0'}`}>
                PURPOSE
                {/* Animated underline */}
                <span
                  className={`absolute -bottom-2 left-0 h-2 bg-[#2BE900] ${contentVisible ? 'animate-fade-right delay-500' : 'opacity-0'}`}
                  style={{ width: contentVisible ? '100%' : '0%', transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1) 0.7s' }}
                />
              </span>
            </h1>

            {/* Subtitle */}
            <p className={`font-[family-name:var(--font-body)] text-gray-400 text-lg max-w-md mt-8 mb-10 ${contentVisible ? 'animate-fade-up delay-400' : 'opacity-0'}`}>
              Join the ultimate esports tournament platform. Register your team,
              compete against the best, and claim your victory.
            </p>

            {/* CTA Buttons */}
            <div className={`flex flex-col sm:flex-row gap-4 ${contentVisible ? 'animate-fade-up delay-500' : 'opacity-0'}`}>
              <Link
                href="/tournaments"
                className="btn-press inline-flex items-center justify-center bg-[#6520EE] hover:bg-[#7c3aed] text-white font-bold px-8 py-4 rounded-none transition-all text-lg font-[family-name:var(--font-heading)] hover:shadow-[0_0_30px_rgba(101,32,238,0.5)] hover:-translate-y-1"
                style={{ transition: 'background 0.2s, box-shadow 0.3s, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}
              >
                BROWSE TOURNAMENTS
              </Link>
              <Link
                href="/register"
                className="btn-press inline-flex items-center justify-center border-2 border-[#2BE900] text-[#2BE900] hover:bg-[#2BE900] hover:text-black font-bold px-8 py-4 rounded-none transition-all text-lg font-[family-name:var(--font-heading)] hover:shadow-[0_0_20px_rgba(43,233,0,0.4)] hover:-translate-y-1"
                style={{ transition: 'background 0.2s, color 0.2s, box-shadow 0.3s, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}
              >
                CREATE ACCOUNT
              </Link>
            </div>
          </div>

          {/* --- RIGHT: Hero image with float animation --- */}
          <div className={`relative h-[600px] lg:h-[800px] ${contentVisible ? 'animate-fade-right delay-300' : 'opacity-0'}`}>
            <div className="absolute inset-0 animate-float" style={{ animationDelay: '0.5s' }}>
              <Image
                src="/hero-character.jpg"
                alt="Gaming Warrior"
                fill
                className="object-contain object-right"
                priority
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#080808]" />

            {/* Decorative corner accent */}
            <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-[#2BE900]/40 animate-pulse" />
            <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-[#6520EE]/40 animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        </div>
      </div>

      {/* --- Stats bar --- */}
      <div ref={statsRef} className="absolute bottom-0 left-0 right-0 bg-[#0d0d0d] border-t border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-3 gap-8">
            <StatItem
              value="05"
              label="GAME TITLES"
              isVisible={statsVisible}
              delay="delay-0"
            />
            <StatItem
              value={formatCompact(prizeCount)}
              label="PRIZE POOL"
              color="text-[#2BE900]"
              isVisible={statsVisible}
              delay="delay-200"
            />
            <StatItem
              value={String(teamsCount)}
              label="TEAM SLOTS"
              color="text-[#6520EE]"
              isVisible={statsVisible}
              delay="delay-400"
            />
          </div>
        </div>
      </div>

    </section>
  );
}
