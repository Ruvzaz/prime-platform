'use client';

import { useState } from 'react';
import { adminDeleteTeam, adminRemoveMember, adminAddMemberToTeam } from '@/app/actions/admin-challenge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, UserMinus, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AddMemberButton({
  teamId,
  maxTeamSize,
  currentCount,
}: {
  teamId: string;
  maxTeamSize: number;
  currentCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const isFull = currentCount >= maxTeamSize;

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (isFull) {
      toast.error(`ทีมนี้สมาชิกเต็มแล้ว (${currentCount}/${maxTeamSize} คน)`);
      return;
    }
    if (!email.trim()) {
      toast.error('กรุณากรอกอีเมลสมาชิก');
      return;
    }

    setLoading(true);
    const res = await adminAddMemberToTeam(teamId, email);
    setLoading(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(res.message || 'เพิ่มสมาชิกเรียบร้อยแล้ว');
      setEmail('');
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1 text-xs border-indigo-500/30 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-600 disabled:opacity-50"
          disabled={isFull}
          title={isFull ? `Team Full (${currentCount}/${maxTeamSize})` : 'Add Member by Email'}
        >
          <UserPlus className="w-3.5 h-3.5 mr-1" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card text-foreground border rounded-xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <UserPlus className="w-5 h-5 text-indigo-500" />
            Add Team Member
          </DialogTitle>
          <DialogDescription>
            Enter the member&apos;s email address to add them to this team. (Capacity: {currentCount}/{maxTeamSize})
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAddMember} className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Member Email Address *
            </label>
            <Input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-10"
              disabled={loading}
            />
          </div>

          <div className="p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground space-y-1">
            <p>💡 <strong>ข้อตกลง:</strong></p>
            <p>1. ระบบจะไม่ให้เพิ่มสมาชิกเกินจำนวนสูงสุด ({maxTeamSize} คน)</p>
            <p>2. สมาชิกต้องไม่เป็นสมาชิกของทีมอื่นในการแข่งขันเดียวกัน</p>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || isFull} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {loading ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteTeamButton({ teamId }: { teamId: string }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const res = await adminDeleteTeam(teamId);
    setLoading(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Team deleted successfully");
      setOpen(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={loading}>
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Team
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to completely delete this team and all its memberships? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete Team"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function RemoveMemberButton({ memberId }: { memberId: string }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleRemove() {
    setLoading(true);
    const res = await adminRemoveMember(memberId);
    setLoading(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Member removed from team");
      setOpen(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" disabled={loading} title="Remove Member">
          <UserMinus className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Member</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove this member from the team?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={handleRemove} disabled={loading}>
            {loading ? "Removing..." : "Remove"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
