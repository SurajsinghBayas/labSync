"use client";

import { useState, useEffect } from "react";
import {
    User,
    Mail,
    Save,
    CheckCircle2,
    AlertCircle,
    Trash2,
    Bell,
    Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { account } from "@/lib/appwrite";

export default function TeacherSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Notification settings
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [submissionAlerts, setSubmissionAlerts] = useState(true);
    const [deadlineReminders, setDeadlineReminders] = useState(true);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const user = await account.get();
            setName(user.name);
            setEmail(user.email);
            setEmailNotifications(user.prefs?.emailNotifications ?? true);
            setSubmissionAlerts(user.prefs?.submissionAlerts ?? true);
            setDeadlineReminders(user.prefs?.deadlineReminders ?? true);
        } catch (err) {
            console.error("Error loading user data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setError("");
        setSuccess("");
        setSaving(true);

        try {
            const currentUser = await account.get();
            if (name !== currentUser.name) {
                await account.updateName(name);
            }

            await account.updatePrefs({
                ...currentUser.prefs,
                emailNotifications,
                submissionAlerts,
                deadlineReminders,
            });

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
                    Manage your account and preferences
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

            {/* Notification Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notifications
                    </CardTitle>
                    <CardDescription>
                        Configure how you receive updates
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <label className="flex items-center justify-between p-4 rounded-lg border border-border cursor-pointer hover:border-primary/50 transition-colors">
                        <div>
                            <p className="font-medium">Email Notifications</p>
                            <p className="text-sm text-muted-foreground">
                                Receive notifications via email
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            checked={emailNotifications}
                            onChange={(e) => setEmailNotifications(e.target.checked)}
                            className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                        />
                    </label>

                    <label className="flex items-center justify-between p-4 rounded-lg border border-border cursor-pointer hover:border-primary/50 transition-colors">
                        <div>
                            <p className="font-medium">Submission Alerts</p>
                            <p className="text-sm text-muted-foreground">
                                Get notified when students submit
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            checked={submissionAlerts}
                            onChange={(e) => setSubmissionAlerts(e.target.checked)}
                            className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                        />
                    </label>

                    <label className="flex items-center justify-between p-4 rounded-lg border border-border cursor-pointer hover:border-primary/50 transition-colors">
                        <div>
                            <p className="font-medium">Deadline Reminders</p>
                            <p className="text-sm text-muted-foreground">
                                Reminders before lab deadlines
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            checked={deadlineReminders}
                            onChange={(e) => setDeadlineReminders(e.target.checked)}
                            className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                        />
                    </label>
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
