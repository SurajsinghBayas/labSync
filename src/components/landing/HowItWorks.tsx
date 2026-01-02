"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User, BookOpen, Code2, Link as LinkIcon,
    FileCheck, CheckCircle2, Download, Plus,
    Users, FileText, MonitorPlay
} from "lucide-react";
import { cn } from "@/lib/utils";

const StudentFlow = [
    {
        title: "Check Assigned Labs",
        desc: "View your pending assignments in the dashboard",
        icon: <BookOpen className="h-8 w-8 text-blue-500" />
    },
    {
        title: "Solve on HackerRank",
        desc: "Complete the problem and pass all test cases",
        icon: <Code2 className="h-8 w-8 text-green-500" />
    },
    {
        title: "Submit & Verify",
        desc: "Paste your submission link and upload proof. Auto-verified!",
        icon: <FileCheck className="h-8 w-8 text-purple-500" />
    }
];

const TeacherFlow = [
    {
        title: "Create Lab & Problems",
        desc: "Set up lab details and assign HackerRank problems",
        icon: <Plus className="h-8 w-8 text-blue-500" />
    },
    {
        title: "Track Submissions",
        desc: "Monitor student progress in real-time with auto-verification",
        icon: <Users className="h-8 w-8 text-orange-500" />
    },
    {
        title: "Export Results",
        desc: "Download comprehensive Excel reports with one click",
        icon: <Download className="h-8 w-8 text-green-500" />
    }
];

export function HowItWorks() {
    const [role, setRole] = useState<"student" | "teacher">("student");
    const [activeStep, setActiveStep] = useState(0);

    // Auto-advance steps
    useEffect(() => {
        const timer = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % 3);
        }, 3000);
        return () => clearInterval(timer);
    }, [role]);

    const steps = role === "student" ? StudentFlow : TeacherFlow;

    return (
        <div className="w-full relative z-10">
            {/* Header / Tabs */}
            <div className="flex justify-center mb-12 space-x-2">
                <div className="bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-full inline-flex border border-zinc-200 dark:border-zinc-800 backdrop-blur-sm">
                    <button
                        onClick={() => { setRole("student"); setActiveStep(0); }}
                        className={cn(
                            "px-6 py-2 rounded-full text-sm font-medium transition-all duration-300",
                            role === "student"
                                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                        )}
                    >
                        Student View
                    </button>
                    <button
                        onClick={() => { setRole("teacher"); setActiveStep(0); }}
                        className={cn(
                            "px-6 py-2 rounded-full text-sm font-medium transition-all duration-300",
                            role === "teacher"
                                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                        )}
                    >
                        Teacher View
                    </button>
                </div>
            </div>

            {/* Simulated Screen Area */}
            <div className="relative mx-auto max-w-4xl h-[400px] bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl shadow-zinc-200/50 dark:shadow-black/50 flex flex-col overflow-hidden">
                {/* Window Controls */}
                <div className="h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center px-4 space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400/80"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-400/80"></div>
                    <div className="ml-4 h-4 w-64 rounded-full bg-zinc-200/50 dark:bg-zinc-800/50"></div>
                </div>

                <div className="flex-1 relative flex items-center justify-center p-8 bg-gradient-to-b from-transparent to-zinc-50/50 dark:to-zinc-900/50">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={role + activeStep}
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="flex flex-col items-center text-center max-w-md"
                        >
                            <motion.div
                                className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-xl mb-6 ring-1 ring-zinc-100 dark:ring-zinc-700"
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            >
                                {steps[activeStep].icon}
                            </motion.div>
                            <h3 className="text-2xl font-bold mb-3 text-zinc-900 dark:text-white">{steps[activeStep].title}</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 text-lg leading-relaxed">
                                {steps[activeStep].desc}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    {/* Progress Indicators */}
                    <div className="absolute bottom-8 flex space-x-2">
                        {steps.map((_, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "h-1.5 rounded-full transition-all duration-500",
                                    idx === activeStep
                                        ? "w-8 bg-zinc-900 dark:bg-white"
                                        : "w-2 bg-zinc-300 dark:bg-zinc-700"
                                )}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
