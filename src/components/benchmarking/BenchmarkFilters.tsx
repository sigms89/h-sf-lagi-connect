import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RotateCcw, Users } from 'lucide-react';
import type { BenchmarkFilters as BenchmarkFiltersType } from '@/hooks/useBenchmarking';
import { Skeleton } from '@/components/ui/skeleton';

interface BenchmarkFiltersProps {
  filters: BenchmarkFiltersType;
  comparableCount: number | undefined;
  isLoadingCount: boolean;
  onUpdate: <K extends keyof BenchmarkFiltersType>(key: K, value: BenchmarkFiltersType[K]) => void;
  onReset: () => void;
}

export function BenchmarkFilters({
  filters,
  comparableCount,
  isLoadingCount,
  onUpdate,
  onReset,
}: BenchmarkFiltersProps) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {isLoadingCount ? (
            <Skeleton className="h-4 w-36" />
          ) : (
            <span>
              Samanburður við{' '}
              <span className="font-semibold text-foreground">
                {comparableCount ?? 0}
              </span>{' '}
              húsfélög
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onReset} className="h-7 gap-1.5 text-xs">
          <RotateCcw className="h-3 w-3" />
          Núllstilla
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* City */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Borg</Label>
          <Select
            value={filters.city ?? 'all'}
            onValueChange={(v) => onUpdate('city', v === 'all' ? undefined : v)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Allar borgir</SelectItem>
              <SelectItem value="Reykjavík">Reykjavík</SelectItem>
              <SelectItem value="Kópavogur">Kópavogur</SelectItem>
              <SelectItem value="Hafnarfjörður">Hafnarfjörður</SelectItem>
              <SelectItem value="Akureyri">Akureyri</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Units range */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Fjöldi íbúða:{' '}
            <span className="text-foreground font-semibold">
              {filters.unitCountMin ?? 2} – {filters.unitCountMax ?? 200}
            </span>
          </Label>
          <div className="px-1 pt-2">
            <Slider
              min={2}
              max={200}
              step={1}
              value={[filters.unitCountMin ?? 2, filters.unitCountMax ?? 200]}
              onValueChange={([min, max]) => {
                onUpdate('unitCountMin', min);
                onUpdate('unitCountMax', max);
              }}
              className="w-full"
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>2 íbúðir</span>
            <span>200+ íbúðir</span>
          </div>
        </div>
      </div>
    </div>
  );
}
