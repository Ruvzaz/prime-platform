'use client';

import { useState } from 'react';
import { adminDeleteTeam, adminRemoveMember } from '@/app/actions/admin-challenge';
import { Button } from '@/components/ui/button';
import { Trash2, UserMinus } from 'lucide-react';

export function DeleteTeamButton({ teamId }: { teamId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm('Are you sure you want to completely delete this team and all its memberships? This cannot be undone.')) return;
    
    setLoading(true);
    const res = await adminDeleteTeam(teamId);
    setLoading(false);
    if (res.error) alert(res.error);
  }

  return (
    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleDelete} disabled={loading}>
      <Trash2 className="w-4 h-4 mr-2" />
      Delete Team
    </Button>
  );
}

export function RemoveMemberButton({ memberId }: { memberId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    if (!confirm('Remove this member from the team?')) return;
    
    setLoading(true);
    const res = await adminRemoveMember(memberId);
    setLoading(false);
    if (res.error) alert(res.error);
  }

  return (
    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={handleRemove} disabled={loading} title="Remove Member">
      <UserMinus className="w-4 h-4" />
    </Button>
  );
}
