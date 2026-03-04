// ============================================================
// Húsfélagið.is — BenchmarkFilters
// Filter bar for the benchmarking page
// ============================================================

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RotateCcw, Users } from 'lucide-react';
import type { BenchmarkFilters } from '@/hooks/useBenchmarking';
import { Skeleton } from '@/components/ui/skeleton';

interface BenchmarkFiltersProps {
  filters: BenchmarkFilters;
  comparableCount: number | undefined;
  isLoadingCount: boolean;
  onUpdate: <K extends keyof BenchmarkFilters>(key: K, value: BenchmarkFilters[K]) => void;
  onReset: () => void;
}

const POSTAL_AREAS = [
  { value: 'all', label: 'Allt landið' },
  { value: '1', label: 'Höfuðborgarsvæði (100–199)' },
  { value: '2', label: 'Suðurnes (200–299)' },
  { value: '3', label: 'Vesturland (300–399)' },
  { value: '4', label: 'Vestfirðir (400–499)' },
  { value: '5', label: 'Norðurland vestra (500–599)' },
  { value: '6', label: 'Norðurland eystra (600–699)' },
  { value: '7', label: 'Austurland (700–799)' },
  { value: '8', label: 'Suðurland (800–899)' },
  { value: '9', label: 'Suðurland / Ísafjarðarbær (900–999)' },
];

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Building type */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Tegund húss</Label>
          <Select
            value={filters.buildingType}
            onValueChange={(v) =>
              onUpdate('buildingType', v as BenchmarkFilters['buildingType'])
            }
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Allar tegundir</SelectItem>
              <SelectItem value="fjolbyli">Fjölbýlishús</SelectItem>
              <SelectItem value="radhus">Raðhús</SelectItem>
              <SelectItem value="parhus">Parhús</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Area */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Svæði</Label>
          <Select
            value={filters.postalPrefix}
            onValueChange={(v) => onUpdate('postalPrefix', v)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {POSTAL_AREAS.map((area) => (
                <SelectItem key={area.value} value={area.value}>
                  {area.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Units range */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Fjöldi íbúða:{' '}
            <span className="text-foreground font-semibold">
              {filters.minUnits} – {filters.maxUnits}
            </span>
          </Label>
          <div className="px-1 pt-2">
            <Slider
              min={2}
              max={200}
              step={1}
              value={[filters.minUnits, filters.maxUnits]}
              onValueChange={([min, max]) => {
                onUpdate('minUnits', min);
                onUpdate('maxUnits', max);
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
