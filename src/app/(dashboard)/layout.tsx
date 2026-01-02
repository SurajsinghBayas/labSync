"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    BookOpen,
    FileCode,
    Settings,
    LogOut,
    Users,
    LineChart,
    Menu,
    X,
    Code2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { account } from "@/lib/appwrite";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const userData = await account.get();
            setUser(userData);

            // Basic role check/redirection
            const isStudentPath = pathname.startsWith("/student");
            const isTeacherPath = pathname.startsWith("/teacher");
            const userRole = userData.prefs?.role || "student"; // Default to student if not set

            if (isStudentPath && userRole !== "student") {
                router.push("/teacher");
            } else if (isTeacherPath && userRole !== "teacher") {
                router.push("/student");
            }
        } catch (error) {
            router.push("/login");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await account.deleteSession("current");
            router.push("/login");
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    if (loading) {
        return (
            <div className="flex bg-muted/30 h-screen w-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    const role = user?.prefs?.role || "student";

    const studentNav = [
        { name: "Dashboard", href: "/student", icon: LayoutDashboard },
        { name: "Labs", href: "/student/labs", icon: BookOpen },
        { name: "Submissions", href: "/student/submissions", icon: FileCode },
        { name: "Settings", href: "/student/settings", icon: Settings },
    ];

    const teacherNav = [
        { name: "Dashboard", href: "/teacher", icon: LayoutDashboard },
        { name: "Labs", href: "/teacher/labs", icon: BookOpen },
        { name: "Students", href: "/teacher/students", icon: Users },
        { name: "Submissions", href: "/teacher/submissions", icon: FileCode },
        { name: "Analytics", href: "/teacher/analytics", icon: LineChart },
        { name: "Settings", href: "/teacher/settings", icon: Settings },
    ];

    const navItems = role === "teacher" ? teacherNav : studentNav;

    return (
        <div className="min-h-screen bg-muted/30 flex">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:block",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="h-14 flex items-center px-6 border-b">
                        <Link href="/" className="flex items-center gap-2 font-semibold">
                            <div className="h-6 w-6 rounded bg-primary text-primary-foreground flex items-center justify-center">
                                <Code2 className="h-4 w-4" />
                            </div>
                            <span>LabSync</span>
                        </Link>
                    </div>

                    {/* Nav */}
                    <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                        isActive
                                            ? "bg-muted text-primary"
                                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>

                    {/* User Profile */}
                    <div className="p-4 border-t">
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <Avatar name={user?.name || "User"} size="sm" />
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-medium truncate">{user?.name}</p>
                                <p className="text-xs text-muted-foreground truncate capitalize">{role}</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-muted-foreground hover:text-foreground"
                            onClick={handleLogout}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Log out
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header */}
                <header className="h-14 lg:hidden border-b bg-background flex items-center px-4 sticky top-0 z-30">
                    <Button variant="ghost" size="iconSm" onClick={() => setIsSidebarOpen(true)}>
                        <Menu className="h-5 w-5" />
                    </Button>
                    <span className="ml-3 font-semibold">
                        {navItems.find(item => item.href === pathname)?.name || "Dashboard"}
                    </span>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}
