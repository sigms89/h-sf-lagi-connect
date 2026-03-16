import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RotateCcw, Users } from 'lucide-react';
import type { BenchmarkFilters as BenchmarkFiltersType } from '@/hooks/useBenchmarking';
import { getLocalRegionLabel, getRegionGroupLabel } from '@/hooks/useBenchmarking';
import { Skeleton } from '@/components/ui/skeleton';

interface BenchmarkFiltersProps {
  filters: BenchmarkFiltersType;
  comparableCount: number | undefined;
  isLoadingCount: boolean;
  postalCode?: string | null;
  onUpdate: <K extends keyof BenchmarkFiltersType>(key: K, value: BenchmarkFiltersType[K]) => void;
  onReset: () => void;
}

export function BenchmarkFilters({
  filters,
  comparableCount,
  isLoadingCount,
  postalCode,
  onUpdate,
  onReset,
}: BenchmarkFiltersProps) {
  const localLabel = getLocalRegionLabel(postalCode);
  const groupLabel = getRegionGroupLabel(postalCode);

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
          <Label className="text-xs font-medium text-muted-foreground">Tegund</Label>
          <Select
            value={filters.buildingType}
            onValueChange={(v) => onUpdate('buildingType', v as BenchmarkFiltersType['buildingType'])}
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

        {/* Region — three tiers */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Svæði</Label>
          <Select
            value={filters.region}
            onValueChange={(v) => onUpdate('region', v as BenchmarkFiltersType['region'])}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="local">{localLabel}</SelectItem>
              <SelectItem value="capital_vs_rural">{groupLabel}</SelectItem>
              <SelectItem value="all">Allt landið</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Units range */}
        <div className="space-y-1.5">
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

        {/* Building year range */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Byggingarár:{' '}
            <span className="text-foreground font-semibold">
              {filters.buildingYearFrom} – {filters.buildingYearTo}
            </span>
          </Label>
          <div className="px-1 pt-2">
            <Slider
              min={1900}
              max={new Date().getFullYear()}
              step={1}
              value={[filters.buildingYearFrom, filters.buildingYearTo]}
              onValueChange={([from, to]) => {
                onUpdate('buildingYearFrom', from);
                onUpdate('buildingYearTo', to);
              }}
              className="w-full"
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>1900</span>
            <span>{new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
