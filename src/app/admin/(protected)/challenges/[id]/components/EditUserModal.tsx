'use client';

import { useState } from 'react';
import { adminUpdateUser } from '@/app/actions/admin-user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { User, Settings2 } from 'lucide-react';

export function EditUserModal({ user }: { user: any }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const res = await adminUpdateUser(user.id, formData);
    if (res?.error) {
      setError(res.error);
    } else {
      setOpen(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button 
          className="w-8 h-8 rounded-full border border-border/50 bg-secondary/30 flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors shrink-0"
          title="Edit Account"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <User className="w-5 h-5 text-primary" />
            Edit User Profile
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2 mt-2">
          {error && <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">{error}</div>}
          
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground">Full Name</Label>
            <Input id="name" name="name" defaultValue={user.name || ''} required className="bg-background" />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={user.email || ''} required className="bg-background" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username" className="text-xs uppercase tracking-wider text-muted-foreground">Username</Label>
              <Input id="username" name="username" defaultValue={user.username || ''} className="bg-background" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phoneNumber" className="text-xs uppercase tracking-wider text-muted-foreground">Phone</Label>
              <Input id="phoneNumber" name="phoneNumber" defaultValue={user.phoneNumber || ''} className="bg-background" />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="institution" className="text-xs uppercase tracking-wider text-muted-foreground">Institution / School</Label>
            <Input id="institution" name="institution" defaultValue={user.institution || ''} className="bg-background" />
          </div>

          <div className="grid gap-2 border-t border-border/50 pt-4 mt-2">
            <Label htmlFor="password" className="text-xs uppercase tracking-wider text-amber-500 font-bold">
              Admin Password Reset (Optional)
            </Label>
            <Input 
              id="password" 
              name="password" 
              type="text" 
              placeholder="Leave blank to keep current password" 
              className="bg-background font-mono text-sm border-amber-500/30 focus-visible:ring-amber-500" 
              autoComplete="new-password"
            />
            <p className="text-[10px] text-muted-foreground">
              Set a temporary password here if the operative lost access. They can change it later.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
