"use client";

import { useState, useEffect } from "react";
import {
    BookOpen,
    Clock,
    CheckCircle2,
    ArrowRight,
    Search,
    ExternalLink,
    Loader2,
    RefreshCw,
    Send,
    X,
    Link2,
    AlertCircle,
    FileCode,
    Calendar,
    Upload,
    Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge, DifficultyBadge, StatusBadge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn, getRelativeTime, calculatePercentage } from "@/lib/utils";
import { account, databases, COLLECTIONS, getDatabaseId, Query, ID, storage } from "@/lib/appwrite";

interface Problem {
    $id: string;
    title: string;
    hackerRankUrl: string;
    difficulty: "easy" | "medium" | "hard";
    points: number;
    status: "solved" | "attempted" | "pending" | "not_started";
    submissionId?: string;
}

interface Lab {
    $id: string;
    title: string;
    description: string;
    labNumber: number;
    subject: string;
    deadline: string | null;
    startTime: string | null;
    branch: string | null;
    year: string | null;
    division: string | null;
    batch: string | null;
    problems: Problem[];
}

interface StudentProfile {
    $id: string;
    branch: string | null;
    year: string | null;
    division: string | null;
    batch: string | null;
    hackerRankUsername: string | null;
}

export default function StudentLabsPage() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [labs, setLabs] = useState<Lab[]>([]);
    const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedLab, setSelectedLab] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all");

    // Submission modal state
    const [submitting, setSubmitting] = useState(false);
    const [submitModalOpen, setSubmitModalOpen] = useState(false);
    const [currentProblem, setCurrentProblem] = useState<{ labId: string; problemId: string; title: string; hackerRankUrl: string } | null>(null);
    const [code, setCode] = useState("");
    const [submissionUrl, setSubmissionUrl] = useState("");
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [verifying, setVerifying] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [verificationMessage, setVerificationMessage] = useState("");

    useEffect(() => {
        fetchLabs();
    }, []);

    const fetchLabs = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const user = await account.get();
            const databaseId = getDatabaseId();

            // Fetch student profile
            const studentDoc = await databases.getDocument(databaseId, COLLECTIONS.USERS, user.$id);
            const profile: StudentProfile = {
                $id: studentDoc.$id,
                branch: studentDoc.branch || null,
                year: studentDoc.year || null,
                division: studentDoc.division || null,
                batch: studentDoc.batch || null,
                hackerRankUsername: studentDoc.hackerRankUsername || null,
            };
            setStudentProfile(profile);

            // Fetch all labs
            const labsResponse = await databases.listDocuments(databaseId, COLLECTIONS.LABS, [
                Query.orderDesc("$createdAt"),
                Query.limit(50),
            ]);

            // Filter labs based on student's profile
            const filteredLabs = labsResponse.documents.filter((lab) => {
                // If lab has no filters, show to all
                if (!lab.branch && !lab.year && !lab.division && !lab.batch) return true;

                // Check if student matches the lab's target audience
                if (lab.branch && lab.branch !== profile.branch) return false;
                if (lab.year && lab.year !== profile.year) return false;
                if (lab.division && lab.division !== profile.division) return false;
                if (lab.batch && lab.batch !== profile.batch) return false;

                return true;
            });

            // Fetch student's submissions
            const submissionsResponse = await databases.listDocuments(databaseId, COLLECTIONS.SUBMISSIONS, [
                Query.equal("userId", user.$id),
                Query.limit(500),
            ]);
            const submissionsMap = new Map(submissionsResponse.documents.map(s => [s.problemId, s]));

            // Fetch problems for each lab and add status
            const labsWithProblems = await Promise.all(
                filteredLabs.map(async (lab) => {
                    const problemsResponse = await databases.listDocuments(databaseId, COLLECTIONS.PROBLEMS, [
                        Query.equal("labId", lab.$id),
                        Query.orderAsc("$createdAt"),
                    ]);

                    const problems = problemsResponse.documents.map((p) => {
                        const submission = submissionsMap.get(p.$id);
                        return {
                            $id: p.$id,
                            title: p.title,
                            hackerRankUrl: p.hackerRankUrl,
                            difficulty: p.difficulty as "easy" | "medium" | "hard",
                            points: p.points,
                            status: (submission?.status || "not_started") as "solved" | "attempted" | "not_started",
                            submissionId: submission?.$id,
                        };
                    });

                    return {
                        $id: lab.$id,
                        title: lab.title,
                        description: lab.description || "",
                        labNumber: lab.labNumber,
                        subject: lab.subject,
                        deadline: lab.deadline,
                        startTime: lab.startTime || null,
                        branch: lab.branch,
                        year: lab.year,
                        division: lab.division,
                        batch: lab.batch,
                        problems,
                    } as Lab;
                })
            );

            setLabs(labsWithProblems);
        } catch (error) {
            console.error("Error fetching labs:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const openSubmitModal = (labId: string, problemId: string, title: string, hackerRankUrl: string) => {
        setCurrentProblem({ labId, problemId, title, hackerRankUrl });
        setCode("");
        setSubmissionUrl("");
        setProofFile(null);
        setSubmitError("");
        setSubmitSuccess(false);
        setVerificationMessage("");
        setSubmitModalOpen(true);
    };

    const validateHackerRankUrl = (url: string): boolean => {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.includes("hackerrank.com");
        } catch {
            return false;
        }
    };

    const getRemainingTime = (deadline: string | null) => {
        if (!deadline) return null;
        const now = new Date();
        const deadlineDate = new Date(deadline);
        if (deadlineDate < now) return "Ended";

        const diff = deadlineDate.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `${days}d ${hours}h`;
        return `${hours}h ${minutes}m`;
    };

    const normalizeUrl = (url: string) => {
        try {
            const urlObj = new URL(url);
            // Remove query params and trailing slash, keep origin and pathname
            return (urlObj.origin + urlObj.pathname).replace(/\/+$/, '').toLowerCase();
        } catch {
            return url.trim().toLowerCase();
        }
    };

    const sha256 = async (message: string) => {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    };

    const handleSubmit = async () => {
        if (!currentProblem || !studentProfile) return;

        setSubmitError("");
        setSubmitSuccess(false);
        setVerificationMessage("");

        if (!submissionUrl.trim()) {
            setSubmitError("Please enter your HackerRank submission URL");
            return;
        }

        if (!validateHackerRankUrl(submissionUrl)) {
            setSubmitError("Please enter a valid HackerRank URL");
            return;
        }

        setSubmitting(true);

        try {
            const databaseId = getDatabaseId();

            // Upload proof file if exists
            let proofFileId = null;
            if (proofFile) {
                try {
                    const upload = await storage.createFile(
                        'submission-proofs',
                        ID.unique(),
                        proofFile
                    );
                    proofFileId = upload.$id;
                } catch (error) {
                    console.error("Proof upload failed:", error);
                    setSubmitError("Failed to upload proof image. Please try again.");
                    setSubmitting(false);
                    return;
                }
            }

            // Removed inefficient client-side duplicates fetch
            // const existingSubmissionsForProblem = ...

            // Verify the submission
            const verifyResponse = await fetch("/api/verify-submission", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    submissionUrl: submissionUrl.trim(),
                    problemUrl: currentProblem.hackerRankUrl,
                    hackerRankUsername: studentProfile.hackerRankUsername,
                    // existingUrls: existingUrls, // Removed client-side duplicates check
                }),
            });

            const verification = await verifyResponse.json();

            // Check if API detected duplicates (legacy check, relying on DB now)
            if (verification.duplicate) {
                setSubmitError("This submission URL has already been used by another student. Please submit the unique submission link of the problem you solved.");
                setSubmitting(false);
                return;
            }

            if (!verification.success) {
                setSubmitError(verification.error || "Submission verification failed. Please check your link.");
                setSubmitting(false);
                return;
            }

            // Determine status based on verification
            // const status = verification.verified ? "solved" : "attempted"; // DEPRECATED: Using verification.status directly

            // Check if submission already exists
            const existingSubmission = await databases.listDocuments(databaseId, COLLECTIONS.SUBMISSIONS, [
                Query.equal("userId", studentProfile.$id),
                Query.equal("problemId", currentProblem.problemId),
                Query.limit(1),
            ]);

            const urlHash = await sha256(normalizeUrl(submissionUrl.trim()));

            const submissionData = {
                userId: studentProfile.$id,
                problemId: currentProblem.problemId,
                labId: currentProblem.labId,
                submissionUrl: submissionUrl.trim(),
                submissionUrlHash: urlHash,
                code: code, // Using 'code' state
                status: verification.status || (verification.verified ? "solved" : "pending"),
                submittedAt: new Date().toISOString(),
                proofFileId: proofFileId, // Add proof file ID
            };

            if (existingSubmission.documents.length > 0) {
                // Update existing submission
                await databases.updateDocument(
                    databaseId,
                    COLLECTIONS.SUBMISSIONS,
                    existingSubmission.documents[0].$id,
                    submissionData
                );
            } else {
                // Create new submission
                await databases.createDocument(
                    databaseId,
                    COLLECTIONS.SUBMISSIONS,
                    ID.unique(),
                    submissionData
                );
            }

            setSubmitSuccess(true);
            if (verification.verified) {
                setVerificationMessage("✓ Verified! Problem marked as solved.");
            } else {
                setVerificationMessage(verification.reason || "⚠ Submission Saved but Unverified. Check your profile or link.");
            }

            setTimeout(() => {
                setSubmitModalOpen(false);
                fetchLabs(true);
            }, 2000);
        } catch (error: any) {
            console.error("Error submitting solution:", error);
            if (error.code === 409 || error.message?.includes("unique_submissionUrlHash")) {
                setSubmitError("This submission link has already been used by another student. Please submit the unique submission link of the problem you solved.");
            } else {
                setSubmitError("Failed to submit. Please ensure your link is correct and try again.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const filteredLabs = labs.filter((lab) =>
        lab.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lab.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const expandedLab = selectedLab ? labs.find((l) => l.$id === selectedLab) : null;

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
                    <h1 className="text-3xl font-bold">My Labs</h1>
                    <p className="text-muted-foreground">
                        {labs.length} labs assigned to you
                        {studentProfile?.branch && ` • ${studentProfile.branch} ${studentProfile.year}`}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => fetchLabs(true)} disabled={refreshing}>
                        <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                        Reload
                    </Button>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search labs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {(["all", "pending", "completed"] as const).map((filter) => (
                    <Button
                        key={filter}
                        variant={statusFilter === filter ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStatusFilter(filter)}
                        className="capitalize"
                    >
                        {filter === "all" ? "All Labs" : filter === "pending" ? "In Progress" : "Completed"}
                    </Button>
                ))}
            </div>

            {/* Labs Grid */}
            <div className="grid gap-6">
                {filteredLabs.map((lab) => {
                    const solvedCount = lab.problems.filter((p) => p.status === "solved").length;
                    const totalCount = lab.problems.length;
                    const progress = totalCount > 0 ? calculatePercentage(solvedCount, totalCount) : 0;
                    const isExpanded = selectedLab === lab.$id;

                    // Filter based on status
                    if (statusFilter === "completed" && progress < 100) return null;
                    if (statusFilter === "pending" && progress === 100) return null;

                    return (
                        <Card
                            key={lab.$id}
                            className={cn(
                                "overflow-hidden transition-all duration-300",
                                isExpanded && "ring-2 ring-primary/30"
                            )}
                        >
                            {/* Lab Header */}
                            <div
                                className="p-6 cursor-pointer"
                                onClick={() => setSelectedLab(isExpanded ? null : lab.$id)}
                            >
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                    <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center shrink-0">
                                        <span className="text-2xl font-bold">
                                            {lab.labNumber}
                                        </span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3 className="text-xl font-semibold">{lab.title}</h3>
                                                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                                    {lab.description || "No description"}
                                                </p>
                                            </div>
                                            {progress === 100 ? (
                                                <Badge variant="success" size="lg">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    Completed
                                                </Badge>
                                            ) : lab.deadline ? (
                                                <Badge
                                                    variant={new Date(lab.deadline) < new Date() ? "destructive" : "outline"}
                                                    size="lg"
                                                >
                                                    <Clock className="h-4 w-4" />
                                                    {getRelativeTime(lab.deadline)}
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" size="lg">No deadline</Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 mt-4">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <BookOpen className="h-4 w-4" />
                                                {lab.subject}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                {lab.startTime ? new Date(lab.startTime).toLocaleDateString() : "No date"}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {solvedCount}/{totalCount} problems
                                            </div>
                                            <div className="flex-1 max-w-xs">
                                                <Progress
                                                    value={progress}
                                                    variant={progress === 100 ? "success" : "default"}
                                                    showLabel
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            "transition-transform",
                                            isExpanded && "rotate-90"
                                        )}
                                    >
                                        <ArrowRight className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Expanded Problems List */}
                            {isExpanded && expandedLab && (
                                <div className="border-t border-border p-6 bg-muted/30 animate-slide-down">
                                    <div className="flex flex-wrap gap-4 mb-6 text-sm">
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground text-xs">Start Time</span>
                                            <span className="font-medium">{lab.startTime ? new Date(lab.startTime).toLocaleString() : "-"}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground text-xs">End Time</span>
                                            <span className="font-medium">{lab.deadline ? new Date(lab.deadline).toLocaleString() : "No deadline"}</span>
                                        </div>
                                        {lab.deadline && new Date(lab.deadline) > new Date() && (
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground text-xs">Remaining</span>
                                                <span className="font-medium text-primary">{getRemainingTime(lab.deadline)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <h4 className="font-semibold mb-4">Problems</h4>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {expandedLab.problems.map((problem) => (
                                            <div
                                                key={problem.$id}
                                                className={cn(
                                                    "p-4 rounded-lg border bg-card transition-all hover:shadow-sm",
                                                    problem.status === "solved"
                                                        ? "border-success/30"
                                                        : (problem.status === "attempted" || problem.status === "pending")
                                                            ? "border-warning/30"
                                                            : "border-border"
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-2 mb-3">
                                                    <h5 className="font-medium">{problem.title}</h5>
                                                    <StatusBadge status={problem.status} size="sm" />
                                                </div>
                                                <div className="flex items-center gap-2 mb-4">
                                                    <DifficultyBadge difficulty={problem.difficulty} size="sm" />
                                                    <span className="text-xs text-muted-foreground">
                                                        {problem.points} pts
                                                    </span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <a
                                                        href={problem.hackerRankUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="flex-1"
                                                    >
                                                        <Button variant="outline" size="sm" className="w-full">
                                                            <ExternalLink className="h-3 w-3" />
                                                            Open
                                                        </Button>
                                                    </a>
                                                    {problem.status !== "solved" && (
                                                        <Button
                                                            size="sm"
                                                            className="flex-1"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openSubmitModal(lab.$id, problem.$id, problem.title, problem.hackerRankUrl);
                                                            }}
                                                        >
                                                            <Send className="h-3 w-3" />
                                                            Submit
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>

            {filteredLabs.length === 0 && (
                <Card className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Labs Found</h3>
                    <p className="text-muted-foreground">
                        {searchQuery ? "No labs match your search criteria." : "No labs have been assigned to you yet."}
                    </p>
                </Card>
            )}

            {/* Submit Modal */}
            {submitModalOpen && currentProblem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        onClick={() => setSubmitModalOpen(false)}
                    />
                    <Card className="relative z-10 w-full max-w-md mx-4 shadow-lg">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Submit Solution</CardTitle>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSubmitModalOpen(false)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Proof of Completion (Screenshot)</label>
                                    <div className="border-2 border-dashed rounded-lg p-4 hover:bg-muted/50 transition-colors text-center cursor-pointer relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setProofFile(e.target.files[0]);
                                                }
                                            }}
                                        />
                                        <div className="flex flex-col items-center gap-2 pointer-events-none">
                                            {proofFile ? (
                                                <>
                                                    <ImageIcon className="h-8 w-8 text-primary" />
                                                    <span className="text-sm font-medium text-primary">{proofFile.name}</span>
                                                    <span className="text-xs text-muted-foreground">Click to change</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                                    <span className="text-sm font-medium">Upload Screenshot</span>
                                                    <span className="text-xs text-muted-foreground">JPG, PNG up to 5MB</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <CardDescription>
                                Submit your solution for &quot;{currentProblem.title}&quot;
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {submitSuccess ? (
                                <div className="flex flex-col items-center py-6 text-center">
                                    <CheckCircle2 className="h-12 w-12 text-success mb-3" />
                                    <p className="font-medium text-success">Submitted Successfully!</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {verificationMessage}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <Link2 className="h-4 w-4" />
                                            HackerRank Submission URL
                                        </label>
                                        <Input
                                            placeholder="https://www.hackerrank.com/challenges/.../submissions/..."
                                            value={submissionUrl}
                                            onChange={(e) => setSubmissionUrl(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Paste your submission URL (e.g., .../submissions/123456).
                                            Submissions are auto-verified if the URL matches the correct problem.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium flex items-center gap-2">
                                            <FileCode className="h-4 w-4" />
                                            Solution Code (Optional)
                                        </label>
                                        <textarea
                                            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                                            placeholder="Paste your code here..."
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                        />
                                    </div>

                                    {submitError && (
                                        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                            <AlertCircle className="h-4 w-4" />
                                            {submitError}
                                        </div>
                                    )}

                                    <Button
                                        className="w-full"
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="h-4 w-4 mr-2" />
                                                Submit Solution
                                            </>
                                        )}
                                    </Button>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
