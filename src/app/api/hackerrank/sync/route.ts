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

        // Fetch recent submissions using HackerRank's internal REST API
        // This is an undocumented endpoint, so it might change.
        const apiUrl = `https://www.hackerrank.com/rest/hackers/${username}/recent_challenges?limit=20&response_version=v2`;

        const response = await fetch(apiUrl, {
            headers: {
                "User-Agent": "LabSync/1.0",
            },
        });

        if (!response.ok) {
            throw new Error(`HackerRank API error: ${response.statusText}`);
        }

        const data = await response.json();

        // The data format usually contains 'models' array with submissions
        // We wrap it in a standard response
        return NextResponse.json({
            success: true,
            lastSynced: new Date().toISOString(),
            submissions: data.models || []
        });

    } catch (error) {
        console.error("HackerRank sync error:", error);
        return NextResponse.json(
            { error: "Failed to sync submissions" },
            { status: 500 }
        );
    }
}
