

## Plan: Create "Öll verkefni" page and add to sidebar/routing

### New file: `src/pages/OllVerkefni.tsx`

- Page title "Öll verkefni"
- Filter row with 3 Select dropdowns:
  - **Flokkur**: Allir / Fjármál / Viðhald / Fundir / Samskipti / Löglegt / Annað (filters on `category` column)
  - **Staða**: Allar / Opin / Í bið / Yfirfallin / Lokið (maps to status values + overdue logic)
  - **Eigandi**: Allir / Mín / Óúthlutað + association members from `useAssociationMembers`
- Fetches all tasks for association, applies visibility filtering (hide `visibility='board'` for non-board members)
- Client-side filtering + sorting: overdue first, then by due_date ascending, no-due-date last
- Renders each task with `TaskCard`
- Bottom count: "Sýni X af Y verkefnum"

### Modified files

| File | Change |
|------|--------|
| `src/App.tsx` | Add import + route `/verkefni` |
| `src/components/AppSidebar.tsx` | Add "Öll verkefni" with `ClipboardList` icon after "Mín verkefni" |
| `src/components/dashboard/TasksWidget.tsx` | Change "Sjá X fleiri..." link from `/min-verkefni` to `/verkefni` |

### Sorting logic
```text
1. overdue (due_date < today, status=open) — sorted by due_date asc
2. non-overdue with due_date — sorted by due_date asc
3. no due_date — at bottom
```

No database changes needed.

