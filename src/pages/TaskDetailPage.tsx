// ============================================================
// TaskDetailPage: Full task detail with comments
// ============================================================

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { is } from 'date-fns/locale';
import { ArrowLeft, Calendar, User, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useTask, useCompleteTask, useAssignTask } from '@/hooks/useTask';
import { useTaskComments, useAddComment } from '@/hooks/useTaskComments';
import { useCurrentAssociation } from '@/hooks/useAssociation';
import AssignTaskModal from '@/components/tasks/AssignTaskModal';

function getStatusDot(status: string, dueDateStr: string | null): { color: string; label: string } {
  if (status === 'done') return { color: 'bg-green-500', label: 'Lokið' };
  if (status === 'waiting') return { color: 'bg-[hsl(38,92%,50%)]', label: 'Í bið' };

  // open — check overdue
  if (dueDateStr) {
    const dueDate = new Date(dueDateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dueDate < today) return { color: 'bg-[hsl(347,77%,50%)]', label: 'Yfirfallin' };
  }
  return { color: 'bg-accent', label: 'Opin' };
}

export default function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { data: task, isLoading } = useTask(taskId);
  const { data: comments = [] } = useTaskComments(taskId);
  const { data: association } = useCurrentAssociation();
  // members fetched inside AssignTaskModal
  const completeTask = useCompleteTask();
  const assignTask = useAssignTask();
  const addComment = useAddComment();

  const [commentText, setCommentText] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>Verkefni fannst ekki.</p>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">
          ← Til baka
        </Button>
      </div>
    );
  }

  const statusInfo = getStatusDot(task.status, task.due_date);
  const isDone = task.status === 'done';

  const handleSendComment = () => {
    if (!commentText.trim() || !taskId) return;
    addComment.mutate({ taskId, content: commentText.trim() });
    setCommentText('');
  };


  return (
    <div className="max-w-2xl mx-auto pb-24">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="mb-4 -ml-2 text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Til baka
      </Button>

      {/* Status + Title */}
      <div className="flex items-start gap-3 mb-2">
        <span className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${statusInfo.color}`} />
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {task.title}
        </h1>
      </div>

      {/* Updated at */}
      {task.updated_at && (
        <p className="text-xs text-muted-foreground ml-6 mb-4">
          Uppfært {formatDistanceToNow(new Date(task.updated_at), { locale: is, addSuffix: true })}
        </p>
      )}

      {/* Due date row */}
      {task.due_date && (
        <div className="flex items-center gap-2 ml-6 mb-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{format(new Date(task.due_date + 'T00:00:00'), 'd. MMMM yyyy', { locale: is })}</span>
        </div>
      )}

      {/* Assignee row */}
      <div className="flex items-center gap-2 ml-6 mb-4 text-sm">
        <User className="h-4 w-4 text-muted-foreground" />
        {task.assigned_to ? (
          <div className="flex items-center gap-2">
            <span className="text-foreground">{task.assignee_name ?? 'Úthlutað'}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAssignModalOpen(true)}
              className="text-xs text-accent h-7"
            >
              Úthluta öðrum
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Óúthlutað</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => assignTask.mutate({ taskId: task.id })}
              disabled={assignTask.isPending}
              className="text-xs text-accent h-[44px]"
            >
              Taka að mér
            </Button>
          </div>
        )}
      </div>

      {/* Description */}
      {task.description && (
        <p className="ml-6 mb-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
          {task.description}
        </p>
      )}

      {/* Stage progress */}
      {task.total_stages && task.current_stage != null && (
        <div className="ml-6 mb-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            Skref {task.current_stage} af {task.total_stages}
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: `${(task.current_stage / task.total_stages) * 100}%` }}
            />
          </div>
        </div>
      )}

      <Separator className="my-6" />

      {/* Comments section */}
      <h2 className="text-base font-semibold text-foreground mb-4">Athugasemdir</h2>

      {comments.length === 0 && (
        <p className="text-sm text-muted-foreground mb-4">Engar athugasemdir enn.</p>
      )}

      <div className="space-y-3 mb-6">
        {comments.map((comment) => (
          <div key={comment.id}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-medium ${comment.is_system ? 'text-muted-foreground' : 'text-foreground'}`}>
                {comment.author_name ?? 'Óþekktur'}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { locale: is, addSuffix: true })}
              </span>
            </div>
            {comment.is_system ? (
              <p className="text-sm italic text-zinc-400 ml-0.5">
                {comment.content}
              </p>
            ) : (
              <div className="text-sm rounded-lg px-3 py-2 bg-secondary text-foreground">
                {comment.content}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Comment input */}
      <div className="flex items-center gap-2">
        <Input
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Skrifa athugasemd..."
          onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
          className="flex-1"
        />
        <Button
          size="icon"
          onClick={handleSendComment}
          disabled={!commentText.trim() || addComment.isPending}
          className="bg-accent hover:bg-accent/90 text-accent-foreground h-10 w-10"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Fixed bottom action button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <div className="max-w-2xl mx-auto">
          {isDone ? (
            <Button disabled className="w-full h-12 bg-secondary text-muted-foreground">
              Lokið ✓
            </Button>
          ) : (
            <Button
              onClick={() => completeTask.mutateAsync(task.id).then(() => navigate(-1))}
              disabled={completeTask.isPending}
              className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-medium"
            >
              ✓ Merkja sem lokið
            </Button>
          )}
        </div>
      </div>

      {/* Member assign modal */}
      <AssignTaskModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        taskId={task.id}
        associationId={association?.id}
        currentAssigneeId={task.assigned_to}
        currentAssigneeName={task.assignee_name}
      />
    </div>
  );
}
