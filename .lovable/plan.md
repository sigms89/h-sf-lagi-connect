

## Plan: Add task completion stats line above Verkefni section

### What
Insert a single summary line between the hero card (Section 1) and TasksWidget (Section 2) on the Dashboard page showing:

`✅ [X] verkefni kláruð síðastliðna 30 daga · 📋 [Y] opin verkefni`

### How

**Modify: `src/pages/Dashboard.tsx`**

1. Add a `useQuery` call to fetch two counts from the `tasks` table:
   - `doneCount`: tasks with `status='done'` and `completed_at` within last 30 days, filtered by `association_id`
   - `openCount`: tasks with `status` in `['open', 'in_progress']`, filtered by `association_id`

2. Between line 151 (end of hero Card) and line 153 (TasksWidget), insert a `<p>` element:
   ```tsx
   <p className="text-sm text-zinc-500">
     ✅ {doneCount} verkefni kláruð síðastliðna 30 daga · 📋 {openCount} opin verkefni
   </p>
   ```

3. Only show when `association?.id` exists and data has loaded (not during loading state). Hide if both counts are 0.

### Files

| File | Action |
|------|--------|
| `src/pages/Dashboard.tsx` | Add query + summary line |

No other files modified.

