// ============================================================
// Húsfélagið.is — AutoClassifyBar
// Banner component showing classification statistics and the
// "Keyra sjálfvirka flokkun" action. Displays progress while
// running and a results summary on completion.
// ============================================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useRunAutoClassify } from '@/hooks/useClassification';
import { useVendorSummary } from '@/hooks/useClassification';

// ============================================================
// PROPS
// ============================================================

export interface AutoClassifyBarProps {
  associationId: string;
}

// ============================================================
// COMPONENT
// ============================================================

export function AutoClassifyBar({ associationId }: AutoClassifyBarProps) {
  const autoClassify = useRunAutoClassify();
  const { data: vendorSummary = [] } = useVendorSummary(associationId);

  // 'uncategorized' | 'all'
  const [scope, setScope] = useState<'uncategorized' | 'all'>('uncategorized');

  // Track last run result for feedback
  const [lastResult, setLastResult] = useState<{
    classified: number;
    skipped: number;
  } | null>(null);

  const isRunning = autoClassify.isPending;

  // Derive counts from vendor summary
  const uncategorizedVendors = vendorSummary.filter((v) => !v.currentCategory);
  const uncategorizedCount = uncategorizedVendors.reduce((sum, v) => sum + v.count, 0);
  const totalTransactions = vendorSummary.reduce((sum, v) => sum + v.count, 0);

  // Vendors that have a different suggested category vs current
  const reclassifiableCount = vendorSummary.filter(
    (v) =>
      v.suggestedCategory &&
      v.suggestedCategory !== 'Óflokkað' &&
      v.currentCategory !== v.suggestedCategory
  ).reduce((sum, v) => sum + v.count, 0);

  const affectedCount = scope === 'uncategorized' ? uncategorizedCount : reclassifiableCount;

  const handleRun = async () => {
    setLastResult(null);
    const result = await autoClassify.mutateAsync({ associationId, scope });
    setLastResult(result);
  };

  // ============================================================
  // RENDER — running state
  // ============================================================
  if (isRunning) {
    return (
      <div className="rounded-lg border border-[#0d9488]/30 bg-teal-50/60 px-4 py-3">
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 text-[#0d9488] animate-spin flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <p className="text-sm font-medium text-[#0d9488]">
              Sjálfvirk flokkun í gangi...
            </p>
            <Progress className="h-1.5" value={undefined} />
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER — completed state
  // ============================================================
  if (lastResult) {
    return (
      <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-teal-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-teal-800">
                Sjálfvirk flokkun lokið
              </p>
              <p className="text-xs text-teal-700 mt-0.5">
                <span className="font-semibold">{lastResult.classified}</span> færslur flokkaðar
                sjálfvirkt
                {lastResult.skipped > 0 && (
                  <>, {lastResult.skipped} óþekktar og óbreyttar</>
                )}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-green-700 hover:text-green-900 hover:bg-green-100 h-8 text-xs"
            onClick={() => setLastResult(null)}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Keyra aftur
          </Button>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER — idle state
  // ============================================================
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        {/* Left: stats */}
        <div className="flex items-center gap-4 flex-wrap">
          {uncategorizedCount > 0 && (
            <div className="flex items-center gap-1.5 text-sm">
              <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
              <span className="text-muted-foreground">Óflokkað:</span>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                {uncategorizedCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} færslur
              </Badge>
            </div>
          )}

          {reclassifiableCount > 0 && scope === 'all' && (
            <div className="flex items-center gap-1.5 text-sm">
              <Sparkles className="h-3.5 w-3.5 text-[#0d9488]" />
              <span className="text-muted-foreground">Mætti endurflokka:</span>
              <Badge
                variant="secondary"
                className="bg-teal-100 text-teal-800 text-xs"
              >
                {reclassifiableCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} færslur
              </Badge>
            </div>
          )}

          {uncategorizedCount === 0 && reclassifiableCount === 0 && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              <span>Allar {totalTransactions.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} færslur eru flokkaðar</span>
            </div>
          )}
        </div>

        {/* Right: scope toggle + run button */}
        <div className="flex items-center gap-2">
          {/* Scope toggle */}
          <div className="flex items-center rounded-md border overflow-hidden text-xs h-8">
            <button
              className={`px-3 h-full transition-colors ${
                scope === 'uncategorized'
                  ? 'bg-[#1e3a5f] text-white font-medium'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
              onClick={() => setScope('uncategorized')}
            >
              Óflokkað
            </button>
            <button
              className={`px-3 h-full border-l transition-colors ${
                scope === 'all'
                  ? 'bg-[#1e3a5f] text-white font-medium'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
              onClick={() => setScope('all')}
            >
              Allt
            </button>
          </div>

          {/* Run button */}
          <Button
            size="sm"
            className="h-8 bg-[#0d9488] hover:bg-[#0d9488]/90 text-white text-xs"
            onClick={handleRun}
            disabled={affectedCount === 0}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Keyra sjálfvirka flokkun
            {affectedCount > 0 && (
              <span className="ml-1.5 opacity-80">
                ({affectedCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')})
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
