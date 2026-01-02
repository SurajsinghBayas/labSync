"use client";

import { useState, useEffect } from "react";
import {
    BarChart3,
    TrendingUp,
    Users,
    BookOpen,
    CheckCircle2,
    Clock,
    ArrowUp,
    ArrowDown,
    Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, calculatePercentage } from "@/lib/utils";
import { databases, COLLECTIONS, getDatabaseId, Query } from "@/lib/appwrite";

interface DailySubmission {
    day: string;
    date: string;
    submissions: number;
}

interface TopPerformer {
    name: string;
    solved: number;
    total: number;
    percentage: number;
}

interface DifficultyStats {
    difficulty: string;
    solved: number;
    total: number;
    percentage: number;
    color: string;
}

interface LabStats {
    labTitle: string;
    completionRate: number;
    totalStudents: number;
    completedStudents: number;
}

export default function TeacherAnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [dailySubmissions, setDailySubmissions] = useState<DailySubmission[]>([]);
    const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
    const [difficultyStats, setDifficultyStats] = useState<DifficultyStats[]>([]);
    const [labStats, setLabStats] = useState<LabStats[]>([]);
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalLabs: 0,
        totalSubmissions: 0,
        avgCompletionRate: 0,
        submissionsThisWeek: 0,
        submissionsLastWeek: 0,
    });

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const databaseId = getDatabaseId();

            // Fetch all data
            const [studentsRes, labsRes, problemsRes, submissionsRes] = await Promise.all([
                databases.listDocuments(databaseId, COLLECTIONS.USERS, [
                    Query.equal("role", "student"),
                    Query.limit(500),
                ]),
                databases.listDocuments(databaseId, COLLECTIONS.LABS, [Query.limit(100)]),
                databases.listDocuments(databaseId, COLLECTIONS.PROBLEMS, [Query.limit(500)]),
                databases.listDocuments(databaseId, COLLECTIONS.SUBMISSIONS, [Query.limit(1000)]),
            ]);

            const students = studentsRes.documents;
            const problems = problemsRes.documents;
            const submissions = submissionsRes.documents;
            const labs = labsRes.documents;

            // Calculate daily submissions for last 7 days
            const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            const daily: DailySubmission[] = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);
                const nextDate = new Date(date);
                nextDate.setDate(nextDate.getDate() + 1);

                const count = submissions.filter((sub) => {
                    const subDate = new Date(sub.$createdAt);
                    return subDate >= date && subDate < nextDate;
                }).length;

                daily.push({
                    day: days[date.getDay()],
                    date: date.toISOString().split("T")[0],
                    submissions: count,
                });
            }
            setDailySubmissions(daily);

            // Calculate top performers
            const studentProgress: { [key: string]: { name: string; solved: number } } = {};
            students.forEach((student) => {
                const solvedCount = submissions.filter(
                    (sub) => sub.userId === student.$id && sub.status === "solved"
                ).length;
                studentProgress[student.$id] = {
                    name: student.name,
                    solved: solvedCount,
                };
            });

            const topList = Object.values(studentProgress)
                .map((s) => ({
                    name: s.name,
                    solved: s.solved,
                    total: problems.length,
                    percentage: calculatePercentage(s.solved, problems.length || 1),
                }))
                .sort((a, b) => b.percentage - a.percentage)
                .slice(0, 5);
            setTopPerformers(topList);

            // Calculate difficulty stats
            const difficultyCount: { [key: string]: { total: number; solved: number } } = {
                easy: { total: 0, solved: 0 },
                medium: { total: 0, solved: 0 },
                hard: { total: 0, solved: 0 },
            };

            problems.forEach((problem) => {
                const diff = problem.difficulty || "easy";
                if (difficultyCount[diff]) {
                    difficultyCount[diff].total += students.length; // Each student should solve each problem
                }
            });

            submissions.forEach((sub) => {
                if (sub.status === "solved") {
                    const problem = problems.find((p) => p.$id === sub.problemId);
                    if (problem && difficultyCount[problem.difficulty]) {
                        difficultyCount[problem.difficulty].solved++;
                    }
                }
            });

            const diffStats: DifficultyStats[] = [
                {
                    difficulty: "Easy",
                    solved: difficultyCount.easy.solved,
                    total: difficultyCount.easy.total,
                    percentage: calculatePercentage(difficultyCount.easy.solved, difficultyCount.easy.total || 1),
                    color: "success",
                },
                {
                    difficulty: "Medium",
                    solved: difficultyCount.medium.solved,
                    total: difficultyCount.medium.total,
                    percentage: calculatePercentage(difficultyCount.medium.solved, difficultyCount.medium.total || 1),
                    color: "warning",
                },
                {
                    difficulty: "Hard",
                    solved: difficultyCount.hard.solved,
                    total: difficultyCount.hard.total,
                    percentage: calculatePercentage(difficultyCount.hard.solved, difficultyCount.hard.total || 1),
                    color: "destructive",
                },
            ];
            setDifficultyStats(diffStats);

            // Calculate lab stats
            const labStatsList: LabStats[] = labs.map((lab) => {
                const labProblems = problems.filter((p) => p.labId === lab.$id);
                const labProblemIds = labProblems.map((p) => p.$id);

                // Count students who completed all problems in this lab
                let completedCount = 0;
                students.forEach((student) => {
                    const studentLabSubmissions = submissions.filter(
                        (sub) =>
                            sub.userId === student.$id &&
                            labProblemIds.includes(sub.problemId) &&
                            sub.status === "solved"
                    );
                    if (studentLabSubmissions.length >= labProblems.length && labProblems.length > 0) {
                        completedCount++;
                    }
                });

                return {
                    labTitle: lab.title,
                    completionRate: calculatePercentage(completedCount, students.length || 1),
                    totalStudents: students.length,
                    completedStudents: completedCount,
                };
            });
            setLabStats(labStatsList);

            // Calculate week comparisons
            const now = new Date();
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

            const thisWeekSubmissions = submissions.filter(
                (sub) => new Date(sub.$createdAt) >= oneWeekAgo
            ).length;
            const lastWeekSubmissions = submissions.filter(
                (sub) => new Date(sub.$createdAt) >= twoWeeksAgo && new Date(sub.$createdAt) < oneWeekAgo
            ).length;

            // Calculate average completion
            const avgCompletion = students.length > 0
                ? Math.round(
                    students.reduce((sum, student) => {
                        const solved = submissions.filter(
                            (sub) => sub.userId === student.$id && sub.status === "solved"
                        ).length;
                        return sum + calculatePercentage(solved, problems.length || 1);
                    }, 0) / students.length
                )
                : 0;

            setStats({
                totalStudents: students.length,
                totalLabs: labs.length,
                totalSubmissions: submissions.length,
                avgCompletionRate: avgCompletion,
                submissionsThisWeek: thisWeekSubmissions,
                submissionsLastWeek: lastWeekSubmissions,
            });
        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    const weekChange = stats.submissionsLastWeek > 0
        ? Math.round(((stats.submissionsThisWeek - stats.submissionsLastWeek) / stats.submissionsLastWeek) * 100)
        : stats.submissionsThisWeek > 0 ? 100 : 0;

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
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
                <p className="text-muted-foreground">
                    Track student performance and submission trends
                </p>
            </div>

            {/* Overview Stats */}
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
                                <p className="text-2xl font-bold">{stats.totalLabs}</p>
                                <p className="text-sm text-muted-foreground">Active Labs</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                                <BarChart3 className="h-5 w-5 text-warning" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.totalSubmissions}</p>
                                <p className="text-sm text-muted-foreground">Total Submissions</p>
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
                                <p className="text-2xl font-bold">{stats.avgCompletionRate}%</p>
                                <p className="text-sm text-muted-foreground">Avg. Completion</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Weekly Submissions Chart */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Weekly Submissions</CardTitle>
                                <CardDescription>Submissions over the last 7 days</CardDescription>
                            </div>
                            <div className={cn(
                                "flex items-center gap-1 text-sm",
                                weekChange >= 0 ? "text-success" : "text-destructive"
                            )}>
                                {weekChange >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                                {Math.abs(weekChange)}% vs last week
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end justify-between h-48 gap-2">
                            {dailySubmissions.map((day) => {
                                const maxSubmissions = Math.max(...dailySubmissions.map(d => d.submissions), 1);
                                const height = (day.submissions / maxSubmissions) * 100;
                                return (
                                    <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                                        <div className="w-full bg-muted rounded-t-md relative" style={{ height: "160px" }}>
                                            <div
                                                className="absolute bottom-0 w-full bg-primary rounded-t-md transition-all"
                                                style={{ height: `${height}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-muted-foreground">{day.day}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Performers */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Performers</CardTitle>
                        <CardDescription>Students with highest completion rates</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topPerformers.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">No data yet</p>
                            ) : (
                                topPerformers.map((performer, index) => (
                                    <div key={performer.name} className="flex items-center gap-4">
                                        <span className={cn(
                                            "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium",
                                            index === 0 ? "bg-yellow-500/20 text-yellow-600" :
                                                index === 1 ? "bg-gray-300/20 text-gray-600" :
                                                    index === 2 ? "bg-orange-500/20 text-orange-600" :
                                                        "bg-muted text-muted-foreground"
                                        )}>
                                            {index + 1}
                                        </span>
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <span className="font-medium">{performer.name}</span>
                                                <span className="text-sm text-muted-foreground">
                                                    {performer.solved}/{performer.total}
                                                </span>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary transition-all"
                                                    style={{ width: `${performer.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                        <span className="text-sm font-medium">{performer.percentage}%</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Second Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Difficulty Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle>Difficulty Breakdown</CardTitle>
                        <CardDescription>Success rates by problem difficulty</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {difficultyStats.map((diff) => (
                                <div key={diff.difficulty} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={diff.color as "default" | "secondary" | "destructive" | "outline"}>
                                                {diff.difficulty}
                                            </Badge>
                                            <span className="text-sm text-muted-foreground">
                                                {diff.solved} / {diff.total} solved
                                            </span>
                                        </div>
                                        <span className="font-medium">{diff.percentage}%</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full transition-all",
                                                diff.color === "success" ? "bg-success" :
                                                    diff.color === "warning" ? "bg-warning" :
                                                        "bg-destructive"
                                            )}
                                            style={{ width: `${diff.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Lab Completion Rates */}
                <Card>
                    <CardHeader>
                        <CardTitle>Lab Completion Rates</CardTitle>
                        <CardDescription>Percentage of students who completed each lab</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {labStats.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">No labs yet</p>
                            ) : (
                                labStats.map((lab) => (
                                    <div key={lab.labTitle} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium truncate max-w-[200px]">{lab.labTitle}</span>
                                            <span className="text-sm text-muted-foreground">
                                                {lab.completedStudents}/{lab.totalStudents} students
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary transition-all"
                                                    style={{ width: `${lab.completionRate}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium w-12 text-right">
                                                {lab.completionRate}%
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
