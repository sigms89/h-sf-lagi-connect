// ============================================================
// TaskCard — Compact task card for list views
// ============================================================

import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, differenceInDays, isPast, isToday, format } from 'date-fns';
import { is } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useAssignTask } from '@/hooks/useTask';

export interface TaskCardData {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  assigned_to: string | null;
  assignee_name: string | null;
}

interface TaskCardProps {
  task: TaskCardData;
}

function getDueDateInfo(dueDateStr: string | null): { label: string; colorClass: string } | null {
  if (!dueDateStr) return null;

  const dueDate = new Date(dueDateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isPast(dueDate) && !isToday(dueDate)) {
    const label = formatDistanceToNow(dueDate, { locale: is, addSuffix: true });
    return { label, colorClass: 'text-[hsl(347,77%,50%)]' };
  }
  if (isToday(dueDate)) {
    return { label: 'Í dag', colorClass: 'text-[hsl(347,77%,50%)]' };
  }

  const days = differenceInDays(dueDate, today);

  if (days <= 6) {
    return { label: format(dueDate, 'd. MMM', { locale: is }), colorClass: 'text-[hsl(38,92%,50%)]' };
  }
  if (days <= 14) {
    return { label: format(dueDate, 'd. MMM', { locale: is }), colorClass: 'text-accent' };
  }
  return { label: format(dueDate, 'd. MMM', { locale: is }), colorClass: 'text-muted-foreground' };
}

function getStatusDotColor(status: string, dueDateStr: string | null): string {
  if (status === 'done') return 'bg-green-500';
  if (status === 'waiting') return 'bg-[hsl(38,92%,50%)]';

  // open — check overdue
  if (dueDateStr) {
    const dueDate = new Date(dueDateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isPast(dueDate) && !isToday(dueDate)) return 'bg-[hsl(347,77%,50%)]';
  }

  return 'bg-accent';
}

export default function TaskCard({ task }: TaskCardProps) {
  const navigate = useNavigate();
  const assignTask = useAssignTask();
  const dueDateInfo = getDueDateInfo(task.due_date);
  const dotColor = getStatusDotColor(task.status, task.due_date);

  const handleAssignSelf = (e: React.MouseEvent) => {
    e.stopPropagation();
    assignTask.mutate({ taskId: task.id });
  };

  return (
    <button
      onClick={() => navigate(`/tasks/${task.id}`)}
      className="flex items-center gap-3 w-full min-h-[64px] px-4 py-3 bg-card rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] text-left hover:shadow-md transition-shadow cursor-pointer border-0"
    >
      {/* Status dot */}
      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground truncate">{task.title}</p>
        <div className="flex items-center gap-3 mt-0.5">
          {dueDateInfo && (
            <span className={`text-xs ${dueDateInfo.colorClass}`}>{dueDateInfo.label}</span>
          )}
          {task.assigned_to ? (
            <span className="text-xs text-muted-foreground">{task.assignee_name ?? 'Úthlutað'}</span>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAssignSelf}
              disabled={assignTask.isPending}
              className="h-[44px] px-2 text-xs text-accent hover:text-accent font-medium -my-2"
            >
              Taka að mér
            </Button>
          )}
        </div>
      </div>
    </button>
  );
}
