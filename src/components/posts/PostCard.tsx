
"use client";

import type { PostWithAuthor, Profile } from "@/lib/types/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Heart, MessageCircle, Repeat, Trash2, Edit3, Info, Tag, Smile, Aperture } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from "@/contexts/AuthContext";
import { likePostAction, deletePostAction } from "@/lib/actions/posts";
import { useToast } from "@/hooks/use-toast";
import React, { useState, useTransition } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PostCardProps {
  post: PostWithAuthor;
  onPostDeleted?: (postId: string) => void;
}

export function PostCard({ post, onPostDeleted }: PostCardProps) {
  const { user, profile: currentUserProfile } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  
  const [optimisticLikes, setOptimisticLikes] = useState(post.likes?.[0]?.count ?? 0);
  const [optimisticLiked, setOptimisticLiked] = useState(post.liked_by_user ?? false);

  const author = post.users;

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0,2);
  }

  const handleLike = async () => {
    if (!user) {
      toast({ title: "Please login to like posts", variant: "destructive" });
      return;
    }
    
    const newLikedState = !optimisticLiked;
    const newLikesCount = newLikedState ? optimisticLikes + 1 : optimisticLikes - 1;

    setOptimisticLiked(newLikedState);
    setOptimisticLikes(newLikesCount);

    startTransition(async () => {
      const result = await likePostAction(post.id);
      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
        // Revert optimistic update
        setOptimisticLiked(!newLikedState);
        setOptimisticLikes(newLikedState ? newLikesCount -1 : newLikesCount +1);
      }
    });
  };

  const handleDelete = async () => {
    if (!user || user.id !== post.user_id) {
      toast({ title: "Error", description: "You cannot delete this post.", variant: "destructive" });
      return;
    }
    startTransition(async () => {
      const result = await deletePostAction(post.id);
      if (result.success) {
        toast({ title: "Post Deleted", description: "Your post has been removed." });
        if (onPostDeleted) onPostDeleted(post.id);
      } else {
        toast({ title: "Error", description: result.error || "Could not delete post.", variant: "destructive" });
      }
    });
  };
  
  const createdAt = post.created_at ? new Date(post.created_at) : new Date();

  return (
    <Card className="w-full shadow-lg rounded-xl overflow-hidden bg-card text-card-foreground">
      <CardHeader className="flex flex-row items-start space-x-4 p-4">
        <Link href={`/profile/${author?.username || author?.id}`}>
          <Avatar className="h-12 w-12 border-2 border-primary">
            <AvatarImage src={author?.avatar_url || undefined} alt={author?.username || "User avatar"} data-ai-hint="user avatar medium" />
            <AvatarFallback>{getInitials(author?.username)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href={`/profile/${author?.username || author?.id}`} className="hover:underline">
                <h3 className="font-semibold text-lg">{author?.username || "Anonymous"}</h3>
              </Link>
              <span className="text-sm text-muted-foreground">
                · {formatDistanceToNow(createdAt, { addSuffix: true })}
              </span>
            </div>
            {user && user.id === post.user_id && (
              <div className="flex gap-1">
                {/* <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                  <Edit3 className="h-4 w-4" />
                </Button> */}
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your post.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
                        {isPending ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">@{author?.username || "anonymous"}</p>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-0">
        <p className="whitespace-pre-wrap text-base leading-relaxed">{post.content}</p>
        {(post.topics || post.sentiment || post.tone) && (
           <div className="mt-3 flex flex-wrap gap-2 items-center text-xs">
            {post.topics && post.topics.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1 px-2 py-1 h-auto cursor-default border-dashed border-accent text-accent-foreground hover:bg-accent/10">
                      <Tag className="h-3 w-3"/> Topics
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-popover text-popover-foreground">
                    <div className="flex flex-wrap gap-1 p-1">
                      {post.topics.map(topic => <Badge key={topic} variant="secondary" className="bg-accent/20 text-accent-foreground">{topic}</Badge>)}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {post.sentiment && (
               <Badge variant="outline" className="gap-1 border-dashed border-primary text-primary-foreground bg-primary/20">
                <Smile className="h-3 w-3"/> {post.sentiment}
               </Badge>
            )}
            {post.tone && (
              <Badge variant="outline" className="gap-1 border-dashed border-secondary-foreground text-secondary-foreground bg-secondary/30">
                <Aperture className="h-3 w-3"/> {post.tone}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-start gap-6 p-4 pt-2 border-t border-border">
        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary" onClick={handleLike} disabled={isPending}>
          <Heart className={cn("h-5 w-5", optimisticLiked ? "fill-primary text-primary" : "")} />
          <span>{optimisticLikes}</span>
        </Button>
        {/* <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary">
          <MessageCircle className="h-5 w-5" />
          <span>{0}</span>
        </Button> */}
        {/* <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary">
          <Repeat className="h-5 w-5" />
          <span>{0}</span>
        </Button> */}
      </CardFooter>
    </Card>
  );
}
