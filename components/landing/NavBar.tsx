"use client";

import Image from "next/image";
import Link from "next/link";
import { Trophy, GameController, Question, User } from "@phosphor-icons/react/dist/ssr";

interface NavBarProps {
	user: {
		id: string;
		name?: string;
		email?: string;
		role?: string | null;
	} | null;
}

export function NavBar({ user }: NavBarProps) {
	return (
		<>
			{/* Desktop Top Navigation */}
			<nav className="hidden sm:block fixed top-0 left-0 right-0 z-50 bg-[#080808]/90 backdrop-blur-sm border-b border-[#1a1a1a]">
				<div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
					<Link href="/" className="flex items-center gap-2">
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
					</Link>

					<div className="flex items-center gap-6 font-[family-name:var(--font-body)]">
						<a
							href="#games"
							className="text-gray-400 hover:text-white transition-colors text-sm"
						>
							Games
						</a>
						<a
							href="#tournaments"
							className="text-gray-400 hover:text-white transition-colors text-sm"
						>
							Tournaments
						</a>
						<a
							href="#faq"
							className="text-gray-400 hover:text-white transition-colors text-sm"
						>
							FAQ
						</a>

						{user ? (
							<Link
								href="/dashboard"
								className="bg-[#6520EE] hover:bg-[#7c3aed] text-white font-medium px-5 py-2 rounded transition-colors text-sm"
							>
								Dashboard
							</Link>
						) : (
							<div className="flex items-center">
								<Link
									href="/register"
									className="bg-[#2BE900] hover:bg-[#25d100] text-black font-medium px-5 py-2 rounded transition-colors text-sm"
								>
									Get Started
								</Link>
							</div>
						)}
					</div>
				</div>
			</nav>

			{/* Mobile Top Bar - Logo only (no login button on landing page) */}
			<nav className="sm:hidden fixed top-0 left-0 right-0 z-50 bg-[#080808]/90 backdrop-blur-sm border-b border-[#1a1a1a]">
				<div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-center">
					<Link href="/" className="flex items-center gap-2">
						<Image
							src="/logo-echamps.png"
							alt="E-CHAMPS"
							width={32}
							height={32}
							className="w-8 h-8"
						/>
						<span className="font-[family-name:var(--font-display)] text-xl tracking-tight">
							<span className="text-[#6520EE]">E</span>
							<span className="text-white">-</span>
							<span className="text-[#2BE900]">CHAMPS</span>
						</span>
					</Link>
				</div>
			</nav>

			{/* Mobile Bottom Navigation */}
			<nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#080808]/95 backdrop-blur-lg border-t border-[#1a1a1a] safe-area-bottom">
				<div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-around">
					<a
						href="#games"
						className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-white transition-colors min-w-[64px]"
					>
						<Trophy size={20} weight="bold" />
						<span className="text-[10px] font-medium">Games</span>
					</a>

					<a
						href="#tournaments"
						className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-white transition-colors min-w-[64px]"
					>
						<GameController size={20} weight="bold" />
						<span className="text-[10px] font-medium">Tours</span>
					</a>

					<a
						href="#faq"
						className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-white transition-colors min-w-[64px]"
					>
						<Question size={20} weight="bold" />
						<span className="text-[10px] font-medium">FAQ</span>
					</a>

					{user ? (
						<Link
							href="/dashboard"
							className="flex flex-col items-center justify-center gap-1 text-[#6520EE] hover:text-white transition-colors min-w-[64px]"
						>
							<User size={20} weight="bold" />
							<span className="text-[10px] font-medium">Profile</span>
						</Link>
					) : (
						<Link
							href="/register"
							className="flex flex-col items-center justify-center gap-1 text-[#2BE900] hover:text-white transition-colors min-w-[64px]"
						>
							<User size={20} weight="bold" />
							<span className="text-[10px] font-medium">Start</span>
						</Link>
					)}
				</div>
			</nav>
		</>
	);
}