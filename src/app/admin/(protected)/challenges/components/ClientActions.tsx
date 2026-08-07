'use client';

import { useState } from 'react';
import { createChallenge, toggleChallengeStatus, updateChallenge } from '@/app/actions/admin-challenge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X, Edit, Download } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';

export function ChallengeDashboardFilter({ challenges, currentFilter }: { challenges: {id: string, name: string}[], currentFilter: string }) {
  const router = useRouter();
  const pathname = usePathname();
  
  return (
    <select
      className="h-10 rounded-md border border-[#3b494b] bg-[#161c21] text-[#dee3e9] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-w-[200px]"
      value={currentFilter}
      onChange={(e) => {
        if (e.target.value === 'ALL') {
          router.push(pathname);
        } else {
          router.push(`${pathname}?challengeId=${e.target.value}`);
        }
      }}
    >
      <option value="ALL">All Challenges</option>
      {challenges.map(c => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  );
}

export function ExportDataButton({ currentFilter }: { currentFilter: string }) {
  return (
    <Button 
      variant="outline" 
      onClick={() => {
        window.location.href = `/api/admin/export?challengeId=${currentFilter}`;
      }}
      className="flex items-center gap-2 border-[#3b494b] bg-[#161c21] text-[#dee3e9] hover:bg-[#252f36] hover:text-white"
    >
      <Download className="w-4 h-4" />
      Export to Excel
    </Button>
  );
}

export function ExportChallengeSysButton({ currentFilter }: { currentFilter: string }) {
  return (
    <Button 
      variant="outline" 
      onClick={() => {
        window.location.href = `/api/admin/export-challenge-sys?challengeId=${currentFilter}`;
      }}
      className="flex items-center gap-2 border-[#3b494b] bg-[#161c21] text-[#dee3e9] hover:bg-[#252f36] hover:text-white"
    >
      <Download className="w-4 h-4" />
      Export to Challenge Sys
    </Button>
  );
}

export function CreateChallengeForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await createChallenge(formData);
    setLoading(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Challenge created successfully");
      setIsOpen(false);
    }
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="w-4 h-4 mr-2" />
        Create Challenge
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border shadow-xl rounded-2xl w-full max-w-md p-6 relative">
        <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={() => setIsOpen(false)}>
          <X className="w-4 h-4" />
        </Button>
        <h2 className="text-xl font-bold mb-4">Create New Challenge</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Challenge Name</Label>
            <Input id="name" name="name" required placeholder="e.g. Junior CTF" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug (URL friendly)</Label>
            <Input id="slug" name="slug" required placeholder="e.g. junior-ctf" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" placeholder="Brief description..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxTeamSize">Max Team Size</Label>
            <Input id="maxTeamSize" name="maxTeamSize" type="number" required defaultValue="4" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="imageFile">Banner Image (16:9)</Label>
            <Input id="imageFile" name="imageFile" type="file" accept="image/*" />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function EditChallengeForm({ challenge }: { challenge: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await updateChallenge(challenge.id, formData);
    setLoading(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Challenge updated successfully");
      setIsOpen(false);
    }
  }

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <Edit className="w-4 h-4 mr-2" />
        Edit
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border shadow-xl rounded-2xl w-full max-w-md p-6 relative">
        <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={() => setIsOpen(false)}>
          <X className="w-4 h-4" />
        </Button>
        <h2 className="text-xl font-bold mb-4">Edit Challenge</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Challenge Name</Label>
            <Input id="name" name="name" required defaultValue={challenge.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug (URL friendly)</Label>
            <Input id="slug" name="slug" required defaultValue={challenge.slug} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" defaultValue={challenge.description || ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxTeamSize">Max Team Size</Label>
            <Input id="maxTeamSize" name="maxTeamSize" type="number" required defaultValue={challenge.maxTeamSize} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="imageFile">Banner Image (16:9)</Label>
            <Input id="imageFile" name="imageFile" type="file" accept="image/*" />
            {challenge.imageUrl && (
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to keep the current image. <a href={challenge.imageUrl} target="_blank" className="text-primary hover:underline">View current image</a>
              </p>
            )}
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ChallengeStatusToggle({ id, isActive }: { id: string, isActive: boolean }) {
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    await toggleChallengeStatus(id, !isActive);
    setLoading(false);
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleToggle}
      disabled={loading}
      className={isActive ? 'text-destructive hover:bg-destructive/10' : 'text-emerald-500 hover:bg-emerald-500/10'}
    >
      {isActive ? 'Close Challenge' : 'Open Challenge'}
    </Button>
  );
}
