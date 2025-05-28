
"use server";

import { createSupabaseServerClient, createSupabaseServerAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const SignUpSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  username: z.string().min(3, { message: "Username must be at least 3 characters." }).max(20, { message: "Username cannot exceed 20 characters." }).regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores." }),
});

const SignInSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export async function signUpWithEmailAndPassword(prevState: any, formData: FormData) {
  const supabase = createSupabaseServerClient();
  const validatedFields = SignUpSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      message: "Invalid form data.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password, username } = validatedFields.data;

  // Check if username is taken
  const { data: existingUserByUsername, error: usernameCheckError } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (usernameCheckError && usernameCheckError.code !== 'PGRST116') { // PGRST116: no rows found
    console.error("Error checking username:", usernameCheckError);
    return { message: "Server error checking username. Please try again." };
  }
  if (existingUserByUsername) {
    return { message: "Username is already taken." };
  }
  
  // Sign up the user
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username, // This will be available in the session, but not directly in users table yet
      },
    },
  });

  if (signUpError) {
    console.error("Sign up error:", signUpError);
    return { message: signUpError.message || "Could not sign up. Please try again." };
  }

  if (!signUpData.user) {
    return { message: "Could not sign up. Please try again." };
  }

  // Create profile in users table using admin client to bypass RLS for initial creation
  // This is often handled by a database trigger on auth.users table inserts
  const supabaseAdmin = createSupabaseServerAdminClient();
  const { error: profileError } = await supabaseAdmin
    .from('users')
    .insert({
      id: signUpData.user.id,
      email: email,
      username: username,
      // avatar_url and bio can be set later by the user
    });

  if (profileError) {
    console.error("Error creating profile:", profileError);
    // Potentially delete the auth user if profile creation fails to keep things consistent
    // await supabaseAdmin.auth.admin.deleteUser(signUpData.user.id);
    return { message: "Could not create user profile. Please contact support." };
  }
  
  revalidatePath("/", "layout"); // Revalidate all paths
  redirect("/fyp"); // Redirect after successful sign up
}


export async function signInWithEmailAndPassword(prevState: any, formData: FormData) {
  const supabase = createSupabaseServerClient();
  const validatedFields = SignInSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      message: "Invalid form data.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Sign in error:", error);
    return { message: error.message || "Could not sign in. Please check your credentials." };
  }

  revalidatePath("/", "layout");
  redirect("/fyp");
}

export async function signOut() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
