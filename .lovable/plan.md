

## Plan: Create "Nýtt verkefni" modal and wire it to Dashboard

### New file: `src/components/tasks/CreateTaskModal.tsx`

A Dialog-based modal with:

- **Title input**: Large text input, autofocus, placeholder "Byrjaðu á sögninni — Laga, Senda, Hringja í...". Only required field. Inline error "Titill vantar" if empty on submit.
- **Description textarea**: Labeled "(valfrjálst)", collapsed by default on mobile (use a disclosure toggle on small screens, always visible on desktop).
- **Two side-by-side fields**:
  - Member dropdown via `useAssociationMembers(associationId)` — default "Óúthlutað", lists members by `profile.full_name`
  - Date picker using shadcn Popover+Calendar pattern (with `pointer-events-auto`)
- **Submit button**: "Bæta við verkefni", teal bg, full width

**Props**: `open: boolean`, `onOpenChange: (open: boolean) => void`, `associationId: string`

**On submit**: Insert into `tasks` via `supabase.from('tasks').insert(...)` with `title, description, assigned_to, due_date, association_id, created_by (auth.uid()), status='open', visibility='all'`. Uses `useMutation` + invalidates `['dashboard-tasks']` query key. Shows toast "Verkefni bætt við ✓" and closes modal.

### Modified file: `src/components/dashboard/TasksWidget.tsx`

- Import `CreateTaskModal` and add state `const [createOpen, setCreateOpen] = useState(false)`
- Replace the placeholder toast `onClick` on the "+ Nýtt verkefni" button with `() => setCreateOpen(true)`
- Render `<CreateTaskModal open={createOpen} onOpenChange={setCreateOpen} associationId={associationId!} />` inside the component

### Files summary

| File | Action |
|------|--------|
| `src/components/tasks/CreateTaskModal.tsx` | New |
| `src/components/dashboard/TasksWidget.tsx` | Minor edit (wire button + render modal) |

No database changes needed. No other files modified.

