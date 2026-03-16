

## Plan: Update `tasks` table and create `task_comments` table

### Migration SQL

A single new migration that:

1. **Add CHECK on `status`** — constrain to `('open', 'waiting', 'done')`. Since no CHECK exists yet and no data uses `'in_progress'`, this is straightforward. Will also update any existing `'in_progress'` rows to `'waiting'` just in case.

2. **Add columns to `tasks`**:
   - `created_by uuid` — nullable, FK → `profiles(user_id)`
   - `visibility text NOT NULL DEFAULT 'all'` — with CHECK `('all', 'board')`
   - `current_stage integer` — nullable
   - `total_stages integer` — nullable

3. **Update SELECT RLS on `tasks`** — drop and recreate the "Members can view tasks" policy to filter by visibility: board-only tasks visible only to admins, 'all' tasks visible to all members.

4. **Create `task_comments` table** with columns: `id`, `task_id` (FK → tasks ON DELETE CASCADE), `user_id` (FK → profiles(user_id)), `content` (NOT NULL), `is_system` (default false), `created_at`.

5. **RLS on `task_comments`**:
   - SELECT: members of the task's association can view
   - INSERT: authenticated users who are members can insert (with their own user_id)
   - UPDATE/DELETE: only the comment author

### Files affected
- **New migration SQL** (via migration tool)
- `src/integrations/supabase/types.ts` will auto-regenerate

### No UI changes — database only.

