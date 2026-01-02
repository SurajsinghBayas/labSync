"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Plus,
    Trash2,
    ExternalLink,
    Calendar,
    Clock,
    Save,
    Loader2,
    Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { account, databases, COLLECTIONS, getDatabaseId, ID } from "@/lib/appwrite";

// Constants for dropdown options
const BRANCHES = ["CSE", "AI&DS"];
const YEARS = ["FY", "SY", "TY", "BTech"];
const DIVISIONS = ["A", "B", "C", "D", "E"];
const BATCHES = ["1", "2", "3"];

interface ProblemInput {
    id: string;
    title: string;
    url: string;
    difficulty: "easy" | "medium" | "hard";
}

export default function CreateLabPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [subject, setSubject] = useState("");
    const [labDate, setLabDate] = useState("");
    const [duration, setDuration] = useState("2880"); // 48 hours (2 days) in minutes
    const [problems, setProblems] = useState<ProblemInput[]>([
        { id: "1", title: "", url: "", difficulty: "easy" }
    ]);

    // Target audience filters
    const [branch, setBranch] = useState("");
    const [year, setYear] = useState("");
    const [division, setDivision] = useState("");
    const [batch, setBatch] = useState("");

    const addProblem = () => {
        setProblems([
            ...problems,
            { id: Date.now().toString(), title: "", url: "", difficulty: "easy" }
        ]);
    };

    const removeProblem = (id: string) => {
        if (problems.length > 1) {
            setProblems(problems.filter(p => p.id !== id));
        }
    };

    const updateProblem = (id: string, field: keyof ProblemInput, value: string) => {
        setProblems(problems.map(p =>
            p.id === id ? { ...p, [field]: value } : p
        ));
    };

    // Extract HackerRank slug from URL
    const extractSlugFromUrl = (url: string): string => {
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/').filter(Boolean);
            // HackerRank URLs are usually like: /challenges/slug-name/problem
            const challengeIndex = pathParts.indexOf('challenges');
            if (challengeIndex !== -1 && pathParts[challengeIndex + 1]) {
                return pathParts[challengeIndex + 1];
            }
            return pathParts[pathParts.length - 1] || "";
        } catch {
            return "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validation
        if (!title.trim()) {
            setError("Please enter a lab title");
            return;
        }
        if (!subject.trim()) {
            setError("Please enter a subject");
            return;
        }
        if (!labDate) {
            setError("Please select a lab date");
            return;
        }

        const validProblems = problems.filter(p => p.title.trim() && p.url.trim());
        if (validProblems.length === 0) {
            setError("Please add at least one problem with title and URL");
            return;
        }

        setIsLoading(true);

        try {
            const user = await account.get();
            const databaseId = getDatabaseId();

            // Calculate deadline based on lab date and duration
            const labDateTime = new Date(labDate);
            const deadline = new Date(labDateTime.getTime() + parseInt(duration) * 60 * 1000);

            // Get next lab number
            const existingLabs = await databases.listDocuments(databaseId, COLLECTIONS.LABS);
            const labNumber = existingLabs.total + 1;

            // Create the lab with optional filtering fields
            const labData: Record<string, string | number | null> = {
                title: title.trim(),
                description: description.trim(),
                labNumber: labNumber,
                subject: subject.trim(),
                startTime: labDateTime.toISOString(),
                deadline: deadline.toISOString(),
                createdBy: user.$id,
            };

            // Add filtering fields only if selected
            if (branch) labData.branch = branch;
            if (year) labData.year = year;
            if (division) labData.division = division;
            if (batch) labData.batch = batch;

            const lab = await databases.createDocument(
                databaseId,
                COLLECTIONS.LABS,
                ID.unique(),
                labData
            );

            // Create problems for this lab
            for (const problem of validProblems) {
                await databases.createDocument(
                    databaseId,
                    COLLECTIONS.PROBLEMS,
                    ID.unique(),
                    {
                        title: problem.title.trim(),
                        hackerRankSlug: extractSlugFromUrl(problem.url),
                        hackerRankUrl: problem.url.trim(),
                        labId: lab.$id,
                        difficulty: problem.difficulty,
                        points: problem.difficulty === "easy" ? 10 : problem.difficulty === "medium" ? 20 : 30,
                    }
                );
            }

            router.push("/teacher/labs");
        } catch (err) {
            console.error("Error creating lab:", err);
            setError("Failed to create lab. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/teacher/labs">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Create New Lab</h1>
                    <p className="text-muted-foreground">Set up a new lab session with problems for students</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                        {error}
                    </div>
                )}

                {/* Basic Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Lab Details</CardTitle>
                        <CardDescription>Basic information about the lab session</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Lab Title *</label>
                                <Input
                                    placeholder="e.g., Arrays and Strings"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Subject *</label>
                                <Input
                                    placeholder="e.g., Data Structures"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <textarea
                                className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                placeholder="Brief description of what students will learn..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Target Audience */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Target Audience
                        </CardTitle>
                        <CardDescription>Select which students should see this lab (leave empty for all students)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Branch</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={branch}
                                    onChange={(e) => setBranch(e.target.value)}
                                >
                                    <option value="">All Branches</option>
                                    {BRANCHES.map((b) => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Year</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                >
                                    <option value="">All Years</option>
                                    {YEARS.map((y) => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Division</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={division}
                                    onChange={(e) => setDivision(e.target.value)}
                                >
                                    <option value="">All Divisions</option>
                                    {DIVISIONS.map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Batch</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={batch}
                                    onChange={(e) => setBatch(e.target.value)}
                                >
                                    <option value="">All Batches</option>
                                    {BATCHES.map((b) => (
                                        <option key={b} value={b}>Batch {b}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Schedule */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Schedule
                        </CardTitle>
                        <CardDescription>When the lab will take place</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Lab Date & Time *</label>
                                <Input
                                    type="datetime-local"
                                    value={labDate}
                                    onChange={(e) => setLabDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Duration (minutes)
                                </label>
                                <Input
                                    type="number"
                                    min="15"
                                    max="480"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Problems */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Problems</CardTitle>
                                <CardDescription>Add HackerRank problems for this lab</CardDescription>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={addProblem}>
                                <Plus className="h-4 w-4 mr-1" />
                                Add Problem
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {problems.map((problem, index) => (
                            <div key={problem.id} className="p-4 border rounded-lg space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted-foreground">
                                        Problem {index + 1}
                                    </span>
                                    {problems.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={() => removeProblem(problem.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                                <div className="grid gap-3 md:grid-cols-3">
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">Title</label>
                                        <Input
                                            placeholder="Problem title"
                                            value={problem.title}
                                            onChange={(e) => updateProblem(problem.id, "title", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground flex items-center gap-1">
                                            HackerRank URL
                                            <ExternalLink className="h-3 w-3" />
                                        </label>
                                        <Input
                                            placeholder="https://hackerrank.com/challenges/..."
                                            value={problem.url}
                                            onChange={(e) => updateProblem(problem.id, "url", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">Difficulty</label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            value={problem.difficulty}
                                            onChange={(e) => updateProblem(problem.id, "difficulty", e.target.value)}
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Submit */}
                <div className="flex justify-end gap-3">
                    <Link href="/teacher/labs">
                        <Button type="button" variant="outline">Cancel</Button>
                    </Link>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Create Lab
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
