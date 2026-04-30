import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pool } from "@/lib/db";
import { generateDoubleEliminationBracket } from "@/scripts/bracket-generator";

export async function POST(request: NextRequest) {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session || session.user.role !== "admin") {
		return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
	}

	const text = await request.text();
	let body: Record<string, string>;
	try {
		body = JSON.parse(text);
	} catch {
		body = Object.fromEntries(new URLSearchParams(text));
	}

	const { categoryId } = body;

	if (!categoryId) {
		return NextResponse.json(
			{ error: "Category ID required" },
			{ status: 400 },
		);
	}

	const client = await pool.connect();
	try {
		const teamsResult = await client.query(
			`SELECT id, "teamName" FROM registered_teams 
       WHERE "categoryId" = $1 AND "paymentStatus" = 'verified' AND "isDeleted" = false
       ORDER BY "createdAt" ASC`,
			[categoryId],
		);

		const teams = teamsResult.rows;

		const result = await generateDoubleEliminationBracket(
			client,
			parseInt(categoryId),
			teams,
		);

		return NextResponse.json({
			message: "Double elimination bracket generated successfully",
			...result,
		});
	} catch (error) {
		console.error("Bracket generation error:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Failed to generate bracket",
			},
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
              tw."teamName" as "winnerName"
       FROM tournament_matches tm
       LEFT JOIN registered_teams ta ON tm."teamAId" = ta.id
       LEFT JOIN registered_teams tb ON tm."teamBId" = tb.id
       LEFT JOIN registered_teams tw ON tm."winnerId" = tw.id
       WHERE tm."categoryId" = $1
       ORDER BY tm.bracket, tm.round, tm."matchNumber"`,
			[categoryId],
		);
		return NextResponse.json(result.rows);
	} finally {
		client.release();
	}
}
