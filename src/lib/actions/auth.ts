
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
      type: "error" as const,
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
    return { message: "Server error checking username. Please try again.", type: "error" as const };
  }
  if (existingUserByUsername) {
    return { 
        message: "Validation failed.", // Generic message, specific error below field
        errors: { username: ["Username is already taken."] },
        type: "error" as const 
    };
  }
  
  // Sign up the user
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username, 
      },
      // emailRedirectTo can be configured in Supabase project settings under Auth > URL Configuration
      // It defaults to Site URL + /auth/callback
    },
  });

  if (signUpError) {
    console.error("Sign up error:", signUpError);
    return { message: signUpError.message || "Could not sign up. Please try again.", type: "error" as const };
  }

  if (!signUpData.user) {
    return { message: "Could not sign up. User data not returned. Please try again.", type: "error" as const };
  }

  // Create profile in users table using admin client
  const supabaseAdmin = createSupabaseServerAdminClient();
  const { error: profileError } = await supabaseAdmin
    .from('users')
    .insert({
      id: signUpData.user.id,
      email: email,
      username: username,
    });

  if (profileError) {
    console.error("Error creating profile:", profileError);
    // Potentially delete the auth user if profile creation fails to keep things consistent
    // await supabaseAdmin.auth.admin.deleteUser(signUpData.user.id);
    return { message: "User registered but could not create user profile. Please contact support.", type: "error" as const };
  }
  
  // Check if email confirmation is required
  // signUpData.session will be null if confirmation is pending.
  // signUpData.user.email_confirmed_at would also be null/false at this stage.
  if (signUpData.user && !signUpData.session) {
     // Email confirmation is pending
    return {
        message: "Registration successful! Please check your email to confirm your account. You will be able to log in after confirming.",
        type: "confirmation_pending" as const,
        errors: {}, // Ensure errors object is present
    };
  }

  // If session exists, user is confirmed (e.g. auto-confirm is ON in Supabase settings or email was already confirmed)
  revalidatePath("/", "layout"); 
  redirect("/fyp"); 
}


export async function signInWithEmailAndPassword(prevState: any, formData: FormData) {
  const supabase = createSupabaseServerClient();
  const validatedFields = SignInSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      message: "Invalid form data.",
      errors: validatedFields.error.flatten().fieldErrors,
      type: "error" as const,
    };
  }

  const { email, password } = validatedFields.data;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Sign in error:", error);
    return { message: error.message || "Could not sign in. Please check your credentials.", type: "error" as const };
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
