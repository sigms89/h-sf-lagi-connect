

## Plan: Replace "Þetta þarfnast athygli" with "Verkefni" tasks section

### 1. Create `tasks` database table

New migration:

```sql
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'info', -- 'critical', 'warning', 'info'
  category text, -- 'vangreiðsla', 'sjóðsstaða', etc.
  status text NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'done'
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view tasks" ON public.tasks
  FOR SELECT TO authenticated
  USING (is_association_member(association_id));

CREATE POLICY "Admins can insert tasks" ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (is_association_admin(association_id));

CREATE POLICY "Admins can update tasks" ON public.tasks
  FOR UPDATE TO authenticated
  USING (is_association_admin(association_id));

CREATE POLICY "Admins can delete tasks" ON public.tasks
  FOR DELETE TO authenticated
  USING (is_association_admin(association_id));
```

### 2. Create `src/hooks/useAutoTasks.ts`

- Runs on Dashboard load when `associationId` is available
- Uses `useFinancialAlerts` data to detect conditions:
  - Missing payment alerts (`type === 'missing_payment'`) → create task per payer with priority `critical`, category `vangreiðsla`
  - Low balance alerts (`type === 'low_balance'`) → create task with priority `critical`, category `sjóðsstaða`
- Before inserting, queries existing open tasks and checks if one with the same `title` already exists
- Uses `useMutation` or a `useEffect` to run once

### 3. Create `src/components/dashboard/TasksWidget.tsx`

- Fetches open/in_progress tasks ordered by priority (critical → warning → info), limit 5
- Header: "Verkefni" with count badge showing number of open tasks
- Each task row: colored dot (rose/amber/gray), bold title, truncated description, "Lokið" button
- "Lokið" button calls update to set `status = 'done'` and `completed_at = now()`
- Footer: "Sjá öll verkefni →" placeholder link
- Uses `invalidateQueries` on completion to refresh the list

### 4. Update `src/pages/Dashboard.tsx`

- Remove Section 2 ("Þetta þarfnast athygli") — lines 209–240
- Remove `actionItems` building logic (lines 106–134) and related imports (`useFinancialAlerts`, `AlertCircle`, `AlertTriangle`, `Info`, `ChevronRight`, `iconMap`, `iconColorMap`)
- Remove `actionItems.length === 0` check in hero card (line 190–194 badge)
- Insert `<TasksWidget associationId={association?.id} />` in place of old Section 2
- Call `useAutoTasks(association?.id)` in the component body

### Files
- **New migration:** `tasks` table + RLS
- **New:** `src/hooks/useAutoTasks.ts`
- **New:** `src/components/dashboard/TasksWidget.tsx`
- **Modified:** `src/pages/Dashboard.tsx`

