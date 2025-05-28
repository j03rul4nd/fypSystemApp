
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UserProfile as UserProfileType, PostWithAuthor } from "@/lib/types/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PostCard } from "@/components/posts/PostCard";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Edit, UserPlus, UserCheck, Mail, CalendarDays, Info } from "lucide-react";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { followUserAction, unfollowUserAction } from "@/lib/actions/users";
import { useToast } from "@/hooks/use-toast";

const POSTS_PER_PAGE = 10;

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const { user: currentUser, profile: currentUserProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const username = params.username as string;

  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [postsPage, setPostsPage] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followPending, setFollowPending] = useState(false);

  const fetchProfileData = useCallback(async () => {
    if (!username) return;
    setLoadingProfile(true);

    const { data: profileData, error: profileError } = await supabase
      .from("users")
      .select("*, followers_count:follows!follows_followed_id_fkey(count), following_count:follows!follows_follower_id_fkey(count), posts_count:posts(count)")
      .eq("username", username)
      .single();

    if (profileError || !profileData) {
      console.error("Error fetching profile:", profileError);
      setProfile(null); // Or redirect to a 404 page
      router.push('/404'); // Simple redirect for now
      return;
    }
    
    const typedProfileData = profileData as any; // Supabase types for counts can be tricky
    const fetchedProfile: UserProfileType = {
        ...profileData,
        followers_count: typedProfileData.followers_count?.[0]?.count ?? 0,
        following_count: typedProfileData.following_count?.[0]?.count ?? 0,
        posts_count: typedProfileData.posts_count?.[0]?.count ?? 0,
    };

    setProfile(fetchedProfile);

    if (currentUser && fetchedProfile.id !== currentUser.id) {
        const { data: followCheck, error: followCheckError } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', currentUser.id)
            .eq('followed_id', fetchedProfile.id)
            .maybeSingle();
        if (followCheckError && followCheckError.code !== 'PGRST116') console.error("Follow check error", followCheckError);
        setIsFollowing(!!followCheck);
    }

    setLoadingProfile(false);
    // Reset posts when profile changes
    setPosts([]);
    setPostsPage(0);
    setHasMorePosts(true);
    fetchUserPosts(fetchedProfile.id, 0); // Fetch initial posts for this profile
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, supabase, currentUser, router]);

  const fetchUserPosts = useCallback(async (userId: string, currentPage: number) => {
    if (loadingPosts || !hasMorePosts) return;
    setLoadingPosts(true);

    const from = currentPage * POSTS_PER_PAGE;
    const to = from + POSTS_PER_PAGE - 1;
    
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id, content, created_at, topics, sentiment, tone, user_id,
        users!inner ( id, username, avatar_url ), /* Ensure posts are from this user */
        likes ( user_id )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching user posts:", error);
    } else if (data) {
      const enrichedPosts = data.map(p => ({
        ...p,
        likes: { count: p.likes.length },
        liked_by_user: currentUser ? p.likes.some(like => like.user_id === currentUser.id) : false,
        users: p.users // already fetched
      })) as unknown as PostWithAuthor[];

      setPosts(prev => currentPage === 0 ? enrichedPosts : [...prev, ...enrichedPosts]);
      setHasMorePosts(data.length === POSTS_PER_PAGE);
      setPostsPage(currentPage + 1);
    }
    setLoadingPosts(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, currentUser, loadingPosts, hasMorePosts]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleFollowToggle = async () => {
    if (!currentUser || !profile || currentUser.id === profile.id) return;
    setFollowPending(true);
    const action = isFollowing ? unfollowUserAction : followUserAction;
    const result = await action(profile.id);

    if (result.success) {
        setIsFollowing(!isFollowing);
        // Optimistically update follower count, or re-fetch profile for accuracy
        setProfile(prev => prev ? ({
            ...prev,
            followers_count: isFollowing ? prev.followers_count -1 : prev.followers_count + 1
        }) : null);
        toast({ title: result.message });
    } else {
        toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setFollowPending(false);
  };

  const handlePostDeleted = (deletedPostId: string) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== deletedPostId));
    if (profile) { // Decrement post count
        setProfile(p => p ? ({...p, posts_count: Math.max(0, p.posts_count - 1) }) : null);
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0,2);
  }

  if (authLoading || loadingProfile || !profile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-8 shadow-xl">
          <CardHeader className="relative p-6 bg-gradient-to-br from-primary/10 to-accent/10">
             <div className="flex items-end space-x-6">
                <Skeleton className="h-32 w-32 rounded-full border-4 border-card" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
             </div>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex space-x-6 pt-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-24" />
            </div>
          </CardContent>
        </Card>
        <Skeleton className="h-10 w-32 mb-4" />
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="w-full shadow-lg rounded-xl overflow-hidden mb-4">
            <CardHeader className="flex flex-row items-start space-x-4 p-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2"> <Skeleton className="h-4 w-3/4" /> <Skeleton className="h-3 w-1/2" /> </div>
            </CardHeader>
            <CardContent className="px-4 pb-3 pt-0 space-y-2"> <Skeleton className="h-4 w-full" /> <Skeleton className="h-4 w-5/6" /> </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;

  if (isEditing && isOwnProfile) {
    return <ProfileForm profile={profile} onSave={() => { setIsEditing(false); fetchProfileData(); }} onCancel={() => setIsEditing(false)} />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="mb-8 shadow-xl overflow-hidden rounded-2xl">
        <div className="h-32 bg-gradient-to-r from-primary to-accent" data-ai-hint="abstract banner">
          {/* <Image src="https://placehold.co/1200x200" alt="Profile banner" layout="fill" objectFit="cover" /> */}
        </div>
        <CardHeader className="relative p-6 transform -translate-y-16">
          <div className="flex items-end space-x-6">
            <Avatar className="h-32 w-32 rounded-full border-4 border-card shadow-md">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.username || "User avatar"} data-ai-hint="user portrait large" />
              <AvatarFallback className="text-4xl">{getInitials(profile.username)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 pt-16">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-3xl font-bold">{profile.username}</CardTitle>
                        <CardDescription className="text-md text-muted-foreground">@{profile.username}</CardDescription>
                    </div>
                    {isOwnProfile ? (
                    <Button onClick={() => setIsEditing(true)} variant="outline">
                        <Edit className="mr-2 h-4 w-4" /> Edit Profile
                    </Button>
                    ) : (
                    <Button onClick={handleFollowToggle} disabled={followPending || authLoading} variant={isFollowing ? "outline" : "default"}>
                        {followPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isFollowing ? <UserCheck className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />)}
                        {isFollowing ? "Following" : "Follow"}
                    </Button>
                    )}
                </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-3 -mt-8">
          <p className="text-foreground/90">{profile.bio || "No bio yet."}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {profile.email && <span className="flex items-center"><Mail className="mr-1.5 h-4 w-4"/> {profile.email}</span>}
            <span className="flex items-center"><CalendarDays className="mr-1.5 h-4 w-4"/> Joined {format(new Date(profile.created_at), "MMMM yyyy")}</span>
          </div>
          <div className="flex space-x-6 pt-2">
            <div><span className="font-bold">{profile.posts_count}</span> <span className="text-muted-foreground">Chirps</span></div>
            <div><span className="font-bold">{profile.followers_count}</span> <span className="text-muted-foreground">Followers</span></div>
            <div><span className="font-bold">{profile.following_count}</span> <span className="text-muted-foreground">Following</span></div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-6 max-w-md mx-auto">
          <TabsTrigger value="posts">Chirps</TabsTrigger>
          {/* <TabsTrigger value="likes">Likes</TabsTrigger> */}
          {/* <TabsTrigger value="media">Media</TabsTrigger> */}
        </TabsList>
        <TabsContent value="posts">
          {posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onPostDeleted={handlePostDeleted}/>
              ))}
              {hasMorePosts && (
                <div className="text-center mt-8">
                  <Button onClick={() => fetchUserPosts(profile.id, postsPage)} disabled={loadingPosts} variant="outline">
                    {loadingPosts ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Load More"}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <Info className="mx-auto h-12 w-12 mb-3"/>
              <p className="text-lg">{profile.username} hasn&apos;t chirped yet.</p>
            </div>
          )}
        </TabsContent>
        {/* Implement Likes and Media tabs if needed */}
      </Tabs>
    </div>
  );
}
