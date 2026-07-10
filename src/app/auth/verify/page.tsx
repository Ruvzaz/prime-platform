import { verifyEmailToken } from "@/app/actions/challenge-auth";
import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token;

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-background">
        <XCircle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2 tracking-tight">Invalid Request</h1>
        <p className="text-muted-foreground mb-6">No verification token was provided.</p>
        <Link href="/">
          <Button>Return Home</Button>
        </Link>
      </div>
    );
  }

  const result = await verifyEmailToken(token);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-background">
      {result.success ? (
        <>
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4 animate-in zoom-in" />
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Email Verified!</h1>
          <p className="text-muted-foreground mb-8 max-w-md">
            Your email has been successfully verified. Your account is now fully active. You can log in to join or create a team.
          </p>
          <Link href="/auth/login">
            <Button size="lg" className="px-8">Continue to Login</Button>
          </Link>
        </>
      ) : (
        <>
          <XCircle className="w-16 h-16 text-destructive mb-4 animate-in zoom-in" />
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Verification Failed</h1>
          <p className="text-muted-foreground mb-8 max-w-md">{result.error}</p>
          <Link href="/auth/register">
            <Button variant="outline" size="lg">Register Again</Button>
          </Link>
        </>
      )}
    </div>
  );
}
