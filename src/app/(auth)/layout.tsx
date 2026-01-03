import Link from "next/link";
import { Code2 } from "lucide-react";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4 font-inter">
            <div className="w-full max-w-[400px] space-y-6">
                {/* Header */}
                <div className="flex flex-col items-center space-y-2 text-center">
                    <Link href="/" className="flex items-center gap-2 font-bold mb-4">
                        <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
                            <Code2 className="h-5 w-5" />
                        </div>
                        <span className="text-xl">LabSync</span>
                    </Link>
                </div>

                {/* Content Card */}
                <div className="bg-background border rounded-xl shadow-sm p-6 sm:p-8">
                    {children}
                </div>

                {/* Footer */}
                <div className="text-center text-sm text-muted-foreground">
                    <Link href="#" className="hover:text-foreground">Terms</Link>
                    <span className="mx-2">•</span>
                    <Link href="#" className="hover:text-foreground">Privacy</Link>
                </div>
            </div>
        </div>
    );
}
