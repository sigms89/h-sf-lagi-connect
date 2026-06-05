// ============================================================
// Húsfélagið.is: MonthlyCategoryList
// Síðasti mánuður: 5-7 stærstu flokkar + ⬆/⬇ miðað við
// meðaltal síðustu 3 mánaða. Engin gröf.
// ============================================================

import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/supabase/db";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { peningarInsight, type MonthlyCategorySnapshot } from "@/lib/insights";
import { format, startOfMonth, subMonths } from "date-fns";

interface Props {
  associationId: string;
}

interface CategoryRow {
  id: string;
  name: string;
  color: string;
  current: number;
  avg3: number;
}

function formatISK(amount: number) {
  const abs = Math.abs(Math.round(amount));
  return abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " kr.";
}

export function MonthlyCategoryList({ associationId }: Props) {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["monthly-categories", associationId],
    queryFn: async () => {
      const now = new Date();
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const thisMonthStart = startOfMonth(now);
      const fourMonthsAgoStart = startOfMonth(subMonths(now, 4));

      const { data: txs, error } = await db
        .from("transactions")
        .select("amount, is_income, category_id, date, category:categories(id, name_is, color)")
        .eq("association_id", associationId)
        .gte("date", format(fourMonthsAgoStart, "yyyy-MM-dd"))
        .lt("date", format(thisMonthStart, "yyyy-MM-dd"))
        .limit(10000);

      if (error) throw error;

      type Row = {
        amount: number;
        is_income: boolean;
        category_id: string | null;
        date: string;
        category: { id: string; name_is: string; color: string | null } | null;
      };
      const rows = (txs ?? []) as Row[];

      const lastMonthKey = format(lastMonthStart, "yyyy-MM");

      // Aggregate per-month per-category for expenses only
      type AggVal = { name: string; color: string; total: number };
      const perMonth: Map<string, Map<string, AggVal>> = new Map();
      const monthsSeen = new Set<string>();
      let lastMonthIncome = 0;
      let lastMonthExpenses = 0;

      for (const r of rows) {
        const mKey = r.date.slice(0, 7);
        monthsSeen.add(mKey);
        if (r.is_income) {
          if (mKey === lastMonthKey) lastMonthIncome += Math.abs(r.amount);
          continue;
        }
        if (!r.category_id || !r.category) continue;
        if (mKey === lastMonthKey) lastMonthExpenses += Math.abs(r.amount);

        if (!perMonth.has(mKey)) perMonth.set(mKey, new Map());
        const monthMap = perMonth.get(mKey)!;
        const e = monthMap.get(r.category_id) ?? {
          name: r.category.name_is,
          color: r.category.color ?? "#003345",
          total: 0,
        };
        e.total += Math.abs(r.amount);
        monthMap.set(r.category_id, e);
      }

      // Last 3 months excluding lastMonthKey for baseline avg
      const baselineKeys = Array.from(monthsSeen)
        .filter((k) => k < lastMonthKey)
        .sort()
        .slice(-3);

      const allCatIds = new Set<string>();
      perMonth.forEach((m) => m.forEach((_v, k) => allCatIds.add(k)));

      const categories: CategoryRow[] = [];
      for (const catId of allCatIds) {
        const curMap = perMonth.get(lastMonthKey)?.get(catId);
        const current = curMap?.total ?? 0;
        let baseSum = 0;
        let baseCount = 0;
        for (const bk of baselineKeys) {
          const v = perMonth.get(bk)?.get(catId);
          if (v) {
            baseSum += v.total;
            baseCount += 1;
          }
        }
        const avg3 = baseCount > 0 ? baseSum / baselineKeys.length : 0;
        const name =
          curMap?.name ??
          baselineKeys.map((bk) => perMonth.get(bk)?.get(catId)?.name).find(Boolean) ??
          "Óþekkt";
        const color =
          curMap?.color ??
          baselineKeys.map((bk) => perMonth.get(bk)?.get(catId)?.color).find(Boolean) ??
          "#003345";
        if (current > 0) {
          categories.push({ id: catId, name, color, current, avg3 });
        }
      }

      categories.sort((a, b) => b.current - a.current);

      return {
        categories: categories.slice(0, 7),
        lastMonthIncome,
        lastMonthExpenses,
        monthsAvailable: monthsSeen.size,
      };
    },
    enabled: !!associationId,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading || !data) return null;

  const snapshots: MonthlyCategorySnapshot[] = data.categories.map((c) => ({
    name: c.name,
    current: c.current,
    avg3: c.avg3,
  }));

  const sentence = peningarInsight({
    categories: snapshots,
    lastMonthIncome: data.lastMonthIncome,
    lastMonthExpenses: data.lastMonthExpenses,
    monthsAvailable: data.monthsAvailable,
  });

  return (
    <Card>
      <CardContent className="p-5 space-y-5">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground">
            Síðasti mánuður
          </p>
          {sentence && (
            <p className="text-[15px] text-foreground leading-snug pt-1">
              {sentence}
            </p>
          )}
        </div>

        {data.categories.length > 0 && (
          <div className="space-y-1">
            {data.categories.map((cat) => {
              const showArrow =
                cat.avg3 > 0 &&
                Math.abs(cat.current - cat.avg3) >= 20_000 &&
                Math.abs((cat.current - cat.avg3) / cat.avg3) >= 0.2;
              const isUp = cat.current > cat.avg3;
              const pct = cat.avg3 > 0
                ? Math.round(((cat.current - cat.avg3) / cat.avg3) * 100)
                : 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/peningar?category=${cat.id}`)}
                  className="w-full flex items-center justify-between gap-3 py-2 px-2 -mx-2 rounded-md hover:bg-muted/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-[15px] text-foreground truncate">
                      {cat.name}
                    </span>
                    {showArrow && (
                      <span className={`inline-flex items-center gap-0.5 text-[12px] tabular-nums shrink-0 ${isUp ? "text-rose-600" : "text-teal-600"}`}>
                        {isUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        {Math.abs(pct)}%
                      </span>
                    )}
                  </div>
                  <span className="text-[15px] text-foreground tabular-nums shrink-0">
                    {formatISK(cat.current)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
