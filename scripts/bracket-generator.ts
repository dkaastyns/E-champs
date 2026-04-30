/**
 * Double Elimination Bracket Generator
 * Generates complete double elimination brackets with winners, losers, and grand finals
 */

import { pool } from "@/lib/db";
import { randomUUID } from "crypto";

interface Team {
	id: number;
	teamName: string;
}

interface MatchRecord {
	id: number;
	displayId: string;
	round: number;
	matchNumber: number;
	bracket: "winners" | "losers" | "finals";
}

function nextPowerOf2(n: number): number {
	return Math.pow(2, Math.ceil(Math.log2(n)));
}

/**
 * Generate complete double elimination bracket
 */
export async function generateDoubleEliminationBracket(
	client: any,
	categoryId: number,
	teams: Team[],
): Promise<{
	teams: number;
	bracketSize: number;
	numByes: number;
	numRounds: number;
}> {
	const numTeams = teams.length;
	const MIN_TEAMS = 8;
	if (numTeams < MIN_TEAMS) {
		throw new Error(
			`Need at least ${MIN_TEAMS} verified teams to generate bracket (currently have ${numTeams})`,
		);
	}

	const bracketSize = nextPowerOf2(numTeams);
	const numByes = bracketSize - numTeams;
	const numRounds = Math.log2(bracketSize);

	// Clear existing matches
	await client.query(`DELETE FROM tournament_matches WHERE "categoryId" = $1`, [
		categoryId,
	]);

	const winnersMatches: MatchRecord[] = [];
	const losersMatches: MatchRecord[] = [];

	// PHASE 1: Generate Winners Bracket (Upper)

	// Round 1 - Initial matches with teams
	let teamIdx = 0;
	const round1Matches = bracketSize / 2;

	for (let i = 0; i < round1Matches; i++) {
		const teamA = teamIdx < numTeams ? teams[teamIdx++] : null;
		const teamB = teamIdx < numTeams ? teams[teamIdx++] : null;

		const hasBye = !teamA || !teamB;
		const winnerId = hasBye ? teamA?.id || teamB?.id || null : null;
		const displayId = randomUUID();

		const result = await client.query(
			`INSERT INTO tournament_matches (
        "categoryId", bracket, round, "matchNumber",
        "teamAId", "teamBId", "isBye", "winnerId", status, "displayId"
      ) VALUES ($1, 'winners', 1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, "displayId", round, "matchNumber"`,
			[
				categoryId,
				i + 1,
				teamA?.id || null,
				teamB?.id || null,
				hasBye,
				winnerId,
				hasBye ? "completed" : "pending",
				displayId,
			],
		);

		winnersMatches.push({
			id: result.rows[0].id,
			displayId: result.rows[0].displayId,
			round: 1,
			matchNumber: i + 1,
			bracket: "winners",
		});
	}

	// Subsequent rounds of winners bracket
	for (let round = 2; round <= numRounds; round++) {
		const matchesInRound = bracketSize / Math.pow(2, round);

		for (let i = 0; i < matchesInRound; i++) {
			const startIdx = winnersMatches.length - matchesInRound * 2;
			const prevMatchA = winnersMatches[startIdx + i * 2];
			const prevMatchB = winnersMatches[startIdx + i * 2 + 1];

			const displayId = randomUUID();

			const result = await client.query(
				`INSERT INTO tournament_matches (
          "categoryId", bracket, round, "matchNumber", status, "displayId"
        ) VALUES ($1, 'winners', $2, $3, 'pending', $4)
        RETURNING id, "displayId", round, "matchNumber"`,
				[categoryId, round, i + 1, displayId],
			);

			const newMatch = {
				id: result.rows[0].id,
				displayId: result.rows[0].displayId,
				round,
				matchNumber: i + 1,
				bracket: "winners" as const,
			};

			winnersMatches.push(newMatch);

			// Link previous matches
			if (prevMatchA) {
				await client.query(
					`UPDATE tournament_matches SET "nextMatchWinnersId" = $1 WHERE id = $2`,
					[newMatch.id, prevMatchA.id],
				);
			}
			if (prevMatchB) {
				await client.query(
					`UPDATE tournament_matches SET "nextMatchWinnersId" = $1 WHERE id = $2`,
					[newMatch.id, prevMatchB.id],
				);
			}
		}
	}

	// PHASE 2: Generate Losers Bracket (Lower)

	// Calculate losers bracket structure
	// For N teams in WB: LB has 2N - 2 rounds
	const numLosersRounds = 2 * numRounds - 2;

	// Round 1: Teams losing in WB Round 1 drop to LB Round 1
	// Each LB Round 1 match gets 2 losers from WB Round 1
	const lbRound1Matches = round1Matches / 2;

	for (let i = 0; i < lbRound1Matches; i++) {
		const displayId = randomUUID();

		const result = await client.query(
			`INSERT INTO tournament_matches (
        "categoryId", bracket, round, "matchNumber", status, "displayId"
      ) VALUES ($1, 'losers', 1, $2, 'pending', $3)
      RETURNING id, "displayId", round, "matchNumber"`,
			[categoryId, i + 1, displayId],
		);

		const newMatch = {
			id: result.rows[0].id,
			displayId: result.rows[0].displayId,
			round: 1,
			matchNumber: i + 1,
			bracket: "losers" as const,
		};

		losersMatches.push(newMatch);

		const wbMatchA = winnersMatches[i * 2];
		const wbMatchB = winnersMatches[i * 2 + 1];

		if (wbMatchA) {
			await client.query(
				`UPDATE tournament_matches SET "nextMatchLosersId" = $1 WHERE id = $2`,
				[newMatch.id, wbMatchA.id],
			);
		}
		if (wbMatchB) {
			await client.query(
				`UPDATE tournament_matches SET "nextMatchLosersId" = $1 WHERE id = $2`,
				[newMatch.id, wbMatchB.id],
			);
		}
	}

	// Subsequent losers bracket rounds
	// Pattern: alternating between dropping from WB and LB consolidation
	let currentLbMatches = lbRound1Matches;

	for (let round = 2; round <= numLosersRounds; round++) {
		// Determine number of matches in this round
		if (round % 2 === 0) {
			// Even rounds: same count as previous (consolidation rounds)
		} else {
			// Odd rounds: half count (new drops from WB)
			currentLbMatches = currentLbMatches / 2;
		}

		for (let i = 0; i < currentLbMatches; i++) {
			const displayId = randomUUID();

			const result = await client.query(
				`INSERT INTO tournament_matches (
          "categoryId", bracket, round, "matchNumber", status, "displayId"
        ) VALUES ($1, 'losers', $2, $3, 'pending', $4)
        RETURNING id, "displayId", round, "matchNumber"`,
				[categoryId, round, i + 1, displayId],
			);

			const newMatch = {
				id: result.rows[0].id,
				displayId: result.rows[0].displayId,
				round,
				matchNumber: i + 1,
				bracket: "losers" as const,
			};

			losersMatches.push(newMatch);

			// Link within losers bracket (winners advance)
			// Previous round matches feed into this round
			const prevRound = round - 1;
			const prevMatches = losersMatches.filter((m) => m.round === prevRound);

			if (prevMatches.length > 0) {
				// In LB, winners from previous round feed into next round
				// Each match in current round gets winners from 2 previous matches
				const matchesPerCurrent = prevMatches.length / currentLbMatches;
				const startIdx = i * matchesPerCurrent;

				for (let j = 0; j < matchesPerCurrent; j++) {
					const prevMatch = prevMatches[startIdx + j];
					if (prevMatch) {
						await client.query(
							`UPDATE tournament_matches SET "nextMatchWinnersId" = $1 WHERE id = $2`,
							[newMatch.id, prevMatch.id],
						);
					}
				}
			}

			// For odd rounds, link drops from winners bracket
			if (round % 2 === 1) {
				const wbRound = (round + 1) / 2;
				const wbMatchesThisRound = winnersMatches.filter(
					(m) => m.round === wbRound,
				);
				const wbMatchesPerLbMatch =
					wbMatchesThisRound.length / currentLbMatches;
				const startIdx = i * wbMatchesPerLbMatch;

				for (let j = 0; j < wbMatchesPerLbMatch; j++) {
					const wbMatch = wbMatchesThisRound[startIdx + j];
					if (wbMatch) {
						await client.query(
							`UPDATE tournament_matches SET "nextMatchLosersId" = $1 WHERE id = $2`,
							[newMatch.id, wbMatch.id],
						);
					}
				}
			}
		}
	}

	// PHASE 3: Generate Grand Finals Match 1

	const wbFinalMatch = winnersMatches[winnersMatches.length - 1];
	const lbFinalMatch = losersMatches[losersMatches.length - 1];

	const grandFinals1DisplayId = randomUUID();
	const grandFinals1Result = await client.query(
		`INSERT INTO tournament_matches (
      "categoryId", bracket, round, "matchNumber", status, "displayId"
    ) VALUES ($1, 'finals', 1, 1, 'pending', $2)
    RETURNING id, "displayId"`,
		[categoryId, grandFinals1DisplayId],
	);

	const grandFinals1Id = grandFinals1Result.rows[0].id;
	const grandFinals1DisplayIdStored = grandFinals1Result.rows[0].displayId;

	// Link WB final and LB final to Grand Finals 1
	await client.query(
		`UPDATE tournament_matches SET "nextMatchWinnersId" = $1 WHERE id = $2`,
		[grandFinals1Id, wbFinalMatch.id],
	);

	await client.query(
		`UPDATE tournament_matches SET "nextMatchWinnersId" = $1 WHERE id = $2`,
		[grandFinals1Id, lbFinalMatch.id],
	);

	// PHASE 4: Advance Bye Winners

	for (const match of winnersMatches) {
		if (match.round === 1) continue;

		const prevMatches = await client.query(
			`SELECT id, "winnerId", "teamAId", "teamBId", "isBye" 
       FROM tournament_matches 
       WHERE "nextMatchWinnersId" = $1`,
			[match.id],
		);

		let slotA = true;
		for (const prev of prevMatches.rows) {
			if (prev.isBye && prev.winnerId) {
				if (slotA) {
					await client.query(
						`UPDATE tournament_matches SET "teamAId" = $1 WHERE id = $2`,
						[prev.winnerId, match.id],
					);
				} else {
					await client.query(
						`UPDATE tournament_matches SET "teamBId" = $1 WHERE id = $2`,
						[prev.winnerId, match.id],
					);
				}
				slotA = false;
			}
		}
	}

	// Update category status
	await client.query(
		`UPDATE tournaments SET status = 'ongoing' WHERE id = $1`,
		[categoryId],
	);

	return {
		teams: numTeams,
		bracketSize,
		numByes,
		numRounds,
	};
}

/**
 * Create Grand Finals Match 2 (Bracket Reset)
 * Called dynamically when LB winner defeats WB winner in Match 1
 */
export async function createGrandFinalsMatch2(
	client: any,
	categoryId: number,
	grandFinals1Id: number,
): Promise<string> {
	const displayId = randomUUID();

	const result = await client.query(
		`INSERT INTO tournament_matches (
      "categoryId", bracket, round, "matchNumber", status, "displayId"
    ) VALUES ($1, 'finals', 2, 1, 'pending', $2)
    RETURNING id, "displayId"`,
		[categoryId, displayId],
	);

	const grandFinals2Id = result.rows[0].id;

	// Link Grand Finals 1 to Grand Finals 2
	await client.query(
		`UPDATE tournament_matches SET "nextMatchWinnersId" = $1 WHERE id = $2`,
		[grandFinals2Id, grandFinals1Id],
	);

	return displayId;
}
