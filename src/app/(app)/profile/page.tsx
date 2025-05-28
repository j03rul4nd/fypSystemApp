
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProfileRedirectPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (profile?.username) {
        router.replace(`/profile/${profile.username}`);
      } else if (profile?.id) { // Fallback if username is not set, though it should be
        router.replace(`/profile/${profile.id}`);
      } else {
        // Handle case where profile is not available after loading (e.g., error or new user)
        // May redirect to login or show an error
        router.replace('/login'); 
      }
    }
  }, [profile, loading, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Loading profile...</p>
    </div>
  );
}
