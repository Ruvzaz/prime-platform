'use client';

import { useState, useTransition, useEffect } from 'react';
import { Search, UserCircle, ShieldCheck, User, Mail, MailCheck, MailWarning, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EditUserModal } from '../../challenges/[id]/components/EditUserModal';
import { adminResendVerificationEmail } from '@/app/actions/admin-user';
import { toast } from 'sonner';

export function AccountsClient({ users }: { users: any[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isPending, startTransition] = useTransition();
  const [resendingForId, setResendingForId] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

  const handleResend = (userId: string) => {
    setResendingForId(userId);
    startTransition(async () => {
      const result = await adminResendVerificationEmail(userId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Verification email sent successfully!");
      }
      setResendingForId(null);
    });
  };

  const filteredUsers = users.filter((u: any) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    
    const matchesStatus = statusFilter === 'ALL' || 
                          (statusFilter === 'VERIFIED' ? !!u.emailVerified : !u.emailVerified);
    
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (u.name && u.name.toLowerCase().includes(searchLower)) ||
      (u.email && u.email.toLowerCase().includes(searchLower)) ||
      (u.username && u.username.toLowerCase().includes(searchLower)) ||
      (u.institution && u.institution.toLowerCase().includes(searchLower));

    return matchesRole && matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 mt-8">
      <div className="flex flex-col sm:flex-row gap-4 bg-card border rounded-xl p-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, email, username, or institution..." 
            className="pl-9 h-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="h-11 rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-w-[150px]"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="ALL">All Roles</option>
          <option value="USER">User</option>
          <option value="STAFF">Staff</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select
          className="h-11 rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-w-[150px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Status</option>
          <option value="VERIFIED">Verified</option>
          <option value="UNVERIFIED">Unverified</option>
        </select>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/30 text-muted-foreground uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Institution</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          {user.role === 'ADMIN' ? (
                            <ShieldCheck className="w-5 h-5 text-primary" />
                          ) : (
                            <UserCircle className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.name || 'Unnamed User'}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {user.username || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        user.role === 'ADMIN' ? 'bg-primary/20 text-primary border border-primary/30' :
                        user.role === 'STAFF' ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30' :
                        'bg-secondary text-secondary-foreground border border-border'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.emailVerified ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-500/10 w-fit px-2.5 py-1 rounded-full text-xs font-medium">
                          <MailCheck className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-1.5 text-amber-600 bg-amber-500/10 w-fit px-2.5 py-1 rounded-full text-xs font-medium">
                            <MailWarning className="w-3.5 h-3.5" />
                            <span>Unverified</span>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-[10px] w-fit px-2"
                            onClick={() => handleResend(user.id)}
                            disabled={isPending && resendingForId === user.id}
                          >
                            {isPending && resendingForId === user.id ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <Mail className="w-3 h-3 mr-1" />
                            )}
                            Resend Email
                          </Button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {user.institution || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <EditUserModal user={user} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-muted-foreground">
                    <User className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    <p>No accounts found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between bg-card border rounded-xl p-4 shadow-sm mt-2 gap-4">
          <div className="text-sm text-muted-foreground font-medium">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} accounts
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
  );
}
