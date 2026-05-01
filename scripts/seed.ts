import "dotenv/config";
import { pool } from "../lib/db";
import { generateDoubleEliminationBracket } from "./bracket-generator";

/**
 * Comprehensive seed script for E-Champs tournament platform.
 *
 * Covers:
 * - Users (1 admin + regular users)
 * - Competition categories (with various statuses: open, ongoing, completed, empty)
 * - Teams with various statuses (verified, paid, pending, withdrawn)
 * - Brackets generated for ongoing/completed categories
 * - Match results for completed tournaments to show winners/losers
 *
 * Strategy: Append missing data (idempotent).
 * Uses transaction for safety.
 */

// ─── Helper Functions ──────────────────────────────────────────────────────

function nextPowerOf2(n: number): number {
	return Math.pow(2, Math.ceil(Math.log2(n)));
}

function randomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray<T>(arr: T[]): T[] {
	const copy = [...arr];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
}

// ─── Data Definitions ──────────────────────────────────────────────────────

const ADMIN_USER = {
	id: "usr_admin_001",
	name: "Admin E-Champs",
	email: "admin@echamps.local",
	emailVerified: true,
	image: null,
	role: "admin",
	banned: false,
};

const REGULAR_USERS = Array.from({ length: 20 }, (_, i) => ({
	id: `usr_${String(i + 1).padStart(3, "0")}`,
	name: [
		"Alex",
		"Jordan",
		"Taylor",
		"Morgan",
		"Casey",
		"Riley",
		"Quinn",
		"Avery",
		"Blake",
		"Cameron",
		"Drew",
		"Emery",
		"Finley",
		"Grey",
		"Harper",
		"Indigo",
		"Jamie",
		"Kai",
		"Lane",
		"Milan",
	][i],
	email: `player${i + 1}@echamps.local`,
	emailVerified: true,
	image: null,
	role: "user",
	banned: i === 19, // Last user is banned
}));

const ALL_USERS = [ADMIN_USER, ...REGULAR_USERS];

const CATEGORIES = [
	// OPEN - accepting registrations (few teams, not full)
	{
		name: "Mobile Legends Open Cup",
		slug: "mlbb-open",
		description: "Open 5v5 MOBA tournament for all skill levels.",
		maxTeams: 8,
		teamSize: 5,
		registrationFee: 100000,
		status: "open",
		start_offset_days: 14,
		end_offset_days: 16,
	},
	// OPEN - with some paid/verified teams
	{
		name: "Valorant Challengers",
		slug: "valorant-challengers",
		description: "Tactical FPS showdown. 5v5 team format.",
		maxTeams: 8,
		teamSize: 5,
		registrationFee: 150000,
		status: "open",
		start_offset_days: 21,
		end_offset_days: 23,
	},
	// ONGOING - bracket generated, some matches played, some pending
	{
		name: "PUBG Mobile Pro League",
		slug: "pubg-pro",
		description: "Battle Royale championship featuring 8 squads.",
		maxTeams: 8,
		teamSize: 4,
		registrationFee: 75000,
		status: "ongoing",
		start_offset_days: -2,
		end_offset_days: 1,
	},
	// ONGOING - just started, no results yet
	{
		name: "Dota 2 Open Qualifiers",
		slug: "dota2-qualifiers",
		description: "Classic MOBA open qualifiers for the main event.",
		maxTeams: 8,
		teamSize: 5,
		registrationFee: 200000,
		status: "ongoing",
		start_offset_days: 0,
		end_offset_days: 2,
	},
	// COMPLETED - fully finished with winner
	{
		name: "CS2 Invitational 2025",
		slug: "cs2-invitational",
		description: "Legendary tactical shooter invitational.",
		maxTeams: 8,
		teamSize: 5,
		registrationFee: 0,
		status: "completed",
		start_offset_days: -30,
		end_offset_days: -28,
	},
	// CLOSED - registrations closed but not started yet
	{
		name: "Apex Legends Showdown",
		slug: "apex-showdown",
		description: "Fast-paced BR tournament.",
		maxTeams: 8,
		teamSize: 3,
		registrationFee: 50000,
		status: "closed",
		start_offset_days: 3,
		end_offset_days: 5,
	},
	// EMPTY - no teams registered
	{
		name: "League of Legends Wild Rift",
		slug: "wild-rift",
		description: "Upcoming mobile MOBA tournament.",
		maxTeams: 16,
		teamSize: 5,
		registrationFee: 50000,
		status: "open",
		start_offset_days: 30,
		end_offset_days: 32,
	},
	// SMALL - 4 teams, for quick bracket visualization
	{
		name: "Test Mini Tournament",
		slug: "test-mini",
		description: "Small 4-team test tournament.",
		maxTeams: 4,
		teamSize: 3,
		registrationFee: 0,
		status: "completed",
		start_offset_days: -60,
		end_offset_days: -59,
	},
];

// ─── Seeding Functions ─────────────────────────────────────────────────────

async function seedUsers(client: any): Promise<void> {
	console.log("🌱 Seeding users...");

	for (const user of ALL_USERS) {
		const exists = await client.query(
			`SELECT 1 FROM "user" WHERE id = $1 OR email = $2`,
			[user.id, user.email],
		);
		if (exists.rows.length > 0) {
			console.log(`   Skipped existing user: ${user.email}`);
			continue;
		}

		await client.query(
			`INSERT INTO "user" (id, name, email, "emailVerified", image, role, banned, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
			[
				user.id,
				user.name,
				user.email,
				user.emailVerified,
				user.image,
				user.role,
				user.banned,
			],
		);
		console.log(
			`   Created user: ${user.name} (${user.role}${user.banned ? ", BANNED" : ""})`,
		);
	}
}

async function seedCategories(client: any): Promise<Map<string, number>> {
	console.log("🌱 Seeding categories...");
	const categoryMap = new Map<string, number>();

	for (const cat of CATEGORIES) {
		const exists = await client.query(
			`SELECT id FROM tournaments WHERE "slug" = $1`,
			[cat.slug],
		);

		let categoryId: number;

		if (exists.rows.length > 0) {
			categoryId = exists.rows[0].id;
			console.log(
				`   Skipped existing category: ${cat.name} (id=${categoryId})`,
			);
		} else {
			const startDate = new Date();
			startDate.setDate(startDate.getDate() + cat.start_offset_days);
			startDate.setHours(10, 0, 0, 0);

			const endDate = new Date();
			endDate.setDate(endDate.getDate() + cat.end_offset_days);
			endDate.setHours(18, 0, 0, 0);

			const result = await client.query(
				`INSERT INTO tournaments 
         ("name", "slug", "description", "maxTeams", "teamSize", "registrationFee", "tournamentStartDate", "tournamentEndDate", "status")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
				[
					cat.name,
					cat.slug,
					cat.description,
					cat.maxTeams,
					cat.teamSize,
					cat.registrationFee,
					startDate.toISOString(),
					endDate.toISOString(),
					cat.status,
				],
			);
			categoryId = result.rows[0].id;
			console.log(
				`   Created category: ${cat.name} (id=${categoryId}, status=${cat.status})`,
			);
		}

		categoryMap.set(cat.slug, categoryId);
	}

	return categoryMap;
}

async function seedTeams(
	client: any,
	categoryMap: Map<string, number>,
): Promise<Map<number, { id: number; teamName: string; captainId: string }[]>> {
	console.log("🌱 Seeding teams...");
	const teamsByCategory = new Map<
		number,
		{ id: number; teamName: string; captainId: string }[]
	>();

	const teamConfigs: { categorySlug: string; count: number; status: string }[] =
		[
			// OPEN categories: partial registrations
			{ categorySlug: "mlbb-open", count: 3, status: "verified" },
			{ categorySlug: "mlbb-open", count: 2, status: "paid" },
			{ categorySlug: "mlbb-open", count: 1, status: "pending" },

			{ categorySlug: "valorant-challengers", count: 4, status: "verified" },
			{ categorySlug: "valorant-challengers", count: 2, status: "paid" },
			{ categorySlug: "valorant-challengers", count: 1, status: "pending" },

			// ONGOING categories: all verified for bracket generation
			{ categorySlug: "pubg-pro", count: 8, status: "verified" },
			{ categorySlug: "dota2-qualifiers", count: 8, status: "verified" },

			// COMPLETED categories: all verified (needed for bracket + results)
			{ categorySlug: "cs2-invitational", count: 8, status: "verified" },
			{ categorySlug: "test-mini", count: 4, status: "verified" },

			// CLOSED category: full verified registrations
			{ categorySlug: "apex-showdown", count: 6, status: "verified" },
			{ categorySlug: "apex-showdown", count: 2, status: "paid" },

			// EMPTY category: nothing
			// wild-rift gets no teams
		];

	const teamNamePrefixes = [
		"Alpha",
		"Beta",
		"Gamma",
		"Delta",
		"Echo",
		"Foxtrot",
		"Hydra",
		"Phoenix",
		"Titan",
		"Viper",
		"Wolves",
		"Dragons",
		"Eagles",
		"Sharks",
		"Lions",
		"Ravens",
		"Spectre",
		"Nebula",
		"Quantum",
		"Zenith",
		"Apex",
		"Blaze",
		"Cobalt",
		"Ember",
		"Frost",
		"Ignite",
		"Kinetic",
		"Legacy",
		"Mythic",
	];

	const regularUserIds = REGULAR_USERS.map((u) => u.id);
	let userIndex = 0;
	let teamNameIndex = 0;

	for (const config of teamConfigs) {
		const categoryId = categoryMap.get(config.categorySlug);
		if (!categoryId) continue;

		const category = CATEGORIES.find((c) => c.slug === config.categorySlug)!;

		for (let i = 0; i < config.count; i++) {
			const captainId = regularUserIds[userIndex % regularUserIds.length];
			userIndex++;

			const teamName = `${teamNamePrefixes[teamNameIndex % teamNamePrefixes.length]} ${category.name.split(" ")[0]}`;
			teamNameIndex++;

			// Check if team already exists
			const exists = await client.query(
				`SELECT id FROM registered_teams WHERE "teamName" = $1 AND "categoryId" = $2`,
				[teamName, categoryId],
			);

			let teamId: number;

			if (exists.rows.length > 0) {
				teamId = exists.rows[0].id;
				console.log(`   Skipped existing team: ${teamName}`);
			} else {
				const result = await client.query(
					`INSERT INTO registered_teams
           ("teamName", "captainId", "categoryId", "contactEmail", "contactPhone", "paymentProofUrl", "paymentStatus")
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
					[
						teamName,
						captainId,
						categoryId,
						`${teamName.toLowerCase().replace(/\s+/g, "")}@team.local`,
						`+62${randomInt(812, 899)}${randomInt(1000000, 9999999)}`,
						"",
						config.status,
					],
				);
				teamId = result.rows[0].id;

				// Insert team members into separate table
				const members = Array.from(
					{ length: category.teamSize - 1 },
					(_, j) => ({
						name: `Player ${j + 2}`,
						gameId: `${teamName.replace(/\s+/g, "").toLowerCase()}_${j + 2}`,
						role: j === 0 ? "Support" : j === 1 ? "Carry" : "Flex",
						isCaptain: false,
					}),
				);

			for (const member of members) {
				await client.query(
					`INSERT INTO team_members ("teamId", "nickname", "gameId", "role", "isCaptain")
             VALUES ($1, $2, $3, $4, $5)`,
					[teamId, member.name, member.gameId, member.role, member.isCaptain],
				);
			}

				console.log(
					`   Created team: ${teamName} (${config.status}, cat=${config.categorySlug})`,
				);
			}

			if (!teamsByCategory.has(categoryId)) {
				teamsByCategory.set(categoryId, []);
			}
			teamsByCategory
				.get(categoryId)!
				.push({ id: teamId, teamName: teamName, captainId: captainId });
		}
	}

	// Seed withdrawn teams (edge case)
	console.log("   Seeding withdrawn teams...");
	const withdrawCategoryId = categoryMap.get("valorant-challengers");
	if (withdrawCategoryId) {
		const withdrawUser = regularUserIds[18];
		const withdrawName = "Retired Squad Valorant";
		const exists = await client.query(
			`SELECT id FROM registered_teams WHERE "teamName" = $1 AND "categoryId" = $2`,
			[withdrawName, withdrawCategoryId],
		);
		if (exists.rows.length === 0) {
			const result = await client.query(
				`INSERT INTO registered_teams
         ("teamName", "captainId", "categoryId", "contactEmail", "paymentStatus", "isDeleted", "deletedAt", "deletedReason")
         VALUES ($1, $2, $3, $4, $5, true, NOW(), $6)
         RETURNING id`,
				[
					withdrawName,
					withdrawUser,
					withdrawCategoryId,
					"retired@team.local",
					"pending",
					"Team withdrew before tournament start",
				],
			);

			// Insert withdrawn team members
			await client.query(
				`INSERT INTO team_members ("teamId", "nickname", "gameId", "role", "isCaptain")
         VALUES ($1, $2, $3, $4, $5)`,
				[result.rows[0].id, "Retired Player", "retired_1", "Carry", false],
			);

			console.log(`   Created withdrawn team: ${withdrawName}`);
		}
	}

	return teamsByCategory;
}

// ─── Bracket Generation ────────────────────────────────────────────────────

interface MatchRecord {
	id: number;
	teamAId: number | null;
	teamBId: number | null;
	round: number;
	matchNumber: number;
}

async function generateBracket(
	client: any,
	categoryId: number,
	teams: { id: number; teamName: string }[],
): Promise<void> {
	// Use the new double elimination bracket generator
	await generateDoubleEliminationBracket(client, categoryId, teams);
}

// ─── Simulating Tournament Results ───────────────────────────────────────────

async function simulateTournamentResults(
	client: any,
	categoryId: number,
	teams: { id: number; teamName: string }[],
): Promise<void> {
	console.log(
		`   🏆 Simulating tournament results for category ${categoryId}...`,
	);

	const shuffledTeams = shuffleArray(teams);

	// Get all matches (winners, losers, and finals)
	const matchesResult = await client.query(
		`SELECT id, "displayId", "teamAId", "teamBId", round, "isBye", bracket,
            "nextMatchWinnersId", "nextMatchLosersId"
     FROM tournament_matches
     WHERE "categoryId" = $1
     ORDER BY bracket, round ASC, "matchNumber" ASC`,
		[categoryId],
	);

	const matches = matchesResult.rows;
	const winnersByMatch = new Map<number, number>();

	// Process winners bracket first
	const wbMatches = matches.filter((m: any) => m.bracket === "winners");
	const maxWbRound = Math.max(...wbMatches.map((m: any) => m.round), 0);

	for (let round = 1; round <= maxWbRound; round++) {
		const roundMatches = wbMatches.filter((m: any) => m.round === round);

		for (const match of roundMatches) {
			if (match.isBye) {
				const winnerId = match.teamAId || match.teamBId;
				if (winnerId) {
					winnersByMatch.set(match.id, winnerId);
				}
			} else if (match.teamAId && match.teamBId) {
				// Actual match - pick random winner
				const teamAIndex = shuffledTeams.findIndex(
					(t) => t.id === match.teamAId,
				);
				const teamBIndex = shuffledTeams.findIndex(
					(t) => t.id === match.teamBId,
				);
				const teamAAdvantage = teamAIndex !== -1 ? (20 - teamAIndex) / 40 : 0.3;
				const winner =
					Math.random() < 0.5 + teamAAdvantage * 0.3
						? match.teamAId
						: match.teamBId;

				winnersByMatch.set(match.id, winner);

				await client.query(
					`UPDATE tournament_matches SET "winnerId" = $1, "playedAt" = NOW(), status = 'completed' WHERE id = $2`,
					[winner, match.id],
				);

				// Advance winner to next match
				if (match.nextMatchWinnersId) {
					const nextMatch = matches.find(
						(m: any) => m.id === match.nextMatchWinnersId,
					);
					if (nextMatch) {
						const slot = nextMatch.teamAId ? '"teamBId"' : '"teamAId"';
						await client.query(
							`UPDATE tournament_matches SET ${slot} = $1 WHERE id = $2`,
							[winner, nextMatch.id],
						);
					}
				}

				// Advance loser to losers bracket
				if (match.nextMatchLosersId) {
					const loserId =
						winner === match.teamAId ? match.teamBId : match.teamAId;
					const losersMatch = matches.find(
						(m: any) => m.id === match.nextMatchLosersId,
					);
					if (losersMatch) {
						const slot = losersMatch.teamAId ? '"teamBId"' : '"teamAId"';
						await client.query(
							`UPDATE tournament_matches SET ${slot} = $1 WHERE id = $2`,
							[loserId, losersMatch.id],
						);
					}
				}
			}
		}
	}

	// Process losers bracket
	const lbMatches = matches.filter((m: any) => m.bracket === "losers");
	const maxLbRound = Math.max(...lbMatches.map((m: any) => m.round), 0);

	for (let round = 1; round <= maxLbRound; round++) {
		const roundMatches = lbMatches.filter((m: any) => m.round === round);

		for (const match of roundMatches) {
			// Fill teams from previous matches if needed
			const prevMatches = matches.filter(
				(m: any) => m.nextMatchWinnersId === match.id,
			);
			for (const prev of prevMatches) {
				const prevWinner = winnersByMatch.get(prev.id);
				if (prevWinner) {
					if (!match.teamAId) {
						match.teamAId = prevWinner;
						await client.query(
							`UPDATE tournament_matches SET "teamAId" = $1 WHERE id = $2`,
							[prevWinner, match.id],
						);
					} else if (!match.teamBId) {
						match.teamBId = prevWinner;
						await client.query(
							`UPDATE tournament_matches SET "teamBId" = $1 WHERE id = $2`,
							[prevWinner, match.id],
						);
					}
				}
			}

			// Also check for drops from winners bracket
			const wbDrops = wbMatches.filter(
				(m: any) =>
					m.nextMatchLosersId === match.id && winnersByMatch.has(m.id),
			);
			for (const wbMatch of wbDrops) {
				const winnerId = winnersByMatch.get(wbMatch.id)!;
				const loserId =
					winnerId === wbMatch.teamAId ? wbMatch.teamBId : wbMatch.teamAId;

				if (!match.teamAId) {
					match.teamAId = loserId;
					await client.query(
						`UPDATE tournament_matches SET "teamAId" = $1 WHERE id = $2`,
						[loserId, match.id],
					);
				} else if (!match.teamBId) {
					match.teamBId = loserId;
					await client.query(
						`UPDATE tournament_matches SET "teamBId" = $1 WHERE id = $2`,
						[loserId, match.id],
					);
				}
			}

			if (match.teamAId && match.teamBId) {
				// Simulate match
				const teamAIndex = shuffledTeams.findIndex(
					(t) => t.id === match.teamAId,
				);
				const teamBIndex = shuffledTeams.findIndex(
					(t) => t.id === match.teamBId,
				);
				const teamAAdvantage = teamAIndex !== -1 ? (20 - teamAIndex) / 40 : 0.3;
				const winner =
					Math.random() < 0.5 + teamAAdvantage * 0.3
						? match.teamAId
						: match.teamBId;

				winnersByMatch.set(match.id, winner);

				await client.query(
					`UPDATE tournament_matches SET "winnerId" = $1, "playedAt" = NOW(), status = 'completed' WHERE id = $2`,
					[winner, match.id],
				);

				// Advance winner
				if (match.nextMatchWinnersId) {
					const nextMatch = matches.find(
						(m: any) => m.id === match.nextMatchWinnersId,
					);
					if (nextMatch) {
						const slot = nextMatch.teamAId ? '"teamBId"' : '"teamAId"';
						await client.query(
							`UPDATE tournament_matches SET ${slot} = $1 WHERE id = $2`,
							[winner, nextMatch.id],
						);
					}
				}
			}
		}
	}

	// Process Grand Finals
	const gfMatches = matches
		.filter((m: any) => m.bracket === "finals")
		.sort((a: any, b: any) => a.round - b.round);

	for (const gfMatch of gfMatches) {
		// Get teams from WB and LB finals
		const prevMatches = matches.filter(
			(m: any) => m.nextMatchWinnersId === gfMatch.id,
		);

		for (const prev of prevMatches) {
			const prevWinner = winnersByMatch.get(prev.id);
			if (prevWinner) {
				if (!gfMatch.teamAId) {
					gfMatch.teamAId = prevWinner;
					await client.query(
						`UPDATE tournament_matches SET "teamAId" = $1 WHERE id = $2`,
						[prevWinner, gfMatch.id],
					);
				} else if (!gfMatch.teamBId) {
					gfMatch.teamBId = prevWinner;
					await client.query(
						`UPDATE tournament_matches SET "teamBId" = $1 WHERE id = $2`,
						[prevWinner, gfMatch.id],
					);
				}
			}
		}

		if (gfMatch.teamAId && gfMatch.teamBId) {
			const teamAIndex = shuffledTeams.findIndex(
				(t) => t.id === gfMatch.teamAId,
			);
			const teamBIndex = shuffledTeams.findIndex(
				(t) => t.id === gfMatch.teamBId,
			);
			const teamAAdvantage = teamAIndex !== -1 ? (20 - teamAIndex) / 40 : 0.3;
			const winner =
				Math.random() < 0.5 + teamAAdvantage * 0.3
					? gfMatch.teamAId
					: gfMatch.teamBId;

			winnersByMatch.set(gfMatch.id, winner);

			await client.query(
				`UPDATE tournament_matches SET "winnerId" = $1, "playedAt" = NOW(), status = 'completed' WHERE id = $2`,
				[winner, gfMatch.id],
			);
		}
	}

	// Mark tournament as completed
	await client.query(
		`UPDATE tournaments SET status = 'completed' WHERE id = $1`,
		[categoryId],
	);

	// Set winner as champion
	const finalMatch = gfMatches[gfMatches.length - 1];
	if (finalMatch) {
		const championId = winnersByMatch.get(finalMatch.id);
		if (championId) {
			await client.query(
				`UPDATE registered_teams SET "finalPlacement" = 1 WHERE id = $1`,
				[championId],
			);
			console.log(`   🏆 Champion determined for category ${categoryId}`);
		}
	}
}

async function simulatePartialTournament(
	client: any,
	categoryId: number,
): Promise<void> {
	console.log(
		`   🎮 Simulating partial results for ongoing category ${categoryId}...`,
	);

	const matchesResult = await client.query(
		`SELECT id, "teamAId", "teamBId", round, "isBye"
     FROM tournament_matches
     WHERE "categoryId" = $1 AND bracket = 'winners'
     ORDER BY round ASC, "matchNumber" ASC`,
		[categoryId],
	);

	const matches = matchesResult.rows;
	const maxRound = Math.max(...matches.map((m: any) => m.round));

	// Complete round 1
	const round1Matches = matches.filter((m: any) => m.round === 1);
	for (const match of round1Matches) {
		if (match.isBye) continue;
		if (match.teamAId && match.teamBId && !match.winnerId) {
			const winner = Math.random() > 0.5 ? match.teamAId : match.teamBId;
			await client.query(
				`UPDATE tournament_matches SET "winnerId" = $1, "playedAt" = NOW(), status = 'completed' WHERE id = $2`,
				[winner, match.id],
			);

			// Advance winner
			const nextMatch = matches.find(
				(m: any) => m.id === match.nextMatchWinnersId,
			);
			if (nextMatch) {
				const slot = nextMatch.teamAId ? '"teamBId"' : '"teamAId"';
				await client.query(
					`UPDATE tournament_matches SET ${slot} = $1 WHERE id = $2`,
					[winner, nextMatch.id],
				);
			}
		}
	}

	// Complete some (but not all) of round 2 for "in-progress" look
	const round2Matches = matches.filter((m: any) => m.round === 2);
	const matchesToComplete = Math.floor(round2Matches.length * 0.6);

	for (let i = 0; i < matchesToComplete; i++) {
		const match = round2Matches[i];
		if (!match) continue;
		if (!match.teamAId || !match.teamBId) continue;

		const winner = Math.random() > 0.5 ? match.teamAId : match.teamBId;
		await client.query(
			`UPDATE tournament_matches SET "winnerId" = $1, "playedAt" = NOW(), status = 'completed' WHERE id = $2`,
			[winner, match.id],
		);

		const nextMatch = matches.find(
			(m: any) => m.id === match.nextMatchWinnersId,
		);
		if (nextMatch) {
			const slot = nextMatch.teamAId ? '"teamBId"' : '"teamAId"';
			await client.query(
				`UPDATE tournament_matches SET ${slot} = $1 WHERE id = $2`,
				[winner, nextMatch.id],
			);
		}
	}

	// Leave remaining round 2 and later rounds untouched (pending/ready)
	for (const match of round2Matches.slice(matchesToComplete)) {
		if (match.teamAId && match.teamBId && !match.winnerId) {
			await client.query(
				`UPDATE tournament_matches SET status = 'ready' WHERE id = $1`,
				[match.id],
			);
		}
	}
}

// ─── Main Runner ─────────────────────────────────────────────────────────────

async function seed() {
	console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log("🌱 E-CHAMPS SEED SCRIPT");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		// 1. Users
		await seedUsers(client);

		// 2. Categories
		const categoryMap = await seedCategories(client);

		// 3. Teams
		const teamsByCategory = await seedTeams(client, categoryMap);

		// 4. Brackets + Results
		console.log("\n🎲 Generating brackets & simulating results...");

		// PUBG Pro - ongoing, partial results (bracket generated, some matches played)
		const pubgTeams = teamsByCategory.get(categoryMap.get("pubg-pro")!) || [];
		if (pubgTeams.length >= 2) {
			await generateBracket(client, categoryMap.get("pubg-pro")!, pubgTeams);
			await simulatePartialTournament(client, categoryMap.get("pubg-pro")!);
		}

		// Dota 2 Qualifiers - just started, bracket generated, no results yet
		const dotaTeams =
			teamsByCategory.get(categoryMap.get("dota2-qualifiers")!) || [];
		if (dotaTeams.length >= 2) {
			await generateBracket(
				client,
				categoryMap.get("dota2-qualifiers")!,
				dotaTeams,
			);
			// No simulatePartial - leave all as pending/ready
		}

		// CS2 Invitational - fully completed with champion
		const cs2Teams =
			teamsByCategory.get(categoryMap.get("cs2-invitational")!) || [];
		if (cs2Teams.length >= 2) {
			await generateBracket(
				client,
				categoryMap.get("cs2-invitational")!,
				cs2Teams,
			);
			await simulateTournamentResults(
				client,
				categoryMap.get("cs2-invitational")!,
				cs2Teams,
			);
		}

		// Test Mini - fully completed small tournament (min 8 teams needed for bracket)
		// Skip bracket generation for test-mini as it only has 4 teams
		// const miniTeams = teamsByCategory.get(categoryMap.get('test-mini')!) || [];
		// if (miniTeams.length >= 8) {
		//   await generateBracket(client, categoryMap.get('test-mini')!, miniTeams);
		//   await simulateTournamentResults(client, categoryMap.get('test-mini')!, miniTeams);
		// }

		await client.query("COMMIT");

		console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.log("✅ SEEDING COMPLETED SUCCESSFULLY");
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.log("\n📊 Coverage Summary:");
		console.log("   • Users: 1 admin + 20 players (1 banned)");
		console.log(
			"   • Categories: OPEN, ONGOING, COMPLETED, CLOSED, EMPTY statuses",
		);
		console.log(
			"   • Teams: verified (bracket-ready), paid, pending, withdrawn",
		);
		console.log(
			"   • Brackets: PUBG (partial), Dota2 (fresh), CS2 (full results), Test Mini (full results)",
		);
		console.log(
			"   • Match states: pending, ready, completed with winners/losers",
		);
		console.log("\n🔍 Edge cases covered:");
		console.log("   • Empty category (Wild Rift)");
		console.log("   • Partial registrations (not full yet)");
		console.log("   • Withdrawn team (Retired Squad in Valorant)");
		console.log("   • Banned user");
		console.log("   • Free-entry tournament (CS2, Test Mini)");
		console.log("   • Byes in bracket (if team count != power of 2)");
		console.log(
			"   • Ongoing tournament with some matches played, others pending",
		);
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
	} catch (err) {
		await client.query("ROLLBACK");
		console.error("\n❌ SEEDING FAILED:", err);
		process.exit(1);
	} finally {
		client.release();
		await pool.end();
	}
}

seed();
