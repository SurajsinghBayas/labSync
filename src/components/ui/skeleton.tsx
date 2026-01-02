import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-muted", className)}
        />
    );
}

// Pre-built skeleton patterns
export function CardSkeleton() {
    return (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                </div>
            </div>
            <Skeleton className="h-20" />
            <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
            </div>
        </div>
    );
}

export function TableRowSkeleton() {
    return (
        <div className="flex items-center gap-4 p-4 border-b border-border">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24 ml-auto" />
            <Skeleton className="h-6 w-16" />
        </div>
    );
}

export function StatCardSkeleton() {
    return (
        <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg" />
            </div>
        </div>
    );
}

export function ProblemCardSkeleton() {
    return (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-6 w-16" />
            </div>
            <div className="flex gap-2">
                <Skeleton className="h-5 w-14" />
                <Skeleton className="h-5 w-20" />
            </div>
        </div>
    );
}
