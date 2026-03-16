// ============================================================
// Húsfélagið.is — CreateTaskModal
// Modal for creating a new task from the Dashboard
// ============================================================

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { is } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAssociationMembers } from '@/hooks/useMembers';
import { cn } from '@/lib/utils';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  associationId: string;
}

export function CreateTaskModal({ open, onOpenChange, associationId }: CreateTaskModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: members = [] } = useAssociationMembers(associationId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('unassigned');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [titleError, setTitleError] = useState(false);
  const [descOpen, setDescOpen] = useState(false);

  const reset = () => {
    setTitle('');
    setDescription('');
    setAssignedTo('unassigned');
    setDueDate(undefined);
    setTitleError(false);
    setDescOpen(false);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Ekki innskráð/ur');

      const { error } = await supabase.from('tasks').insert({
        title: title.trim(),
        description: description.trim() || null,
        assigned_to: assignedTo === 'unassigned' ? null : assignedTo,
        due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
        association_id: associationId,
        created_by: user.id,
        status: 'open',
        visibility: 'all',
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Verkefni bætt við ✓');
      queryClient.invalidateQueries({ queryKey: ['dashboard-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      reset();
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error(`Villa: ${err.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError(true);
      return;
    }
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Nýtt verkefni</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Title — required */}
          <div className="space-y-1.5">
            <Input
              autoFocus
              value={title}
              onChange={(e) => { setTitle(e.target.value); setTitleError(false); }}
              placeholder="Byrjaðu á sögninni — Laga, Senda, Hringja í..."
              className={cn('text-base h-11', titleError && 'border-destructive')}
            />
            {titleError && (
              <p className="text-xs text-destructive font-medium">Titill vantar</p>
            )}
          </div>

          {/* Description — collapsible on mobile, visible on desktop */}
          <div className="hidden md:block space-y-1.5">
            <Label className="text-sm text-muted-foreground">Lýsing <span className="font-normal">(valfrjálst)</span></Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="md:hidden">
            <Collapsible open={descOpen} onOpenChange={setDescOpen}>
              <CollapsibleTrigger asChild>
                <button type="button" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {descOpen ? '▾' : '▸'} Lýsing (valfrjálst)
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1.5">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Assignee + Due date side by side */}
          <div className="grid grid-cols-2 gap-3">
            {/* Assignee */}
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Hverjum?</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Óúthlutað" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Óúthlutað</SelectItem>
                  {members.map((m: any) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.profile?.full_name || 'Nafnlaus'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due date */}
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Gjalddagi</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dueDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'd. MMM yyyy', { locale: is }) : 'Veldu dagsetningu'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    className={cn('p-3 pointer-events-auto')}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-secondary hover:bg-secondary/90 text-white"
          >
            {mutation.isPending ? 'Vistar...' : 'Bæta við verkefni'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
