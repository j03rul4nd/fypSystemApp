
"use client"; // For infinite scroll and client-side data fetching

import { useEffect, useState, useRef, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PostWithAuthor } from "@/lib/types/supabase";
import { PostCard } from "@/components/posts/PostCard";
import { useInView } from "react-intersection-observer";
import { Loader2, SearchX } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";

const POSTS_PER_PAGE = 10;

export default function FYPPage() {
  const supabase = createSupabaseBrowserClient();
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { ref, inView } = useInView({ threshold: 0.5 });

  const fetchPosts = useCallback(async (currentPage: number) => {
    if (loading || !hasMore) return;
    setLoading(true);

    const from = currentPage * POSTS_PER_PAGE;
    const to = from + POSTS_PER_PAGE - 1;

    let query = supabase
      .from("posts")
      .select(`
        *,
        users (*),
        likes (count),
        liked_by_user:likes!inner(user_id)
      `)
      .eq('likes.user_id', user?.id) // This is incorrect. liked_by_user needs to be a computed column or a separate query.
                                  // For now, we will fetch all likes and determine client-side or simplify.
                                  // Supabase RPC or view would be better for `liked_by_user`.
                                  // Let's simplify: check if current user's ID is in likes array (not directly possible without modification)
                                  // Or, fetch likes separately and map.
                                  // For MVP, let's fetch likes count only and liked_by_user can be a follow-up.
      .order("created_at", { ascending: false })
      .range(from, to);
    
    // To properly implement liked_by_user, we need to adjust the query or use an RPC.
    // A simplified version:
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id, content, created_at, topics, sentiment, tone, user_id,
        users ( id, username, avatar_url ),
        likes ( user_id )
      `)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching posts:", error);
      setHasMore(false); // Stop fetching on error
    } else if (data) {
      const enrichedPosts = data.map(p => ({
        ...p,
        likes: { count: p.likes.length }, // This is an array of likes, not a count object directly
        liked_by_user: user ? p.likes.some(like => like.user_id === user.id) : false,
        // users: p.users // This is already selected
      })) as unknown as PostWithAuthor[]; // Cast carefully

      setPosts((prevPosts) => currentPage === 0 ? enrichedPosts : [...prevPosts, ...enrichedPosts]);
      setHasMore(data.length === POSTS_PER_PAGE);
      setPage(currentPage + 1);
    }
    setLoading(false);
    if (currentPage === 0) setInitialLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, user, loading, hasMore]);


  useEffect(() => {
    if (user) { // Only fetch if user is available
        setInitialLoading(true);
        setPosts([]); // Reset posts when user changes or on initial load
        setPage(0);
        setHasMore(true);
        fetchPosts(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Re-fetch when user context changes (e.g., login)


  useEffect(() => {
    if (inView && hasMore && !loading && !initialLoading) {
      fetchPosts(page);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, hasMore, loading, page, initialLoading]);

  const handlePostDeleted = (deletedPostId: string) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== deletedPostId));
  };

  if (initialLoading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6 text-center text-primary">For You</h1>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="w-full shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="flex flex-row items-start space-x-4 p-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3 pt-0 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </CardContent>
            <CardFooter className="p-4 pt-2 border-t">
              <Skeleton className="h-8 w-20" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-primary">For You</h1>
      {posts.length === 0 && !loading && !hasMore ? (
        <div className="text-center py-10">
          <SearchX className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground">No chirps here yet.</p>
          <p className="text-sm text-muted-foreground">Follow some people or be the first to chirp!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onPostDeleted={handlePostDeleted} />
          ))}
        </div>
      )}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      {/* Intersection observer target */}
      {hasMore && <div ref={ref} className="h-10" />} 
      {!hasMore && posts.length > 0 && (
        <p className="text-center text-muted-foreground py-8">You&apos;ve reached the end!</p>
      )}
    </div>
  );
}

// Note: The PostWithAuthor type might need adjustment based on actual Supabase response structure.
// The `liked_by_user` logic is simplified here. For a robust solution, consider:
// 1. A Supabase RPC function that joins posts with likes and checks if the current user liked each post.
// 2. Fetching all likes for the visible posts and mapping them client-side (less performant for many posts).
// The current approach attempts a simplified join which might not work as expected without specific Supabase setup (e.g., views or proper RLS for the join).
// The query for likes has been simplified to fetch `likes ( user_id )` and then process it client-side.
