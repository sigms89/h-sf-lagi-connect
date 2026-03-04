import type { BenchmarkFilters as BenchmarkFiltersType } from '@/hooks/useBenchmarking';

interface Props {
  filters: BenchmarkFiltersType;
  comparableCount: number | undefined;
  isLoadingCount: boolean;
  onUpdate: <K extends keyof BenchmarkFiltersType>(key: K, value: BenchmarkFiltersType[K]) => void;
  onReset: () => void;
}

export function BenchmarkFilters({ filters, comparableCount, isLoadingCount, onUpdate, onReset }: Props) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">Síur — kemur fljótlega</p>
      {comparableCount !== undefined && (
        <p className="text-xs text-muted-foreground mt-1">{comparableCount} sambærileg húsfélög</p>
      )}
    </div>
  );
}
