"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    BookOpen,
    Users,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    ExternalLink,
    Code2,
    Download,
    RefreshCw,
    Loader2,
    Target,
    Plus,
    Save,
    Pencil,
    FileImage,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge, DifficultyBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn, formatDate, getRelativeTime } from "@/lib/utils";
import { databases, COLLECTIONS, getDatabaseId, Query, ID, storage } from "@/lib/appwrite";
import * as XLSX from "xlsx";

interface Problem {
    $id: string;
    title: string;
    difficulty: "easy" | "medium" | "hard";
    hackerRankUrl: string;
    points: number;
}

interface Submission {
    $id: string;
    userId: string;
    problemId: string;
    status: "solved" | "attempted" | "not_started";
    language: string | null;
    code: string | null;
    submittedAt: string | null;
    proofFileId: string | null;
    // Joined data
    studentName: string;
    studentEmail: string;
    studentRollNo: number | null;
    studentBranch: string | null;
    studentYear: string | null;
    studentDivision: string | null;
    studentBatch: string | null;
    problemTitle: string;
    submissionUrl?: string; // Added submissionUrl
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
    $createdAt: string;
}

export default function LabDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const labId = resolvedParams.id;

    const [lab, setLab] = useState<Lab | null>(null);
    const [problems, setProblems] = useState<Problem[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
    const [selectedProblem, setSelectedProblem] = useState<string>("all");
    const [verificationFilter, setVerificationFilter] = useState("all");
    const [addingProblem, setAddingProblem] = useState(false);
    const [newProblem, setNewProblem] = useState({ title: "", url: "", difficulty: "easy" });
    const [addingProblemLoading, setAddingProblemLoading] = useState(false);

    // Schedule editing
    const [editingSchedule, setEditingSchedule] = useState(false);
    const [newDeadline, setNewDeadline] = useState("");
    const [updatingSchedule, setUpdatingSchedule] = useState(false);

    useEffect(() => {
        fetchLabDetails();
    }, [labId]);

    const fetchLabDetails = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const databaseId = getDatabaseId();

            // Fetch lab details
            const labDoc = await databases.getDocument(databaseId, COLLECTIONS.LABS, labId);
            setLab({
                $id: labDoc.$id,
                title: labDoc.title,
                description: labDoc.description,
                labNumber: labDoc.labNumber,
                subject: labDoc.subject,
                deadline: labDoc.deadline,
                startTime: labDoc.startTime || null,
                branch: labDoc.branch || null,
                year: labDoc.year || null,
                division: labDoc.division || null,
                batch: labDoc.batch || null,
                $createdAt: labDoc.$createdAt,
            });

            // Fetch problems for this lab
            const problemsResponse = await databases.listDocuments(databaseId, COLLECTIONS.PROBLEMS, [
                Query.equal("labId", labId),
                Query.orderAsc("$createdAt"),
            ]);
            setProblems(problemsResponse.documents.map(p => ({
                $id: p.$id,
                title: p.title,
                difficulty: p.difficulty as "easy" | "medium" | "hard",
                hackerRankUrl: p.hackerRankUrl,
                points: p.points,
            })));

            // Fetch all submissions for this lab
            const submissionsResponse = await databases.listDocuments(databaseId, COLLECTIONS.SUBMISSIONS, [
                Query.equal("labId", labId),
                Query.orderDesc("$createdAt"),
                Query.limit(500),
            ]);

            // Fetch all students
            const studentsResponse = await databases.listDocuments(databaseId, COLLECTIONS.USERS, [
                Query.equal("role", "student"),
                Query.limit(100),
            ]);
            const studentsMap = new Map(studentsResponse.documents.map(s => [s.$id, s]));

            // Create problems map
            const problemsMap = new Map(problemsResponse.documents.map(p => [p.$id, p]));

            // Join the data
            const enrichedSubmissions = submissionsResponse.documents.map((sub) => {
                const student = studentsMap.get(sub.userId);
                const problem = problemsMap.get(sub.problemId);

                return {
                    $id: sub.$id,
                    userId: sub.userId,
                    problemId: sub.problemId,
                    status: sub.status as "solved" | "attempted" | "pending" | "not_started",
                    language: sub.language,
                    code: sub.code,
                    submittedAt: sub.submittedAt,
                    studentName: student?.name || "Unknown",
                    studentEmail: student?.email || "",
                    studentRollNo: student?.rollNo || null,
                    studentBranch: student?.branch || null,
                    studentYear: student?.year || null,
                    studentDivision: student?.division || null,
                    studentBatch: student?.batch || null,
                    problemTitle: problem?.title || "Unknown Problem",
                    proofFileId: sub.proofFileId || null,
                    submissionUrl: sub.submissionUrl || null,
                } as Submission;
            });

            setSubmissions(enrichedSubmissions);
        } catch (error) {
            console.error("Error fetching lab details:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const exportToExcel = () => {
        const exportData = filteredSubmissions.map((sub) => ({
            "Roll No": sub.studentRollNo || "-",
            "Student Name": sub.studentName,
            "Email": sub.studentEmail,
            "Branch": sub.studentBranch || "-",
            "Year": sub.studentYear || "-",
            "Division": sub.studentDivision || "-",
            "Batch": sub.studentBatch || "-",
            "Problem": sub.problemTitle,
            "Status": sub.status.charAt(0).toUpperCase() + sub.status.slice(1),
            "Verified": sub.status === "solved" ? "Yes" : "No",
            "Submitted At": sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : "-",
            "Submission Link": sub.submissionUrl || "-",
            "Proof Link": sub.proofFileId ? storage.getFileView('submission-proofs', sub.proofFileId).toString() : "-",
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        worksheet["!cols"] = [
            { wch: 10 }, { wch: 20 }, { wch: 30 }, { wch: 10 }, { wch: 8 },
            { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 25 }, { wch: 40 }, { wch: 40 },
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");
        XLSX.writeFile(workbook, `lab_${lab?.labNumber || labId}_submissions.xlsx`);
    };

    // Filter submissions
    const filteredSubmissions = submissions.filter((sub) => {
        const matchesSearch =
            sub.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (sub.studentRollNo?.toString().includes(searchQuery) ?? false);

        const matchesProblem = selectedProblem === "all" || sub.problemId === selectedProblem;



        const matchesVerification = verificationFilter === "all" ||
            (verificationFilter === "solved" ? sub.status === "solved" : sub.status !== "solved");

        return matchesSearch && matchesProblem && matchesVerification;
    });

    // Stats
    const solvedCount = submissions.filter(s => s.status === "solved").length;
    const attemptedCount = submissions.filter(s => s.status === "attempted").length;
    const uniqueStudents = new Set(submissions.map(s => s.userId)).size;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "solved":
                return <CheckCircle2 className="h-4 w-4 text-success" />;
            case "attempted":
            case "pending":
                return <Clock className="h-4 w-4 text-warning" />;
            default:
                return <XCircle className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const handleManualVerify = async (submissionId: string) => {
        if (!confirm("Are you sure you want to verify this submission manually?")) return;

        try {
            const databaseId = getDatabaseId();

            // Optimistic update
            setSubmissions(current => current.map(s =>
                s.$id === submissionId ? { ...s, status: 'solved' } : s
            ));

            await databases.updateDocument(
                databaseId,
                COLLECTIONS.SUBMISSIONS,
                submissionId,
                { status: 'solved' }
            );

        } catch (error) {
            console.error("Failed to verify", error);
            alert("Failed to verify submission");
            fetchLabDetails(); // Revert
        }
    };


    const getDeadlineStatus = (deadline: string | null) => {
        if (!deadline) return null;
        const now = new Date();
        const deadlineDate = new Date(deadline);
        if (deadlineDate < now) return "passed";
        const hoursLeft = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursLeft < 24) return "urgent";
        return "active";
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

        if (days > 0) return `${days}d ${hours}h remaining`;
        return `${hours}h ${minutes}m remaining`;
    };

    const extractSlugFromUrl = (url: string): string => {
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/').filter(Boolean);
            const challengeIndex = pathParts.indexOf('challenges');
            if (challengeIndex !== -1 && pathParts[challengeIndex + 1]) {
                return pathParts[challengeIndex + 1];
            }
            return pathParts[pathParts.length - 1] || "";
        } catch {
            return "";
        }
    };

    const handleAddProblem = async () => {
        if (!newProblem.title || !newProblem.url) return;
        setAddingProblemLoading(true);
        try {
            const databaseId = getDatabaseId();
            await databases.createDocument(
                databaseId,
                COLLECTIONS.PROBLEMS,
                ID.unique(),
                {
                    title: newProblem.title.trim(),
                    hackerRankSlug: extractSlugFromUrl(newProblem.url),
                    hackerRankUrl: newProblem.url.trim(),
                    labId: labId,
                    difficulty: newProblem.difficulty,
                    points: newProblem.difficulty === "easy" ? 10 : newProblem.difficulty === "medium" ? 20 : 30,
                }
            );
            setAddingProblem(false);
            setNewProblem({ title: "", url: "", difficulty: "easy" });
            fetchLabDetails(true);
        } catch (error) {
            console.error("Error adding problem:", error);
        } finally {
            setAddingProblemLoading(false);
        }
    };

    const handleUpdateSchedule = async () => {
        if (!newDeadline) return;
        setUpdatingSchedule(true);
        try {
            const databaseId = getDatabaseId();
            await databases.updateDocument(
                databaseId,
                COLLECTIONS.LABS,
                labId,
                { deadline: new Date(newDeadline).toISOString() }
            );
            setEditingSchedule(false);
            fetchLabDetails(true);
        } catch (error) {
            console.error("Error updating schedule:", error);
        } finally {
            setUpdatingSchedule(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!lab) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-4">
                <p className="text-muted-foreground">Lab not found</p>
                <Link href="/teacher/labs">
                    <Button variant="outline">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Labs
                    </Button>
                </Link>
            </div>
        );
    }

    const deadlineStatus = getDeadlineStatus(lab.deadline);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                    <Link href="/teacher/labs">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">Lab {lab.labNumber}</Badge>
                            {deadlineStatus === "passed" && <Badge variant="destructive">Deadline Passed</Badge>}
                            {deadlineStatus === "urgent" && <Badge variant="warning">Due Soon</Badge>}
                            {deadlineStatus === "active" && <Badge variant="success">Active</Badge>}
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">{lab.title}</h1>
                        <p className="text-muted-foreground">{lab.subject}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => fetchLabDetails(true)} disabled={refreshing}>
                        <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                        Reload
                    </Button>
                    <Button onClick={exportToExcel}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Lab Info Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <BookOpen className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{problems.length}</p>
                                <p className="text-sm text-muted-foreground">Problems</p>
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
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                                <Users className="h-5 w-5 text-accent-foreground" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{uniqueStudents}</p>
                                <p className="text-sm text-muted-foreground">Students</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Lab Details */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-lg w-full">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Schedule
                            </div>
                            {!editingSchedule ? (
                                <Button variant="ghost" size="sm" onClick={() => {
                                    setNewDeadline(lab.deadline ? new Date(lab.deadline).toISOString().slice(0, 16) : "");
                                    setEditingSchedule(true);
                                }}>
                                    <Pencil className="h-3 w-3 mr-1" />
                                    Edit
                                </Button>
                            ) : (
                                <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" onClick={() => setEditingSchedule(false)}>Cancel</Button>
                                    <Button size="sm" onClick={handleUpdateSchedule} disabled={updatingSchedule}>
                                        {updatingSchedule ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                                    </Button>
                                </div>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {editingSchedule ? (
                            <div className="space-y-2 p-2 border rounded-md">
                                <label className="text-xs font-semibold">New Deadline</label>
                                <Input
                                    type="datetime-local"
                                    value={newDeadline}
                                    onChange={(e) => setNewDeadline(e.target.value)}
                                />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="space-y-1">
                                    <span className="text-muted-foreground block">Start Time</span>
                                    <span className="font-medium">{lab.startTime ? new Date(lab.startTime).toLocaleString() : formatDate(lab.$createdAt)}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-muted-foreground block">End Time</span>
                                    <span className="font-medium">{lab.deadline ? new Date(lab.deadline).toLocaleString() : "No deadline"}</span>
                                </div>
                            </div>
                        )}
                        {deadlineStatus === "active" || deadlineStatus === "urgent" ? (
                            <div className="p-3 bg-primary/10 rounded-lg flex items-center gap-3 text-primary">
                                <Clock className="h-5 w-5" />
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider">Time Remaining</p>
                                    <p className="font-bold text-lg">{getRemainingTime(lab.deadline)}</p>
                                </div>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Target className="h-4 w-4" />
                            Target Audience
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {lab.branch || lab.year || lab.division || lab.batch ? (
                            <div className="flex flex-wrap gap-2">
                                {lab.branch && <Badge variant="outline">{lab.branch}</Badge>}
                                {lab.year && <Badge variant="outline">{lab.year}</Badge>}
                                {lab.division && <Badge variant="outline">Div {lab.division}</Badge>}
                                {lab.batch && <Badge variant="outline">Batch {lab.batch}</Badge>}
                            </div>
                        ) : (
                            <span className="text-muted-foreground">All students</span>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Problems List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Problems</CardTitle>
                            <CardDescription>Problems in this lab assignment</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setAddingProblem(true)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Problem
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-3">
                        {addingProblem && (
                            <div className="p-4 border rounded-lg bg-muted/30 space-y-3 animate-in fade-in slide-in-from-top-2">
                                <h4 className="font-medium text-sm">New Problem</h4>
                                <div className="grid gap-3 md:grid-cols-3">
                                    <Input
                                        placeholder="Problem Title"
                                        value={newProblem.title}
                                        onChange={(e) => setNewProblem({ ...newProblem, title: e.target.value })}
                                        className="h-9"
                                    />
                                    <Input
                                        placeholder="HackerRank URL"
                                        value={newProblem.url}
                                        onChange={(e) => setNewProblem({ ...newProblem, url: e.target.value })}
                                        className="h-9"
                                    />
                                    <div className="flex gap-2">
                                        <select
                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            value={newProblem.difficulty}
                                            onChange={(e) => setNewProblem({ ...newProblem, difficulty: e.target.value as any })}
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                        <Button size="sm" onClick={handleAddProblem} disabled={addingProblemLoading}>
                                            {addingProblemLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setAddingProblem(false)}>
                                            <XCircle className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="flex flex-wrap gap-3">
                            {problems.map((problem, index) => (
                                <div
                                    key={problem.$id}
                                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-secondary transition-colors"
                                >
                                    <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                                    <div>
                                        <p className="font-medium">{problem.title}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <DifficultyBadge difficulty={problem.difficulty} />
                                            <span className="text-xs text-muted-foreground">{problem.points} pts</span>
                                        </div>
                                    </div>
                                    <a href={problem.hackerRankUrl} target="_blank" rel="noopener noreferrer">
                                        <Button variant="ghost" size="icon" className="ml-auto">
                                            <ExternalLink className="h-4 w-4" />
                                        </Button>
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Submissions */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Submissions</CardTitle>
                            <CardDescription>All student submissions for this lab</CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" onClick={exportToExcel}>
                                <Download className="mr-2 h-4 w-4" />
                                Export
                            </Button>
                            <Input
                                placeholder="Search student..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-48"
                            />
                            <select
                                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={verificationFilter}
                                onChange={(e) => setVerificationFilter(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="solved">Verified</option>
                                <option value="pending">Unverified</option>
                            </select>
                            <select
                                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={selectedProblem}
                                onChange={(e) => setSelectedProblem(e.target.value)}
                            >
                                <option value="all">All Problems</option>
                                {problems.map((p) => (
                                    <option key={p.$id} value={p.$id}>{p.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-3 font-medium">Roll No</th>
                                    <th className="text-left p-3 font-medium">Student</th>
                                    <th className="text-left p-3 font-medium">Problem</th>
                                    <th className="text-left p-3 font-medium">Status</th>
                                    <th className="text-left p-3 font-medium">Submitted</th>
                                    <th className="text-left p-3 font-medium">Proof</th>
                                    <th className="text-left p-3 font-medium">Code</th>
                                    <th className="text-left p-3 font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSubmissions.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                            No submissions found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSubmissions.map((sub) => (
                                        <>
                                            <tr
                                                key={sub.$id}
                                                className="border-b hover:bg-secondary transition-colors cursor-pointer"
                                                onClick={() => setExpandedSubmission(
                                                    expandedSubmission === sub.$id ? null : sub.$id
                                                )}
                                            >
                                                <td className="p-3 font-mono text-sm">
                                                    {sub.studentRollNo || "-"}
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar name={sub.studentName} size="sm" />
                                                        <div>
                                                            <p className="font-medium text-sm">{sub.studentName}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {sub.studentBranch} {sub.studentYear}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-sm">{sub.problemTitle}</td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        {getStatusIcon(sub.status)}
                                                        <span className="text-sm capitalize">{sub.status}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-sm text-muted-foreground">
                                                    {sub.submittedAt ? getRelativeTime(sub.submittedAt) : "-"}
                                                </td>
                                                <td className="p-3">
                                                    {sub.proofFileId ? (
                                                        <a
                                                            href={storage.getFileView('submission-proofs', sub.proofFileId).toString()}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent hover:text-accent-foreground"
                                                        >
                                                            <FileImage className="h-4 w-4 text-blue-500" />
                                                        </a>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">-</span>
                                                    )}
                                                </td>
                                                <td className="p-3 font-mono text-xs max-w-[200px] truncate">
                                                    {sub.code ? sub.code.substring(0, 30) + "..." : "-"}
                                                </td>
                                                <td className="p-3">
                                                    {sub.status !== 'solved' && (
                                                        <Button
                                                            size="sm"
                                                            variant="default" // Changed to default for visibility? or outline
                                                            className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white border-none"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleManualVerify(sub.$id);
                                                            }}
                                                        >
                                                            Verify
                                                        </Button>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    {sub.code && (
                                                        <Button variant="ghost" size="icon">
                                                            <Code2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                            {expandedSubmission === sub.$id && sub.code && (
                                                <tr>
                                                    <td colSpan={7} className="p-0">
                                                        <div className="p-4 bg-muted/30 border-b">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-sm font-medium">
                                                                    Code by {sub.studentName}
                                                                </span>
                                                                <Badge variant="outline">{sub.language}</Badge>
                                                            </div>
                                                            <pre className="bg-background p-4 rounded-lg text-sm overflow-x-auto max-h-64 overflow-y-auto border">
                                                                <code>{sub.code}</code>
                                                            </pre>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
