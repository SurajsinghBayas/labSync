// User Types
export type UserRole = "student" | "teacher";

export interface User {
    $id: string;
    name: string;
    email: string;
    role: UserRole;
    hackerRankUsername: string | null;
    hackerRankVerified: boolean;
    avatarUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateUserData {
    name: string;
    email: string;
    password: string;
    role: UserRole;
}

// Lab Types
export interface Lab {
    $id: string;
    title: string;
    description: string;
    labNumber: number;
    subject: string;
    deadline: string | null;
    createdBy: string;
    createdAt: string;
    problemCount?: number;
}

export interface CreateLabData {
    title: string;
    description: string;
    labNumber: number;
    subject: string;
    deadline?: string;
}

// Problem Types
export type Difficulty = "easy" | "medium" | "hard";

export interface Problem {
    $id: string;
    title: string;
    hackerRankSlug: string;
    hackerRankUrl: string;
    labId: string;
    difficulty: Difficulty;
    points: number;
    createdAt: string;
}

export interface CreateProblemData {
    title: string;
    hackerRankSlug: string;
    hackerRankUrl: string;
    labId: string;
    difficulty: Difficulty;
    points: number;
}

// Submission Types
export type SubmissionStatus = "not_started" | "attempted" | "solved";

export interface Submission {
    $id: string;
    userId: string;
    problemId: string;
    labId: string;
    status: SubmissionStatus;
    language: string | null;
    code: string | null;
    submissionUrl: string | null;
    submittedAt: string | null;
    verifiedAt: string | null;
    verifiedBy: string | null;
}

export interface CreateSubmissionData {
    userId: string;
    problemId: string;
    labId: string;
    status: SubmissionStatus;
    language?: string;
    code?: string;
    submissionUrl?: string;
}

export interface UpdateSubmissionData {
    status?: SubmissionStatus;
    language?: string;
    code?: string;
    submissionUrl?: string;
    verifiedAt?: string;
    verifiedBy?: string;
}

// Dashboard Types
export interface StudentProgress {
    user: User;
    totalProblems: number;
    solvedProblems: number;
    attemptedProblems: number;
    completionPercentage: number;
    lastActivity: string | null;
}

export interface LabProgress {
    lab: Lab;
    problems: ProblemWithStatus[];
    totalProblems: number;
    solvedProblems: number;
    completionPercentage: number;
}

export interface ProblemWithStatus extends Problem {
    status: SubmissionStatus;
    submission?: Submission;
}

// HackerRank Integration Types
export interface HackerRankProfile {
    username: string;
    name: string;
    avatarUrl: string;
    verified: boolean;
}

export interface HackerRankSubmissionVerification {
    isValid: boolean;
    username: string;
    problemSlug: string;
    status: "accepted" | "wrong_answer" | "compilation_error" | "unknown";
    language?: string;
    code?: string;
}

// API Response Types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// Auth Types
export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials extends LoginCredentials {
    name: string;
    role: UserRole;
}

// Export Types
export interface ExportData {
    studentName: string;
    email: string;
    hackerRankUsername: string;
    labTitle: string;
    problemTitle: string;
    status: SubmissionStatus;
    language: string | null;
    submittedAt: string | null;
}
