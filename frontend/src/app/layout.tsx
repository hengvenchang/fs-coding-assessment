import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth";
import { ProgressProvider } from "@/contexts/progress";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProgressBarWrapper } from "@/components/ProgressBarWrapper";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Todo App",
  description: "Production-ready todo application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <ProgressProvider>
            <ProgressBarWrapper />
            <AuthProvider>
              {children}
              <Toaster position="bottom-right" richColors />
            </AuthProvider>
          </ProgressProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
