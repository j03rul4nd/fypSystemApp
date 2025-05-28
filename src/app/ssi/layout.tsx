
import React from "react";
// Font imports, AuthProvider, and Toaster are handled by RootLayout

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
    // Apply styling that was previously on <body> here or to <main>
    <div className="min-h-screen flex flex-col bg-muted/30 text-foreground">
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
  );
}
