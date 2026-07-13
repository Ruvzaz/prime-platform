'use client';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Users, Eye, Shield, User } from "lucide-react";

export function ViewTeamsDialog({ 
  teams, 
  challengeName 
}: { 
  teams: { 
    id: string; 
    name: string; 
    leader: { username: string | null };
    _count: { members: number };
  }[], 
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
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden flex flex-col bg-[#161c21]/95 backdrop-blur-xl border border-red-500/20 shadow-[0_0_40px_rgba(255,0,0,0.1)] text-[#dee3e9]">
        <DialogHeader className="border-b border-[#3b494b] pb-4 shrink-0">
          <DialogTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tight text-white">
            <span className="w-2 h-6 bg-red-500 rounded-sm animate-pulse"></span>
            Enlisted Squads
          </DialogTitle>
          <p className="text-[#849495] font-mono text-xs uppercase tracking-widest mt-2">
            Operation: {challengeName}
          </p>
        </DialogHeader>
        
        <div className="mt-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-red-500/20 scrollbar-track-transparent pr-2">
          {teams.length === 0 ? (
            <div className="text-center p-12 text-[#849495] border border-dashed border-[#3b494b] rounded-lg bg-[#090f13]/50 flex flex-col items-center justify-center gap-4">
              <Shield className="w-12 h-12 text-[#3b494b]" />
              <p className="font-mono uppercase tracking-widest text-sm">No squads have joined this operation yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team) => (
                <div key={team.id} className="relative group overflow-hidden">
                  <div className="absolute -inset-px bg-gradient-to-br from-red-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
                  <div className="relative flex flex-col p-4 border border-[#3b494b] rounded-lg bg-[#090f13] hover:border-red-500/50 transition-colors h-full">
                    
                    {/* Team Name Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 shrink-0 rounded bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-base text-white uppercase truncate tracking-wide">{team.name}</h4>
                        <div className="flex items-center gap-1.5 text-xs font-mono text-[#849495] mt-1">
                          <User className="w-3 h-3 text-red-500" />
                          <span className="truncate">Leader: {team.leader?.username || 'Unknown'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats Footer */}
                    <div className="mt-auto pt-3 border-t border-[#3b494b] flex items-center justify-between font-mono text-xs uppercase tracking-widest">
                      <span className="text-[#849495]">จำนวนสมาชิก</span>
                      <span className="text-white bg-[#161c21] px-2 py-1 rounded border border-[#3b494b]">
                        {team._count.members} <span className="text-red-500">คน</span>
                      </span>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
