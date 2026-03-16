// ============================================================
// TaskCard — Compact task card for list views
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, differenceInDays, isPast, isToday, format } from 'date-fns';
import { is } from 'date-fns/locale';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAssignTask, useCompleteTask } from '@/hooks/useTask';

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

export default function TaskCard({ task }: TaskCardProps) {
  const navigate = useNavigate();
  const assignTask = useAssignTask();
  const completeTask = useCompleteTask();
  const [completing, setCompleting] = useState(false);
  const dueDateInfo = getDueDateInfo(task.due_date);
  const isDone = task.status === 'done';

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDone || completing) return;
    setCompleting(true);
    completeTask.mutateAsync(task.id).catch(() => setCompleting(false));
  };

  const handleAssignSelf = (e: React.MouseEvent) => {
    e.stopPropagation();
    assignTask.mutate({ taskId: task.id });
  };

  return (
    <button
      onClick={() => navigate(`/tasks/${task.id}`)}
      className={`flex items-center gap-3 w-full min-h-[64px] px-4 py-3 bg-card rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] text-left hover:shadow-md transition-all cursor-pointer border-0 ${
        completing ? 'opacity-0 translate-y-2 transition-all duration-400' : ''
      }`}
    >
      {/* Completion circle */}
      <span
        role="checkbox"
        aria-checked={isDone}
        onClick={handleComplete}
        className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center border-2 transition-colors ${
          isDone
            ? 'bg-green-500 border-green-500 text-white cursor-default'
            : 'border-zinc-300 hover:border-accent cursor-pointer'
        }`}
      >
        {isDone && <Check className="h-3 w-3" />}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm truncate ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-3 mt-0.5">
          {dueDateInfo && !isDone && (
            <span className={`text-xs ${dueDateInfo.colorClass}`}>{dueDateInfo.label}</span>
          )}
          {task.assigned_to ? (
            <span className="text-xs text-muted-foreground">{task.assignee_name ?? 'Úthlutað'}</span>
          ) : !isDone ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAssignSelf}
              disabled={assignTask.isPending}
              className="h-[44px] px-2 text-xs text-accent hover:text-accent font-medium -my-2"
            >
              Taka að mér
            </Button>
          ) : null}
        </div>
      </div>
    </button>
  );
}
