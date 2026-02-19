"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface SettingsFormProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export function SettingsForm({ user }: SettingsFormProps) {
  const initialState = { message: "", errors: {}, success: false };
  // @ts-ignore - useActionState types are tricky with server actions in this version
  const [state, dispatch] = useActionState(updateProfile, initialState);

  return (
    <form action={dispatch}>
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>
            Update your personal information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={user.name || ""}
              placeholder="Enter your name"
              required
            />
            {state.errors?.name && (
              <p className="text-sm text-red-500">{state.errors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={user.email || ""}
              placeholder="Enter your email"
              required
            />
            {state.errors?.email && (
              <p className="text-sm text-red-500">{state.errors.email}</p>
            )}
          </div>
          
          <div className="mt-4">
            {state.success && (
                <div className="flex items-center text-green-600 text-sm bg-green-50 p-3 rounded-md border border-green-200">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {state.message}
                </div>
            )}
             {!state.success && state.message && (
                <div className="flex items-center text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {state.message}
                </div>
            )}
          </div>

        </CardContent>
        <CardFooter>
          <Button type="submit">Save Changes</Button>
        </CardFooter>
      </Card>
    </form>
  );
}
