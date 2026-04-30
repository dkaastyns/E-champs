import Image from "next/image";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { HeroSection } from "@/components/landing/HeroSection";
import { GamesShowcase } from "@/components/landing/GamesShowcase";
import { TournamentsPreview } from "@/components/landing/TournamentsPreview";
import { FAQSection } from "@/components/landing/FAQSection";
import { NavBar } from "@/components/landing/NavBar";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="min-h-screen bg-[#080808]">
      <NavBar user={session?.user || null} />
      <main>
        <HeroSection />
        <GamesShowcase />
        <TournamentsPreview />
        <FAQSection />
      </main>
      <footer className="bg-[#0d0d0d] border-t border-[#1a1a1a] py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Image
                src="/logo-echamps.png"
                alt="E-CHAMPS Logo"
                width={40}
                height={40}
                className="w-10 h-10"
              />
              <span className="font-[family-name:var(--font-display)] text-2xl tracking-tight">
                <span className="text-[#6520EE]">E</span>
                <span className="text-white">-</span>
                <span className="text-[#2BE900]">CHAMPS</span>
              </span>
            </div>
            <div className="text-gray-500 text-sm">
              © 2025 E-Champs. Level up your game.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
