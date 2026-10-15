import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SkillForge AI | Full-Stack Career & Learning Platform",
  description:
    "Accelerate your software engineering career with structured course tracking, internship application pipelines, daily goal streaks, and private local AI career tools.",
  keywords: [
    "SkillForge AI",
    "software engineering",
    "internship tracker",
    "resume reviewer",
    "cover letter generator",
    "interview questions",
    "career roadmap",
    "local AI",
    "Ollama",
  ],
  authors: [{ name: "SkillForge AI Team" }],
};

export const viewport: Viewport = {
  themeColor: "#090A0F",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#090A0F] text-slate-100 selection:bg-pink-500/30 selection:text-pink-200">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
