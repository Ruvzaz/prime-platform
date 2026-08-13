"use client";

import Image from "next/image";

import { useActionState, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createTeam, processMemberAction, regenerateTeamInviteToken } from "@/app/actions/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
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
import { useFormStatus } from "react-dom";
import {
  Shield,
  Copy,
  Check,
  Users,
  UserPlus,
  CheckCircle2,
  XCircle,
  Trash2,
  Clock,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

function CreateButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="w-full h-12 font-mono text-sm uppercase tracking-widest px-6 py-2.5 bg-red-500 text-white font-bold hover:brightness-125 active:scale-95 transition-all duration-150 shadow-[0_0_15px_rgba(255,0,0,0.3)] rounded flex items-center justify-center mt-4"
      aria-disabled={pending}
    >
      {pending ? "[ INITIALIZING SQUAD... ]" : "FORM SQUAD"}
    </button>
  );
}

export function TeamManager({
  challenge,
  myMembership,
  currentUser,
}: {
  challenge: any;
  myMembership: any;
  currentUser: any;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);



  const handleCopyInvite = (token: string) => {
    const inviteUrl = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateLink = async () => {
    setIsRegenerating(true);
    try {
      const result = await regenerateTeamInviteToken(myMembership?.team?.id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Recruitment link regenerated successfully");
        router.refresh();
      }
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleMemberAction = (
    memberId: string,
    action: "APPROVE" | "REJECT" | "REMOVE",
  ) => {
    startTransition(async () => {
      const res = await processMemberAction(
        myMembership.teamId,
        memberId,
        action,
      );
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Team updated successfully");
        router.refresh();
      }
    });
  };

  // Check if registration is active (controlled by Admin)
  const isClosed = !challenge.isActive;

  // 1. User is NOT in a team for this challenge
  if (!myMembership) {
    if (isClosed) {
      return (
        <div className="max-w-md mx-auto bg-[#161c21] p-8 rounded-xl border border-red-500/30 text-center shadow-xl">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4 animate-pulse" />
          <h3 className="text-xl font-bold font-mono uppercase tracking-widest text-[#dee3e9] mb-2">
            Registration Closed
          </h3>
          <p className="text-sm text-[#849495] font-mono leading-relaxed mb-6">
            การรับสมัครของรายการนี้ปิดอยู่ (Registration is currently closed by Administrator).
          </p>
          <Link href="/challenge">
            <Button variant="outline" className="font-mono text-xs uppercase tracking-widest border-[#3b494b] bg-[#161c21] text-[#dee3e9] hover:bg-[#252f36]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Challenges
            </Button>
          </Link>
        </div>
      );
    }
    const createWithChallenge = createTeam.bind(null, challenge.id);
    return <CreateTeamForm action={createWithChallenge} />;
  }

  // 2. User IS in a team
  const team = myMembership.team;
  const isLeader = team.leaderId === currentUser.id;
  const approvedMembers = team.members.filter(
    (m: any) => m.status === "APPROVED",
  );
  const pendingMembers = team.members.filter(
    (m: any) => m.status === "PENDING",
  );

  // Smart Auto-refresh: Only refresh when the user switches back to this tab
  useEffect(() => {
    if (!isLeader) return;
    
    const handleFocus = () => {
      router.refresh();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isLeader, router]);

  return (
    <div className="space-y-8">
      {/* Team Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-[#161c21]/80 backdrop-blur-md p-6 rounded-xl border border-[#3b494b] shadow-[0_0_15px_rgba(255,0,0,0.05)]">
        <div>
          <h2 className="text-3xl font-black text-[#dee3e9] flex items-center gap-3 uppercase tracking-tighter">
            <Shield className="w-8 h-8 text-red-500" />
            {team.name}
          </h2>
          <p className="text-[#849495] font-mono text-sm uppercase tracking-widest mt-2">
            Operation: {challenge.name}
          </p>
        </div>
        <div className="text-left md:text-right mt-4 md:mt-0">
          <div className="inline-flex items-center gap-2 bg-[#0e1418] text-[#dee3e9] border border-[#3b494b] px-4 py-2 rounded font-mono text-sm uppercase tracking-widest">
            <Users className="w-4 h-4 text-red-500" />
            {approvedMembers.length} / {challenge.maxTeamSize} Capacity
          </div>
          <p className="text-xs text-red-500 mt-2 uppercase font-mono tracking-widest font-bold">
            {isLeader
              ? "You are Squad Leader"
              : myMembership.status === "PENDING"
                ? "Awaiting Authorization"
                : "Active Member"}
          </p>
        </div>
      </div>

      {/* Invite Link Section (Only for Leader) */}
      {isLeader && (
        <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
          <h3 className="text-lg font-bold font-mono uppercase tracking-widest text-[#dee3e9] flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-red-500" />
            Recruitment Link
          </h3>
          <p className="text-sm text-[#849495] font-mono mb-4">
            Transmit this encoded link to potential operatives. Authentication
            is required.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              readOnly
              value={origin ? `${origin}/invite/${team.inviteToken}` : ""}
              className="bg-[#0e1418] border-[#3b494b] text-red-500 font-mono text-sm flex-1 h-11 focus-visible:ring-red-500"
            />
            <button
              onClick={() => handleCopyInvite(team.inviteToken)}
              className="shrink-0 sm:w-32 h-11 px-4 flex items-center justify-center font-mono text-xs uppercase tracking-widest border border-red-500 text-red-500 font-bold hover:bg-red-500/10 transition-colors rounded"
            >
              {copied ? (
                <Check className="w-4 h-4 mr-2" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              {copied ? "COPIED" : "COPY"}
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  disabled={isRegenerating}
                  className="shrink-0 sm:w-12 h-11 px-0 flex items-center justify-center font-mono text-xs uppercase tracking-widest border border-[#3b494b] text-[#849495] font-bold hover:bg-[#3b494b]/20 hover:text-[#dee3e9] transition-colors rounded disabled:opacity-50"
                  title="Regenerate Link"
                >
                  <RefreshCw className={`w-4 h-4 ${isRegenerating ? "animate-spin" : ""}`} />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#0a0e11] border-[#3b494b]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-[#dee3e9] font-mono tracking-wide uppercase">Generate New Link?</AlertDialogTitle>
                  <AlertDialogDescription className="text-[#849495] font-mono">
                    Are you sure you want to generate a new recruitment link? The old link will stop working immediately.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-transparent border-[#3b494b] text-[#849495] hover:bg-[#3b494b]/20 hover:text-[#dee3e9] font-mono uppercase tracking-widest">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRegenerateLink} className="bg-red-500 text-white hover:bg-red-600 font-mono uppercase tracking-widest">
                    Generate
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      {/* Team Members List */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Approved Members */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold font-mono uppercase tracking-widest text-[#dee3e9] flex items-center gap-2 border-b border-[#3b494b] pb-3">
            <CheckCircle2 className="w-5 h-5 text-red-500" />
            Active Roster
          </h3>
          <div className="space-y-3">
            {approvedMembers.map((m: any) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-4 bg-[#161c21] border border-[#3b494b] rounded-xl hover:border-red-500/30 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#0e1418] border border-[#3b494b] rounded flex items-center justify-center font-bold text-red-500 font-mono">
                    {m.user.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="font-bold text-[#dee3e9] uppercase tracking-wide">
                      {m.user.name}
                    </p>
                    <p className="text-[10px] text-[#849495] font-mono tracking-widest uppercase">
                      {m.user.email}
                    </p>
                  </div>
                </div>
                {isLeader && m.userId !== currentUser.id && (
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded border border-[#3b494b] text-[#849495] hover:text-red-500 hover:border-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    onClick={() => handleMemberAction(m.id, "REMOVE")}
                    disabled={isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                {m.userId === team.leaderId && (
                  <span className="text-[10px] font-mono uppercase tracking-widest border border-red-500 text-red-500 px-2 py-1 rounded bg-red-500/10">
                    Leader
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pending Approvals */}
        {(isLeader || myMembership.status === "PENDING") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#3b494b] pb-3">
              <h3 className="text-lg font-bold font-mono uppercase tracking-widest text-[#dee3e9] flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Pending Authorization
              </h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.refresh()}
                className="h-8 border-[#3b494b] bg-transparent text-[#849495] hover:bg-[#3b494b] hover:text-[#dee3e9] font-mono text-xs uppercase"
              >
                <RefreshCw className="w-3 h-3 md:mr-2" />
                <span className="hidden md:inline">Refresh</span>
              </Button>
            </div>
            {pendingMembers.length === 0 ? (
              <div className="p-8 text-center text-[#849495] font-mono text-sm uppercase tracking-widest bg-[#161c21] rounded-xl border border-dashed border-[#3b494b]">
                No pending requests.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingMembers.map((m: any) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-4 bg-[#161c21] border border-[#3b494b] rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#0e1418] border border-[#3b494b] rounded flex items-center justify-center font-bold text-[#849495] font-mono">
                        {m.user.name?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="font-bold text-[#dee3e9] uppercase tracking-wide">
                          {m.user.name}
                        </p>
                        <p className="text-[10px] text-[#849495] font-mono tracking-widest uppercase">
                          {m.user.email}
                        </p>
                      </div>
                    </div>
                    {isLeader ? (
                      <div className="flex items-center gap-2">
                        <button
                          className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/50 rounded hover:bg-amber-500 hover:text-[#0e1418] transition-colors disabled:opacity-50"
                          onClick={() => handleMemberAction(m.id, "APPROVE")}
                          disabled={
                            isPending ||
                            approvedMembers.length >= challenge.maxTeamSize
                          }
                        >
                          Approve
                        </button>
                        <button
                          className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-[#849495] border border-[#3b494b] rounded hover:border-red-500 hover:text-red-500 transition-colors disabled:opacity-50"
                          onClick={() => handleMemberAction(m.id, "REJECT")}
                          disabled={isPending}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      m.userId === currentUser.id && (
                        <span className="text-[10px] text-amber-500 font-mono tracking-widest uppercase border border-amber-500/30 bg-amber-500/10 px-2 py-1 rounded">
                          Processing...
                        </span>
                      )
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CreateTeamForm({ action }: { action: any }) {
  const [state, dispatch] = useActionState<any, FormData>(action, undefined);

  return (
    <div className="max-w-md mx-auto mt-12 bg-[#161c21]/80 backdrop-blur-md p-8 rounded-xl border border-[#3b494b] shadow-[0_0_20px_rgba(255,0,0,0.05)]">
      <div className="text-center mb-6">
        <div className="w-20 h-20 mx-auto mb-4 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/30 overflow-hidden">
          <Image src="/ICON IMAGE.png" alt="Form Your Team" width={60} height={60} className="object-contain" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tighter text-[#dee3e9]">
          Form Your Team
        </h2>
        <p className="text-[#849495] font-mono text-xs uppercase tracking-widest mt-2">
          Initialize squad parameters.
        </p>
      </div>

      <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-[10px] font-mono uppercase tracking-widest text-amber-500">
            <p className="font-bold mb-1">[ SYSTEM WARNING ]</p>
            <p>1 Member = 1 Team constraint active. Proceed with caution.</p>
          </div>
        </div>
      </div>

      <form action={dispatch} className="space-y-5">
        <div className="space-y-2">
          <Label
            htmlFor="name"
            className="font-mono text-xs uppercase tracking-widest text-[#849495]"
          >
            Team Name *
          </Label>
          <Input
            id="name"
            name="name"
            required
            placeholder="e.g. Cyber Ninjas"
            className="h-11 bg-[#0e1418] border-[#3b494b] text-[#dee3e9] placeholder:text-[#849495]/50 focus-visible:ring-red-500 font-mono text-sm"
            defaultValue={(state?.data?.name as string) || ""}
          />
          {state?.details?.name && (
            <p className="text-xs text-red-500 font-mono">
              {state.details.name[0]}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="organization"
            className="font-mono text-xs uppercase tracking-widest text-[#849495]"
          >
            Organization *
          </Label>
          <Input
            id="organization"
            name="organization"
            required
            placeholder="Academy/Agency"
            className="h-11 bg-[#0e1418] border-[#3b494b] text-[#dee3e9] placeholder:text-[#849495]/50 focus-visible:ring-red-500 font-mono text-sm"
            defaultValue={(state?.data?.organization as string) || ""}
          />
          {state?.details?.organization && (
            <p className="text-xs text-red-500 font-mono">
              {state.details.organization[0]}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="region"
            className="font-mono text-xs uppercase tracking-widest text-[#849495]"
          >
            Region Sector *
          </Label>
          <select
            id="region"
            name="region"
            required
            className="flex w-full rounded-md border h-11 bg-[#0e1418] border-[#3b494b] text-[#dee3e9] px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 font-mono text-sm"
            defaultValue={(state?.data?.region as string) || ""}
          >
            <option value="" disabled>
              -- Select Region --
            </option>
            <option value="กรุงเทพมหานครและปริมณฑล">
              กรุงเทพมหานครและปริมณฑล
            </option>
            <option value="ภาคเหนือ">ภาคเหนือ</option>
            <option value="ภาคกลาง ภาคตะวันออก และภาคตะวันตก">
              ภาคกลาง ภาคตะวันออก และภาคตะวันตก
            </option>
            <option value="ภาคตะวันออกเฉียงเหนือ">ภาคตะวันออกเฉียงเหนือ</option>
            <option value="ภาคใต้">ภาคใต้</option>
          </select>
          {state?.details?.region && (
            <p className="text-xs text-red-500 font-mono">
              {state.details.region[0]}
            </p>
          )}
        </div>

        {state?.error && !state.details && (
          <div className="p-3 text-xs font-mono uppercase tracking-wider text-red-500 bg-red-500/10 rounded border border-red-500/30 flex items-start gap-2 animate-in fade-in">
            <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>[ERROR] {state.error}</span>
          </div>
        )}

        <CreateButton />
      </form>

      <div className="mt-8 pt-6 border-t border-[#3b494b] space-y-4">
        <div className="bg-[#0e1418] p-4 rounded border border-[#3b494b] text-center">
          <p className="text-[10px] font-bold font-mono uppercase tracking-widest text-red-500 mb-2">
            Pending Invitation?
          </p>
          <p className="text-[10px] font-mono text-[#849495] uppercase tracking-widest leading-relaxed">
            Acquire recruitment link from your designated Squad Leader.
          </p>
        </div>

        <Link href="/challenge" className="block">
          <button className="w-full h-11 flex items-center justify-center text-[10px] font-mono uppercase tracking-widest text-[#849495] hover:text-[#dee3e9] hover:bg-[#3b494b]/30 rounded transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Abort & Return
          </button>
        </Link>
      </div>
    </div>
  );
}
