
"use client";

import { useFormState, useFormStatus } from "react-dom";
import { signInWithEmailAndPassword } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { AlertCircle, LogIn } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <LogIn className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
      Sign In
    </Button>
  );
}

export function LoginForm() {
  const initialState = { message: null, errors: {} };
  const [state, dispatch] = useFormState(signInWithEmailAndPassword, initialState);

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-primary">ChirpSpark</CardTitle>
        <CardDescription>Welcome back! Sign in to your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={dispatch} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required 
                   className="bg-background border-border focus:ring-primary" />
            {state.errors?.email && (
              <p className="text-sm text-destructive">{state.errors.email.join(", ")}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required 
                   className="bg-background border-border focus:ring-primary" />
            {state.errors?.password && (
              <p className="text-sm text-destructive">{state.errors.password.join(", ")}</p>
            )}
          </div>
          
          {state.message && !state.errors && (
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
          Don&apos;t have an account?{" "}
          <Button variant="link" asChild className="p-0 text-primary">
            <Link href="/register">Sign up</Link>
          </Button>
        </p>
      </CardFooter>
    </Card>
  );
}
