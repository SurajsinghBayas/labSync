import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Classname utility for conditional classes
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Format date to readable string
export function formatDate(date: string | Date | null): string {
    if (!date) return "N/A";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

// Format date with time
export function formatDateTime(date: string | Date | null): string {
    if (!date) return "N/A";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

// Get relative time (e.g., "2 hours ago")
export function getRelativeTime(date: string | Date | null): string {
    if (!date) return "Never";

    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "Just now";
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;

    return formatDate(date);
}

// Calculate completion percentage
export function calculatePercentage(completed: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
}

// Get status color based on submission status
export function getStatusColor(status: string): string {
    switch (status) {
        case "solved":
            return "text-success bg-success/10 border-success/30";
        case "attempted":
            return "text-warning bg-warning/10 border-warning/30";
        case "not_started":
        default:
            return "text-muted-foreground bg-muted/50 border-muted";
    }
}

// Get status label
export function getStatusLabel(status: string): string {
    switch (status) {
        case "solved":
            return "Solved";
        case "attempted":
            return "Attempted";
        case "not_started":
        default:
            return "Not Started";
    }
}

// Get difficulty color
export function getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
        case "easy":
            return "text-success bg-success/10 border-success/30";
        case "medium":
            return "text-warning bg-warning/10 border-warning/30";
        case "hard":
            return "text-destructive bg-destructive/10 border-destructive/30";
        default:
            return "text-muted-foreground bg-muted/50 border-muted";
    }
}

// Validate email format
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate HackerRank username format
export function isValidHackerRankUsername(username: string): boolean {
    // HackerRank usernames are alphanumeric with underscores, 3-30 characters
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    return usernameRegex.test(username);
}

// Build HackerRank profile URL
export function getHackerRankProfileUrl(username: string): string {
    return `https://www.hackerrank.com/${username}`;
}

// Build HackerRank problem URL
export function getHackerRankProblemUrl(slug: string): string {
    return `https://www.hackerrank.com/challenges/${slug}/problem`;
}

// Extract problem slug from HackerRank URL
export function extractProblemSlug(url: string): string | null {
    const match = url.match(/hackerrank\.com\/challenges\/([^\/]+)/);
    return match ? match[1] : null;
}

// Truncate text with ellipsis
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
}

// Generate initials from name
export function getInitials(name: string | null | undefined): string {
    if (!name) return "?";
    return name
        .split(" ")
        .map((n) => n[0])
        .filter(Boolean)
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?";
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// Sleep/delay utility
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Generate a random ID (for temporary use)
export function generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
