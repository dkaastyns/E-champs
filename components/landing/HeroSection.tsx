'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatCompact } from '@indodev/toolkit/currency';

export function HeroSection() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.scrollY * 0.3);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#080808]">
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

      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#6520EE]/30 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="inline-flex items-center gap-2 mb-8">
              <span className="w-2 h-2 bg-[#2BE900] rounded-full animate-pulse" />
              <span className="text-[#2BE900] text-sm font-bold tracking-widest font-[family-name:var(--font-body)]">REGISTRATION OPEN</span>
            </div>

            <h1 className="font-[family-name:var(--font-display)] text-[120px] md:text-[180px] lg:text-[220px] leading-[0.85] tracking-tight text-white uppercase">
              <span className="block">PLAY</span>
              <span className="block text-[#6520EE]">FOR</span>
              <span className="block relative">
                PURPOSE
                <span className="absolute -bottom-2 left-0 w-full h-2 bg-[#2BE900]" />
              </span>
            </h1>

            <p className="font-[family-name:var(--font-body)] text-gray-400 text-lg max-w-md mt-8 mb-10">
              Join the ultimate esports tournament platform. Register your team,
              compete against the best, and claim your victory.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/tournaments"
                className="inline-flex items-center justify-center bg-[#6520EE] hover:bg-[#7c3aed] text-white font-bold px-8 py-4 rounded-none transition-all text-lg font-[family-name:var(--font-heading)]"
              >
                BROWSE TOURNAMENTS
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center border-2 border-[#2BE900] text-[#2BE900] hover:bg-[#2BE900] hover:text-black font-bold px-8 py-4 rounded-none transition-all text-lg font-[family-name:var(--font-heading)]"
              >
                CREATE ACCOUNT
              </Link>
            </div>
          </div>

          <div className="relative h-[600px] lg:h-[800px]">
            <Image
              src="/hero-character.jpg"
              alt="Gaming Warrior"
              fill
              className="object-contain object-right"
              priority
            />

            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#080808]" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-[#0d0d0d] border-t border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-3 gap-8">
            <div className="flex items-baseline gap-2">
              <span className="font-[family-name:var(--font-display)] text-4xl text-white">05</span>
              <span className="text-gray-500 text-sm font-[family-name:var(--font-body)]">GAME TITLES</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-[family-name:var(--font-display)] text-4xl text-[#2BE900]">{formatCompact(500000000)}</span>
              <span className="text-gray-500 text-sm font-[family-name:var(--font-body)]">PRIZE POOL</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-[family-name:var(--font-display)] text-4xl text-[#6520EE]">192</span>
              <span className="text-gray-500 text-sm font-[family-name:var(--font-body)]">TEAM SLOTS</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        .animate-marquee-reverse {
          animation: marquee-reverse 25s linear infinite;
        }
      `}</style>
    </section>
  );
}
