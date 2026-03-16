

## Plan: Create AssignTaskModal + enhance assign mutations with system comments

### 1. New file: `src/components/tasks/AssignTaskModal.tsx`

A Dialog-based modal with:
- Title: "Úthluta verkefni"
- Current assignment shown at top: "Núverandi: [name]" or "Óúthlutað"
- Scrollable list of association members, each row showing:
  - Initials circle (first letters of full_name, colored bg)
  - Full name
  - "Stjórn" badge if role is 'admin' or 'board'
- Clicking a row calls the assign mutation and closes modal

**Props**: `open`, `onOpenChange`, `taskId`, `associationId`, `currentAssigneeId`, `currentAssigneeName`

### 2. Modify: `src/hooks/useTask.ts` — enhance `useAssignTask`

Update the mutation to also insert a system comment (`is_system=true`) after updating `assigned_to`:
- If assigning to self: "[Name] tók að sér verkefni"
- If assigning to another: "[CurrentUser] úthlutar verkefni til [TargetName]"

Fetch target user's profile name inside the mutation to build the comment text. Update toast messages:
- Self: "Þú ert nú eigandi þessa verkefnis ✓"
- Other: "Verkefni úthlutað [name]"

Also invalidate `['dashboard-tasks']` query key for Dashboard refresh.

### 3. Modify: `src/pages/TaskDetailPage.tsx`

Replace the inline assign Dialog (lines 244-265) with `<AssignTaskModal>`, passing the required props. Remove the inline `handleAssignMember` function since the modal handles it internally.

### Files summary

| File | Action |
|------|--------|
| `src/components/tasks/AssignTaskModal.tsx` | New |
| `src/hooks/useTask.ts` | Enhance `useAssignTask` with system comments + better toasts |
| `src/pages/TaskDetailPage.tsx` | Replace inline dialog with `AssignTaskModal` |

No changes to TaskCard (it already calls `useAssignTask` which will get the enhanced behavior automatically), CreateTaskModal, or Dashboard layout.

