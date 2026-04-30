import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pool } from "@/lib/db";
import { createGrandFinalsMatch2 } from "@/scripts/bracket-generator";

export async function POST(request: NextRequest) {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session || session.user.role !== "admin") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
	}

	const body = await request.json();
	const { displayId, winnerId } = body;

	if (!displayId || !winnerId) {
		return NextResponse.json(
			{ error: "Display ID and winner ID required" },
			{ status: 400 },
		);
	}

	const client = await pool.connect();
	try {
		const matchResult = await client.query(
			`SELECT * FROM tournament_matches WHERE "displayId" = $1`,
			[displayId],
		);

		if (matchResult.rows.length === 0) {
			return NextResponse.json({ error: "Match not found" }, { status: 404 });
		}

		const match = matchResult.rows[0];

		if (winnerId !== match.teamAId && winnerId !== match.teamBId) {
			return NextResponse.json({ error: "Invalid winner" }, { status: 400 });
		}

		const loserId = winnerId === match.teamAId ? match.teamBId : match.teamAId;

		await client.query(
			`UPDATE tournament_matches 
       SET "winnerId" = $1, "playedAt" = CURRENT_TIMESTAMP, status = 'completed'
       WHERE id = $2`,
			[winnerId, match.id],
		);

		let bracketResetCreated = false;

		if (match.nextMatchWinnersId) {
			const nextMatch = await client.query(
				`SELECT * FROM tournament_matches WHERE id = $1`,
				[match.nextMatchWinnersId],
			);

			if (nextMatch.rows.length > 0) {
				const next = nextMatch.rows[0];

				if (!next.teamAId) {
					await client.query(
						`UPDATE tournament_matches SET "teamAId" = $1 WHERE id = $2`,
						[winnerId, match.nextMatchWinnersId],
					);
				} else if (!next.teamBId) {
					await client.query(
						`UPDATE tournament_matches SET "teamBId" = $1 WHERE id = $2`,
						[winnerId, match.nextMatchWinnersId],
					);
				}

				const updatedNext = await client.query(
					`SELECT "teamAId", "teamBId" FROM tournament_matches WHERE id = $1`,
					[match.nextMatchWinnersId],
				);

				if (updatedNext.rows[0].teamAId && updatedNext.rows[0].teamBId) {
					await client.query(
						`UPDATE tournament_matches SET status = 'ready' WHERE id = $1`,
						[match.nextMatchWinnersId],
					);
				}
			}
		}

		if (match.nextMatchLosersId && loserId) {
			const losersMatch = await client.query(
				`SELECT * FROM tournament_matches WHERE id = $1`,
				[match.nextMatchLosersId],
			);

			if (losersMatch.rows.length > 0) {
				const losers = losersMatch.rows[0];

				if (!losers.teamAId) {
					await client.query(
						`UPDATE tournament_matches SET "teamAId" = $1 WHERE id = $2`,
						[loserId, match.nextMatchLosersId],
					);
				} else if (!losers.teamBId) {
					await client.query(
						`UPDATE tournament_matches SET "teamBId" = $1 WHERE id = $2`,
						[loserId, match.nextMatchLosersId],
					);
				}

				const updatedLosers = await client.query(
					`SELECT "teamAId", "teamBId" FROM tournament_matches WHERE id = $1`,
					[match.nextMatchLosersId],
				);

				if (updatedLosers.rows[0].teamAId && updatedLosers.rows[0].teamBId) {
					await client.query(
						`UPDATE tournament_matches SET status = 'ready' WHERE id = $1`,
						[match.nextMatchLosersId],
					);
				}
			}
		}

		if (match.bracket === "finals" && match.round === 1) {
			const lbFinalResult = await client.query(
				`SELECT "winnerId" FROM tournament_matches 
         WHERE "categoryId" = $1 AND bracket = 'losers' 
         ORDER BY round DESC, "matchNumber" DESC LIMIT 1`,
				[match.categoryId],
			);

			const lbChampionId = lbFinalResult.rows[0]?.winnerId;

			if (lbChampionId && winnerId === lbChampionId) {
				const gf2Check = await client.query(
					`SELECT id FROM tournament_matches 
           WHERE "categoryId" = $1 AND bracket = 'finals' AND round = 2`,
					[match.categoryId],
				);

				if (gf2Check.rows.length === 0) {
					await createGrandFinalsMatch2(client, match.categoryId, match.id);
					bracketResetCreated = true;
				}
			}
		}

		return NextResponse.json({
			message: "Match result recorded",
			bracketReset: bracketResetCreated,
		});
	} catch (error) {
		console.error("Match result error:", error);
		return NextResponse.json(
			{ error: "Failed to record match result" },
			{ status: 500 },
		);
	} finally {
		client.release();
	}
}

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const categoryId = searchParams.get("category");

	if (!categoryId) {
		return NextResponse.json(
			{ error: "Category ID required" },
			{ status: 400 },
		);
	}

	const client = await pool.connect();
	try {
		const result = await client.query(
			`SELECT tm.*, 
              ta."teamName" as "teamAName", 
              tb."teamName" as "teamBName",
              tw."teamName" as "winnerName",
              t.name as "categoryName"
       FROM tournament_matches tm
       LEFT JOIN registered_teams ta ON tm."teamAId" = ta.id
       LEFT JOIN registered_teams tb ON tm."teamBId" = tb.id
       LEFT JOIN registered_teams tw ON tm."winnerId" = tw.id
       JOIN tournaments t ON tm."categoryId" = t.id
       WHERE tm."categoryId" = $1
       ORDER BY tm.bracket, tm.round, tm."matchNumber"`,
			[categoryId],
		);
		return NextResponse.json(result.rows);
	} finally {
		client.release();
	}
}
