
'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { UserAlgorithmInsight } from '@/lib/types/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

async function getAlgorithmInsightsData(): Promise<UserAlgorithmInsight[]> {
  // Use admin client for unrestricted access to user data for dashboard purposes
  // Ensure this client is only used in secure server-side admin contexts.
  // For this specific dashboard, server client with RLS is also fine if policies allow admin reads.
  // Let's stick to createSupabaseServerClient() for now and assume admin has read rights.
  const supabase = createSupabaseServerClient();

  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('id, username, email, is_admin, created_at');

  if (usersError) {
    console.error("Error fetching users for SSI:", usersError);
    throw new Error(`Failed to fetch users: ${usersError.message}`);
  }
  // Filter out users with null id, though this shouldn't happen with proper DB constraints
  const users = usersData.filter(u => u.id);


  const { data: allLikes, error: likesError } = await supabase
    .from('likes')
    .select('user_id, post_id');

  if (likesError) {
    console.error("Error fetching likes for SSI:", likesError);
    throw new Error(`Failed to fetch likes: ${likesError.message}`);
  }

  const allPostIdsWithLikes = [...new Set(allLikes.map(l => l.post_id))];
  let postsMap = new Map<string, string[] | null>();

  if (allPostIdsWithLikes.length > 0) {
    const { data: postsWithTopics, error: postsError } = await supabase
      .from('posts')
      .select('id, topics')
      .in('id', allPostIdsWithLikes)
      .not('topics', 'is', null);

    if (postsError) {
      console.error("Error fetching posts for SSI:", postsError);
      // Continue without topics if posts fetch fails, but log it
    } else if (postsWithTopics) {
      postsMap = new Map(postsWithTopics.map(p => [p.id, p.topics]));
    }
  }


  const insights: UserAlgorithmInsight[] = users.map(user => {
    const userLikes = allLikes.filter(like => like.user_id === user.id);
    const likedPostIds = userLikes.map(like => like.post_id);
    
    const likedTopicsArrays: (string[])[] = likedPostIds
        .map(postId => postsMap.get(postId) || [])
        .filter(topics => topics && topics.length > 0);

    const uniqueLikedTopics: string[] = [...new Set(likedTopicsArrays.flat().filter(topic => topic))];

    return {
      ...user, // Spread all fields from usersData.Row
      bio: null, // bio and avatar_url are not selected, so set to null or default
      avatar_url: null,
      likedPostsCount: userLikes.length,
      derivedTopics: uniqueLikedTopics,
      fypStrategy: uniqueLikedTopics.length > 0
        ? `Topics: ${uniqueLikedTopics.slice(0, 5).join(', ')}${uniqueLikedTopics.length > 5 ? '...' : ''}`
        : "General Recency (New User / No Likes with Topics)"
    };
  });

  return insights;
}

export default async function SSIPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login?message=SSI_Auth_Required');
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('is_admin, username')
    .eq('id', authUser.id)
    .single();

  if (profileError || !profile) {
    console.error("SSI Admin Check - Profile Error:", profileError?.message || "Profile not found.");
    return (
      <Card className="max-w-2xl mx-auto mt-10 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-destructive flex items-center">
            <AlertTriangle className="mr-2 h-6 w-6" /> Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>You do not have permission to view this page, or there was an error fetching your profile.</p>
          <p className="text-sm text-muted-foreground mt-2">Please contact an administrator if you believe this is a mistake.</p>
        </CardContent>
      </Card>
    );
  }
  
  if (!profile.is_admin) {
     return (
      <Card className="max-w-2xl mx-auto mt-10 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-destructive flex items-center">
            <AlertTriangle className="mr-2 h-6 w-6" /> Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Welcome, {profile.username || 'User'}. You do not have sufficient permissions to view this page.</p>
          <p className="text-sm text-muted-foreground mt-2">This section is for administrators only.</p>
        </CardContent>
      </Card>
    );
  }

  let insightsData: UserAlgorithmInsight[] = [];
  let fetchError: string | null = null;
  try {
    insightsData = await getAlgorithmInsightsData();
  } catch (error: any) {
    console.error("Error fetching SSI data:", error);
    fetchError = error.message || "An unknown error occurred while fetching dashboard data.";
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center">
            <ShieldCheck className="mr-3 h-8 w-8 text-primary" />
            User Algorithm Insights
          </CardTitle>
          <CardDescription>
            Overview of user interactions and potential FYP algorithm inputs.
            Logged in as Admin: <span className="font-semibold">{profile.username}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fetchError && (
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
              <span className="font-medium">Error:</span> {fetchError}
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Admin?</TableHead>
                <TableHead className="text-center">Liked Posts</TableHead>
                <TableHead>Derived Topics</TableHead>
                <TableHead>Potential FYP Strategy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {insightsData.length === 0 && !fetchError ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    No user data to display.
                  </TableCell>
                </TableRow>
              ) : (
                insightsData.map((insightUser) => (
                  <TableRow key={insightUser.id}>
                    <TableCell className="font-medium">{insightUser.username || 'N/A'}</TableCell>
                    <TableCell>{insightUser.email || 'N/A'}</TableCell>
                    <TableCell className="text-center">
                      {insightUser.is_admin ? (
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">Yes</Badge>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">{insightUser.likedPostsCount}</TableCell>
                    <TableCell>
                      {insightUser.derivedTopics.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {insightUser.derivedTopics.map(topic => (
                            <Badge key={topic} variant="outline" className="text-xs">{topic}</Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{insightUser.fypStrategy}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
