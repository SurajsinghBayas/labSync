"use client";

import { useState, useEffect } from "react";
import {
    FileCode,
    Search,
    RefreshCw,
    ExternalLink,
    Clock,
    CheckCircle2,
    Code2,
    Copy,
    Check,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge, StatusBadge, DifficultyBadge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn, formatDateTime, getRelativeTime } from "@/lib/utils";
import { account, databases, COLLECTIONS, getDatabaseId, Query, ID } from "@/lib/appwrite";

interface SubmissionWithProblem {
    $id: string;
    problemId: string;
    labId: string;
    status: "solved" | "attempted" | "not_started";
    language: string | null;
    code: string | null;
    submissionUrl: string | null;
    submittedAt: string | null;
    $createdAt: string;
    // Joined data
    problemTitle: string;
    problemDifficulty: "easy" | "medium" | "hard";
    problemUrl: string;
    problemPoints: number;
    labTitle: string;
}

export default function StudentSubmissionsPage() {
    const [loading, setLoading] = useState(true);
    const [submissions, setSubmissions] = useState<SubmissionWithProblem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "solved" | "attempted">("all");
    const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
    const [copiedCode, setCopiedCode] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState("");
    const [hackerRankUsername, setHackerRankUsername] = useState<string | null>(null);

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const user = await account.get();
            const databaseId = getDatabaseId();

            // Get HackerRank username from user profile
            const userDoc = await databases.getDocument(databaseId, COLLECTIONS.USERS, user.$id);
            setHackerRankUsername(userDoc.hackerRankUsername || null);

            // Fetch user's submissions
            const submissionsResponse = await databases.listDocuments(databaseId, COLLECTIONS.SUBMISSIONS, [
                Query.equal("userId", user.$id),
                Query.orderDesc("$createdAt"),
                Query.limit(100),
            ]);

            // Fetch all problems
            const problemsResponse = await databases.listDocuments(databaseId, COLLECTIONS.PROBLEMS, [
                Query.limit(500),
            ]);
            const problemsMap = new Map(problemsResponse.documents.map(p => [p.$id, p]));

            // Fetch all labs
            const labsResponse = await databases.listDocuments(databaseId, COLLECTIONS.LABS, [
                Query.limit(100),
            ]);
            const labsMap = new Map(labsResponse.documents.map(l => [l.$id, l]));

            // Join the data
            const enrichedSubmissions = submissionsResponse.documents.map((sub) => {
                const problem = problemsMap.get(sub.problemId);
                const lab = labsMap.get(sub.labId);

                return {
                    $id: sub.$id,
                    problemId: sub.problemId,
                    labId: sub.labId,
                    status: sub.status as "solved" | "attempted" | "not_started",
                    language: sub.language,
                    code: sub.code,
                    submissionUrl: sub.submissionUrl,
                    submittedAt: sub.submittedAt,
                    $createdAt: sub.$createdAt,
                    problemTitle: problem?.title || "Unknown Problem",
                    problemDifficulty: (problem?.difficulty || "easy") as "easy" | "medium" | "hard",
                    problemUrl: problem?.hackerRankUrl || "#",
                    problemPoints: problem?.points || 0,
                    labTitle: lab?.title || "Unknown Lab",
                } as SubmissionWithProblem;
            });

            setSubmissions(enrichedSubmissions);
        } catch (error) {
            console.error("Error fetching submissions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        if (!hackerRankUsername) {
            setSyncMessage("Please set your HackerRank username in Settings first.");
            return;
        }

        setSyncing(true);
        setSyncMessage("");

        try {
            // Call the HackerRank sync API
            const response = await fetch("/api/hackerrank/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: hackerRankUsername }),
            });

            const data = await response.json();

            if (data.success && data.submissions) {
                setSyncMessage(`Found ${data.submissions.length} recent submissions on HackerRank. Checking for matches...`);

                // Get current problems from database
                const databaseId = getDatabaseId();
                const problemsResponse = await databases.listDocuments(databaseId, COLLECTIONS.PROBLEMS, [
                    Query.limit(500),
                ]);

                // Create a map of problem slugs to problems
                const problemsBySlug = new Map<string, any>();
                problemsResponse.documents.forEach((p) => {
                    // Extract slug from HackerRank URL
                    try {
                        const url = new URL(p.hackerRankUrl);
                        const parts = url.pathname.split('/').filter(Boolean);
                        const challengesIndex = parts.indexOf('challenges');
                        if (challengesIndex !== -1 && parts[challengesIndex + 1]) {
                            problemsBySlug.set(parts[challengesIndex + 1].toLowerCase(), p);
                        }
                    } catch { /* ignore */ }
                });

                // Match HackerRank submissions with our problems
                let matchedCount = 0;
                const user = await account.get();

                for (const hrSubmission of data.submissions) {
                    const slug = (hrSubmission.ch_slug || hrSubmission.slug)?.toLowerCase();
                    if (!slug) continue;

                    const matchingProblem = problemsBySlug.get(slug);
                    if (matchingProblem) {
                        matchedCount++;

                        // Check if we already have a submission for this problem
                        const existingSubmissions = await databases.listDocuments(databaseId, COLLECTIONS.SUBMISSIONS, [
                            Query.equal("userId", user.$id),
                            Query.equal("problemId", matchingProblem.$id),
                            Query.limit(1),
                        ]);

                        const submissionData = {
                            userId: user.$id,
                            problemId: matchingProblem.$id,
                            labId: matchingProblem.labId,
                            status: "solved",
                            submittedAt: hrSubmission.created_at || new Date().toISOString(),
                            submissionUrl: `https://www.hackerrank.com/challenges/${slug}/submissions`,
                        };

                        if (existingSubmissions.documents.length > 0) {
                            // Update if current status is not solved
                            if (existingSubmissions.documents[0].status !== "solved") {
                                await databases.updateDocument(
                                    databaseId,
                                    COLLECTIONS.SUBMISSIONS,
                                    existingSubmissions.documents[0].$id,
                                    submissionData
                                );
                            }
                        } else {
                            // Create new submission
                            await databases.createDocument(
                                databaseId,
                                COLLECTIONS.SUBMISSIONS,
                                ID.unique(),
                                submissionData
                            );
                        }
                    }
                }

                if (matchedCount > 0) {
                    setSyncMessage(`✓ Synced ${matchedCount} submissions from HackerRank!`);
                    // Refresh the submissions list
                    await fetchSubmissions();
                } else {
                    setSyncMessage("No matching problems found in HackerRank history.");
                }
            } else {
                setSyncMessage(data.error || "Could not fetch HackerRank submissions.");
            }
        } catch (error) {
            console.error("Sync error:", error);
            setSyncMessage("Failed to sync. Please try again.");
        } finally {
            setSyncing(false);
        }
    };

    const filteredSubmissions = submissions.filter((sub) => {
        const matchesSearch =
            sub.problemTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.language?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.labTitle.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const selectedSub = selectedSubmission
        ? submissions.find((s) => s.$id === selectedSubmission)
        : null;

    const handleCopyCode = async () => {
        if (selectedSub?.code) {
            await navigator.clipboard.writeText(selectedSub.code);
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        }
    };

    // Stats
    const solvedCount = submissions.filter(s => s.status === "solved").length;
    const attemptedCount = submissions.filter(s => s.status === "attempted").length;

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">My Submissions</h1>
                    <p className="text-muted-foreground">
                        View your submission history and code
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={fetchSubmissions}>
                        <RefreshCw className="h-4 w-4" />
                        Reload
                    </Button>
                    <Button onClick={handleSync} disabled={syncing}>
                        <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
                        {syncing ? "Syncing..." : "Sync from HackerRank"}
                    </Button>
                </div>
            </div>

            {/* Sync Message */}
            {syncMessage && (
                <div className={cn(
                    "flex items-center gap-2 p-3 rounded-lg text-sm",
                    syncMessage.includes("✓") ? "bg-success/10 text-success" : "bg-muted"
                )}>
                    {syncMessage.includes("✓") ? (
                        <CheckCircle2 className="h-4 w-4" />
                    ) : syncMessage.includes("Please set") ? (
                        <AlertCircle className="h-4 w-4 text-warning" />
                    ) : (
                        <Clock className="h-4 w-4" />
                    )}
                    {syncMessage}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <FileCode className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{submissions.length}</p>
                                <p className="text-sm text-muted-foreground">Total Submissions</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                                <CheckCircle2 className="h-5 w-5 text-success" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{solvedCount}</p>
                                <p className="text-sm text-muted-foreground">Solved</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-warning" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{attemptedCount}</p>
                                <p className="text-sm text-muted-foreground">Attempted</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by problem, lab, or language..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-2">
                    {(["all", "solved", "attempted"] as const).map((filter) => (
                        <Button
                            key={filter}
                            variant={statusFilter === filter ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter(filter)}
                            className="capitalize"
                        >
                            {filter}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Submissions List and Code Viewer */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Submissions List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Submissions</CardTitle>
                        <CardDescription>Click to view details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                        {filteredSubmissions.length > 0 ? (
                            filteredSubmissions.map((submission) => (
                                <div
                                    key={submission.$id}
                                    onClick={() => setSelectedSubmission(submission.$id)}
                                    className={cn(
                                        "p-4 rounded-lg border cursor-pointer transition-all",
                                        selectedSubmission === submission.$id
                                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                            : "border-border hover:border-primary/50"
                                    )}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h4 className="font-medium">{submission.problemTitle}</h4>
                                            <p className="text-xs text-muted-foreground">{submission.labTitle}</p>
                                        </div>
                                        <StatusBadge status={submission.status} size="sm" />
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <DifficultyBadge difficulty={submission.problemDifficulty} size="sm" />
                                        {submission.language && (
                                            <Badge variant="outline" size="sm">
                                                <Code2 className="h-3 w-3" />
                                                {submission.language}
                                            </Badge>
                                        )}
                                        <span className="ml-auto text-xs">
                                            {submission.submittedAt ? getRelativeTime(submission.submittedAt) : getRelativeTime(submission.$createdAt)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No submissions found.</p>
                                <p className="text-sm mt-1">Start solving problems or sync from HackerRank!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Code Viewer */}
                <Card className="sticky top-8">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle>
                                {selectedSub ? selectedSub.problemTitle : "Select a Submission"}
                            </CardTitle>
                            {selectedSub && (
                                <CardDescription>
                                    {selectedSub.submittedAt
                                        ? `Submitted ${formatDateTime(selectedSub.submittedAt)}`
                                        : `Created ${formatDateTime(selectedSub.$createdAt)}`
                                    }
                                </CardDescription>
                            )}
                        </div>
                        {selectedSub && (
                            <div className="flex gap-2">
                                {selectedSub.code && (
                                    <Button variant="outline" size="sm" onClick={handleCopyCode}>
                                        {copiedCode ? (
                                            <Check className="h-4 w-4 text-success" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                        {copiedCode ? "Copied!" : "Copy"}
                                    </Button>
                                )}
                                <a
                                    href={selectedSub.submissionUrl || selectedSub.problemUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button variant="outline" size="sm">
                                        <ExternalLink className="h-4 w-4" />
                                        View on HackerRank
                                    </Button>
                                </a>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        {selectedSub ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <StatusBadge status={selectedSub.status} />
                                    <DifficultyBadge difficulty={selectedSub.problemDifficulty} />
                                    {selectedSub.language && (
                                        <Badge variant="outline">
                                            <Code2 className="h-3 w-3" />
                                            {selectedSub.language}
                                        </Badge>
                                    )}
                                    <span className="text-sm text-muted-foreground ml-auto">
                                        {selectedSub.problemPoints} pts
                                    </span>
                                </div>

                                {selectedSub.code ? (
                                    <div className="rounded-lg bg-[#0d1117] border border-border overflow-hidden">
                                        <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border">
                                            <span className="text-xs text-muted-foreground font-mono">
                                                {selectedSub.language || "Code"}
                                            </span>
                                        </div>
                                        <pre className="p-4 overflow-x-auto max-h-96">
                                            <code className="text-sm font-mono text-foreground whitespace-pre">
                                                {selectedSub.code}
                                            </code>
                                        </pre>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground border rounded-lg">
                                        <Code2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p>No code saved for this submission.</p>
                                        <a
                                            href={selectedSub.submissionUrl || selectedSub.problemUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline text-sm"
                                        >
                                            View on HackerRank →
                                        </a>
                                    </div>
                                )}

                                {selectedSub.status === "solved" && (
                                    <div className="flex items-center gap-2 text-sm text-success">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Problem solved!
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <Code2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Select a submission to view details</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
