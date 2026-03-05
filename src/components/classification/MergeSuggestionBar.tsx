// ============================================================
// MergeSuggestionBar.tsx
// Collapsible amber alert bar for duplicate vendor suggestions.
// ============================================================

import { useState } from 'react';
import { toast } from 'sonner';
import { GitMerge, ChevronDown, ChevronUp, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatIskAmount } from '@/lib/categories';
import { useVendorDedup, type DedupSuggestion } from '@/hooks/useVendorDedup';
import { cn } from '@/lib/utils';

export interface MergeSuggestionBarProps {
  associationId: string;
}

export function MergeSuggestionBar({ associationId }: MergeSuggestionBarProps) {
  const { data: suggestions, mergeVendors, dismissSuggestion, isLoading } =
    useVendorDedup(associationId);

  const [open, setOpen] = useState(true);
  const [merging, setMerging] = useState<string | null>(null);

  if (isLoading || !suggestions || suggestions.length === 0) {
    return null;
  }

  const count = suggestions.length;

  async function handleMerge(suggestionId: string, keepName: string, removeName: string) {
    setMerging(suggestionId);
    try {
      await mergeVendors(keepName, removeName);
      toast.success('Sameinað!');
    } catch {
      toast.error('Villa við sameiningu. Reyndu aftur.');
    } finally {
      setMerging(null);
    }
  }

  async function handleDismiss(suggestionId: string) {
    try {
      dismissSuggestion(suggestionId);
    } catch {
      toast.error('Villa. Reyndu aftur.');
    }
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-amber-200 bg-amber-50',
        'text-amber-900 overflow-hidden',
      )}
      role="region"
      aria-label="Tvítekningar uppástungur"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3',
          'hover:bg-amber-100/60 transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
        )}
        aria-expanded={open}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-200/80 shrink-0">
          <GitMerge className="h-4 w-4 text-amber-700" aria-hidden="true" />
        </span>
        <span className="flex-1 text-left text-sm font-semibold text-amber-800">
          {count === 1
            ? '1 hugsanleg tvítekening fundist'
            : `${count} hugsanlegar tvítekningar fundust`}
        </span>
        <Badge className="bg-amber-200 text-amber-800 border-amber-300 hover:bg-amber-200 text-xs tabular-nums">
          {count}
        </Badge>
        <span className="text-amber-600" aria-hidden="true">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {open && (
        <div className="border-t border-amber-200">
          {suggestions.map((s, idx) => {
            const keepName = s.countA >= s.countB ? s.vendorA : s.vendorB;
            const dropName = keepName === s.vendorA ? s.vendorB : s.vendorA;
            const isMerging = merging === s.id;

            return (
              <div
                key={s.id}
                className={cn(
                  'flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3',
                  idx < suggestions.length - 1 && 'border-b border-amber-100',
                )}
              >
                <VendorChip name={s.vendorA} count={s.countA} total={s.totalA} />
                <ArrowLeftRight className="h-4 w-4 text-amber-500 shrink-0 self-center" aria-hidden="true" />
                <VendorChip name={s.vendorB} count={s.countB} total={s.totalB} />

                <div className="flex items-center gap-2 sm:ml-auto shrink-0">
                  <Button
                    size="sm"
                    className="h-7 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white border-0"
                    disabled={isMerging}
                    onClick={() => handleMerge(s.id, keepName, dropName)}
                  >
                    {isMerging ? 'Sameinar…' : 'Sameina'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-3 text-xs text-amber-700 hover:bg-amber-100 hover:text-amber-900"
                    disabled={isMerging}
                    onClick={() => handleDismiss(s.id)}
                  >
                    Ekki sami
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function VendorChip({ name, count, total }: { name: string; count: number; total: number }) {
  return (
    <div className="flex flex-col min-w-0">
      <span className="text-sm font-semibold text-amber-900 truncate">{name}</span>
      <span className="text-xs text-amber-700 tabular-nums">
        {count} færslur · {formatIskAmount(total)}
      </span>
    </div>
  );
}
