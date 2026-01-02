import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "LabSync - HackerRank Lab Management",
    description:
        "Seamlessly track and manage HackerRank lab submissions for students and teachers. The smart bridge between coding practice and academic assessment.",
    keywords: [
        "HackerRank",
        "Lab Management",
        "Student Submissions",
        "Code Tracking",
        "Academic",
        "Programming Labs",
    ],
    authors: [{ name: "LabSync Team" }],
    openGraph: {
        title: "LabSync - HackerRank Lab Management",
        description:
            "The smart bridge between coding practice and academic assessment",
        type: "website",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                {children}
            </body>
        </html>
    );
}
