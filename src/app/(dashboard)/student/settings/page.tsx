"use client";

import { useState, useEffect } from "react";
import {
    User,
    Link2,
    Save,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
    Trash2,
    GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { account, databases, COLLECTIONS, getDatabaseId } from "@/lib/appwrite";
import { isValidHackerRankUsername, getHackerRankProfileUrl } from "@/lib/utils";

// Constants for dropdown options
const BRANCHES = ["CSE", "AI&DS"];
const YEARS = ["FY", "SY", "TY", "BTech"];
const DIVISIONS = ["A", "B", "C", "D", "E"];
const BATCHES = ["1", "2", "3"];

export default function StudentSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userId, setUserId] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [hackerRankUsername, setHackerRankUsername] = useState("");
    const [originalUsername, setOriginalUsername] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Student-specific fields
    const [rollNo, setRollNo] = useState<number | "">("")
    const [branch, setBranch] = useState("");
    const [year, setYear] = useState("");
    const [division, setDivision] = useState("");
    const [batch, setBatch] = useState("");

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const user = await account.get();
            setUserId(user.$id);
            setName(user.name);
            setEmail(user.email);
            setHackerRankUsername(user.prefs?.hackerRankUsername || "");
            setOriginalUsername(user.prefs?.hackerRankUsername || "");

            // Load student document for additional fields
            try {
                const userDoc = await databases.getDocument(
                    getDatabaseId(),
                    COLLECTIONS.USERS,
                    user.$id
                );
                setRollNo(userDoc.rollNo || "");
                setBranch(userDoc.branch || "");
                setYear(userDoc.year || "");
                setDivision(userDoc.division || "");
                setBatch(userDoc.batch || "");
            } catch {
                // Document might not exist yet
            }
        } catch (err) {
            console.error("Error loading user data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setError("");
        setSuccess("");

        if (hackerRankUsername && !isValidHackerRankUsername(hackerRankUsername)) {
            setError("Invalid HackerRank username format");
            return;
        }

        setSaving(true);

        try {
            // Update name if changed
            const currentUser = await account.get();
            if (name !== currentUser.name) {
                await account.updateName(name);
            }

            // Update HackerRank username in prefs
            await account.updatePrefs({
                hackerRankUsername: hackerRankUsername || null,
                hackerRankVerified: !!hackerRankUsername,
            });

            // Update user document with student fields
            await databases.updateDocument(
                getDatabaseId(),
                COLLECTIONS.USERS,
                userId,
                {
                    name,
                    rollNo: rollNo || null,
                    branch: branch || null,
                    year: year || null,
                    division: division || null,
                    batch: batch || null,
                    hackerRankUsername: hackerRankUsername || null,
                    hackerRankVerified: !!hackerRankUsername,
                }
            );

            setOriginalUsername(hackerRankUsername);
            setSuccess("Settings saved successfully!");
        } catch (err) {
            console.error("Error saving settings:", err);
            setError("Failed to save settings. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="h-8 w-48 bg-muted rounded animate-pulse" />
                <div className="h-64 bg-muted rounded-xl animate-pulse" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your account and academic details
                </p>
            </div>

            {/* Profile Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Profile Information
                    </CardTitle>
                    <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input
                        label="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                    />
                    <Input
                        label="Email Address"
                        value={email}
                        disabled
                        helperText="Email cannot be changed"
                    />
                </CardContent>
            </Card>

            {/* Academic Details */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Academic Details
                    </CardTitle>
                    <CardDescription>Your class and batch information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input
                        label="Roll Number"
                        type="number"
                        value={rollNo}
                        onChange={(e) => setRollNo(e.target.value ? parseInt(e.target.value) : "")}
                        placeholder="e.g., 12345"
                    />

                    <div className="grid grid-cols-2 gap-4">
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

                    <div className="grid grid-cols-2 gap-4">
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
                </CardContent>
            </Card>

            {/* HackerRank Connection */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Link2 className="h-5 w-5" />
                        HackerRank Connection
                    </CardTitle>
                    <CardDescription>
                        Link your HackerRank profile to sync submissions
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {originalUsername && (
                        <div className="flex items-center gap-3 p-4 rounded-lg border border-success/30 bg-success/5">
                            <CheckCircle2 className="h-5 w-5 text-success" />
                            <div className="flex-1">
                                <p className="font-medium">Profile Connected</p>
                                <a
                                    href={getHackerRankProfileUrl(originalUsername)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline flex items-center gap-1"
                                >
                                    @{originalUsername}
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </div>
                            <Badge variant="success">Verified</Badge>
                        </div>
                    )}

                    <Input
                        label="HackerRank Username"
                        value={hackerRankUsername}
                        onChange={(e) => setHackerRankUsername(e.target.value)}
                        placeholder="Enter your HackerRank username"
                        helperText="Your username appears in your profile URL: hackerrank.com/username"
                    />
                </CardContent>
            </Card>

            {/* Save Button */}
            {(error || success) && (
                <div
                    className={`p-4 rounded-lg ${error
                        ? "bg-destructive/10 border border-destructive/30 text-destructive"
                        : "bg-success/10 border border-success/30 text-success"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        {error ? (
                            <AlertCircle className="h-5 w-5" />
                        ) : (
                            <CheckCircle2 className="h-5 w-5" />
                        )}
                        {error || success}
                    </div>
                </div>
            )}

            <div className="flex justify-end">
                <Button onClick={handleSave} isLoading={saving}>
                    <Save className="h-4 w-4" />
                    Save Changes
                </Button>
            </div>

            {/* Danger Zone */}
            <Card className="border-destructive/30">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Danger Zone
                    </CardTitle>
                    <CardDescription>
                        Irreversible actions for your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/30">
                        <div>
                            <p className="font-medium">Delete Account</p>
                            <p className="text-sm text-muted-foreground">
                                Permanently delete your account and all data
                            </p>
                        </div>
                        <Button variant="destructive" disabled>
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
