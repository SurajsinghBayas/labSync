import { NextRequest, NextResponse } from "next/server";

// Extract challenge slug from HackerRank URL
function extractChallengeSlug(url: string): string | null {
    try {
        const urlObj = new URL(url);

        // Expected formats:
        // https://www.hackerrank.com/challenges/two-sum/submissions/123456
        // https://www.hackerrank.com/challenges/two-sum/problem
        // https://www.hackerrank.com/rest/contests/master/challenges/two-sum/submissions/123456

        const pathParts = urlObj.pathname.split('/').filter(Boolean);

        // Find 'challenges' index and get the next part as slug
        const challengesIndex = pathParts.indexOf('challenges');
        if (challengesIndex !== -1 && pathParts[challengesIndex + 1]) {
            return pathParts[challengesIndex + 1].toLowerCase();
        }

        return null;
    } catch {
        return null;
    }
}

// Extract expected slug from problem URL
function extractExpectedSlug(problemUrl: string): string | null {
    return extractChallengeSlug(problemUrl);
}

// Check if URL is a submission URL (not just problem page)
function isSubmissionUrl(url: string): boolean {
    try {
        const urlObj = new URL(url);
        return urlObj.pathname.includes('/submissions') ||
            urlObj.pathname.includes('/submit');
    } catch {
        return false;
    }
}

// Normalize URL for comparison (remove trailing slashes, query params)
export function normalizeUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        // Keep only the pathname without query params
        return urlObj.origin + urlObj.pathname.replace(/\/+$/, '').toLowerCase();
    } catch {
        return url.toLowerCase().replace(/\/+$/, '');
    }
}

// Verify against HackerRank public profile
async function verifyWithProfile(username: string, expectedSlug: string): Promise<{ verified: boolean; data?: any }> {
    try {
        const response = await fetch(`https://www.hackerrank.com/rest/hackers/${username}/recent_challenges?limit=20`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; LabSync/1.0;)',
            }
        });

        if (!response.ok) return { verified: false };

        const data = await response.json();
        if (data.models && Array.isArray(data.models)) {
            // Check if the expected slug exists in recent challenges
            const match = data.models.find((challenge: any) =>
                challenge.ch_slug === expectedSlug ||
                challenge.url === `/challenges/${expectedSlug}`
            );

            if (match) {
                return { verified: true, data: match };
            }
        }
        return { verified: false };
    } catch (error) {
        console.error("Profile verification failed:", error);
        return { verified: false };
    }
}

export async function POST(request: NextRequest) {
    try {
        const { submissionUrl, problemUrl, hackerRankUsername } = await request.json();

        // 1. URL Structure Validation
        if (submissionUrl) {
            // ... existing URL validation logic ...
            // Validate it's a HackerRank URL
            try {
                const urlObj = new URL(submissionUrl);
                if (!urlObj.hostname.includes('hackerrank.com')) {
                    return NextResponse.json({ success: false, error: "URL must be from hackerrank.com" });
                }
            } catch {
                return NextResponse.json({ success: false, error: "Invalid URL format" });
            }
        }

        // Extract slugs
        const submittedSlug = submissionUrl ? extractChallengeSlug(submissionUrl) : null;
        const expectedSlug = problemUrl ? extractExpectedSlug(problemUrl) : null;

        if (!expectedSlug) {
            return NextResponse.json({ success: false, error: "Could not determine problem slug" });
        }

        // Strict Check: Submission URL must match the expected problem
        if (submittedSlug && expectedSlug && submittedSlug !== expectedSlug) {
            return NextResponse.json({
                success: true,
                verified: false,
                status: "rejected",
                reason: `Submission URL is for a different problem. Expected: ${expectedSlug}, Got: ${submittedSlug}`,
                error: `Submission URL is for problem "${submittedSlug}", but this assignment is for "${expectedSlug}"`
            });
        }

        // 2. Profile Verification (Highest Confidence)
        if (hackerRankUsername) {
            const profileVerification = await verifyWithProfile(hackerRankUsername, expectedSlug);
            if (profileVerification.verified) {
                return NextResponse.json({
                    success: true,
                    verified: true,
                    status: "solved",
                    message: "Verified against HackerRank profile activity!",
                    method: "profile",
                    challengeSlug: expectedSlug
                });
            }
        }

        // 3. Fallback: URL Format Valid but not Verified via Profile
        if (submittedSlug && expectedSlug) {
            // We already checked strict equality above, so here it matches.
            return NextResponse.json({
                success: true,
                verified: false, // Not verified execution, just format
                status: "pending", // Changed from 'attempted' to 'pending' to indicate unverified
                message: "Submission recorded but NOT verified. Pending manual review.",
                method: "url_slug_format",
                challengeSlug: submittedSlug,
            });
        }

        // If we can extract the submission slug but don't have problem URL to compare (Edge case)
        if (submittedSlug) {
            return NextResponse.json({
                success: true,
                verified: false,
                status: "pending",
                message: "Submission recorded but NOT verified.",
                challengeSlug: submittedSlug,
            });
        }

    } catch (error) {
        console.error("Verification error:", error);
        return NextResponse.json(
            { success: false, error: "Verification failed" },
            { status: 500 }
        );
    }
}
