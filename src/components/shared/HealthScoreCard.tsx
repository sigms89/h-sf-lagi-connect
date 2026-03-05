// ============================================================
// HealthScoreCard.tsx
// Displays the housing association health score.
//
// Variants:
//   "full"    – Large card with SVG progress ring, score, label,
//               and a list of individual factor bars.
//   "compact" – Single inline line: colour dot + score/100 + label.
//               Designed to sit inside a KPI card row on the dashboard.
// ============================================================

import { useHealthScore } from '@/hooks/useHealthScore';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HealthScoreCardProps {
  associationId: string;
  variant?: 'full' | 'compact';
}

// Colours and label text for each score tier
interface ScoreTier {
  label: string;
  color: string;       // Tailwind text/bg utility OR raw hex for SVG
  hex: string;         // Raw hex for the SVG stroke
  dotClass: string;    // Tailwind bg class for the colour dot
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreTier(score: number): ScoreTier {
  if (score >= 75) {
    return {
      label: 'Gott',
      color: 'text-emerald-600',
      hex: '#10b981',
      dotClass: 'bg-emerald-500',
    };
  }
  if (score >= 50) {
    return {
      label: 'Þarfnast athugunar',
      color: 'text-amber-500',
      hex: '#f59e0b',
      dotClass: 'bg-amber-400',
    };
  }
  return {
    label: 'Aðgerða þörf',
    color: 'text-red-500',
    hex: '#ef4444',
    dotClass: 'bg-red-500',
  };
}

// ─── SVG Progress Ring ────────────────────────────────────────────────────────

interface ProgressRingProps {
  score: number;   // 0–100
  size?: number;   // px diameter, default 140
  stroke?: number; // stroke width, default 10
}

function ProgressRing({ score, size = 140, stroke = 10 }: ProgressRingProps) {
  const tier = scoreTier(score);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const center = size / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
    >
      {/* Track */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-muted/30"
      />
      {/* Progress arc */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={tier.hex}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
        // Start at 12 o'clock
        transform={`rotate(-90 ${center} ${center})`}
        style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)' }}
      />
      {/* Score label in the centre */}
      <text
        x={center}
        y={center - 6}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size * 0.22}
        fontWeight="700"
        fill={tier.hex}
      >
        {score}
      </text>
      <text
        x={center}
        y={center + size * 0.15}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size * 0.085}
        fill="currentColor"
        className="text-muted-foreground"
      >
        / 100
      </text>
    </svg>
  );
}

// ─── Factor Bar Row ───────────────────────────────────────────────────────────

interface FactorRowProps {
  label: string;
  score: number; // 0–100
}

function FactorRow({ label, score }: FactorRowProps) {
  const tier = scoreTier(score);
  return (
    <div className="flex items-center gap-3">
      {/* Status dot */}
      <span
        className={cn('h-2 w-2 rounded-full shrink-0', tier.dotClass)}
        aria-hidden="true"
      />
      {/* Label */}
      <span className="flex-1 text-xs text-muted-foreground truncate">
        {label}
      </span>
      {/* Progress bar */}
      <div
        className="w-24 h-1.5 rounded-full bg-muted overflow-hidden"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: tier.hex }}
        />
      </div>
      {/* Score number */}
      <span className={cn('text-xs font-medium w-7 text-right tabular-nums', tier.color)}>
        {score}
      </span>
    </div>
  );
}

// ─── Full Variant ─────────────────────────────────────────────────────────────

function HealthScoreCardFull({ associationId }: { associationId: string }) {
  const { data, isLoading } = useHealthScore(associationId);

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <Skeleton className="h-[140px] w-[140px] rounded-full mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
        <div className="space-y-2 mt-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { score, factors } = data;
  const tier = scoreTier(score);

  return (
    <div className="rounded-xl border bg-card p-6 space-y-5">
      {/* Ring + label */}
      <div className="flex flex-col items-center gap-2">
        <ProgressRing score={score} />
        <span className={cn('text-sm font-semibold', tier.color)}>
          {tier.label}
        </span>
      </div>

      {/* Factors */}
      {factors && factors.length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-border">
          {factors.map((f) => (
            <FactorRow key={f.key} label={f.label} score={f.score} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Compact Variant ──────────────────────────────────────────────────────────

function HealthScoreCardCompact({ associationId }: { associationId: string }) {
  const { data, isLoading } = useHealthScore(associationId);

  if (isLoading) {
    return <Skeleton className="h-5 w-36" />;
  }

  if (!data) return null;

  const { score } = data;
  const tier = scoreTier(score);

  return (
    <div className="inline-flex items-center gap-2">
      {/* Colour indicator dot */}
      <span
        className={cn('h-2.5 w-2.5 rounded-full shrink-0', tier.dotClass)}
        aria-hidden="true"
      />
      {/* Score */}
      <span className={cn('text-sm font-bold tabular-nums', tier.color)}>
        {score}
        <span className="font-normal text-muted-foreground">/100</span>
      </span>
      {/* Label */}
      <span className="text-xs text-muted-foreground">{tier.label}</span>
    </div>
  );
}

// ─── Public Component ─────────────────────────────────────────────────────────

export function HealthScoreCard({
  associationId,
  variant = 'full',
}: HealthScoreCardProps) {
  if (variant === 'compact') {
    return <HealthScoreCardCompact associationId={associationId} />;
  }
  return <HealthScoreCardFull associationId={associationId} />;
}
