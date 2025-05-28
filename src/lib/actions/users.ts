
"use server";

import { createSupabaseServerClient, createSupabaseServerAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Profile } from "@/lib/types/supabase";

const UpdateProfileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters.").max(20, "Username cannot exceed 20 characters.").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores.").optional().or(z.literal('')),
  bio: z.string().max(160, "Bio cannot exceed 160 characters.").optional().or(z.literal('')),
  avatar_url: z.string().url("Avatar URL must be a valid URL.").optional().or(z.literal('')),
});

export async function updateUserProfile(userId: string, prevState: any, formData: FormData) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== userId) {
    return { message: "Not authorized.", type: "error" as const };
  }

  const validatedFields = UpdateProfileSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      message: "Invalid form data.",
      errors: validatedFields.error.flatten().fieldErrors,
      type: "error" as const,
    };
  }
  
  const { username, bio, avatar_url } = validatedFields.data;
  const updateData: Partial<Profile> = {};

  if (username && username !== '') updateData.username = username;
  if (bio !== undefined) updateData.bio = bio; // Allow empty string to clear bio
  if (avatar_url !== undefined) updateData.avatar_url = avatar_url; // Allow empty string to clear avatar

  // Check if username is being changed and if it's already taken by another user
  if (username && username !== '') {
    const { data: existingUser, error: usernameCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .not('id', 'eq', userId) // Exclude current user
        .maybeSingle();

    if (usernameCheckError && usernameCheckError.code !== 'PGRST116') { // PGRST116: no rows found
        console.error("Error checking username:", usernameCheckError);
        return { message: "Server error checking username.", type: "error" as const };
    }
    if (existingUser) {
        return { 
            message: "Username is already taken.", 
            errors: { username: ["Username is already taken."] },
            type: "error" as const 
        };
    }
  }


  if (Object.keys(updateData).length === 0) {
    return { message: "No changes submitted.", type: "info" as const };
  }
  
  // It's safer to use admin client if you have RLS that might prevent user from updating their own username directly
  // For this app structure, user should be able to update their own profile via RLS.
  const { error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", userId);

  if (error) {
    console.error("Error updating profile:", error);
    return { message: error.message || "Could not update profile.", type: "error" as const };
  }

  revalidatePath(`/profile/${username || user.user_metadata.username}`); // Revalidate the specific profile page
  revalidatePath("/", "layout"); // Revalidate layout in case username changed for sidebar display
  return { message: "Profile updated successfully!", type: "success" as const };
}

export async function followUserAction(followedId: string) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated", success: false };
  }
  if (user.id === followedId) {
    return { error: "You cannot follow yourself.", success: false };
  }

  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: user.id, followed_id: followedId });

  if (error) {
    if (error.code === '23505') { // Unique constraint violation
      return { error: "Already following this user.", success: false };
    }
    console.error("Error following user:", error);
    return { error: "Could not follow user.", success: false };
  }
  revalidatePath(`/profile/${followedId}`); // Revalidate target profile
  revalidatePath("/following");
  return { success: true, message: "User followed." };
}

export async function unfollowUserAction(followedId: string) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated", success: false };
  }

  const { error } = await supabase
    .from("follows")
    .delete()
    .match({ follower_id: user.id, followed_id: followedId });

  if (error) {
    console.error("Error unfollowing user:", error);
    return { error: "Could not unfollow user.", success: false };
  }
  revalidatePath(`/profile/${followedId}`);
  revalidatePath("/following");
  return { success: true, message: "User unfollowed." };
}

