import type { BenchmarkRow } from '@/hooks/useBenchmarking';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  rows: BenchmarkRow[];
  isLoading: boolean;
  associationId: string | undefined;
}

export function BenchmarkTable({ rows, isLoading }: Props) {
  if (isLoading) return <Skeleton className="h-48 w-full rounded-lg" />;
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">Tafla — kemur fljótlega</p>
    </div>
  );
}
