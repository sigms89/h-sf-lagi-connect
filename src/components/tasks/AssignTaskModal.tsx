// ============================================================
// AssignTaskModal: Member selection modal for task assignment
// ============================================================

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAssociationMembers } from '@/hooks/useMembers';
import { useAssignTask } from '@/hooks/useTask';

interface AssignTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  associationId: string | undefined;
  currentAssigneeId: string | null;
  currentAssigneeName: string | null;
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const INITIALS_COLORS = [
  'bg-accent text-accent-foreground',
  'bg-[hsl(347,77%,50%)] text-white',
  'bg-[hsl(38,92%,50%)] text-white',
  'bg-[hsl(220,70%,50%)] text-white',
  'bg-[hsl(280,60%,50%)] text-white',
  'bg-[hsl(160,60%,40%)] text-white',
];

function getInitialsColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return INITIALS_COLORS[Math.abs(hash) % INITIALS_COLORS.length];
}

export default function AssignTaskModal({
  open,
  onOpenChange,
  taskId,
  associationId,
  currentAssigneeId,
  currentAssigneeName,
}: AssignTaskModalProps) {
  const { data: members = [] } = useAssociationMembers(associationId);
  const assignTask = useAssignTask();

  const handleSelect = (userId: string) => {
    assignTask.mutate({ taskId, userId });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Úthluta verkefni</DialogTitle>
        </DialogHeader>

        {/* Current assignment */}
        <p className="text-sm text-muted-foreground mb-2">
          {currentAssigneeId
            ? `Núverandi: ${currentAssigneeName ?? 'Óþekktur'}`
            : 'Óúthlutað'}
        </p>

        {/* Member list */}
        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          {members.map((member: any) => {
            const name = member.profile?.full_name ?? null;
            const isBoard = member.role === 'admin' || member.role === 'board';
            const isCurrent = member.user_id === currentAssigneeId;

            return (
              <button
                key={member.id}
                onClick={() => handleSelect(member.user_id)}
                disabled={isCurrent || assignTask.isPending}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left text-sm transition-colors ${
                  isCurrent
                    ? 'bg-secondary text-muted-foreground cursor-default'
                    : 'hover:bg-secondary text-foreground'
                }`}
              >
                {/* Initials circle */}
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${getInitialsColor(member.user_id)}`}
                >
                  {getInitials(name)}
                </span>

                {/* Name + badge */}
                <span className="flex-1 truncate">{name ?? member.user_id}</span>

                {isBoard && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 shrink-0">
                    Stjórn
                  </Badge>
                )}

                {isCurrent && (
                  <span className="text-xs text-muted-foreground shrink-0">✓</span>
                )}
              </button>
            );
          })}
          {members.length === 0 && (
            <p className="text-sm text-muted-foreground p-3">Engir meðlimir fundust.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
