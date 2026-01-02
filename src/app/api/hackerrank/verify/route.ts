import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { username } = await request.json();

        if (!username) {
            return NextResponse.json(
                { error: "Username is required" },
                { status: 400 }
            );
        }

        // Verify by fetching the HackerRank profile page
        // Note: HackerRank doesn't have a documented public API for this, 
        // so we check if the profile page returns 200 via a HEAD or GET request.
        // However, HackerRank might block automated scraped requests.
        // For a real production app, we might need a proxy or proper API access.
        // Here we simulate checking headers.

        const response = await fetch(`https://www.hackerrank.com/${username}`, {
            method: "HEAD",
            headers: {
                "User-Agent": "LabSync/1.0",
            },
        });

        if (response.ok) {
            return NextResponse.json({ verified: true, username });
        } else {
            // If 404, user doesn't exist.
            return NextResponse.json(
                { error: "HaackerRank user not found" },
                { status: 404 }
            );
        }
    } catch (error) {
        console.error("HackerRank verification error:", error);
        return NextResponse.json(
            { error: "Failed to verify HackerRank profile" },
            { status: 500 }
        );
    }
}
