import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WebMCP Identity Passport · Agent Trust & Reputation Layer",
  description: "WebMCP-native identity, Email OTP authentication, deterministic reputation, and independent rate-limiting layer for AI agents.",
  keywords: ["WebMCP", "AI Agents", "Identity Passport", "Email OTP", "Agent Reputation", "ChatGPT WebMCP", "AI Security"],
  authors: [{ name: "WebMCP Identity Standards" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-paper text-ink antialiased min-h-screen selection:bg-accent/30 selection:text-ink`}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
