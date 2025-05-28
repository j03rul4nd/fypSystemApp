
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { analyzePost, type AnalyzePostInput } from "@/ai/flows/analyze-post";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Post } from "@/lib/types/supabase";

const CreatePostSchema = z.object({
  content: z.string().min(1, "Content cannot be empty.").max(280, "Content cannot exceed 280 characters."),
});

export async function createPostAction(prevState: any, formData: FormData) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { message: "Not authenticated.", type: "error" as const };
  }

  const validatedFields = CreatePostSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      message: "Invalid form data.",
      errors: validatedFields.error.flatten().fieldErrors,
      type: "error" as const,
    };
  }

  const { content } = validatedFields.data;

  try {
    const aiInput: AnalyzePostInput = { content };
    const analysis = await analyzePost(aiInput);

    const { data: postData, error: postError } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        content,
        topics: analysis.topics,
        sentiment: analysis.sentiment,
        tone: analysis.tone,
      })
      .select()
      .single();

    if (postError) {
      console.error("Error creating post:", postError);
      return { message: postError.message || "Could not create post.", type: "error" as const };
    }
    
    revalidatePath("/fyp");
    revalidatePath("/profile"); // Or specific profile path
    return { message: "Post created successfully!", type: "success" as const, post: postData as Post };

  } catch (e: any) {
    console.error("Error during post creation or AI analysis:", e);
    return { message: e.message || "An unexpected error occurred.", type: "error" as const };
  }
}

export async function likePostAction(postId: string) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check if already liked
  const { data: existingLike, error: checkError } = await supabase
    .from("likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine
    console.error("Error checking like:", checkError);
    return { error: "Database error." };
  }

  if (existingLike) {
    // Unlike
    const { error: unlikeError } = await supabase
      .from("likes")
      .delete()
      .match({ user_id: user.id, post_id: postId });
    
    if (unlikeError) {
      console.error("Error unliking post:", unlikeError);
      return { error: "Could not unlike post." };
    }
    revalidatePath("/fyp"); // Or specific post page
    revalidatePath("/following");
    revalidatePath("/post/" + postId);
    return { success: true, liked: false };
  } else {
    // Like
    const { error: likeError } = await supabase
      .from("likes")
      .insert({ user_id: user.id, post_id: postId });

    if (likeError) {
      console.error("Error liking post:", likeError);
      return { error: "Could not like post." };
    }
    revalidatePath("/fyp"); // Or specific post page
    revalidatePath("/following");
    revalidatePath("/post/" + postId);
    return { success: true, liked: true };
  }
}

export async function deletePostAction(postId: string) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify user owns the post
  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", postId)
    .single();

  if (fetchError || !post) {
    return { error: "Post not found or error fetching post." };
  }

  if (post.user_id !== user.id) {
    return { error: "You are not authorized to delete this post." };
  }

  // First, delete likes associated with the post (optional, depends on DB cascade settings)
  // await supabase.from("likes").delete().eq("post_id", postId);

  const { error: deleteError } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId);

  if (deleteError) {
    console.error("Error deleting post:", deleteError);
    return { error: "Could not delete post." };
  }

  revalidatePath("/fyp");
  revalidatePath("/profile"); // Or specific profile path
  return { success: true };
}

