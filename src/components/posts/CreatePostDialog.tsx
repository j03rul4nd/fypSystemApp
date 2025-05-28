
"use client";

import { useState, type ReactNode } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom"; // Changed from "react"
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createPostAction } from "@/lib/actions/posts";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-primary hover:bg-primary/90">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Chirping...
        </>
      ) : (
        <>
          <Send className="mr-2 h-4 w-4" />
          Chirp
        </>
      )}
    </Button>
  );
}

interface CreatePostDialogProps {
  trigger: ReactNode;
}

export function CreatePostDialog({ trigger }: CreatePostDialogProps) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const initialState = { message: null, errors: {}, type: "" as const, post: null };
  const [state, dispatch] = useActionState(createPostAction, initialState);
  const [content, setContent] = useState("");

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0,2);
  }

  const handleSubmit = async (formData: FormData) => {
    // dispatch is called by the form's action prop
    // We need to observe the state returned by useActionState to react to the action's result
    const result = await createPostAction(initialState, formData); 
     if (result.type === "success") {
      toast({
        title: "Chirp Sent!",
        description: "Your new chirp is now live.",
      });
      setContent(""); // Clear content on success
      setOpen(false);
    } else if (result.message && result.type === "error") { // Check for type error as well
       toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
    // Note: The state from useActionState will also update, which can be used to show errors directly in the form.
    // The `result` here is from a direct call, `state` is from the hook.
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px] bg-card text-card-foreground rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create a new Chirp</DialogTitle>
          <DialogDescription>
            Share your thoughts with the world. Keep it under 280 characters.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <div className="flex items-start space-x-3">
                <Avatar className="h-10 w-10 mt-1">
                    <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.username ?? "User avatar"} data-ai-hint="user avatar small" />
                    <AvatarFallback>{getInitials(profile?.username)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <Label htmlFor="content" className="sr-only">
                    Chirp content
                    </Label>
                    <Textarea
                    id="content"
                    name="content"
                    placeholder="What's happening?"
                    className="min-h-[100px] text-base resize-none bg-background border-border focus:ring-primary"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    maxLength={280}
                    />
                    <p className="text-xs text-muted-foreground text-right mt-1">{content.length}/280</p>
                </div>
            </div>
            {state?.errors?.content && (
              <p className="text-sm text-destructive">{state.errors.content.join(", ")}</p>
            )}
          </div>
          {state?.message && state.type === "error" && !state.errors?.content && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
            </DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
