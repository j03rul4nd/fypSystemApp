
"use client";

import type { User } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types/supabase";
import { usePathname, useRouter } from "next/navigation";

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, name?: string) => Promise<any>; // Simplified for magic link or OTP
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          // If user logs out and is on a protected page, redirect to login
          if (!['/login', '/register'].includes(pathname)) {
             // router.push('/login'); // This was causing infinite loops with middleware
          }
        }
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) {
      setProfile(data);
    } else if (error) {
      console.error("Error fetching profile:", error);
      setProfile(null); // Set profile to null to indicate it's not found or error
    }
  };

  // Simplified signIn for magic link or OTP example
  const signIn = async (email: string) => {
    // This is a placeholder. Actual sign-in logic will be in server actions.
    // For client-side, you might redirect or show a message.
    console.log("Attempting to sign in with", email);
    // Example: await supabase.auth.signInWithOtp({ email });
    // Actual implementation will be handled by server actions on login/register pages
    return Promise.resolve();
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push("/login"); // Redirect to login after sign out
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
