"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Copy, ExternalLink, CheckCircle2,
    User, BookOpen, Lightbulb, Users,
    FileBarChart, Plus, Code2, Link as LinkIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Documentation() {
    const [activeTab, setActiveTab] = useState<"student" | "teacher">("student");

    return (
        <section id="docs" className="w-full py-24 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-900">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="flex flex-col items-center text-center space-y-6 mb-16">
                    <Badge variant="outline" className="px-3 py-1 text-sm font-normal uppercase tracking-wider text-zinc-500">
                        Workflow Guide
                    </Badge>
                    <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl text-zinc-900 dark:text-zinc-50">
                        Master the Platform
                    </h2>
                    <p className="max-w-[700px] text-zinc-500 md:text-xl/relaxed dark:text-zinc-400">
                        A streamlined guide for students and faculty to manage academic submissions efficiently.
                    </p>

                    {/* Minimalist Segmented Control */}
                    <div className="inline-flex items-center justify-center rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800 mt-8">
                        <button
                            onClick={() => setActiveTab("student")}
                            className={cn(
                                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                                activeTab === "student"
                                    ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
                                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                            )}
                        >
                            <User className="mr-2 h-4 w-4" />
                            Student
                        </button>
                        <button
                            onClick={() => setActiveTab("teacher")}
                            className={cn(
                                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                                activeTab === "teacher"
                                    ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
                                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                            )}
                        >
                            <Users className="mr-2 h-4 w-4" />
                            Faculty
                        </button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {activeTab === "student" ? (
                        <>
                            {/* Step 1 */}
                            <Card className="border-0 shadow-none bg-zinc-50/50 dark:bg-zinc-900/50">
                                <CardHeader>
                                    <div className="h-10 w-10 rounded-lg bg-zinc-900 text-white flex items-center justify-center mb-4">
                                        <Code2 className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-xl">1. Solve Problem</CardTitle>
                                    <CardDescription className="text-base text-zinc-500">
                                        Navigate to your assigned lab on the dashboard. Click the challenge link to open HackerRank, then solve and pass all test cases.
                                    </CardDescription>
                                </CardHeader>
                            </Card>

                            {/* Step 2 */}
                            <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3">
                                    <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 hover:bg-zinc-200">Critical</Badge>
                                </div>
                                <CardHeader>
                                    <div className="h-10 w-10 rounded-lg bg-blue-600 text-white flex items-center justify-center mb-4">
                                        <LinkIcon className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-xl">2. Copy Link</CardTitle>
                                    <CardDescription className="text-base text-zinc-500 space-y-3">
                                        <span className="block">Go to the <strong>Submissions</strong> tab, click your <strong>Accepted</strong> submission, and copy the URL.</span>
                                        <code className="block w-full bg-zinc-50 dark:bg-zinc-900 p-2 rounded text-xs font-mono border border-zinc-100 dark:border-zinc-800 text-zinc-600">
                                            .../challenges/slug/submissions/code/12345
                                        </code>
                                    </CardDescription>
                                </CardHeader>
                            </Card>

                            {/* Step 3 */}
                            <Card className="border-0 shadow-none bg-zinc-50/50 dark:bg-zinc-900/50">
                                <CardHeader>
                                    <div className="h-10 w-10 rounded-lg bg-zinc-900 text-white flex items-center justify-center mb-4">
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-xl">3. Verify</CardTitle>
                                    <CardDescription className="text-base text-zinc-500">
                                        Paste the link into LabSync and upload a screenshot. Verification is instant and automated.
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        </>
                    ) : (
                        <>
                            {/* Teacher Steps */}
                            <Card className="border-0 shadow-none bg-zinc-50/50 dark:bg-zinc-900/50">
                                <CardHeader>
                                    <div className="h-10 w-10 rounded-lg bg-zinc-900 text-white flex items-center justify-center mb-4">
                                        <Plus className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-xl">1. Information</CardTitle>
                                    <CardDescription className="text-base text-zinc-500">
                                        Create a new lab with Title, Subject, and Deadline. Organize via Branch, Year, and Division.
                                    </CardDescription>
                                </CardHeader>
                            </Card>

                            <Card className="border-0 shadow-none bg-zinc-50/50 dark:bg-zinc-900/50">
                                <CardHeader>
                                    <div className="h-10 w-10 rounded-lg bg-zinc-900 text-white flex items-center justify-center mb-4">
                                        <BookOpen className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-xl">2. Assignments</CardTitle>
                                    <CardDescription className="text-base text-zinc-500">
                                        Paste HackerRank Challenge URLs. The system auto-validates links and extracts required metadata.
                                    </CardDescription>
                                </CardHeader>
                            </Card>

                            <Card className="border-0 shadow-none bg-zinc-50/50 dark:bg-zinc-900/50">
                                <CardHeader>
                                    <div className="h-10 w-10 rounded-lg bg-zinc-900 text-white flex items-center justify-center mb-4">
                                        <FileBarChart className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-xl">3. Evaluation</CardTitle>
                                    <CardDescription className="text-base text-zinc-500">
                                        Track &quot;Solved&quot; status in real-time. Export comprehensive Excel reports containing proof links and code.
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
