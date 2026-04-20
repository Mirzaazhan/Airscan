import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ScanProvider } from "@/contexts/ScanContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Airscan — Airway Pre-Screening",
  description: "Radiation-free airway pre-screening using facial landmark detection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full antialiased" style={{ background: "var(--paper)", color: "var(--ink)", fontFamily: "var(--font-sans)" }}>
        <ScanProvider>{children}</ScanProvider>
      </body>
    </html>
  );
}
