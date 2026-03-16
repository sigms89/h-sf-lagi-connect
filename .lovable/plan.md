

## Plan: Wire up "Merkja sem lokið" + comment styling

### 1. Modify: `src/hooks/useTask.ts` — enhance `useCompleteTask`

Update the mutation to also insert a system comment and return navigation signal:
- Fetch current user's profile name
- Insert system comment: "[Name] kláraði verkefni" (`is_system: true`)
- Update toast to "Verkefni klárað ✓"
- Invalidate `dashboard-tasks` and `task-comments` query keys too

### 2. Modify: `src/pages/TaskDetailPage.tsx`

**Complete button**: After `completeTask.mutate()` succeeds, navigate back. Use `onSuccess` callback or `mutateAsync` + `navigate(-1)`.

**Comments styling**: Update the comments rendering (lines 173-192):
- System comments (`is_system=true`): italic text, `text-zinc-400`, NO background box (no `bg-secondary`, no `px/py`)
- Human comments: keep `bg-secondary` rounded box with normal text

### 3. Modify: `src/components/tasks/TaskCard.tsx`

Replace the status dot with a clickable completion circle:
- Add a `useCompleteTask` hook call
- Render a circle/checkbox button on the left that stops propagation and calls `completeTask.mutate(task.id)`
- For `status='done'` tasks: show a filled green check circle (non-clickable)
- For open tasks: show an empty circle border that becomes a checkmark on click
- Add a `completing` state + CSS animation (opacity fade-out over ~400ms) before the card disappears
- Keep the rest of the card clickable for navigation

### Files summary

| File | Action |
|------|--------|
| `src/hooks/useTask.ts` | Enhance `useCompleteTask` with system comment |
| `src/pages/TaskDetailPage.tsx` | Navigate back on complete + style system comments |
| `src/components/tasks/TaskCard.tsx` | Add completion circle + fade-out animation |

No database changes needed.

