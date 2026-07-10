import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfileForm } from "./ProfileForm";

export default async function EditProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0e1418] text-[#dee3e9] font-sans relative pb-20 overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-red-500/10 to-transparent pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 relative z-10">
        <ProfileForm defaultValues={user} />
      </div>
    </div>
  );
}
