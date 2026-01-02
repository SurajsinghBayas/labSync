"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    BookOpen,
    Plus,
    Search,
    Edit,
    Trash2,
    Eye,
    Users,
    Calendar,
    Clock,
    Loader2,
    RefreshCw,
    Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn, getRelativeTime, formatDate, calculatePercentage } from "@/lib/utils";
import { databases, COLLECTIONS, getDatabaseId, Query } from "@/lib/appwrite";
import * as XLSX from "xlsx";

interface Lab {
    $id: string;
    title: string;
    description: string;
    labNumber: number;
    subject: string;
    deadline: string | null;
    createdBy: string;
    $createdAt: string;
    branch?: string | null;
    year?: string | null;
    division?: string | null;
    batch?: string | null;
    problemCount?: number;
    studentProgress?: number;
    totalStudents?: number;
}

export default function TeacherLabsPage() {
    const [labs, setLabs] = useState<Lab[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
    const [totalStudents, setTotalStudents] = useState(0);

    useEffect(() => {
        fetchLabs();
    }, []);

    const fetchLabs = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const databaseId = getDatabaseId();

            // Fetch labs
            const labsResponse = await databases.listDocuments(databaseId, COLLECTIONS.LABS, [
                Query.orderDesc("$createdAt"),
            ]);

            // Fetch total students
            const studentsResponse = await databases.listDocuments(databaseId, COLLECTIONS.USERS, [
                Query.equal("role", "student"),
            ]);
            setTotalStudents(studentsResponse.total);

            // For each lab, get problem count and submission stats
            const labsWithStats = await Promise.all(
                labsResponse.documents.map(async (lab) => {
                    // Get problems for this lab
                    const problemsResponse = await databases.listDocuments(databaseId, COLLECTIONS.PROBLEMS, [
                        Query.equal("labId", lab.$id),
                    ]);

                    // Get unique students who have completed all problems
                    const submissionsResponse = await databases.listDocuments(databaseId, COLLECTIONS.SUBMISSIONS, [
                        Query.equal("labId", lab.$id),
                        Query.equal("status", "solved"),
                    ]);

                    // Count unique students with at least one solved problem
                    const uniqueStudents = new Set(submissionsResponse.documents.map(s => s.userId));

                    return {
                        $id: lab.$id,
                        title: lab.title,
                        description: lab.description,
                        labNumber: lab.labNumber,
                        subject: lab.subject,
                        deadline: lab.deadline,
                        createdBy: lab.createdBy,
                        $createdAt: lab.$createdAt,
                        branch: lab.branch || null,
                        year: lab.year || null,
                        division: lab.division || null,
                        batch: lab.batch || null,
                        problemCount: problemsResponse.total,
                        studentProgress: uniqueStudents.size,
                        totalStudents: studentsResponse.total,
                    } as Lab;
                })
            );

            setLabs(labsWithStats);
        } catch (error) {
            console.error("Error fetching labs:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const deleteLab = async (labId: string) => {
        if (!confirm("Are you sure you want to delete this lab? This action cannot be undone.")) {
            return;
        }

        try {
            const databaseId = getDatabaseId();

            // Delete all problems for this lab first
            const problems = await databases.listDocuments(databaseId, COLLECTIONS.PROBLEMS, [
                Query.equal("labId", labId),
            ]);
            for (const problem of problems.documents) {
                await databases.deleteDocument(databaseId, COLLECTIONS.PROBLEMS, problem.$id);
            }

            // Delete all submissions for this lab
            const submissions = await databases.listDocuments(databaseId, COLLECTIONS.SUBMISSIONS, [
                Query.equal("labId", labId),
            ]);
            for (const submission of submissions.documents) {
                await databases.deleteDocument(databaseId, COLLECTIONS.SUBMISSIONS, submission.$id);
            }

            // Delete the lab
            await databases.deleteDocument(databaseId, COLLECTIONS.LABS, labId);

            // Refresh the list
            fetchLabs();
        } catch (error) {
            console.error("Error deleting lab:", error);
            alert("Failed to delete lab. Please try again.");
        }
    };

    const getDeadlineStatus = (deadline: string | null) => {
        if (!deadline) return { status: "none", label: "No deadline", color: "secondary" };
        const now = new Date();
        const deadlineDate = new Date(deadline);
        const diffHours = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (diffHours < 0) return { status: "passed", label: "Passed", color: "destructive" };
        if (diffHours < 24) return { status: "urgent", label: "Due soon", color: "warning" };
        return { status: "active", label: "Active", color: "success" };
    };

    const filteredLabs = labs.filter(lab =>
        lab.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lab.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const exportToExcel = () => {
        const exportData = filteredLabs.map(lab => {
            const progress = calculatePercentage(lab.studentProgress || 0, lab.totalStudents || 1);
            return {
                "Lab Number": lab.labNumber,
                "Title": lab.title,
                "Subject": lab.subject,
                "Problems Count": lab.problemCount || 0,
                "Student Completed": lab.studentProgress || 0,
                "Total Students": lab.totalStudents || 0,
                "Progress (%)": `${progress}%`,
                "Deadline": lab.deadline ? new Date(lab.deadline).toLocaleString() : "No deadline",
                "Created At": new Date(lab.$createdAt).toLocaleString(),
                "Target Branch": lab.branch || "All",
                "Target Year": lab.year || "All",
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        worksheet["!cols"] = [
            { wch: 10 }, { wch: 25 }, { wch: 20 }, { wch: 15 },
            { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 20 },
            { wch: 15 }, { wch: 10 }
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Labs");
        XLSX.writeFile(workbook, `labs_list_${new Date().toISOString().split('T')[0]}.xlsx`);
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
                    <h1 className="text-2xl font-bold tracking-tight">Labs</h1>
                    <p className="text-muted-foreground">
                        Manage lab assignments and track student progress
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => fetchLabs(true)} disabled={refreshing}>
                        <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                        Reload
                    </Button>
                    <Button variant="outline" onClick={exportToExcel}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                    <Link href="/teacher/labs/new">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Lab
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Search and View Toggle */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search labs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={viewMode === "grid" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                    >
                        Grid
                    </Button>
                    <Button
                        variant={viewMode === "table" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("table")}
                    >
                        Table
                    </Button>
                </div>
            </div>

            {/* Labs List */}
            {
                filteredLabs.length === 0 ? (
                    <Card className="py-12">
                        <CardContent className="text-center">
                            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No labs yet</h3>
                            <p className="text-muted-foreground mb-4">
                                Create your first lab to get started
                            </p>
                            <Link href="/teacher/labs/new">
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Lab
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : viewMode === "grid" ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredLabs.map((lab) => {
                            const deadlineInfo = getDeadlineStatus(lab.deadline);
                            const progress = calculatePercentage(lab.studentProgress || 0, lab.totalStudents || 1);

                            return (
                                <Card key={lab.$id} className="hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="text-lg">{lab.title}</CardTitle>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {lab.subject} • Lab {lab.labNumber}
                                                </p>
                                            </div>
                                            <Badge variant={deadlineInfo.color as "default" | "secondary" | "destructive" | "outline"}>
                                                {deadlineInfo.label}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {lab.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {lab.description}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <BookOpen className="h-4 w-4" />
                                                {lab.problemCount || 0} problems
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users className="h-4 w-4" />
                                                {lab.studentProgress || 0}/{lab.totalStudents || 0}
                                            </span>
                                        </div>

                                        {lab.deadline && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <span>{formatDate(lab.deadline)}</span>
                                            </div>
                                        )}

                                        {/* Progress bar */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span>Student Progress</span>
                                                <span>{progress}%</span>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary transition-all"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <Link href={`/teacher/labs/${lab.$id}`} className="flex-1">
                                                <Button variant="outline" size="sm" className="w-full">
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    View
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => deleteLab(lab.$id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}

                        {/* Add New Lab Card */}
                        <Link href="/teacher/labs/new">
                            <Card className="h-full min-h-[250px] border-dashed flex items-center justify-center hover:bg-secondary transition-colors cursor-pointer">
                                <div className="text-center">
                                    <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                                        <Plus className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <h3 className="font-semibold">Create New Lab</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Add a new lab assignment
                                    </p>
                                </div>
                            </Card>
                        </Link>
                    </div>
                ) : (
                    <Card>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-4 font-medium">Lab</th>
                                        <th className="text-left p-4 font-medium">Subject</th>
                                        <th className="text-left p-4 font-medium">Problems</th>
                                        <th className="text-left p-4 font-medium">Progress</th>
                                        <th className="text-left p-4 font-medium">Deadline</th>
                                        <th className="text-left p-4 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLabs.map((lab) => {
                                        const deadlineInfo = getDeadlineStatus(lab.deadline);
                                        const progress = calculatePercentage(lab.studentProgress || 0, lab.totalStudents || 1);

                                        return (
                                            <tr key={lab.$id} className="border-b hover:bg-secondary transition-colors">
                                                <td className="p-4">
                                                    <div>
                                                        <p className="font-medium">{lab.title}</p>
                                                        <p className="text-sm text-muted-foreground">Lab {lab.labNumber}</p>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-muted-foreground">{lab.subject}</td>
                                                <td className="p-4">{lab.problemCount || 0}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-primary"
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-sm">{progress}%</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <Badge variant={deadlineInfo.color as "default" | "secondary" | "destructive" | "outline"}>
                                                        {lab.deadline ? formatDate(lab.deadline) : "No deadline"}
                                                    </Badge>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex gap-2">
                                                        <Link href={`/teacher/labs/${lab.$id}`}>
                                                            <Button variant="ghost" size="icon">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() => deleteLab(lab.$id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )
            }
        </div >
    );
}
