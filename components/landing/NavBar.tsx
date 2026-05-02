"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

interface NavBarProps {
	user: {
		id: string;
		name?: string;
		email?: string;
		role?: string | null;
	} | null;
}

export function NavBar({ user }: NavBarProps) {
	const [scrolled, setScrolled] = useState(false);
	const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 20);
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	return (
		<nav
			className={`fixed top-0 left-0 right-0 z-50 border-b border-[#1a1a1a] transition-all duration-500 ${
				scrolled
					? "bg-[#080808]/98 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
					: "bg-[#080808]/80 backdrop-blur-sm"
			}`}
		>
			<div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
				{/* Logo */}
				<Link
					href="/"
					className={`flex items-center gap-2 transition-all duration-300 hover:opacity-80 ${mounted ? "animate-fade-left delay-0" : "opacity-0"}`}
				>
					<Image
						src="/logo-echamps.png"
						alt="E-CHAMPS Logo"
						width={40}
						height={40}
						className="w-10 h-10 transition-transform duration-300 hover:rotate-6"
					/>
					<span className="font-[family-name:var(--font-display)] text-2xl tracking-tight">
						<span className="text-[#6520EE]">E</span>
						<span className="text-white">-</span>
						<span className="text-[#2BE900]">CHAMPS</span>
					</span>
				</Link>

				{/* Nav Links */}
				<div className="flex items-center gap-6 font-[family-name:var(--font-body)]">
					{[
						{ href: "#games", label: "Games", delay: "delay-100" },
						{ href: "#tournaments", label: "Tournaments", delay: "delay-200" },
						{ href: "#faq", label: "FAQ", delay: "delay-300" },
					].map(({ href, label, delay }) => (
						<a
							key={href}
							href={href}
							className={`nav-link-animated text-gray-400 hover:text-white transition-colors duration-300 text-sm pb-1 ${mounted ? `animate-fade-in ${delay}` : "opacity-0"}`}
						>
							{label}
						</a>
					))}

					<div className={`${mounted ? "animate-fade-right delay-400" : "opacity-0"}`}>
						{user ? (
							<Link
								href="/dashboard"
								className="btn-press bg-[#6520EE] hover:bg-[#7c3aed] text-white font-medium px-5 py-2 rounded transition-colors text-sm animate-glow-pulse"
							>
								Dashboard
							</Link>
						) : (
							<Link
								href="/register"
								className="btn-press bg-[#2BE900] hover:bg-[#25d100] text-black font-bold px-5 py-2 rounded transition-all text-sm hover:shadow-[0_0_20px_rgba(43,233,0,0.4)]"
							>
								Get Started
							</Link>
						)}
					</div>
				</div>
			</div>
		</nav>
	);
}
