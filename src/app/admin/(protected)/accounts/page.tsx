import { prisma } from "@/lib/prisma";
import { UserCog } from "lucide-react";
import { AccountsClient } from "./components/AccountsClient";

export const metadata = {
  title: 'Manage Accounts | Prime CTF',
};

export default async function AdminAccountsPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      phoneNumber: true,
      institution: true,
      educationLevel: true,
      gender: true,
      role: true,
      createdAt: true,
      emailVerified: true,
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
          <UserCog className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Account Management</h1>
          <p className="text-muted-foreground mt-1">View, search, and manage user accounts.</p>
        </div>
      </div>

      <AccountsClient users={users} />
    </div>
  );
}
