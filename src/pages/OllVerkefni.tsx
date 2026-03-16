// ============================================================
// Húsfélagið.is — Öll verkefni (All Tasks) page
// Full filterable task list with sorting and count summary
// ============================================================

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentAssociation } from '@/hooks/useAssociation';
import { useAssociationMembers } from '@/hooks/useMembers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { isPast, isToday } from 'date-fns';
import TaskCard, { type TaskCardData } from '@/components/tasks/TaskCard';

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'Allir' },
  { value: 'Fjármál', label: 'Fjármál' },
  { value: 'Viðhald', label: 'Viðhald' },
  { value: 'Fundir', label: 'Fundir' },
  { value: 'Samskipti', label: 'Samskipti' },
  { value: 'Löglegt', label: 'Löglegt' },
  { value: 'Annað', label: 'Annað' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Allar' },
  { value: 'open', label: 'Opin' },
  { value: 'waiting', label: 'Í bið' },
  { value: 'overdue', label: 'Yfirfallin' },
  { value: 'done', label: 'Lokið' },
];

export default function OllVerkefni() {
  const { user } = useAuth();
  const { data: association } = useCurrentAssociation();
  const associationId = association?.id;

  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');

  const { data: members = [] } = useAssociationMembers(associationId);

  // Fetch user's role
  const { data: memberRole } = useQuery({
    queryKey: ['member-role', associationId, user?.id],
    queryFn: async () => {
      if (!associationId || !user?.id) return 'member';
      const { data } = await supabase
        .from('association_members')
        .select('role')
        .eq('association_id', associationId)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      return data?.role ?? 'member';
    },
    enabled: !!associationId && !!user?.id,
  });

  const isBoardMember = memberRole === 'admin' || memberRole === 'board';

  // Fetch all tasks
  const { data: rawTasks = [], isLoading } = useQuery({
    queryKey: ['tasks', 'all', associationId],
    queryFn: async () => {
      if (!associationId) return [];

      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, status, due_date, assigned_to, visibility, completed_at, category')
        .eq('association_id', associationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch assignee names
      const assignedIds = [...new Set((data ?? []).filter(t => t.assigned_to).map(t => t.assigned_to!))];
      let profileMap: Record<string, string> = {};
      if (assignedIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', assignedIds);
        profileMap = Object.fromEntries((profiles ?? []).map(p => [p.user_id, p.full_name ?? 'Úthlutað']));
      }

      return (data ?? []).map(t => ({
        ...t,
        assignee_name: t.assigned_to ? (profileMap[t.assigned_to] ?? null) : null,
      }));
    },
    enabled: !!associationId,
  });

  const isOverdue = (t: { due_date: string | null; status: string }) => {
    if (t.status === 'done' || !t.due_date) return false;
    const dueDate = new Date(t.due_date + 'T00:00:00');
    return isPast(dueDate) && !isToday(dueDate);
  };

  // Filter and sort
  const { filtered, totalVisible } = useMemo(() => {
    // Visibility filter
    let tasks = rawTasks.filter(t => t.visibility !== 'board' || isBoardMember);
    const totalVisible = tasks.length;

    // Category filter
    if (categoryFilter !== 'all') {
      tasks = tasks.filter(t => t.category === categoryFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'overdue') {
        tasks = tasks.filter(t => isOverdue(t));
      } else {
        tasks = tasks.filter(t => t.status === statusFilter);
      }
    }

    // Owner filter
    if (ownerFilter === 'mine') {
      tasks = tasks.filter(t => t.assigned_to === user?.id);
    } else if (ownerFilter === 'unassigned') {
      tasks = tasks.filter(t => !t.assigned_to);
    } else if (ownerFilter !== 'all') {
      tasks = tasks.filter(t => t.assigned_to === ownerFilter);
    }

    // Sort: overdue first, then by due_date asc, no due_date last
    tasks.sort((a, b) => {
      const aOverdue = isOverdue(a);
      const bOverdue = isOverdue(b);
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      // Both have same overdue status — sort by due_date
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
      if (a.due_date && !b.due_date) return -1;
      if (!a.due_date && b.due_date) return 1;
      return 0;
    });

    return { filtered: tasks as TaskCardData[], totalVisible };
  }, [rawTasks, categoryFilter, statusFilter, ownerFilter, isBoardMember, user?.id]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Öll verkefni</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Flokkur" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Staða" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={ownerFilter} onValueChange={setOwnerFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Eigandi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Allir</SelectItem>
            <SelectItem value="mine">Mín</SelectItem>
            <SelectItem value="unassigned">Óúthlutað</SelectItem>
            {members
              .filter(m => m.user_id !== user?.id)
              .map(m => (
                <SelectItem key={m.user_id} value={m.user_id}>
                  {(m as any).profile?.full_name ?? m.user_id.slice(0, 8)}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Task list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 rounded-lg bg-card shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] text-center">
          <p className="text-sm text-muted-foreground">Engin verkefni passa við síu</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(t => <TaskCard key={t.id} task={t} />)}
        </div>
      )}

      {/* Count summary */}
      {!isLoading && (
        <p className="text-xs text-muted-foreground text-center">
          Sýni {filtered.length} af {totalVisible} verkefnum
        </p>
      )}
    </div>
  );
}