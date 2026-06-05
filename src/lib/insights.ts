// ============================================================
// Húsfélagið.is: Insights — hreinar fallar sem mynda íslenskar
// "hvað þýðir þetta" setningar úr gögnum sem þegar eru sótt.
// Engin ný gögn, engar nýjar fyrirspurnir.
// ============================================================

import type { MonthlyData } from "@/types/database";

function formatISK(amount: number): string {
  const abs = Math.abs(Math.round(amount));
  return abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " kr.";
}

/**
 * "Þetta dugar fyrir um X mánaða venjulegan rekstur."
 * Krefst: ≥3 mánaða af útgjöldum OG balance > 0.
 */
export function monthsOfOperation(
  balance: number | null,
  monthly: MonthlyData[]
): string | null {
  if (!balance || balance <= 0) return null;
  const withExpenses = monthly.filter((m) => m.expenses > 0);
  if (withExpenses.length < 3) return null;
  const recent = withExpenses.slice(-Math.min(6, withExpenses.length));
  const avg = recent.reduce((s, m) => s + m.expenses, 0) / recent.length;
  if (avg <= 0) return null;
  const months = Math.round(balance / avg);
  if (months < 1) return "Þetta dugar fyrir innan við mánuð af venjulegum rekstri.";
  return `Þetta dugar fyrir um ${months} ${months === 1 ? "mánuð" : "mánaða"} venjulegan rekstur.`;
}

/**
 * "Staðan er X kr. hærri en í síðasta mánuði." eða lægri.
 * Notar nettó síðasta heila mánaðar.
 */
export function vsLastMonth(monthly: MonthlyData[]): string | null {
  const withData = monthly.filter((m) => m.income > 0 || m.expenses > 0);
  if (withData.length < 1) return null;
  const last = withData[withData.length - 1];
  const net = last.income - last.expenses;
  if (net === 0) return null;
  if (net > 0) {
    return `Staðan er ${formatISK(net)} hærri en í byrjun mánaðarins.`;
  }
  return `Staðan lækkaði um ${formatISK(net)} í mánuðinum. Gæti verið eðlilegt ef stór reikningur var greiddur.`;
}

/**
 * "Hladdu inn nokkrum mánuðum og þá get ég sagt betur."
 */
export const NOT_ENOUGH_DATA_MSG =
  "Hladdu inn nokkrum mánuðum og þá get ég sagt betur.";

/**
 * Næsta skref á Yfirliti — alltaf ein setning, forgangsröðuð.
 */
export interface NextStepInput {
  hasData: boolean;
  uncategorizedCount: number;
  overdueTaskCount: number;
  month: number; // 0-indexed
}

export function nextStep(input: NextStepInput): string {
  if (!input.hasData) return "Byrjaðu á bankayfirliti.";
  if (input.overdueTaskCount > 0) {
    return `${input.overdueTaskCount} ${input.overdueTaskCount === 1 ? "verkefni komið" : "verkefni komin"} fram yfir.`;
  }
  if (input.uncategorizedCount > 0) {
    return `Við þurfum aðeins hjálp með ${input.uncategorizedCount} ${input.uncategorizedCount === 1 ? "hreyfingu" : "hreyfingar"}.`;
  }
  // Janúar (0) - apríl (3)
  if (input.month <= 3) {
    return "Aðalfundur nálgast. Gott er að hafa ársyfirlitið tilbúið.";
  }
  return "Ekkert kallar á athygli. Þú getur búið til drög að skýrslu þegar þú vilt.";
}

/**
 * Forgangsröðuð innsýnar-setning fyrir Peningar.
 * A) Óvenjulegt > B) Stærst > C) Tekjur vs gjöld > D) Ekki nóg gögn.
 */
export interface MonthlyCategorySnapshot {
  name: string;
  current: number; // síðasti mánuður
  avg3: number; // meðaltal síðustu 3 mán (án síðasta?)
}

export function peningarInsight(args: {
  categories: MonthlyCategorySnapshot[];
  lastMonthIncome: number;
  lastMonthExpenses: number;
  monthsAvailable: number;
}): string {
  if (args.monthsAvailable < 2 && args.categories.length === 0) {
    return "Þegar fleiri mánuðir eru komnir inn get ég sýnt þróun.";
  }

  // A) Óvenjulegt: hækkun >20% og >50.000 kr breyting
  if (args.monthsAvailable >= 3) {
    const unusual = args.categories
      .filter((c) => c.avg3 > 0 && c.current - c.avg3 > 50_000)
      .map((c) => ({
        ...c,
        pct: Math.round(((c.current - c.avg3) / c.avg3) * 100),
      }))
      .filter((c) => c.pct >= 20)
      .sort((a, b) => b.pct - a.pct);
    if (unusual.length > 0) {
      const top = unusual[0];
      return `${top.name} var ${top.pct}% hærra en venjulega — gæti verið þess virði að skoða.`;
    }
  }

  // B) Stærst
  const biggest = [...args.categories].sort((a, b) => b.current - a.current)[0];
  if (biggest && biggest.current > 0) {
    return `Stærsti kostnaðurinn í mánuðinum var ${biggest.name}, ${formatISK(biggest.current)}.`;
  }

  // C) Tekjur vs gjöld
  if (args.lastMonthIncome > 0 || args.lastMonthExpenses > 0) {
    const diff = args.lastMonthExpenses - args.lastMonthIncome;
    if (Math.abs(diff) < 1000) {
      return "Tekjur og gjöld voru jöfn í mánuðinum.";
    }
    if (diff > 0) {
      return `Gjöld voru ${formatISK(diff)} hærri en tekjur í mánuðinum.`;
    }
    return `Tekjur voru ${formatISK(-diff)} hærri en gjöld í mánuðinum.`;
  }

  return "Þegar fleiri mánuðir eru komnir inn get ég sýnt þróun.";
}
