import { Github, Linkedin } from "lucide-react";
import Link from "next/link";

export function Footer() {
    return (
        <footer className="w-full border-t border-zinc-100 dark:border-zinc-900 py-12 bg-white dark:bg-zinc-950">
            <div className="container px-4 mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col items-center md:items-start space-y-2">
                    <span className="font-bold text-lg tracking-tight">LabSync</span>
                    <p className="text-sm text-zinc-500 max-w-xs text-center md:text-left">
                        Seamlessly track and manage HackerRank lab submissions.
                    </p>
                </div>

                <div className="flex items-center space-x-6">
                    <Link
                        href="https://github.com/surajsinghbayas"
                        target="_blank"
                        className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                        <Github className="h-5 w-5" />
                        <span className="sr-only">GitHub</span>
                    </Link>
                    <Link
                        href="https://linkedin.com/in/surajbayas"
                        target="_blank"
                        className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                        <Linkedin className="h-5 w-5" />
                        <span className="sr-only">LinkedIn</span>
                    </Link>
                </div>

                <p className="text-xs text-zinc-400">
                    &copy; {new Date().getFullYear()} LabSync.
                </p>
            </div>
        </footer>
    );
}
