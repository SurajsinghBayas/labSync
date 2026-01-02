"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Eye,
    EyeOff,
    GraduationCap,
    BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { account, ID, databases, COLLECTIONS, getDatabaseId } from "@/lib/appwrite";
import { isValidEmail, cn } from "@/lib/utils";
import type { UserRole } from "@/types";

import { Suspense } from "react";

// Constants for dropdown options
const BRANCHES = ["CSE", "AI&DS"];
const YEARS = ["FY", "SY", "TY", "BTech"];
const DIVISIONS = ["A", "B", "C", "D", "E"];
const BATCHES = ["1", "2", "3"];

function RegisterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const defaultRole = searchParams.get("role") as UserRole | null;

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState<UserRole>(defaultRole || "student");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Student-specific fields
    const [rollNo, setRollNo] = useState<number | "">("");
    const [branch, setBranch] = useState("");
    const [year, setYear] = useState("");
    const [division, setDivision] = useState("");
    const [batch, setBatch] = useState("");
    const [hackerRankUsername, setHackerRankUsername] = useState("");

    useEffect(() => {
        if (defaultRole && (defaultRole === "student" || defaultRole === "teacher")) {
            setRole(defaultRole);
        }
    }, [defaultRole]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!name || !email || !password || !confirmPassword) {
            setError("Please fill in all fields");
            return;
        }

        if (!isValidEmail(email)) {
            setError("Please enter a valid email address");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        // Validate student-specific fields
        if (role === "student") {
            if (!rollNo || !branch || !year || !division || !batch) {
                setError("Please fill in all student details");
                return;
            }
        }

        setIsLoading(true);

        try {
            const authUser = await account.create(ID.unique(), email, password, name);
            await account.createEmailPasswordSession(email, password);
            await account.updatePrefs({ role });

            const userData: Record<string, string | boolean | number> = {
                name: name,
                email: email,
                role: role,
            };

            // Add student-specific fields
            if (role === "student") {
                userData.rollNo = rollNo;
                userData.branch = branch;
                userData.year = year;
                userData.division = division;
                userData.batch = batch;
                userData.hackerRankUsername = hackerRankUsername;
            }

            await databases.createDocument(
                getDatabaseId(),
                COLLECTIONS.USERS,
                authUser.$id,
                userData
            );

            router.push(`/${role}`);
        } catch (err: unknown) {
            console.error("Registration error:", err);
            if (err instanceof Error && err.message.includes("already exists")) {
                setError("An account with this email already exists");
            } else {
                setError("Failed to create account. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="animate-fade-in border shadow-sm">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
                <CardDescription>
                    Join LabSync to streamline your lab submissions
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    {/* Role Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">I am a</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setRole("student")}
                                className={cn(
                                    "flex items-center gap-3 p-4 rounded-lg border transition-all text-left",
                                    role === "student"
                                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                                        : "border-border hover:border-foreground/20"
                                )}
                            >
                                <div
                                    className={cn(
                                        "h-8 w-8 rounded flex items-center justify-center shrink-0",
                                        role === "student"
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground"
                                    )}
                                >
                                    <GraduationCap className="h-4 w-4" />
                                </div>
                                <div>
                                    <div className="font-medium text-sm">Student</div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setRole("teacher")}
                                className={cn(
                                    "flex items-center gap-3 p-4 rounded-lg border transition-all text-left",
                                    role === "teacher"
                                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                                        : "border-border hover:border-foreground/20"
                                )}
                            >
                                <div
                                    className={cn(
                                        "h-8 w-8 rounded flex items-center justify-center shrink-0",
                                        role === "teacher"
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground"
                                    )}
                                >
                                    <BookOpen className="h-4 w-4" />
                                </div>
                                <div>
                                    <div className="font-medium text-sm">Teacher</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Full Name</label>
                            <Input
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoComplete="name"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input
                                type="email"
                                placeholder="name@college.edu"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                            />
                        </div>

                        {/* Student-specific fields */}
                        {role === "student" && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Roll Number</label>
                                    <Input
                                        type="number"
                                        placeholder="e.g., 12345"
                                        value={rollNo}
                                        onChange={(e) => setRollNo(e.target.value ? parseInt(e.target.value) : "")}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Branch</label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            value={branch}
                                            onChange={(e) => setBranch(e.target.value)}
                                        >
                                            <option value="">Select Branch</option>
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
                                            <option value="">Select Year</option>
                                            {YEARS.map((y) => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Division</label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            value={division}
                                            onChange={(e) => setDivision(e.target.value)}
                                        >
                                            <option value="">Select Division</option>
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
                                            <option value="">Select Batch</option>
                                            {BATCHES.map((b) => (
                                                <option key={b} value={b}>Batch {b}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">HackerRank Username (Optional)</label>
                                    <Input
                                        type="text"
                                        placeholder="your_username"
                                        value={hackerRankUsername}
                                        onChange={(e) => setHackerRankUsername(e.target.value.replace('@', '').trim())}
                                    />
                                    <p className="text-xs text-muted-foreground">Used for automatic submission verification.</p>
                                </div>
                            </>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Password</label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Min 8 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pr-10"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Confirm Password</label>
                            <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Re-enter password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                autoComplete="new-password"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        isLoading={isLoading}
                    >
                        Create Account
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link
                            href="/login"
                            className="text-primary hover:underline font-medium"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </CardContent>
        </Card >
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div className="h-[600px] w-full max-w-md mx-auto bg-muted/20 animate-pulse rounded-xl" />}>
            <RegisterContent />
        </Suspense>
    );
}
