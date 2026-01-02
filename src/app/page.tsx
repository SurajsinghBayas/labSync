import Link from "next/link";
import { ArrowRight, CheckSquare, FileText, BarChart3, Code2, Users, GraduationCap, LayoutDashboard, Link as LinkIcon } from "lucide-react";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-zinc-100">
            {/* Navbar */}
            <nav className="border-b border-zinc-100 px-6 py-4 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur-sm z-50 h-16">
                <div className="flex items-center gap-2 font-bold tracking-tight text-xl">
                    <Code2 className="w-6 h-6" />
                    <span>LabSync</span>
                </div>
                <div className="flex gap-6 text-sm font-medium items-center">
                    <Link href="/login" className="text-zinc-500 hover:text-zinc-900 transition-colors">Log in</Link>
                    <Link href="/register" className="bg-zinc-900 text-white px-4 py-2 rounded-[4px] hover:bg-zinc-800 transition-all shadow-sm">Sign up</Link>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-6 py-20 md:py-32">
                {/* Hero Grid */}
                <div className="grid md:grid-cols-2 gap-16 md:gap-24 mb-32 items-center">
                    {/* Left: Intro & Actions */}
                    <div className="space-y-8">
                        <h1 className="text-5xl md:text-6xl font-bold tracking-tighter leading-[1.1] text-zinc-900">
                            Manage academic labs <span className="text-zinc-400">effortlessly.</span>
                        </h1>
                        <p className="text-xl text-zinc-600 leading-relaxed font-normal max-w-md">
                            The minimal workspace for code submissions.
                            Automate verification, track progress, and grade without the hassle.
                        </p>
                        <div className="flex gap-4 pt-4">
                            <Link href="/login" className="bg-zinc-900 text-white px-8 py-3.5 rounded-[4px] font-medium hover:bg-zinc-800 transition-all text-base">
                                Log In
                            </Link>
                            <Link href="/register" className="border border-zinc-200 px-8 py-3.5 rounded-[4px] font-medium hover:bg-zinc-50 transition-all text-zinc-600 text-base bg-white">
                                Create Account
                            </Link>
                        </div>
                    </div>

                    {/* Right: Features List */}
                    <div className="space-y-10 pl-6 border-l border-zinc-100 md:border-l-0 md:pl-0">
                        <div className="flex gap-5 items-start">
                            <div className="flex-shrink-0 p-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
                                <CheckSquare className="w-5 h-5 text-zinc-900" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-1 tracking-tight">Automated Verification</h3>
                                <p className="text-zinc-500 leading-relaxed text-base">System instantly validates HackerRank profiles and submission links.</p>
                            </div>
                        </div>

                        <div className="flex gap-5 items-start">
                            <div className="flex-shrink-0 p-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
                                <FileText className="w-5 h-5 text-zinc-900" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-1 tracking-tight">Proof Management</h3>
                                <p className="text-zinc-500 leading-relaxed text-base">Students upload proofs directly. Teachers check screenshots side-by-side.</p>
                            </div>
                        </div>

                        <div className="flex gap-5 items-start">
                            <div className="flex-shrink-0 p-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
                                <BarChart3 className="w-5 h-5 text-zinc-900" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-1 tracking-tight">One-Click Exports</h3>
                                <p className="text-zinc-500 leading-relaxed text-base">Download detailed Excel reports with verification status and code links.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* How to Use Section */}
                <div className="border-t border-zinc-100 pt-20">
                    <div className="mb-16">
                        <h2 className="text-4xl font-bold tracking-tighter mb-4 text-zinc-900">How to use</h2>
                        <p className="text-zinc-500 text-xl font-normal">Three simple steps.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-16 md:gap-20">
                        {/* Student Guide */}
                        <div>
                            <div className="flex items-center gap-3 mb-10 pb-4 border-b border-zinc-100 text-zinc-900">
                                <GraduationCap className="w-6 h-6" />
                                <span className="font-bold text-xl tracking-tight">Student</span>
                            </div>
                            <ol className="space-y-12">
                                <li className="flex gap-5">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center font-mono text-sm font-medium text-zinc-600">1</span>
                                    <div>
                                        <h4 className="font-semibold text-lg mb-2 text-zinc-900">Sign Up & Join</h4>
                                        <p className="text-zinc-500 text-base leading-relaxed">Create your account. Wait for admin approval or join your batch immediately to see labs.</p>
                                    </div>
                                </li>
                                <li className="flex gap-5">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center font-mono text-sm font-medium text-zinc-600">2</span>
                                    <div>
                                        <h4 className="font-semibold text-lg mb-2 text-zinc-900">Solve & Copy Link</h4>
                                        <p className="text-zinc-500 text-base leading-relaxed">Solve on HackerRank. Go to <strong>Submissions</strong> tab, select Accepted solution, and copy the URL.</p>
                                    </div>
                                </li>
                                <li className="flex gap-5">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center font-mono text-sm font-medium text-zinc-600">3</span>
                                    <div>
                                        <h4 className="font-semibold text-lg mb-2 text-zinc-900">Verify</h4>
                                        <p className="text-zinc-500 text-base leading-relaxed">Paste the link in LabSync dashboard. The system auto-verifies your solution.</p>
                                    </div>
                                </li>
                            </ol>
                        </div>

                        {/* Teacher Guide */}
                        <div>
                            <div className="flex items-center gap-3 mb-10 pb-4 border-b border-zinc-100 text-zinc-900">
                                <Users className="w-6 h-6" />
                                <span className="font-bold text-xl tracking-tight">Teacher</span>
                            </div>
                            <ol className="space-y-12">
                                <li className="flex gap-5">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center font-mono text-sm font-medium text-zinc-600">1</span>
                                    <div>
                                        <h4 className="font-semibold text-lg mb-2 text-zinc-900">Create Lab</h4>
                                        <p className="text-zinc-500 text-base leading-relaxed">Set up new lab details, deadline, and assign it to a specific student batch.</p>
                                    </div>
                                </li>
                                <li className="flex gap-5">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center font-mono text-sm font-medium text-zinc-600">2</span>
                                    <div>
                                        <h4 className="font-semibold text-lg mb-2 text-zinc-900">Assignments</h4>
                                        <p className="text-zinc-500 text-base leading-relaxed">Paste HackerRank challenge URLs. We handle the slug extraction and verification logic.</p>
                                    </div>
                                </li>
                                <li className="flex gap-5">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center font-mono text-sm font-medium text-zinc-600">3</span>
                                    <div>
                                        <h4 className="font-semibold text-lg mb-2 text-zinc-900">Export</h4>
                                        <p className="text-zinc-500 text-base leading-relaxed">Track lives status. Click <strong>Export</strong> to download proof links and grading data.</p>
                                    </div>
                                </li>
                            </ol>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-zinc-100 mt-20 py-12 bg-zinc-50/50">
                <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 text-zinc-900 font-bold tracking-tight">
                        <Code2 className="w-5 h-5" />
                        <span>LabSync</span>
                    </div>
                    <p className="text-zinc-400 text-sm font-medium">
                        Built by <Link href="https://github.com/surajsinghbayas" target="_blank" className="underline underline-offset-4 hover:text-zinc-900 transition-colors">Suraj</Link> • AI & Data Science Dept.
                    </p>
                </div>
            </footer>
        </div>
    )
}
