

## Plan: Replace HealthScore and remove alert banner on Greining tab

### Changes to `src/pages/Analytics.tsx`

1. **Remove alert banner** (lines 282–308) — the pink/amber banner with "mikilvægar viðvaranir". Delete entirely.

2. **Replace HealthScoreCard** (lines 310–313) — replace the `HealthScoreCard` call with the reused `StatusSummary` component wrapped in a `Card`. Will use the existing `useHealthScore` hook (already imported) to get `healthData`, then pass it to `StatusSummary`.

3. **Add health score hook call** inside the component body (around line 262), adding:
   ```typescript
   const { data: healthData, isLoading: healthLoading } = useHealthScore(associationId);
   ```

4. **Replace lines 310–313** with:
   ```tsx
   {healthData && (
     <Card>
       <CardContent className="pt-5">
         <StatusSummary healthData={healthData} />
       </CardContent>
     </Card>
   )}
   ```

5. **Clean up unused imports** — remove `Bell`, `ArrowRight` if no longer used, and remove `alerts`-related variables (`criticalCount`, `warningCount`) and the `useFinancialAlerts` import if the alert banner was the only consumer. Need to check if alerts are used elsewhere in the file.

Looking at the file: `alerts` is only used for the banner (lines 268–269, 283–306). The `useFinancialAlerts` import and related variables can be removed.

### Files modified
- `src/pages/Analytics.tsx` only

