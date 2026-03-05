// ============================================================
// TimeRangeSelector.tsx
// Compact pill-button group for selecting time range presets.
// ============================================================

import { useTimeRange, type TimeRangePreset } from '@/hooks/useTimeRange';
import { cn } from '@/lib/utils';

const PRESET_LABELS: Record<Exclude<TimeRangePreset, 'custom'>, string> = {
  '12m': '12 mánuðir',
  '3y': '3 ár',
  all: 'Frá upphafi',
  ytd: 'Þetta ár',
};

const PRESETS: Exclude<TimeRangePreset, 'custom'>[] = ['12m', '3y', 'all', 'ytd'];

export function TimeRangeSelector() {
  const { range, setPreset } = useTimeRange();

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Tímabil val">
      {PRESETS.map((p) => {
        const isActive = range.preset === p;
        return (
          <button
            key={p}
            type="button"
            onClick={() => setPreset(p)}
            className={cn(
              'inline-flex items-center justify-center rounded-full px-3 h-7 text-xs font-medium',
              'transition-colors duration-150 focus-visible:outline-none',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground',
            )}
            aria-pressed={isActive}
          >
            {PRESET_LABELS[p]}
          </button>
        );
      })}
    </div>
  );
}
