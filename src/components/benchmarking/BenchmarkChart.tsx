import type { BenchmarkRow } from '@/hooks/useBenchmarking';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  rows: BenchmarkRow[];
  isLoading: boolean;
}

export function BenchmarkChart({ rows, isLoading }: Props) {
  if (isLoading) return <Skeleton className="h-64 w-full rounded-lg" />;
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">Línurit — kemur fljótlega</p>
    </div>
  );
}
