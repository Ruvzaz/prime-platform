'use client';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Users, Eye, Shield } from "lucide-react";

export function ViewTeamsDialog({ 
  teams, 
  challengeName 
}: { 
  teams: { id: string, name: string, leader: { name: string | null } }[], 
  challengeName: string 
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full font-mono text-xs uppercase tracking-widest h-auto px-4 py-3 bg-transparent border border-[#3b494b] text-[#dee3e9] hover:bg-red-500/10 hover:border-red-500 hover:text-red-500 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 rounded"
        >
          <Eye className="w-4 h-4" />
          View Teams
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="w-5 h-5 text-primary" />
            Teams in {challengeName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 space-y-3">
          {teams.length === 0 ? (
            <div className="text-center p-6 text-muted-foreground border border-dashed rounded-lg bg-muted/20">
              No teams have joined this challenge yet.
            </div>
          ) : (
            teams.map((team) => (
              <div key={team.id} className="flex items-center justify-between p-3 border rounded-lg bg-card shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">{team.name}</p>
                    <p className="text-xs text-muted-foreground">Leader: <span className="font-medium text-foreground/80">{team.leader.name || 'Unknown'}</span></p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
