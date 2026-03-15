// ============================================================
// HealthScoreCard.tsx — Health score display with rounded scores
// ============================================================

import { useHealthScore } from '@/hooks/useHealthScore';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface HealthScoreCardProps {
  associationId: string;
  variant?: 'full' | 'compact';
}

interface ScoreTier {
  label: string;
  color: string;
  hex: string;
  dotClass: string;
}

function scoreTier(score: number): ScoreTier {
  if (score >= 75) {
    return { label: 'Gott', color: 'text-emerald-600', hex: '#10b981', dotClass: 'bg-emerald-500' };
  }
  if (score >= 50) {
    return { label: 'Þarfnast athugunar', color: 'text-amber-500', hex: '#f59e0b', dotClass: 'bg-amber-400' };
  }
  return { label: 'Aðgerða þörf', color: 'text-rose-500', hex: '#e11d48', dotClass: 'bg-rose-500' };
}

// ─── SVG Progress Ring ────────────────────────────────────────────────────────

function ProgressRing({ score, size = 140, stroke = 10 }: { score: number; size?: number; stroke?: number }) {
  const tier = scoreTier(score);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const center = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={center} cy={center} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted/30" />
      <circle cx={center} cy={center} r={radius} fill="none" stroke={tier.hex} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={offset}
        transform={`rotate(-90 ${center} ${center})`}
        style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)' }}
      />
      <text x={center} y={center - 6} textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.22} fontWeight="700" fill={tier.hex}>
        {Math.round(score)}
      </text>
      <text x={center} y={center + size * 0.15} textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.085} fill="currentColor" className="text-muted-foreground">
        / 100
      </text>
    </svg>
  );
}

// ─── Factor Bar Row ───────────────────────────────────────────────────────────

function FactorRow({ label, score }: { label: string; score: number }) {
  const rounded = Math.round(score);
  const tier = scoreTier(rounded);
  return (
    <div className="flex items-center gap-3">
      <span className={cn('h-2 w-2 rounded-full shrink-0', tier.dotClass)} aria-hidden="true" />
      <span className="flex-1 text-xs text-muted-foreground truncate">{label}</span>
      <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden" role="progressbar" aria-valuenow={rounded} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${rounded}%`, backgroundColor: tier.hex }} />
      </div>
      <span className={cn('text-xs font-medium w-7 text-right tabular-nums', tier.color)}>{rounded}</span>
    </div>
  );
}

// ─── Full Variant ─────────────────────────────────────────────────────────────

function HealthScoreCardFull({ associationId }: { associationId: string }) {
  const { data, isLoading } = useHealthScore(associationId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[140px] w-[140px] rounded-full mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
        <div className="space-y-2 mt-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-4 w-full" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { score, factors } = data;
  const tier = scoreTier(score);

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-2">
        <ProgressRing score={score} />
        <span className={cn('text-sm font-semibold', tier.color)}>{tier.label}</span>
      </div>
      {factors && factors.length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-border">
          {factors.map((f) => <FactorRow key={f.key} label={f.label} score={f.score} />)}
        </div>
      )}
    </div>
  );
}

// ─── Compact Variant ──────────────────────────────────────────────────────────

function HealthScoreCardCompact({ associationId }: { associationId: string }) {
  const { data, isLoading } = useHealthScore(associationId);

  if (isLoading) return <Skeleton className="h-5 w-36" />;
  if (!data) return null;

  const { score } = data;
  const tier = scoreTier(score);

  return (
    <div className="inline-flex items-center gap-2">
      <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', tier.dotClass)} aria-hidden="true" />
      <span className={cn('text-sm font-bold tabular-nums', tier.color)}>
        {Math.round(score)}
        <span className="font-normal text-muted-foreground">/100</span>
      </span>
      <span className="text-xs text-muted-foreground">{tier.label}</span>
    </div>
  );
}

// ─── Public Component ─────────────────────────────────────────────────────────

export function HealthScoreCard({ associationId, variant = 'full' }: HealthScoreCardProps) {
  if (variant === 'compact') return <HealthScoreCardCompact associationId={associationId} />;
  return <HealthScoreCardFull associationId={associationId} />;
}
