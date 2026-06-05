// ============================================================
// Húsfélagið.is: YearCategoryOverview
// Flokkasamantekt á Peningar — ein setning + listi flokka.
// Engar gröf, engin ný gögn — nýtir useYearComparison.
// ============================================================

import { Card, CardContent } from "@/components/ui/card";
import { useYearComparison } from "@/hooks/useYearComparison";
import { ArrowUp, ArrowDown } from "lucide-react";

interface Props {
  associationId: string;
}

function formatISK(amount: number) {
  const abs = Math.abs(Math.round(amount));
  return abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " kr.";
}

function buildSentence(data: ReturnType<typeof useYearComparison>["data"]) {
  if (!data) return null;
  // Reglur:
  // 1) <6 mánuðir gagna í fyrra → engin setning
  // 2) >20% óflokkað → engin setning
  // 3) Ein flokkur >15% breyting OG >50.000 kr → setning með %
  // 4) 2+ flokkar hækka → setning án %
  // 5) Annars → "Útgjöld eru svipuð og í fyrra."
  if (data.previousMonthsWithData < 6) return null;
  if (data.currentUnclassifiedPct > 20) return null;

  const eligible = data.categoryComparisons.filter(
    (c) => c.previousYear > 0 && c.currentYear > 0
  );

  // Stærsta einstaka breytingin (upp eða niður)
  const big = eligible.find(
    (c) =>
      c.changePct !== null &&
      Math.abs(c.changePct) >= 15 &&
      Math.abs(c.change) >= 50_000
  );

  if (big && big.changePct !== null) {
    const dir = big.changePct > 0 ? "hærri" : "lægri";
    return `${big.categoryName} er ${Math.abs(big.changePct)}% ${dir} en í fyrra.`;
  }

  const risers = eligible.filter(
    (c) => c.change > 50_000 && (c.changePct ?? 0) > 10
  );
  if (risers.length >= 2) {
    const names = risers.slice(0, 2).map((r) => r.categoryName).join(" og ");
    return `${names} eru hærri en í fyrra.`;
  }

  return "Útgjöld eru svipuð og í fyrra.";
}

export function YearCategoryOverview({ associationId }: Props) {
  const { data, isLoading } = useYearComparison(associationId);

  if (isLoading || !data) return null;
  if (data.currentExpenses === 0) return null;

  const top = data.categoryComparisons.slice(0, 6);
  const restTotal = data.categoryComparisons
    .slice(6)
    .reduce((sum, c) => sum + c.currentYear, 0);

  const sentence = buildSentence(data);

  return (
    <Card>
      <CardContent className="p-5 space-y-5">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground">
            Útgjöld {data.currentYear}
          </p>
          <p className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">
            {formatISK(data.currentExpenses)}
          </p>
          {sentence && (
            <p className="text-[15px] text-muted-foreground leading-snug pt-1">
              {sentence}
            </p>
          )}
        </div>

        <div className="space-y-2 pt-1">
          {top.map((cat) => {
            const showArrow =
              cat.previousYear > 0 &&
              cat.changePct !== null &&
              Math.abs(cat.changePct) >= 15;
            const isUp = (cat.changePct ?? 0) > 0;
            return (
              <div
                key={cat.categoryId}
                className="flex items-center justify-between gap-3 py-1"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: cat.categoryColor }}
                  />
                  <span className="text-[15px] text-foreground truncate">
                    {cat.categoryName}
                  </span>
                  {showArrow && (
                    isUp ? (
                      <ArrowUp className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                    ) : (
                      <ArrowDown className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                    )
                  )}
                </div>
                <span className="text-[15px] text-foreground tabular-nums shrink-0">
                  {formatISK(cat.currentYear)}
                </span>
              </div>
            );
          })}
          {restTotal > 0 && (
            <div className="flex items-center justify-between gap-3 py-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-2 w-2 rounded-full shrink-0 bg-muted-foreground/40" />
                <span className="text-[15px] text-muted-foreground truncate">
                  Annað
                </span>
              </div>
              <span className="text-[15px] text-muted-foreground tabular-nums shrink-0">
                {formatISK(restTotal)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
