import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"
import { cva } from "class-variance-authority"

const progressVariants = cva(
    "h-full w-full flex-1 bg-primary transition-all",
    {
        variants: {
            variant: {
                default: "bg-primary",
                success: "bg-success",
                warning: "bg-warning",
                input: "bg-input", // Neutral
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
    value?: number;
    className?: string; // Explicitly adding className
    variant?: "default" | "success" | "warning";
    showLabel?: boolean;
}

const Progress = React.forwardRef<
    React.ElementRef<typeof ProgressPrimitive.Root>,
    ProgressProps
>(({ className, value, variant, showLabel, ...props }, ref) => (
    <ProgressPrimitive.Root
        ref={ref}
        className={cn(
            "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
            className
        )}
        {...props}
    >
        <ProgressPrimitive.Indicator
            className={progressVariants({ variant })}
            style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
    </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

const CircularProgress = ({
    value,
    max = 100,
    size = 60,
    strokeWidth = 4,
    variant = 'default',
    showLabel = true,
}: {
    value: number;
    max?: number;
    size?: number;
    strokeWidth?: number;
    variant?: 'default' | 'success' | 'warning' | 'gradient';
    showLabel?: boolean;
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / max) * circumference;

    let strokeColor = "stroke-primary";
    if (variant === 'success') strokeColor = "stroke-success";
    if (variant === 'warning') strokeColor = "stroke-warning";

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="stroke-muted text-muted"
                    fill="transparent"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className={cn("transition-all duration-1000 ease-out", strokeColor)}
                    fill="transparent"
                />
            </svg>
            {showLabel && (
                <span className="absolute text-sm font-semibold">
                    {Math.round((value / max) * 100)}%
                </span>
            )}
        </div>
    );
};

export { Progress, CircularProgress }
