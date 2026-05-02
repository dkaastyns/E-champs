'use client';

import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';
import { formatRupiah } from '@indodev/toolkit/currency';

const upcomingTournaments = [
  {
    id: 1,
    name: 'CS2 CHAMPIONSHIP',
    subtitle: 'Double Elimination',
    date: '5 DAYS',
    teams: '18/32',
    teamsRegistered: 18,
    teamsMax: 32,
    prize: 50000000,
    color: '#6520EE',
  },
  {
    id: 2,
    name: 'PUBG MOBILE CUP',
    subtitle: 'Squad Battle',
    date: '7 DAYS',
    teams: '34/48',
    teamsRegistered: 34,
    teamsMax: 48,
    prize: 30000000,
    color: '#2BE900',
  },
  {
    id: 3,
    name: 'VALORANT MASTERS',
    subtitle: 'Tactical FPS',
    date: '10 DAYS',
    teams: '12/32',
    teamsRegistered: 12,
    teamsMax: 32,
    prize: 75000000,
    color: '#7255EC',
  },
];

function ProgressBar({
  registered,
  max,
  color,
  animate,
}: {
  registered: number;
  max: number;
  color: string;
  animate: boolean;
}) {
  const pct = Math.round((registered / max) * 100);
  return (
    <div className="mt-3 mb-1">
      <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            background: color,
            width: animate ? `${pct}%` : '0%',
            boxShadow: animate ? `0 0 8px ${color}88` : 'none',
          }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-gray-600 text-xs font-[family-name:var(--font-body)]">{registered} teams</span>
        <span className="text-gray-600 text-xs font-[family-name:var(--font-body)]">{pct}% full</span>
      </div>
    </div>
  );
}

export function TournamentsPreview() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="tournaments" className="py-24 bg-[#080808]">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <span className={`text-[#2BE900] text-sm font-bold tracking-widest font-[family-name:var(--font-body)] block ${visible ? 'animate-fade-left delay-0' : 'opacity-0'}`}>
              UPCOMING
            </span>
            <h2 className={`font-[family-name:var(--font-display)] text-6xl md:text-8xl text-white uppercase leading-none mt-2 ${visible ? 'animate-fade-up delay-100' : 'opacity-0'}`}>
              TOURNAMENTS
            </h2>
          </div>
          <Link
            href="/tournaments"
            className={`nav-link-animated font-[family-name:var(--font-heading)] text-[#6520EE] hover:text-white transition-colors text-lg pb-1 ${visible ? 'animate-fade-right delay-200' : 'opacity-0'}`}
          >
            VIEW ALL →
          </Link>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {upcomingTournaments.map((tournament, index) => (
            <div
              key={tournament.id}
              className={`relative group card-hover-glow ${visible ? 'animate-fade-up' : 'opacity-0'}`}
              style={{ animationDelay: visible ? `${200 + index * 150}ms` : '0ms' }}
            >
              <div
                className="relative bg-[#0d0d0d] border border-[#1a1a1a] p-6 overflow-hidden h-full"
                style={{
                  clipPath: 'polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 0 100%)',
                }}
              >
                {/* Gradient overlay on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `linear-gradient(135deg, ${tournament.color}20 0%, transparent 60%)` }}
                />

                {/* Shimmer strip on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" />

                {/* Content */}
                <div className="relative z-10">
                  {/* Number + Status badge */}
                  <div className="flex items-start justify-between mb-6">
                    <span
                      className="font-[family-name:var(--font-display)] text-5xl transition-all duration-300 group-hover:scale-110 origin-left"
                      style={{ color: tournament.color }}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="font-[family-name:var(--font-heading)] text-xs text-[#2BE900] border border-[#2BE900] px-2 py-1 animate-green-glow">
                      OPEN
                    </span>
                  </div>

                  {/* Name */}
                  <h3 className="font-[family-name:var(--font-display)] text-3xl text-white mb-1 group-hover:text-opacity-90 transition-colors duration-300">
                    {tournament.name}
                  </h3>
                  <p className="font-[family-name:var(--font-body)] text-gray-400 text-sm mb-6">
                    {tournament.subtitle}
                  </p>

                  {/* Countdown */}
                  <div className="mb-4">
                    <div
                      className="font-[family-name:var(--font-display)] text-4xl text-white transition-all duration-300 group-hover:scale-105 origin-left"
                      style={{ color: 'white' }}
                    >
                      {tournament.date}
                    </div>
                    <div className="text-gray-500 text-xs font-[family-name:var(--font-body)]">UNTIL START</div>
                  </div>

                  {/* Team progress bar */}
                  <ProgressBar
                    registered={tournament.teamsRegistered}
                    max={tournament.teamsMax}
                    color={tournament.color}
                    animate={visible}
                  />

                  {/* Stats row */}
                  <div className="flex items-center justify-between border-t border-[#1a1a1a] pt-4 mt-4">
                    <div>
                      <div className="font-[family-name:var(--font-display)] text-2xl text-white">{tournament.teams}</div>
                      <div className="text-gray-500 text-xs font-[family-name:var(--font-body)]">TEAMS</div>
                    </div>
                    <div className="text-right">
                      <div
                        className="font-[family-name:var(--font-display)] text-2xl transition-all duration-300 group-hover:scale-105 origin-right"
                        style={{ color: tournament.color }}
                      >
                        {formatRupiah(tournament.prize)}
                      </div>
                      <div className="text-gray-500 text-xs font-[family-name:var(--font-body)]">PRIZE</div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Link
                    href="/tournaments"
                    className="btn-press block w-full mt-6 text-white font-bold py-3 text-center font-[family-name:var(--font-heading)] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                    style={{
                      background: tournament.color,
                      boxShadow: '0 0 0 rgba(0,0,0,0)',
                      transition: 'background 0.2s, box-shadow 0.3s, transform 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 24px ${tournament.color}66`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 rgba(0,0,0,0)`;
                    }}
                  >
                    REGISTER NOW
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
