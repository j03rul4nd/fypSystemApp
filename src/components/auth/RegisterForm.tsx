
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signUpWithEmailAndPassword } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { AlertCircle, UserPlus, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <UserPlus className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
      Sign Up
    </Button>
  );
}

export function RegisterForm() {
  const initialState = { message: null, errors: {}, type: "" as const };
  const [state, dispatch] = useActionState(signUpWithEmailAndPassword, initialState);

  if (state.type === "confirmation_pending" && state.message) {
    return (
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">ChirpSpark</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <Alert variant="default" className="border-green-500/50 bg-green-500/10 text-foreground">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <AlertDescription className="font-medium text-base">
              {state.message}
            </AlertDescription>
          </Alert>
          <Button variant="link" asChild className="w-full text-primary text-sm pt-2">
            <Link href="/login">Proceed to Sign In page</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-primary">Join ChirpSpark</CardTitle>
        <CardDescription>Create an account to start chirping.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={dispatch} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" type="text" placeholder="your_username" required 
                   className="bg-background border-border focus:ring-primary"/>
            {state.errors?.username && (
              <p className="text-xs text-destructive">{state.errors.username.join(", ")}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required 
                   className="bg-background border-border focus:ring-primary"/>
            {state.errors?.email && (
              <p className="text-xs text-destructive">{state.errors.email.join(", ")}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required 
                   className="bg-background border-border focus:ring-primary"/>
            {state.errors?.password && (
              <p className="text-xs text-destructive">{state.errors.password.join(", ")}</p>
            )}
          </div>
          
          {/* Display general errors from the action that are not field-specific */}
          {state.type === "error" && state.message && !state.errors?.username && !state.errors?.email && !state.errors?.password && (
             <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          <SubmitButton />
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Button variant="link" asChild className="p-0 text-primary">
            <Link href="/login">Sign in</Link>
          </Button>
        </p>
      </CardFooter>
    </Card>
  );
}
