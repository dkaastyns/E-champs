"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCompact } from "@indodev/toolkit/currency";
import { formatDate } from "@indodev/toolkit/datetime";
import { PageTransition, RevealOnScroll } from "@/components/ui/page-transition";

interface Tournament {
  id: number;
  name: string;
  slug: string;
  description: string;
  maxTeams: number;
  teamSize: number;
  registrationFee: number;
  tournamentStartDate: string;
  tournamentEndDate: string;
  status: string;
}

export default function TournamentsClient({ initialTournaments }: { initialTournaments: Tournament[] }) {
  // Membuat state untuk menyimpan teks yang diketik user
  const [searchQuery, setSearchQuery] = useState("");

  // Memfilter daftar turnamen berdasarkan teks pencarian
  const filteredTournaments = initialTournaments.filter((tournament) =>
    tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tournament.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageTransition className="space-y-8">
      {/* Page header dengan Search Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-5xl text-white uppercase mb-2">
            Tournaments
          </h1>
          <p className="font-[family-name:var(--font-body)] text-gray-400">
            Browse and register for upcoming competitions.
          </p>
        </div>
        
        {/* Ini adalah Kotak Pencariannya */}
        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Search tournaments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#6520EE] transition-colors"
          />
        </div>
      </div>

      {/* Tournament cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTournaments.map((tournament, i) => (
          <RevealOnScroll key={tournament.id} delay={i * 80}>
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-6 card-hover-glow h-full flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-[#2BE900] text-xs font-bold">OPEN FOR REGISTRATION</span>
                  <h2 className="text-xl font-bold text-white mt-1">{tournament.name}</h2>
                </div>
              </div>

              <p className="text-gray-400 text-sm mb-6">{tournament.description}</p>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{tournament.teamSize}v{tournament.teamSize}</div>
                  <div className="text-xs text-gray-500">Team Size</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{tournament.maxTeams}</div>
                  <div className="text-xs text-gray-500">Max Teams</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[#6520EE]">{formatCompact(Number(tournament.registrationFee))}</div>
                  <div className="text-xs text-gray-500">Entry Fee</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#1a1a1a] mt-auto">
                <div className="text-sm text-gray-400">
                  Starts: {tournament.tournamentStartDate ? formatDate(new Date(tournament.tournamentStartDate), 'long') : 'TBA'}
                </div>
                <Link
                  href={`/tournaments/${tournament.id}/register`}
                  className="btn-press bg-[#6520EE] hover:bg-[#7c3aed] text-white font-medium px-6 py-2 rounded transition-all text-sm hover:shadow-[0_0_16px_rgba(101,32,238,0.4)]"
                >
                  Register Team
                </Link>
              </div>
            </div>
          </RevealOnScroll>
        ))}
      </div>

      {/* Empty state (Jika turnamen tidak ditemukan) */}
      {filteredTournaments.length === 0 && (
        <RevealOnScroll>
          <div className="text-center py-12">
            <p className="text-gray-400">No tournaments match your search.</p>
          </div>
        </RevealOnScroll>
      )}
    </PageTransition>
  );
}