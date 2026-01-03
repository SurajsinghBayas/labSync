"use client";

import { useState, useEffect } from "react";
import {
    Users,
    Search,
    Download,
    Mail,
    ExternalLink,
    CheckCircle2,
    Clock,
    AlertCircle,
    ArrowUpDown,
    Loader2,
    RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { cn, getRelativeTime, calculatePercentage, getHackerRankProfileUrl } from "@/lib/utils";
import { databases, COLLECTIONS, getDatabaseId, Query } from "@/lib/appwrite";
import * as XLSX from "xlsx";

interface StudentData {
    $id: string;
    name: string;
    email: string;
    rollNo: string | null;
    branch: string | null;
    year: string | null;
    division: string | null;
    batch: string | null;
    hackerRankUsername: string | null;
    hackerRankVerified: boolean;
    solvedProblems: number;
    totalProblems: number;
    completionPercentage: number;
    lastActivity: string | null;
}

type SortField = "name" | "completion" | "lastActivity" | "rollNo";
type SortOrder = "asc" | "desc";
type FilterType = "all" | "linked" | "unlinked" | "completed";

export default function TeacherStudentsPage() {
    const [students, setStudents] = useState<StudentData[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortField, setSortField] = useState<SortField>("name");
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
    const [filter, setFilter] = useState<FilterType>("all");
    const [totalProblems, setTotalProblems] = useState(0);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const databaseId = getDatabaseId();

            // Fetch all students
            const studentsResponse = await databases.listDocuments(databaseId, COLLECTIONS.USERS, [
                Query.equal("role", "student"),
                Query.limit(100),
            ]);

            // Fetch all problems to get total count
            const problemsResponse = await databases.listDocuments(databaseId, COLLECTIONS.PROBLEMS, [
                Query.limit(500),
            ]);
            setTotalProblems(problemsResponse.total);

            // Fetch all submissions
            const submissionsResponse = await databases.listDocuments(databaseId, COLLECTIONS.SUBMISSIONS, [
                Query.limit(1000),
            ]);

            // Process each student
            const studentsWithStats = studentsResponse.documents.map((student) => {
                // Get submissions for this student
                const studentSubmissions = submissionsResponse.documents.filter(
                    (sub) => sub.userId === student.$id
                );

                // Count solved problems
                const solvedProblems = studentSubmissions.filter(
                    (sub) => sub.status === "solved"
                ).length;

                // Get last activity
                const lastSubmission = studentSubmissions.sort(
                    (a, b) => new Date(b.$updatedAt).getTime() - new Date(a.$updatedAt).getTime()
                )[0];

                return {
                    $id: student.$id,
                    name: student.name,
                    email: student.email,
                    rollNo: student.rollNo || null,
                    branch: student.branch || null,
                    year: student.year || null,
                    division: student.division || null,
                    batch: student.batch || null,
                    hackerRankUsername: student.hackerRankUsername,
                    hackerRankVerified: student.hackerRankVerified,
                    solvedProblems,
                    totalProblems: problemsResponse.total,
                    completionPercentage: calculatePercentage(solvedProblems, problemsResponse.total || 1),
                    lastActivity: lastSubmission?.$updatedAt || null,
                } as StudentData;
            });

            setStudents(studentsWithStats);
        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    const exportToExcel = () => {
        const exportData = filteredStudents.map((student) => ({
            "Roll No": student.rollNo || "-",
            "Name": student.name,
            "Email": student.email,
            "Branch": student.branch || "-",
            "Year": student.year || "-",
            "Division": student.division || "-",
            "Batch": student.batch || "-",
            "HackerRank Username": student.hackerRankUsername || "Not Linked",
            "HackerRank Verified": student.hackerRankVerified ? "Yes" : "No",
            "Problems Solved": student.solvedProblems,
            "Total Problems": student.totalProblems,
            "Completion %": student.completionPercentage,
            "Last Activity": student.lastActivity ? new Date(student.lastActivity).toLocaleString() : "Never",
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
            { wch: 20 }, // HackerRank
            { wch: 15 }, // Verified
            { wch: 15 }, // Solved
            { wch: 15 }, // Total
            { wch: 12 }, // Completion
            { wch: 20 }, // Last Activity
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

        XLSX.writeFile(workbook, `labsync_students_${new Date().toISOString().split("T")[0]}.xlsx`);
    };

    // Filter and sort students
    const filteredStudents = students.filter((student) => {
        const matchesSearch =
            student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (student.hackerRankUsername?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
            (student.rollNo?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

        if (!matchesSearch) return false;

        switch (filter) {
            case "linked":
                return !!student.hackerRankUsername;
            case "unlinked":
                return !student.hackerRankUsername;
            case "completed":
                return student.completionPercentage === 100;
            default:
                return true;
        }
    });

    filteredStudents.sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
            case "name":
                comparison = a.name.localeCompare(b.name);
                break;
            case "rollNo":
                comparison = (a.rollNo || "").localeCompare(b.rollNo || "");
                break;
            case "completion":
                comparison = a.completionPercentage - b.completionPercentage;
                break;
            case "lastActivity":
                const aTime = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
                const bTime = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
                comparison = aTime - bTime;
                break;
        }
        return sortOrder === "asc" ? comparison : -comparison;
    });

    // Stats
    const linkedStudents = students.filter((s) => s.hackerRankUsername).length;
    const completedStudents = students.filter((s) => s.completionPercentage === 100).length;
    const avgProgress = students.length > 0
        ? Math.round(students.reduce((sum, s) => sum + s.completionPercentage, 0) / students.length)
        : 0;

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
                    <h1 className="text-2xl font-bold tracking-tight">Students</h1>
                    <p className="text-muted-foreground">
                        Monitor student progress and submissions
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => fetchStudents(true)} disabled={refreshing}>
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
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{students.length}</p>
                                <p className="text-sm text-muted-foreground">Total Students</p>
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
                                <p className="text-2xl font-bold">{linkedStudents}</p>
                                <p className="text-sm text-muted-foreground">Linked Profiles</p>
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
                                <p className="text-2xl font-bold">{completedStudents}</p>
                                <p className="text-sm text-muted-foreground">Completed All</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                                <AlertCircle className="h-5 w-5 text-accent-foreground" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{avgProgress}%</p>
                                <p className="text-sm text-muted-foreground">Avg. Progress</p>
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
                        placeholder="Search by name, email, roll no, or HackerRank..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-2">
                    {(["all", "linked", "unlinked", "completed"] as FilterType[]).map((f) => (
                        <Button
                            key={f}
                            variant={filter === f ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter(f)}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Students Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left p-4 font-medium">
                                    <button
                                        className="flex items-center gap-1 hover:text-primary"
                                        onClick={() => handleSort("rollNo")}
                                    >
                                        Roll No
                                        <ArrowUpDown className="h-4 w-4" />
                                    </button>
                                </th>
                                <th className="text-left p-4 font-medium">
                                    <button
                                        className="flex items-center gap-1 hover:text-primary"
                                        onClick={() => handleSort("name")}
                                    >
                                        Student
                                        <ArrowUpDown className="h-4 w-4" />
                                    </button>
                                </th>
                                <th className="text-left p-4 font-medium">Class</th>
                                <th className="text-left p-4 font-medium">HackerRank</th>
                                <th className="text-left p-4 font-medium">
                                    <button
                                        className="flex items-center gap-1 hover:text-primary"
                                        onClick={() => handleSort("completion")}
                                    >
                                        Progress
                                        <ArrowUpDown className="h-4 w-4" />
                                    </button>
                                </th>
                                <th className="text-left p-4 font-medium">Solved</th>
                                <th className="text-left p-4 font-medium">
                                    <button
                                        className="flex items-center gap-1 hover:text-primary"
                                        onClick={() => handleSort("lastActivity")}
                                    >
                                        Last Active
                                        <ArrowUpDown className="h-4 w-4" />
                                    </button>
                                </th>
                                <th className="text-left p-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                                        No students found
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((student) => (
                                    <tr key={student.$id} className="border-b hover:bg-secondary transition-colors">
                                        <td className="p-4 font-mono text-sm">
                                            {student.rollNo || "-"}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar name={student.name || "Unknown"} />
                                                <div>
                                                    <p className="font-medium">{student.name}</p>
                                                    <p className="text-sm text-muted-foreground">{student.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {student.branch && student.year && student.division && student.batch ? (
                                                <div className="text-sm">
                                                    <p className="font-medium">{student.branch} - {student.year}</p>
                                                    <p className="text-muted-foreground">Div {student.division}, Batch {student.batch}</p>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">Not set</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {student.hackerRankUsername ? (
                                                <a
                                                    href={getHackerRankProfileUrl(student.hackerRankUsername)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-primary hover:underline"
                                                >
                                                    @{student.hackerRankUsername}
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            ) : (
                                                <span className="text-muted-foreground">Not Linked</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full transition-all",
                                                            student.completionPercentage === 100
                                                                ? "bg-success"
                                                                : student.completionPercentage >= 50
                                                                    ? "bg-primary"
                                                                    : "bg-warning"
                                                        )}
                                                        style={{ width: `${student.completionPercentage}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-medium">{student.completionPercentage}%</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-medium">{student.solvedProblems}</span>
                                            <span className="text-muted-foreground">/{student.totalProblems}</span>
                                        </td>
                                        <td className="p-4 text-muted-foreground">
                                            {student.lastActivity ? getRelativeTime(student.lastActivity) : "Never"}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <a href={`mailto:${student.email}`}>
                                                    <Button variant="ghost" size="icon">
                                                        <Mail className="h-4 w-4" />
                                                    </Button>
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
