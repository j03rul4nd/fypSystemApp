
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom"; // Changed from "react"
import { updateUserProfile } from "@/lib/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import type { Profile } from "@/lib/types/supabase";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { Loader2, Save, XSquare } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ProfileFormProps {
  profile: Profile;
  onSave: () => void;
  onCancel: () => void;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-primary hover:bg-primary/90">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
      Save Changes
    </Button>
  );
}

export function ProfileForm({ profile, onSave, onCancel }: ProfileFormProps) {
  const { toast } = useToast();
  const initialState = { message: null, errors: {}, type: "" as const };
  // Bind profile.id to the action
  const updateUserProfileActionWithId = updateUserProfile.bind(null, profile.id);
  const [state, dispatch] = useActionState(updateUserProfileActionWithId, initialState);

  useEffect(() => {
    if (state.type === "success" && state.message) {
      toast({ title: "Profile Updated", description: state.message });
      onSave();
    } else if (state.type === "error" && state.message) {
      toast({ title: "Error", description: state.message, variant: "destructive" });
    }
  }, [state, toast, onSave]);

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Edit Profile</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={dispatch} className="space-y-6">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                name="username" 
                defaultValue={profile.username || ""} 
                className="mt-1 bg-background border-border focus:ring-primary"
              />
              {state.errors?.username && (
                <p className="text-sm text-destructive mt-1">{state.errors.username.join(", ")}</p>
              )}
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea 
                id="bio" 
                name="bio" 
                defaultValue={profile.bio || ""} 
                placeholder="Tell us a bit about yourself"
                className="mt-1 min-h-[100px] bg-background border-border focus:ring-primary"
                maxLength={160}
              />
               {state.errors?.bio && (
                <p className="text-sm text-destructive mt-1">{state.errors.bio.join(", ")}</p>
              )}
            </div>
            <div>
              <Label htmlFor="avatar_url">Avatar URL</Label>
              <Input 
                id="avatar_url" 
                name="avatar_url" 
                type="url"
                defaultValue={profile.avatar_url || ""} 
                placeholder="https://example.com/avatar.png"
                className="mt-1 bg-background border-border focus:ring-primary"
              />
              {state.errors?.avatar_url && (
                <p className="text-sm text-destructive mt-1">{state.errors.avatar_url.join(", ")}</p>
              )}
            </div>

            {state.message && state.type === "error" && !state.errors?.username && !state.errors?.bio && !state.errors?.avatar_url && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            )}

            <CardFooter className="px-0 pt-4 flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={onCancel}>
                <XSquare className="mr-2 h-4 w-4" /> Cancel
              </Button>
              <SubmitButton />
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
