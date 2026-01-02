"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Clock, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { StatusBadge, DifficultyBadge } from "@/components/ui/badge";
import { cn, getRelativeTime } from "@/lib/utils";
import { account, databases, COLLECTIONS, getDatabaseId, Query } from "@/lib/appwrite";

export default function StudentDashboard() {
    const [syncing, setSyncing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState({
        solved: 0,
        total: 0,
        pending: 0,
    });
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [activeLabs, setActiveLabs] = useState<any[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const userData = await account.get();
                setUser(userData);

                const databaseId = getDatabaseId();

                // 1. Fetch Submissions for Stats and Activity
                const submissionsResponse = await databases.listDocuments(
                    databaseId,
                    COLLECTIONS.SUBMISSIONS,
                    [
                        Query.equal("userId", userData.$id),
                        Query.orderDesc("$updatedAt"),
                        Query.limit(10)
                    ]
                ).catch(err => {
                    console.error("Submissions fetch error", err);
                    return { documents: [], total: 0 };
                });

                const allSubmissionsResponse = await databases.listDocuments(
                    databaseId,
                    COLLECTIONS.SUBMISSIONS,
                    [
                        Query.equal("userId", userData.$id),
                        Query.limit(100)
                    ]
                ).catch(() => ({ documents: [], total: 0 }));

                const submissions = allSubmissionsResponse.documents;
                const solvedCount = submissions.filter((s: any) => s.status === "solved").length;
                const pendingCount = submissions.filter((s: any) => s.status === "attempted").length;

                // 2. Fetch Total Problems
                const problemsResponse = await databases.listDocuments(
                    databaseId,
                    COLLECTIONS.PROBLEMS,
                    [Query.limit(1)]
                ).catch(() => ({ total: 0 }));
                const totalProblems = problemsResponse.total;

                setStats({
                    solved: solvedCount,
                    pending: pendingCount,
                    total: totalProblems,
                });

                // 3. Process Recent Activity
                const recentItems = await Promise.all(submissionsResponse.documents.slice(0, 5).map(async (submission: any) => {
                    try {
                        const problem = await databases.getDocument(
                            databaseId,
                            COLLECTIONS.PROBLEMS,
                            submission.problemId
                        );

                        let labTitle = "Lab";
                        if (problem.labId) {
                            try {
                                const lab = await databases.getDocument(databaseId, COLLECTIONS.LABS, problem.labId);
                                labTitle = lab.title;
                            } catch (e) { /* ignore */ }
                        }

                        return {
                            id: submission.$id,
                            title: problem.title,
                            lab: labTitle,
                            difficulty: problem.difficulty,
                            status: submission.status,
                            lastAction: submission.$updatedAt || submission.submittedAt, // Use system updated at or field
                        };
                    } catch (e) {
                        return null;
                    }
                }));

                setRecentActivity(recentItems.filter(Boolean));

                // 4. Fetch student profile for filtering
                const studentDoc = await databases.getDocument(databaseId, COLLECTIONS.USERS, userData.$id).catch(() => null);
                const studentProfile = {
                    branch: studentDoc?.branch || null,
                    year: studentDoc?.year || null,
                    division: studentDoc?.division || null,
                    batch: studentDoc?.batch || null,
                };

                // 5. Fetch Active Labs (filtered by student profile)
                const labsResponse = await databases.listDocuments(
                    databaseId,
                    COLLECTIONS.LABS,
                    [Query.limit(20), Query.orderAsc("deadline")]
                ).catch(() => ({ documents: [] }));

                // Filter labs based on student's profile
                const filteredLabs = labsResponse.documents.filter((lab: any) => {
                    if (!lab.branch && !lab.year && !lab.division && !lab.batch) return true;
                    if (lab.branch && lab.branch !== studentProfile.branch) return false;
                    if (lab.year && lab.year !== studentProfile.year) return false;
                    if (lab.division && lab.division !== studentProfile.division) return false;
                    if (lab.batch && lab.batch !== studentProfile.batch) return false;
                    return true;
                });

                const labsWithProgress = await Promise.all(filteredLabs.slice(0, 5).map(async (lab: any) => {
                    const labProblems = await databases.listDocuments(
                        databaseId,
                        COLLECTIONS.PROBLEMS,
                        [Query.equal("labId", lab.$id)]
                    ).catch(() => ({ total: 0 }));
                    const totalLabProblems = labProblems.total;

                    if (totalLabProblems === 0) return { ...lab, progress: 0 };

                    const solvedInLab = submissions.filter((s: any) =>
                        s.labId === lab.$id && s.status === "solved"
                    ).length;

                    return {
                        id: lab.$id,
                        title: lab.title,
                        subject: lab.subject,
                        deadline: lab.deadline,
                        progress: Math.round((solvedInLab / totalLabProblems) * 100)
                    };
                }));

                setActiveLabs(labsWithProgress);

            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const handleSync = async () => {
        setSyncing(true);
        try {
            const response = await fetch("/api/hackerrank/sync", { method: "POST" });
            if (response.ok) {
                window.location.reload();
            }
        } catch (error) {
            console.error("Sync failed", error);
        } finally {
            setSyncing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
                    <p className="text-muted-foreground">
                        Welcome back, {user?.name}. You have {activeLabs.length} active labs.
                    </p>
                </div>
                <Button onClick={handleSync} disabled={syncing} variant="outline" size="sm">
                    <RefreshCw className={cn("mr-2 h-4 w-4", syncing && "animate-spin")} />
                    Sync HackerRank
                </Button>
            </div>

            {/* Stats Cards - Minimal */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Problems Solved</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.solved}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.total > 0 ? (stats.solved / stats.total * 100).toFixed(0) : 0}% completion rate
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pending}</div>
                        <p className="text-xs text-muted-foreground">
                            Requires verification
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Assigned</CardTitle>
                        <Circle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">
                            Across all labs
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Active Labs */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Active Labs</h2>
                        <Link href="/student/labs" className="text-sm text-primary hover:underline">
                            View all
                        </Link>
                    </div>
                    <div className="rounded-md border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Lab Title</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead className="w-[100px]">Progress</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activeLabs.length > 0 ? (
                                    activeLabs.map((lab) => (
                                        <TableRow key={lab.id} className="cursor-pointer group">
                                            <TableCell className="font-medium">
                                                <Link href={`/student/labs?id=${lab.id}`} className="block">
                                                    {lab.title}
                                                    <span className="block text-xs text-muted-foreground font-normal">
                                                        {lab.subject}
                                                    </span>
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {lab.deadline ? getRelativeTime(lab.deadline) : "No deadline"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs tabular-nums">{lab.progress}%</span>
                                                    <Progress value={lab.progress} className="h-1.5 w-16" />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                                            No active labs found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Recent Activity</h2>
                    </div>
                    <div className="rounded-md border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Problem</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentActivity.length > 0 ? (
                                    recentActivity.map((problem) => (
                                        <TableRow key={problem.id}>
                                            <TableCell>
                                                <div className="font-medium">{problem.title}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {problem.difficulty && <DifficultyBadge difficulty={problem.difficulty} size="sm" />}
                                                    <span className="text-xs text-muted-foreground">{problem.lab}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={problem.status} size="sm" />
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground text-xs">
                                                {getRelativeTime(problem.lastAction)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                                            No recent activity.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}
