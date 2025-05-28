
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  // Middleware should handle redirection.
  // This page can be a loading state or a simple welcome.
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Loading ChirpSpark...</p>
    </div>
  );
}
