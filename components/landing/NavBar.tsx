"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { List, X } from "@phosphor-icons/react/dist/ssr";

interface NavBarProps {
	user: {
		id: string;
		name?: string;
		email?: string;
		role?: string | null;
	} | null;
}

export function NavBar({ user }: NavBarProps) {
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	return (
		<nav className="fixed top-0 left-0 right-0 z-50 bg-[#080808]/90 backdrop-blur-sm border-b border-[#1a1a1a]">
			<div className="max-w-7xl mx-auto px-4 min-[391px]:px-6 h-14 min-[391px]:h-16 flex items-center justify-between">
				<Link href="/" className="flex items-center gap-2">
					<Image
						src="/logo-echamps.png"
						alt="E-CHAMPS Logo"
						width={40}
						height={40}
						className="w-8 min-[391px]:w-10 h-8 min-[391px]:h-10"
					/>
					<span className="font-[family-name:var(--font-display)] text-xl min-[391px]:text-2xl tracking-tight">
						<span className="text-[#6520EE]">E</span>
						<span className="text-white">-</span>
						<span className="text-[#2BE900]">CHAMPS</span>
					</span>
				</Link>

				{/* Desktop Nav - Hidden on mobile (below 390px) */}
				<div className="hidden min-[391px]:flex items-center gap-6 font-[family-name:var(--font-body)]">
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

				{/* Mobile Hamburger - Visible below 390px */}
				<button
					className="min-[391px]:hidden p-2 text-white"
					onClick={() => setIsMenuOpen(!isMenuOpen)}
					aria-label="Toggle menu"
				>
					{isMenuOpen ? <X size={24} /> : <List size={24} />}
				</button>
			</div>

			{/* Mobile Dropdown Menu - Visible below 390px */}
			{isMenuOpen && (
				<div className="min-[391px]:hidden absolute top-full left-0 right-0 bg-[#080808]/95 backdrop-blur-lg border-b border-[#1a1a1a]">
					<div className="flex flex-col p-4 gap-4 font-[family-name:var(--font-body)]">
						<a
							href="#games"
							className="text-gray-400 hover:text-white transition-colors text-base py-2"
							onClick={() => setIsMenuOpen(false)}
						>
							Games
						</a>
						<a
							href="#tournaments"
							className="text-gray-400 hover:text-white transition-colors text-base py-2"
							onClick={() => setIsMenuOpen(false)}
						>
							Tournaments
						</a>
						<a
							href="#faq"
							className="text-gray-400 hover:text-white transition-colors text-base py-2"
							onClick={() => setIsMenuOpen(false)}
						>
							FAQ
						</a>
						{user ? (
							<Link
								href="/dashboard"
								className="bg-[#6520EE] hover:bg-[#7c3aed] text-white font-medium px-5 py-3 rounded transition-colors text-base text-center mt-2"
								onClick={() => setIsMenuOpen(false)}
							>
								Dashboard
							</Link>
						) : (
							<Link
								href="/register"
								className="bg-[#2BE900] hover:bg-[#25d100] text-black font-medium px-5 py-3 rounded transition-colors text-base text-center mt-2"
								onClick={() => setIsMenuOpen(false)}
							>
								Get Started
							</Link>
						)}
					</div>
				</div>
			)}
		</nav>
	);
}
