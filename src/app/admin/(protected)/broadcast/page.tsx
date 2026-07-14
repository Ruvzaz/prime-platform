import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Shield, ChevronRight } from "lucide-react";

export default async function GlobalBroadcastPage() {
  const challenges = await prisma.challenge.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Broadcast Emails</h1>
        <p className="text-muted-foreground mt-1">Select a challenge to broadcast emails to its teams.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-8">
        {challenges.map(challenge => (
          <Link key={challenge.id} href={`/admin/challenges/${challenge.id}/broadcast`}>
            <div className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-bold text-lg mb-1">{challenge.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {challenge.description || "No description"}
              </p>
            </div>
          </Link>
        ))}
        {challenges.length === 0 && (
          <div className="col-span-full p-8 text-center text-muted-foreground bg-card border rounded-xl">
            No challenges available.
          </div>
        )}
      </div>
    </div>
  );
}
