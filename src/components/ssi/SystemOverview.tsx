
'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquareText, Heart, Tags } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SystemStats {
  totalUsers: number;
  totalPosts: number;
  totalLikes: number;
  topTopics: { topic: string; count: number }[];
}

async function getSystemStats(): Promise<SystemStats> {
  const supabase = createSupabaseServerClient();

  const { count: totalUsers, error: usersError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  if (usersError) {
    console.error("Error fetching total users for SSI overview:", usersError);
  }

  const { count: totalPosts, error: postsError } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true });

  if (postsError) {
    console.error("Error fetching total posts for SSI overview:", postsError);
  }

  const { count: totalLikes, error: likesError } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true });

  if (likesError) {
    console.error("Error fetching total likes for SSI overview:", likesError);
  }

  // Fetch all posts with topics to determine trending topics
  const { data: postsWithTopics, error: topicsError } = await supabase
    .from('posts')
    .select('topics')
    .not('topics', 'is', null); // Get posts where topics array exists

  if (topicsError) {
    console.error("Error fetching posts for topic aggregation:", topicsError);
  }

  const topicCounts: Record<string, number> = {};
  if (postsWithTopics) {
    for (const post of postsWithTopics) {
      if (post.topics && Array.isArray(post.topics)) { // Ensure topics is an array
        for (const topic of post.topics) {
          if (topic && typeof topic === 'string' && topic.trim() !== '') { // Ensure topic is a non-empty string
            topicCounts[topic] = (topicCounts[topic] || 0) + 1;
          }
        }
      }
    }
  }

  const sortedTopics = Object.entries(topicCounts)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Get top 10 topics

  return {
    totalUsers: totalUsers ?? 0,
    totalPosts: totalPosts ?? 0,
    totalLikes: totalLikes ?? 0,
    topTopics: sortedTopics,
  };
}


export async function SystemOverview() {
  const stats = await getSystemStats();

  return (
    <Card className="shadow-xl mb-8">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold flex items-center">
          <Tags className="mr-3 h-7 w-7 text-accent" />
          System-Wide Overview & Trends
        </CardTitle>
        <CardDescription>
          Current statistics and popular topics across the platform.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card/90 border-border shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/90 border-border shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Chirps</CardTitle>
              <MessageSquareText className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalPosts}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/90 border-border shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Likes</CardTitle>
              <Heart className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalLikes}</div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4 text-foreground/90 pt-4 border-t border-border">
            Top 10 Trending Topics
          </h3>
          {stats.topTopics.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {stats.topTopics.map(topicItem => (
                <Badge key={topicItem.topic} variant="secondary" className="text-base py-1.5 px-4 rounded-md bg-accent/10 text-accent-foreground border-accent/30 shadow-sm">
                  {topicItem.topic} <span className="ml-2 font-normal opacity-75">({topicItem.count})</span>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-md text-muted-foreground">No topics found in posts yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
