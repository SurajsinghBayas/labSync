"use client";

import { useState, useEffect } from "react";
import {
    FileCode,
    Search,
    Download,
    CheckCircle2,
    Clock,
    XCircle,
    Code2,
    ExternalLink,
    Loader2,
    RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, DifficultyBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn, getRelativeTime } from "@/lib/utils";
import { databases, COLLECTIONS, getDatabaseId, Query } from "@/lib/appwrite";
import * as XLSX from "xlsx";

interface SubmissionData {
    $id: string;
    userId: string;
    problemId: string;
    labId: string;
    status: "solved" | "attempted" | "not_started";
    language: string | null;
    code: string | null;
    submissionUrl: string | null;
    submittedAt: string | null;
    $createdAt: string;
    // Joined data
    studentName: string;
    studentEmail: string;
    studentRollNo: string | null;
    studentBranch: string | null;
    studentYear: string | null;
    studentDivision: string | null;
    studentBatch: string | null;
    problemTitle: string;
    problemDifficulty: string;
    labTitle: string;
}

type FilterStatus = "all" | "solved" | "attempted";

export default function TeacherSubmissionsPage() {
    const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
    const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const fetchSubmissions = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const databaseId = getDatabaseId();

            // Fetch all submissions
            const submissionsResponse = await databases.listDocuments(databaseId, COLLECTIONS.SUBMISSIONS, [
                Query.orderDesc("$createdAt"),
                Query.limit(200),
            ]);

            // Fetch all users
            const usersResponse = await databases.listDocuments(databaseId, COLLECTIONS.USERS, [
                Query.equal("role", "student"),
                Query.limit(100),
            ]);
            const usersMap = new Map(usersResponse.documents.map(u => [u.$id, u]));

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
                const user = usersMap.get(sub.userId);
                const problem = problemsMap.get(sub.problemId);
                const lab = labsMap.get(sub.labId);

                return {
                    $id: sub.$id,
                    userId: sub.userId,
                    problemId: sub.problemId,
                    labId: sub.labId,
                    status: sub.status as "solved" | "attempted" | "not_started",
                    language: sub.language,
                    code: sub.code,
                    submissionUrl: sub.submissionUrl,
                    submittedAt: sub.submittedAt,
                    $createdAt: sub.$createdAt,
                    studentName: user?.name || "Unknown",
                    studentEmail: user?.email || "",
                    studentRollNo: user?.rollNo || null,
                    studentBranch: user?.branch || null,
                    studentYear: user?.year || null,
                    studentDivision: user?.division || null,
                    studentBatch: user?.batch || null,
                    problemTitle: problem?.title || "Unknown Problem",
                    problemDifficulty: problem?.difficulty || "easy",
                    labTitle: lab?.title || "Unknown Lab",
                } as SubmissionData;
            });

            setSubmissions(enrichedSubmissions);
        } catch (error) {
            console.error("Error fetching submissions:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const exportToExcel = () => {
        const exportData = filteredSubmissions.map((sub) => ({
            "Roll No": sub.studentRollNo || "-",
            "Student Name": sub.studentName,
            "Student Email": sub.studentEmail,
            "Branch": sub.studentBranch || "-",
            "Year": sub.studentYear || "-",
            "Division": sub.studentDivision || "-",
            "Batch": sub.studentBatch || "-",
            "Lab": sub.labTitle,
            "Problem": sub.problemTitle,
            "Difficulty": sub.problemDifficulty.charAt(0).toUpperCase() + sub.problemDifficulty.slice(1),
            "Status": sub.status.charAt(0).toUpperCase() + sub.status.slice(1),
            "Language": sub.language || "N/A",
            "Submitted At": sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : "N/A",
            "Code": sub.code ? "Yes" : "No",
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);

        // Set column widths
        worksheet["!cols"] = [
            { wch: 12 }, // Roll No
            { wch: 20 }, // Name
            { wch: 30 }, // Email
            { wch: 10 }, // Branch
            { wch: 8 },  // Year
            { wch: 10 }, // Division
            { wch: 8 },  // Batch
            { wch: 25 }, // Lab
            { wch: 25 }, // Problem
            { wch: 12 }, // Difficulty
            { wch: 12 }, // Status
            { wch: 12 }, // Language
            { wch: 20 }, // Submitted At
            { wch: 8 },  // Code
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");

        XLSX.writeFile(workbook, `labsync_submissions_${new Date().toISOString().split("T")[0]}.xlsx`);
    };

    // Filter submissions
    const filteredSubmissions = submissions.filter((sub) => {
        const matchesSearch =
            sub.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (sub.studentRollNo?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
            sub.problemTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.labTitle.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (statusFilter === "all") return true;
        return sub.status === statusFilter;
    });

    // Stats
    const totalSubmissions = submissions.length;
    const solvedCount = submissions.filter((s) => s.status === "solved").length;
    const attemptedCount = submissions.filter((s) => s.status === "attempted").length;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "solved":
                return <CheckCircle2 className="h-4 w-4 text-success" />;
            case "attempted":
                return <Clock className="h-4 w-4 text-warning" />;
            default:
                return <XCircle className="h-4 w-4 text-muted-foreground" />;
        }
    };

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Submissions</h1>
                    <p className="text-muted-foreground">
                        Review and track all student submissions
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => fetchSubmissions(true)} disabled={refreshing}>
                        <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                        Reload
                    </Button>
                    <Button onClick={exportToExcel}>
                        <Download className="h-4 w-4 mr-2" />
                        Export to Excel
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <FileCode className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{totalSubmissions}</p>
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

            {/* Filters */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by student, roll no, problem, or lab..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-2">
                    {(["all", "solved", "attempted"] as FilterStatus[]).map((status) => (
                        <Button
                            key={status}
                            variant={statusFilter === status ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter(status)}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Submissions List */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left p-4 font-medium">Roll No</th>
                                <th className="text-left p-4 font-medium">Student</th>
                                <th className="text-left p-4 font-medium">Problem</th>
                                <th className="text-left p-4 font-medium">Lab</th>
                                <th className="text-left p-4 font-medium">Status</th>
                                <th className="text-left p-4 font-medium">Language</th>
                                <th className="text-left p-4 font-medium">Submitted</th>
                                <th className="text-left p-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubmissions.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
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
                                            <td className="p-4 font-mono text-sm">
                                                {sub.studentRollNo || "-"}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar name={sub.studentName || "Unknown"} size="sm" />
                                                    <div>
                                                        <p className="font-medium text-sm">{sub.studentName}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {sub.studentBranch && sub.studentYear
                                                                ? `${sub.studentBranch} ${sub.studentYear}`
                                                                : sub.studentEmail}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div>
                                                    <p className="font-medium text-sm">{sub.problemTitle}</p>
                                                    <DifficultyBadge difficulty={sub.problemDifficulty as "easy" | "medium" | "hard"} />
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground">{sub.labTitle}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(sub.status)}
                                                    <span className="text-sm capitalize">{sub.status}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {sub.language ? (
                                                    <Badge variant="outline">{sub.language}</Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground">
                                                {sub.submittedAt ? getRelativeTime(sub.submittedAt) : "-"}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-2">
                                                    {sub.code && (
                                                        <Button variant="ghost" size="icon">
                                                            <Code2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {sub.submissionUrl && (
                                                        <a href={sub.submissionUrl} target="_blank" rel="noopener noreferrer">
                                                            <Button variant="ghost" size="icon">
                                                                <ExternalLink className="h-4 w-4" />
                                                            </Button>
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedSubmission === sub.$id && sub.code && (
                                            <tr>
                                                <td colSpan={8} className="p-0">
                                                    <div className="p-4 bg-muted/30 border-b">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-sm font-medium">Code Submission</span>
                                                            <Badge variant="outline">{sub.language}</Badge>
                                                        </div>
                                                        <pre className="bg-background p-4 rounded-lg text-sm overflow-x-auto max-h-64 overflow-y-auto">
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
            </Card>
        </div>
    );
}
