
import React from "react";
import { Geist, Geist_Mono } from 'next/font/google';
import "../globals.css"; // Assuming globals.css contains necessary base styles and Tailwind imports
import { AuthProvider } from "@/contexts/AuthContext"; // SSI pages still need auth context to check admin status
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'SSI Dashboard | ChirpSpark',
  description: 'Admin dashboard for ChirpSpark algorithm insights.',
};

export default function SSILayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-muted/30 text-foreground`}>
        <AuthProvider> {/* AuthProvider to get current user for admin check */}
          <div className="min-h-screen flex flex-col">
            <header className="bg-primary text-primary-foreground p-4 shadow-md sticky top-0 z-50">
              <div className="container mx-auto">
                <h1 className="text-xl font-semibold">ChirpSpark - Algorithm Insights (SSI)</h1>
              </div>
            </header>
            <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8">
              {children}
            </main>
            <footer className="text-center p-4 text-sm text-muted-foreground border-t bg-background/50">
              Internal Dashboard - For Admin Use Only
            </footer>
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
