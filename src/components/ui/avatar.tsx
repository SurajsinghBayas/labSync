import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";
import Image from "next/image";

interface AvatarProps {
    src?: string | null;
    name: string;
    size?: "sm" | "default" | "lg" | "xl";
    className?: string;
}

const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    default: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg",
};

export function Avatar({ src, name, size = "default", className }: AvatarProps) {
    const initials = getInitials(name);

    if (src) {
        return (
            <div
                className={cn(
                    "relative overflow-hidden rounded-full bg-muted",
                    sizeClasses[size],
                    className
                )}
            >
                <Image
                    src={src}
                    alt={name}
                    fill
                    className="object-cover"
                    sizes={size === "xl" ? "64px" : size === "lg" ? "48px" : size === "sm" ? "32px" : "40px"}
                />
            </div>
        );
    }

    // Fallback with initials - Flat design
    return (
        <div
            className={cn(
                "flex items-center justify-center rounded-full bg-primary text-primary-foreground font-medium",
                sizeClasses[size],
                className
            )}
        >
            {initials}
        </div>
    );
}

// Avatar group for showing multiple avatars
interface AvatarGroupProps {
    users: { name: string; avatarUrl?: string | null }[];
    max?: number;
    size?: "sm" | "default" | "lg";
    className?: string;
}

export function AvatarGroup({
    users,
    max = 4,
    size = "default",
    className,
}: AvatarGroupProps) {
    const displayUsers = users.slice(0, max);
    const remaining = users.length - max;

    return (
        <div className={cn("flex -space-x-2", className)}>
            {displayUsers.map((user, index) => (
                <Avatar
                    key={index}
                    src={user.avatarUrl}
                    name={user.name}
                    size={size}
                    className="ring-2 ring-background"
                />
            ))}
            {remaining > 0 && (
                <div
                    className={cn(
                        "flex items-center justify-center rounded-full bg-muted font-medium text-muted-foreground ring-2 ring-background",
                        sizeClasses[size]
                    )}
                >
                    +{remaining}
                </div>
            )}
        </div>
    );
}
