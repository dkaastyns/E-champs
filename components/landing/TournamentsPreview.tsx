import Link from 'next/link';
import { formatRupiah } from '@indodev/toolkit/currency';

const upcomingTournaments = [
  {
    id: 1,
    name: 'CS2 CHAMPIONSHIP',
    subtitle: 'Double Elimination',
    date: '5 DAYS',
    teams: '18/32',
    prize: 50000000,
    color: '#6520EE',
  },
  {
    id: 2,
    name: 'PUBG MOBILE CUP',
    subtitle: 'Squad Battle',
    date: '7 DAYS',
    teams: '34/48',
    prize: 30000000,
    color: '#2BE900',
  },
  {
    id: 3,
    name: 'VALORANT MASTERS',
    subtitle: 'Tactical FPS',
    date: '10 DAYS',
    teams: '12/32',
    prize: 75000000,
    color: '#7255EC',
  },
];

export function TournamentsPreview() {
  return (
    <section id="tournaments" className="py-16 sm:py-24 bg-[#080808]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 gap-4 sm:gap-6">
          <div>
            <span className="text-[#2BE900] text-xs sm:text-sm font-bold tracking-widest font-[family-name:var(--font-body)]">UPCOMING</span>
            <h2 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl md:text-6xl lg:text-8xl text-white uppercase leading-none mt-2">
              TOURNAMENTS
            </h2>
          </div>
          <Link
            href="/tournaments"
            className="font-[family-name:var(--font-heading)] text-[#6520EE] hover:text-white transition-colors text-lg"
          >
            VIEW ALL →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {upcomingTournaments.map((tournament, index) => (
          <div
            key={tournament.id}
            className="relative group"
          >
            <div
              className="relative bg-[#0d0d0d] border border-[#1a1a1a] p-4 sm:p-6 overflow-hidden"
              style={{
                clipPath: 'polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 0 100%)',
              }}
            >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: `linear-gradient(135deg, ${tournament.color}20 0%, transparent 50%)`,
                  }}
                />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <span
                      className="font-[family-name:var(--font-display)] text-5xl"
                      style={{ color: tournament.color }}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="font-[family-name:var(--font-heading)] text-xs text-[#2BE900] border border-[#2BE900] px-2 py-1">
                      OPEN
                    </span>
                  </div>

                  {/* Tournament Info */}
                  <h3 className="font-[family-name:var(--font-display)] text-3xl text-white mb-1">
                    {tournament.name}
                  </h3>
                  <p className="font-[family-name:var(--font-body)] text-gray-400 text-sm mb-6">
                    {tournament.subtitle}
                  </p>

                  <div className="mb-6">
                    <div className="font-[family-name:var(--font-display)] text-4xl text-white">
                      {tournament.date}
                    </div>
                    <div className="text-gray-500 text-xs font-[family-name:var(--font-body)]">UNTIL START</div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#1a1a1a] pt-4">
                    <div>
                      <div className="font-[family-name:var(--font-display)] text-2xl text-white">{tournament.teams}</div>
                      <div className="text-gray-500 text-xs font-[family-name:var(--font-body)]">TEAMS</div>
                    </div>
                    <div className="text-right">
                      <div className="font-[family-name:var(--font-display)] text-2xl" style={{ color: tournament.color }}>
                        {formatRupiah(tournament.prize)}
                      </div>
                      <div className="text-gray-500 text-xs font-[family-name:var(--font-body)]">PRIZE</div>
                    </div>
                  </div>

                  <Link
                    href="/tournaments"
                    className="block w-full mt-6 bg-[#6520EE] hover:bg-[#7c3aed] text-white font-bold py-3 text-center font-[family-name:var(--font-heading)] transition-colors"
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
