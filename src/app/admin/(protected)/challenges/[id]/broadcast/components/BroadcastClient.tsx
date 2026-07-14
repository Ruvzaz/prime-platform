'use client';

import { useState, useMemo } from 'react';
import { sendCompleteEmailToTeam } from '@/app/actions/admin-challenge';
import { Button } from '@/components/ui/button';
import { Search, Mail, CheckCircle2, Circle, Play, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type TeamData = {
  id: string;
  name: string;
  memberCount: number;
  isCompleteEmailSent: boolean;
};

export function BroadcastClient({ challengeId, maxTeamSize, initialTeams }: { challengeId: string, maxTeamSize: number, initialTeams: TeamData[] }) {
  const [teams, setTeams] = useState<TeamData[]>(initialTeams);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFull, setFilterFull] = useState(true);
  const [filterStatus, setFilterStatus] = useState('NOT_SENT'); // 'ALL', 'SENT', 'NOT_SENT'
  
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set());
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Filtered Teams
  const filteredTeams = useMemo(() => {
    return teams.filter(team => {
      // Search
      if (searchTerm && !team.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      // Full Filter
      if (filterFull && team.memberCount < maxTeamSize) return false;
      // Status Filter
      if (filterStatus === 'SENT' && !team.isCompleteEmailSent) return false;
      if (filterStatus === 'NOT_SENT' && team.isCompleteEmailSent) return false;
      
      return true;
    });
  }, [teams, searchTerm, filterFull, filterStatus, maxTeamSize]);

  const handleSelectAll = () => {
    if (selectedTeamIds.size === filteredTeams.length) {
      setSelectedTeamIds(new Set());
    } else {
      setSelectedTeamIds(new Set(filteredTeams.map(t => t.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedTeamIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedTeamIds(newSet);
  };

  const startBroadcast = async () => {
    if (selectedTeamIds.size === 0) return;
    if (!confirm(`Are you sure you want to broadcast emails to ${selectedTeamIds.size} teams? They will be processed one by one.`)) return;

    setIsBroadcasting(true);
    let successCount = 0;
    let failCount = 0;

    const idsToProcess = Array.from(selectedTeamIds);

    for (const id of idsToProcess) {
      setProcessingId(id);
      
      const res = await sendCompleteEmailToTeam(id);
      
      if (res.success) {
        successCount++;
        // Update local state to reflect sent status
        setTeams(prev => prev.map(t => t.id === id ? { ...t, isCompleteEmailSent: true } : t));
        // Remove from selection once sent successfully
        setSelectedTeamIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        failCount++;
        toast.error(`Failed to send email to team: ${teams.find(t => t.id === id)?.name}`);
      }

      // Small delay to prevent rate-limiting (Gmail Workspace)
      // User requested 5 seconds delay
      await new Promise(r => setTimeout(r, 5000));
    }

    setProcessingId(null);
    setIsBroadcasting(false);
    toast.success(`Broadcast complete. Sent: ${successCount}, Failed: ${failCount}`);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search team name..." 
            className="pl-9 h-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isBroadcasting}
          />
        </div>
        
        <label className="flex items-center gap-2 text-sm font-medium shrink-0 cursor-pointer">
          <input 
            type="checkbox" 
            checked={filterFull} 
            onChange={e => setFilterFull(e.target.checked)} 
            disabled={isBroadcasting}
            className="rounded border-input w-4 h-4 text-primary focus:ring-primary"
          />
          Show only Full Teams ({maxTeamSize}/{maxTeamSize})
        </label>

        <select
          className="h-11 rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-w-[150px] disabled:opacity-50"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          disabled={isBroadcasting}
        >
          <option value="ALL">All Status</option>
          <option value="NOT_SENT">Not Sent</option>
          <option value="SENT">Sent</option>
        </select>
      </div>

      {/* Broadcast Action Bar */}
      <div className="flex items-center justify-between bg-card border rounded-xl p-4 shadow-sm">
        <div className="text-sm font-medium">
          <span className="text-primary">{selectedTeamIds.size}</span> teams selected
        </div>
        <Button 
          onClick={startBroadcast} 
          disabled={isBroadcasting || selectedTeamIds.size === 0}
          className="gap-2"
        >
          {isBroadcasting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Broadcasting...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Start Broadcast
            </>
          )}
        </Button>
      </div>

      {/* Teams List */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 p-4 border-b bg-secondary/30 text-sm font-semibold text-muted-foreground items-center">
          <div className="flex items-center justify-center w-6">
            <input 
              type="checkbox" 
              checked={filteredTeams.length > 0 && selectedTeamIds.size === filteredTeams.length}
              onChange={handleSelectAll}
              disabled={isBroadcasting || filteredTeams.length === 0}
              className="rounded border-input w-4 h-4 text-primary focus:ring-primary cursor-pointer"
            />
          </div>
          <div>Team Name</div>
          <div className="text-center w-24">Members</div>
          <div className="w-32 text-right">Status</div>
        </div>

        <div className="divide-y max-h-[600px] overflow-y-auto">
          {filteredTeams.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No teams match your filters.</div>
          ) : (
            filteredTeams.map(team => {
              const isSelected = selectedTeamIds.has(team.id);
              const isProcessing = processingId === team.id;
              
              return (
                <div 
                  key={team.id} 
                  className={`grid grid-cols-[auto_1fr_auto_auto] gap-4 p-4 items-center transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'} ${isProcessing ? 'bg-amber-500/10' : ''}`}
                >
                  <div className="flex items-center justify-center w-6">
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                    ) : (
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleSelect(team.id)}
                        disabled={isBroadcasting || team.isCompleteEmailSent || team.memberCount < maxTeamSize}
                        className="rounded border-input w-4 h-4 text-primary focus:ring-primary cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      />
                    )}
                  </div>
                  <div className="font-medium">{team.name}</div>
                  <div className="text-center w-24">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${team.memberCount === maxTeamSize ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                      {team.memberCount} / {maxTeamSize}
                    </span>
                  </div>
                  <div className="w-32 flex justify-end">
                    {team.isCompleteEmailSent ? (
                      <div className="flex items-center gap-1.5 text-emerald-500 text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        Sent
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                        <Circle className="w-4 h-4" />
                        Not Sent
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
