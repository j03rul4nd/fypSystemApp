
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string | null
          username: string | null
          bio: string | null
          avatar_url: string | null
          created_at: string
          is_admin: boolean | null
        }
        Insert: {
          id: string
          email?: string | null
          username?: string | null
          bio?: string | null
          avatar_url?: string | null
          created_at?: string
          is_admin?: boolean | null
        }
        Update: {
          id?: string
          email?: string | null
          username?: string | null
          bio?: string | null
          avatar_url?: string | null
          created_at?: string
          is_admin?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      posts: {
        Row: {
          id: string
          user_id: string
          content: string
          created_at: string
          topics: string[] | null
          sentiment: string | null
          tone: string | null
          retention_rate: number | null
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          created_at?: string
          topics?: string[] | null
          sentiment?: string | null
          tone?: string | null
          retention_rate?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          created_at?: string
          topics?: string[] | null
          sentiment?: string | null
          tone?: string | null
          retention_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      likes: {
        Row: {
          id: string
          user_id: string
          post_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          }
        ]
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          followed_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          followed_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          followed_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_followed_id_fkey"
            columns: ["followed_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Profile = Database['public']['Tables']['users']['Row'];
export type Post = Database['public']['Tables']['posts']['Row'];
export type Like = Database['public']['Tables']['likes']['Row'];
export type Follow = Database['public']['Tables']['follows']['Row'];

// For enriched post data, e.g. with author profile and like count
export type PostWithAuthor = Post & {
  users: Profile | null; 
  likes: { count: number }[]; 
  liked_by_user?: boolean; 
};

export type UserProfile = Profile & {
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_followed_by_current_user?: boolean;
};

export type UserAlgorithmInsight = Profile & {
  posts_count: number;
  followers_count: number;
  following_count: number;
  likedPostsCount: number;
  derivedTopics: string[];
  fypStrategy: string;
};
