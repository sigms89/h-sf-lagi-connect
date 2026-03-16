

## Plan: Create "Mín Verkefni" page and add to sidebar

### New files

**1. `src/pages/MinVerkefni.tsx`**

- Fetches user profile (full_name) for greeting
- Fetches tasks from `tasks` table where `association_id` matches user's association AND `status != 'done'` AND (`assigned_to = user.id` OR `assigned_to IS NULL`)
- Uses `useCurrentAssociation` for association_id, `useAuth` for user
- Groups assigned tasks by time:
  - "Í dag / Í gær" — due today or overdue by ≤1 day
  - "Þessi vika" — due within current week (2-6 days out)
  - "Seinna" — due later or no due date
- Unassigned section at bottom: `assigned_to IS NULL`, `visibility='all'`, `status='open'`
- Each section shows count in parentheses, hidden if empty
- Empty state: clipboard icon + "Ekkert á þínum borði 🎉"
- Uses existing `TaskCard` component for rendering each task
- Single query, client-side grouping

**2. `src/App.tsx`** — Add route `/min-verkefni` → `MinVerkefni`

**3. `src/components/AppSidebar.tsx`** — Add nav item with `Star` icon between "Yfirlit" and "Fjármál"

### No database changes needed — all required columns already exist.

