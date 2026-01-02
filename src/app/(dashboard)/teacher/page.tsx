"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Users,
    BookOpen,
    Plus,
    Search,
    Download,
    Loader2,
    TrendingUp,
    FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { cn, getRelativeTime, calculatePercentage } from "@/lib/utils";
import { databases, COLLECTIONS, getDatabaseId, Query } from "@/lib/appwrite";
import * as XLSX from "xlsx";

interface StudentData {
    user: {
        $id: string;
        name: string;
        email: string;
        hackerRankUsername: string | null;
        hackerRankVerified: boolean;
    };
    totalProblems: number;
    solvedProblems: number;
    attemptedProblems: number;
    completionPercentage: number;
    lastActivity: string | null;
}

export default function TeacherDashboard() {
    const [students, setStudents] = useState<StudentData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [stats, setStats] = useState({
        totalStudents: 0,
        activeLabs: 0,
        submissionsToday: 0,
        avgCompletion: 0,
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const databaseId = getDatabaseId();

            // Fetch all students
            const studentsResponse = await databases.listDocuments(databaseId, COLLECTIONS.USERS, [
                Query.equal("role", "student"),
                Query.limit(100),
            ]);

            // Fetch active labs
            const labsResponse = await databases.listDocuments(databaseId, COLLECTIONS.LABS, [
                Query.limit(100),
            ]);

            // Fetch all problems
            const problemsResponse = await databases.listDocuments(databaseId, COLLECTIONS.PROBLEMS, [
                Query.limit(500),
            ]);

            // Fetch all submissions
            const submissionsResponse = await databases.listDocuments(databaseId, COLLECTIONS.SUBMISSIONS, [
                Query.limit(1000),
            ]);

            // Calculate today's submissions
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const submissionsToday = submissionsResponse.documents.filter(
                (sub) => new Date(sub.$createdAt) >= today
            ).length;

            // Process students with their progress
            const studentProgressList: StudentData[] = studentsResponse.documents.map((doc) => {
                // Get submissions for this student
                const studentSubmissions = submissionsResponse.documents.filter(
                    (sub) => sub.userId === doc.$id
                );

                const solvedCount = studentSubmissions.filter(s => s.status === "solved").length;
                const attemptedCount = studentSubmissions.filter(s => s.status === "attempted").length;
                const totalProblems = problemsResponse.total;

                // Get last activity
                const lastSubmission = studentSubmissions.sort(
                    (a, b) => new Date(b.$updatedAt).getTime() - new Date(a.$updatedAt).getTime()
                )[0];

                return {
                    user: {
                        $id: doc.$id,
                        name: doc.name || "Unknown",
                        email: doc.email || "",
                        role: "student" as const,
                        hackerRankUsername: doc.hackerRankUsername || null,
                        hackerRankVerified: doc.hackerRankVerified || false,
                    },
                    totalProblems,
                    solvedProblems: solvedCount,
                    attemptedProblems: attemptedCount,
                    completionPercentage: calculatePercentage(solvedCount, totalProblems || 1),
                    lastActivity: lastSubmission?.$updatedAt || null,
                };
            });

            // Calculate average completion
            const avgCompletion = studentProgressList.length > 0
                ? Math.round(
                    studentProgressList.reduce((sum, s) => sum + s.completionPercentage, 0) / studentProgressList.length
                )
                : 0;

            setStudents(studentProgressList);
            setStats({
                totalStudents: studentsResponse.total,
                activeLabs: labsResponse.total,
                submissionsToday,
                avgCompletion,
            });
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = () => {
        const exportData = students.map((student) => ({
            "Name": student.user.name,
            "Email": student.user.email,
            "HackerRank": student.user.hackerRankUsername || "Not Linked",
            "Solved": student.solvedProblems,
            "Attempted": student.attemptedProblems,
            "Total Problems": student.totalProblems,
            "Completion %": student.completionPercentage,
            "Last Activity": student.lastActivity ? new Date(student.lastActivity).toLocaleString() : "Never",
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        worksheet["!cols"] = [
            { wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 10 },
            { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 20 },
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
        XLSX.writeFile(workbook, `labsync_dashboard_${new Date().toISOString().split("T")[0]}.xlsx`);
    };

    const filteredStudents = students.filter((student) =>
        student.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                    <h1 className="text-2xl font-bold tracking-tight">Teacher Dashboard</h1>
                    <p className="text-muted-foreground">
                        Monitor student progress and manage labs
                    </p>
                </div>
                <div className="flex gap-3">
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

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.totalStudents}</p>
                                <p className="text-sm text-muted-foreground">Total Students</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                                <BookOpen className="h-5 w-5 text-success" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.activeLabs}</p>
                                <p className="text-sm text-muted-foreground">Active Labs</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                                <FileCode className="h-5 w-5 text-warning" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.submissionsToday}</p>
                                <p className="text-sm text-muted-foreground">Submissions Today</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-accent-foreground" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.avgCompletion}%</p>
                                <p className="text-sm text-muted-foreground">Avg. Completion</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-3">
                <Link href="/teacher/labs/new">
                    <Card className="hover:bg-secondary transition-colors cursor-pointer h-full">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                                    <Plus className="h-5 w-5 text-primary-foreground" />
                                </div>
                                <div>
                                    <p className="font-medium">Create New Lab</p>
                                    <p className="text-sm text-muted-foreground">Set up a new lab session</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/teacher/students">
                    <Card className="hover:bg-secondary transition-colors cursor-pointer h-full">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-success flex items-center justify-center">
                                    <Users className="h-5 w-5 text-success-foreground" />
                                </div>
                                <div>
                                    <p className="font-medium">View All Students</p>
                                    <p className="text-sm text-muted-foreground">Manage student progress</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/teacher/analytics">
                    <Card className="hover:bg-secondary transition-colors cursor-pointer h-full">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-warning flex items-center justify-center">
                                    <TrendingUp className="h-5 w-5 text-warning-foreground" />
                                </div>
                                <div>
                                    <p className="font-medium">View Analytics</p>
                                    <p className="text-sm text-muted-foreground">Track performance trends</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Students Table */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Student Progress</CardTitle>
                            <CardDescription>Overview of all student submissions</CardDescription>
                        </div>
                        <div className="relative max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search students..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-3 font-medium">Student</th>
                                    <th className="text-left p-3 font-medium">Progress</th>
                                    <th className="text-left p-3 font-medium">Status</th>
                                    <th className="text-left p-3 font-medium">Last Active</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                            No students found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStudents.slice(0, 10).map((student) => (
                                        <tr key={student.user.$id} className="border-b hover:bg-secondary transition-colors">
                                            <td className="p-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar name={student.user.name || "Unknown"} size="sm" />
                                                    <div>
                                                        <p className="font-medium">{student.user.name}</p>
                                                        <p className="text-xs text-muted-foreground">{student.user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className={cn(
                                                                "h-full transition-all",
                                                                student.completionPercentage === 100 ? "bg-success" :
                                                                    student.completionPercentage >= 50 ? "bg-primary" : "bg-warning"
                                                            )}
                                                            style={{ width: `${student.completionPercentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm">{student.completionPercentage}%</span>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <StatusBadge
                                                    status={
                                                        student.completionPercentage === 100 ? "completed" :
                                                            student.completionPercentage > 0 ? "in_progress" : "not_started"
                                                    }
                                                />
                                            </td>
                                            <td className="p-3 text-muted-foreground text-sm">
                                                {student.lastActivity ? getRelativeTime(student.lastActivity) : "Never"}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {filteredStudents.length > 10 && (
                        <div className="mt-4 text-center">
                            <Link href="/teacher/students">
                                <Button variant="outline">View All Students</Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
