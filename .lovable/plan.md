

## Plan: Enhance useAutoTasks with improved logic, new auto-task type, and dedup

### 1. Database migration — add `source` and `related_entity_id` to tasks

Add two nullable columns to the `tasks` table:
- `source text DEFAULT NULL` — values: `'auto'` for system-generated, `NULL` for manual
- `related_entity_id uuid DEFAULT NULL` — links task to a specific entity (e.g. a resident/vendor)

These enable proper dedup: check for existing open task with same `category` + `related_entity_id` instead of brittle title matching.

### 2. Modify: `src/hooks/useAutoTasks.ts`

**Dedup logic**: Query existing open tasks by `category` and optionally `related_entity_id` (not by title). Skip creation if a match exists.

**Vangreiðsla tasks**:
- `visibility: 'board'`
- `category: 'vangreiðsla'`
- Title: `"Senda áminningu til [FirstName] vegna húsgjalds [month]"` — extract first name from `alert.vendor`, month from alert's `createdAt`
- `current_stage: 1, total_stages: 4`
- `source: 'auto', created_by: null`
- `related_entity_id`: derive a deterministic UUID or use a hash — since alerts use payer description as vendor, we'll store a generated ID based on the payer string

**Sjóðsstaða task**:
- `visibility: 'board'`
- `source: 'auto', created_by: null`

**New: Viðhaldskostnaður check**:
- Fetch transactions for last 12 months
- Calculate maintenance expense % of total expenses (using category matching for "Viðhald" category)
- If > 40%, create task: `"Skoða viðhaldskostnað — [X]% af gjöldum"`
- `visibility: 'board', category: 'viðhald', source: 'auto', created_by: null`

### Files summary

| File | Action |
|------|--------|
| Migration | Add `source` and `related_entity_id` columns to `tasks` |
| `src/hooks/useAutoTasks.ts` | Rewrite with new logic, dedup, maintenance check |

No UI changes.

