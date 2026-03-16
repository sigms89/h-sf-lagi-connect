

## Plan: Redesign TasksWidget on Dashboard

### Approach

Rewrite `src/components/dashboard/TasksWidget.tsx` to replace the old priority-based task list with the new time/status-grouped layout using the existing `TaskCard` component.

### Data Fetching

Single query fetching all tasks for the association (open, waiting, and recently done), plus a separate query for the user's membership role to filter `visibility='board'` tasks.

- Fetch tasks where `association_id` matches AND (`status IN ('open','waiting')` OR (`status='done'` AND `completed_at > now()-14d`))
- Fetch the current user's `role` from `association_members` for the current association
- Join `profiles` on `assigned_to` to get `assignee_name` for TaskCard
- Client-side: filter out `visibility='board'` tasks if user role is `'member'`

### Groups (client-side split)

1. **YFIRFALLIN** (red) — `status='open'` AND `due_date < today`. Always first. Hidden if empty.
2. **OPIN** (teal) — `status='open'` AND (`due_date >= today` OR `due_date IS NULL`), plus `status='waiting'`. Max 5 shown, then "Sjá X fleiri opin verkefni..." link (navigates to `/min-verkefni`).
3. **LOKIÐ NÝLEGA** (green) — `status='done'` AND `completed_at` within last 14 days. Collapsed by default with count, expandable.

### Header

- "Verkefni" bold + count badge (open+overdue count) + `[+ Nýtt verkefni]` button on right
- Button shows toast "Kemur fljótlega" (placeholder)

### Components Used

- `TaskCard` from `src/components/tasks/TaskCard.tsx` — no modifications
- Collapsible from shadcn for "LOKIÐ NÝLEGA" section

### Files Changed

| File | Change |
|------|--------|
| `src/components/dashboard/TasksWidget.tsx` | Full rewrite |

No changes to Dashboard.tsx (it already renders `<TasksWidget associationId={...} />`), MinVerkefni, TaskCard, or TaskDetailPage.

