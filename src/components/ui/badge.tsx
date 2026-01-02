import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
                secondary:
                    "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
                destructive:
                    "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
                outline: "text-foreground",
                success:
                    "border-transparent bg-success text-white hover:opacity-80",
                warning:
                    "border-transparent bg-warning text-white hover:opacity-80",
            },
            size: {
                default: "px-2.5 py-0.5 text-xs",
                sm: "px-2 py-0.5 text-[10px]",
                lg: "px-3 py-1 text-sm",
            }
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, size, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
    )
}

function StatusBadge({ status, size }: { status: string; size?: "default" | "sm" | "lg" }) {
    const variants: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
        solved: "success",
        completed: "success",
        verified: "success",
        attempted: "warning",
        pending: "warning",
        not_started: "secondary",
        failed: "destructive",
    }

    const labels: Record<string, string> = {
        solved: "Solved",
        completed: "Completed",
        verified: "Verified",
        attempted: "Unverified",
        pending: "Unverified",
        not_started: "Not Started",
        failed: "Failed",
    }

    return (
        <Badge variant={variants[status] || "secondary"} size={size}>
            {labels[status] || status}
        </Badge>
    )
}

function DifficultyBadge({ difficulty, size }: { difficulty: string; size?: "default" | "sm" | "lg" }) {
    const colors: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
        easy: "success",
        medium: "warning",
        hard: "destructive",
    }

    return (
        <Badge variant={colors[difficulty.toLowerCase()] || "secondary"} size={size} className="capitalize">
            {difficulty}
        </Badge>
    )
}

export { Badge, badgeVariants, StatusBadge, DifficultyBadge }
