'use client';

import { useState, useEffect } from 'react';
import { Shield, Users, Search, MapPin, Building, ChevronLeft, ChevronRight, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DeleteTeamButton, RemoveMemberButton, AddMemberButton } from '../../components/AdminTeamActions';
import { EditUserModal } from './EditUserModal';
import Link from 'next/link';

export function ChallengeTeamsClient({ challenge }: { challenge: any }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, regionFilter]);

  // Filter teams based on search term and region
  const filteredTeams = challenge.teams.filter((team: any) => {
    const matchesRegion = regionFilter === 'ALL' || team.region === regionFilter;
    
    // Check if team name, org, or any member matches search term
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      team.name.toLowerCase().includes(searchLower) ||
      (team.organization && team.organization.toLowerCase().includes(searchLower)) ||
      team.members.some((m: any) => 
        m.user.name?.toLowerCase().includes(searchLower) ||
        m.user.email?.toLowerCase().includes(searchLower)
      );

    return matchesRegion && matchesSearch;
  });

  const regions = [
    'ALL',
    'กรุงเทพมหานครและปริมณฑล',
    'ภาคเหนือ',
    'ภาคกลาง ภาคตะวันออก และภาคตะวันตก',
    'ภาคตะวันออกเฉียงเหนือ',
    'ภาคใต้',
  ];

  const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);
  const paginatedTeams = filteredTeams.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 mt-8">
      {/* Actions & Filters Section */}
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 bg-card border rounded-xl p-4 shadow-sm flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by team, member name, or email..." 
              className="pl-9 h-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="h-11 rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-w-[200px]"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
          >
            <option value="ALL">All Regions (ทุกภูมิภาค)</option>
            {regions.slice(1).map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        
        <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center justify-center shrink-0">
           <Link 
             href={`/admin/challenges/${challenge.id}/broadcast`}
             className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors w-full lg:w-auto h-11"
           >
             <Mail className="w-5 h-5" />
             Broadcast "Team Complete" Emails
           </Link>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid gap-6">
        {paginatedTeams.map((team: any) => {
          const approvedMembers = team.members.filter((m: any) => m.status === 'APPROVED');
          const pendingMembers = team.members.filter((m: any) => m.status === 'PENDING');
          
          return (
            <div key={team.id} className="bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-secondary/20 p-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-6 h-6 text-primary" />
                    <h3 className="font-bold text-xl">{team.name}</h3>
                    <span className="bg-background px-2.5 py-1 text-xs rounded-md border font-medium">
                      {approvedMembers.length} / {challenge.maxTeamSize} Members
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground md:ml-9">
                    {team.organization && (
                      <div className="flex items-center gap-1.5">
                        <Building className="w-4 h-4" />
                        <span>{team.organization}</span>
                      </div>
                    )}
                    {team.region && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        <span>{team.region}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="md:ml-0 flex items-center gap-2">
                  <AddMemberButton 
                    teamId={team.id} 
                    maxTeamSize={challenge.maxTeamSize} 
                    currentCount={approvedMembers.length} 
                  />
                  <DeleteTeamButton teamId={team.id} />
                </div>
              </div>
              
              <div className="p-5 space-y-5 bg-background/50">
                {/* Approved Members */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Active Members
                  </h4>
                  {approvedMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic bg-secondary/20 p-4 rounded-lg border border-dashed">No active members.</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {approvedMembers.map((m: any) => (
                        <div key={m.id} className="flex items-center justify-between p-3 bg-card border rounded-lg hover:border-primary/50 transition-colors">
                          <div className="overflow-hidden flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                              {m.user.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate text-foreground">{m.user.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{m.user.email}</p>
                              {m.userId === team.leaderId && (
                                <span className="inline-block mt-1 text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Leader</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <EditUserModal user={m.user} />
                            {m.userId !== team.leaderId && (
                              <RemoveMemberButton memberId={m.id} />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pending Members */}
                {pendingMembers.length > 0 && (
                  <div className="pt-5 border-t">
                    <h4 className="text-sm font-semibold text-amber-500 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Pending Requests
                    </h4>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {pendingMembers.map((m: any) => (
                        <div key={m.id} className="flex items-center justify-between p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                          <div className="overflow-hidden flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs shrink-0">
                              {m.user.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate text-foreground">{m.user.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{m.user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <EditUserModal user={m.user} />
                            <RemoveMemberButton memberId={m.id} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredTeams.length === 0 && (
          <div className="text-center py-16 border border-dashed rounded-xl bg-muted/20">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="text-lg font-medium text-muted-foreground">No Teams Found</h3>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or region filter.</p>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between bg-card border rounded-xl p-4 shadow-sm mt-2 gap-4">
            <div className="text-sm text-muted-foreground font-medium">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTeams.length)} of {filteredTeams.length} teams
            </div>
            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-1 px-3 py-2 border rounded-md text-sm font-medium disabled:opacity-50 hover:bg-secondary transition-colors"
                disabled={currentPage === 1}
                onClick={() => {
                  setCurrentPage(p => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <div className="flex items-center px-4 py-2 bg-secondary/50 rounded-md text-sm font-semibold">
                Page {currentPage} of {totalPages}
              </div>
              <button
                className="flex items-center gap-1 px-3 py-2 border rounded-md text-sm font-medium disabled:opacity-50 hover:bg-secondary transition-colors"
                disabled={currentPage === totalPages}
                onClick={() => {
                  setCurrentPage(p => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
