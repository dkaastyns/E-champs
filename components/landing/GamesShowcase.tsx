'use client';

import { useRef, useEffect, useState } from 'react';
import { formatRupiah } from '@indodev/toolkit/currency';

const games = [
  {
    name: 'MOBILE LEGENDS',
    subtitle: 'Bang Bang',
    slug: 'mlbb',
    teamSize: 5,
    maxTeams: 64,
    fee: 150000,
    image: 'https://play-lh.googleusercontent.com/0gB6KEvQzyQXS6Uscx7HNjjlRMRUzEvYFqWr0TlmwHw6cw3nNRNSR9xChp-EUrk3Cq1lqTlsE1DbPgc97YClXVU=w480-h960-rw',
  },
  {
    name: 'VALORANT',
    subtitle: 'Tactical FPS',
    slug: 'valorant',
    teamSize: 5,
    maxTeams: 32,
    fee: 200000,
    image: 'https://assets.xboxservices.com/assets/36/b5/36b52fa8-e71b-4435-888a-cecb98d3876a.jpg?n=153142244433_GLP-Page-Hero-0_1083x1222_02.jpg',
  },
  {
    name: 'PUBG MOBILE',
    subtitle: 'Battle Royale',
    slug: 'pubg',
    teamSize: 4,
    maxTeams: 48,
    fee: 100000,
    image: 'https://play-lh.googleusercontent.com/bqliWUqt7QfpSC4EybIXMT_QZclpYN9ANItoMTXltshu8v0HTnFdfU_pboHzz7Zs7pqX1AfLE7eFVU8S0aSI',
  },
  {
    name: 'DOTA 2',
    subtitle: 'The International',
    slug: 'dota2',
    teamSize: 5,
    maxTeams: 16,
    fee: 250000,
    image: 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota2_social.jpg',
  },
  {
    name: 'CS2',
    subtitle: 'Counter-Strike',
    slug: 'cs2',
    teamSize: 5,
    maxTeams: 32,
    fee: 175000,
    image: 'https://cdn.akamai.steamstatic.com/steam/apps/730/header.jpg',
  },
];

export function GamesShowcase() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Trigger entrance animation when scrolled into view
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

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -400 : 400,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section ref={sectionRef} id="games" className="py-24 bg-[#0d0d0d] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <div className="flex items-end justify-between">
          <div>
            <span
              className={`text-[#2BE900] text-sm font-bold tracking-widest font-[family-name:var(--font-body)] block ${visible ? 'animate-fade-left delay-0' : 'opacity-0'}`}
            >
              FEATURED
            </span>
            <h2
              className={`font-[family-name:var(--font-display)] text-6xl md:text-8xl text-white uppercase leading-none mt-2 ${visible ? 'animate-fade-up delay-100' : 'opacity-0'}`}
            >
              GAMES
            </h2>
            <p
              className={`font-[family-name:var(--font-body)] text-gray-400 max-w-xl mt-4 ${visible ? 'animate-fade-up delay-200' : 'opacity-0'}`}
            >
              Choose your battlefield. From tactical shooters to strategic MOBAs.
            </p>
          </div>

          {/* Scroll buttons */}
          <div className={`flex gap-2 ${visible ? 'animate-fade-right delay-200' : 'opacity-0'}`}>
            <button
              onClick={() => scroll('left')}
              className="w-12 h-12 border border-[#1a1a1a] hover:border-[#6520EE] flex items-center justify-center text-white transition-all duration-300 hover:bg-[#6520EE]/10 hover:scale-110 active:scale-95"
            >
              ←
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-12 h-12 border border-[#1a1a1a] hover:border-[#6520EE] flex items-center justify-center text-white transition-all duration-300 hover:bg-[#6520EE]/10 hover:scale-110 active:scale-95"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Cards row */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide px-6 pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {games.map((game, index) => {
          return (
            <div
              key={game.slug}
              className={`relative flex-shrink-0 w-[300px] md:w-[350px] group hover-lift ${visible ? 'animate-fade-up' : 'opacity-0'}`}
              style={{ animationDelay: visible ? `${200 + index * 100}ms` : '0ms' }}
            >
              {/* Card */}
              <div className="relative h-[400px] overflow-hidden">
                {/* Background image with zoom-on-hover */}
                <div className="absolute inset-0">
                  <div
                    className="w-full h-full bg-cover bg-center transition-transform duration-700 ease-in-out group-hover:scale-110"
                    style={{ backgroundImage: `url(${game.image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                </div>

                {/* Purple overlay on hover */}
                <div className="absolute inset-0 bg-[#6520EE]/0 group-hover:bg-[#6520EE]/20 transition-all duration-500" />

                {/* Shimmer overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" />

                {/* Content */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-400 ease-out">
                    <span className="inline-block bg-[#2BE900] text-black text-xs font-bold px-2 py-1 mb-2">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <h3 className="font-[family-name:var(--font-display)] text-4xl text-white leading-none">
                      {game.name}
                    </h3>
                    <p className="font-[family-name:var(--font-heading)] text-[#2BE900] text-sm">
                      {game.subtitle}
                    </p>

                    {/* Stats — fade in on hover */}
                    <div className="grid grid-cols-3 gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 delay-75 translate-y-2 group-hover:translate-y-0">
                      <div className="text-center">
                        <div className="font-[family-name:var(--font-display)] text-2xl text-white">{game.teamSize}</div>
                        <div className="text-gray-500 text-xs font-[family-name:var(--font-body)]">VS</div>
                      </div>
                      <div className="text-center">
                        <div className="font-[family-name:var(--font-display)] text-2xl text-white">{game.maxTeams}</div>
                        <div className="text-gray-500 text-xs font-[family-name:var(--font-body)]">TEAMS</div>
                      </div>
                      <div className="text-center">
                        <div className="font-[family-name:var(--font-display)] text-2xl text-[#6520EE]">{formatRupiah(game.fee)}</div>
                        <div className="text-gray-500 text-xs font-[family-name:var(--font-body)]">FEE</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Corner accent with smooth slide */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#2BE900] transform rotate-45 translate-x-8 -translate-y-8 group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-400 ease-out" />

                {/* Bottom border glow on hover */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6520EE] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out origin-left" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
