// ============================================================
// Húsfélagið.is: Insights — hreinar fallar sem mynda íslenskar
// "hvað þýðir þetta" setningar úr gögnum sem þegar eru sótt.
// Engin ný gögn, engar nýjar fyrirspurnir.
// ============================================================

import type { MonthlyData } from "@/types/database";

const MONTH_NAMES_IS = [
  "janúar", "febrúar", "mars", "apríl", "maí", "júní",
  "júlí", "ágúst", "september", "október", "nóvember", "desember",
];

const MONTH_NAMES_IS_ACC = [
  "janúar", "febrúar", "mars", "apríl", "maí", "júní",
  "júlí", "ágúst", "september", "október", "nóvember", "desember",
];

export interface UploadPromptResult {
  message: string;
  action: string;
}

export function uploadPrompt(lastTransactionDate: string | null): UploadPromptResult | null {
  if (!lastTransactionDate) return null;
  const last = new Date(lastTransactionDate);
  const now = new Date();
  if (isNaN(last.getTime())) return null;

  const lastMonth = last.getMonth();
  const lastYear = last.getFullYear();
  const curMonth = now.getMonth();
  const curYear = now.getFullYear();

  const monthsBehind = (curYear - lastYear) * 12 + (curMonth - lastMonth);
  const daysSince = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  if (monthsBehind >= 1) {
    const nextDate = new Date(lastYear, lastMonth + 1, 1);
    const nextName = MONTH_NAMES_IS_ACC[nextDate.getMonth()];
    const lastName = MONTH_NAMES_IS[lastMonth];
    if (monthsBehind === 1) {
      return {
        message: `Síðasta hreyfing er frá ${lastName}. Viltu hlaða inn ${nextName}?`,
        action: `Hlaða inn ${nextName}`,
      };
    }
    return {
      message: `Það vantar ${monthsBehind} mánuði af gögnum. Síðasta hreyfing er frá ${lastName}.`,
      action: "Hlaða inn nýju yfirliti",
    };
  }

  if (daysSince >= 25) {
    return {
      message: "Mánuður liðinn frá síðustu uppfærslu. Tekur tvær mínútur að uppfæra.",
      action: "Hlaða inn nýju yfirliti",
    };
  }

  return null;
}


function formatISK(amount: number): string {
  const abs = Math.abs(Math.round(amount));
  return abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " kr.";
}

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

export const NOT_ENOUGH_DATA_MSG =
  "Hladdu inn nokkrum mánuðum og þá get ég sagt betur.";

// ============================================================
// Next step — ein aðgerð, einn takki, ein setning.
// ============================================================

export type NextStepKind =
  | "upload-first"
  | "overdue-tasks"
  | "uncategorized"
  | "missing-month"
  | "annual-meeting"
  | "all-good";

export interface NextStepResult {
  kind: NextStepKind;
  /** Stuttur titill — það sem skiptir máli */
  title: string;
  /** Útskýring í einni línu — af hverju þetta núna */
  subtitle?: string;
  /** Takki sem klárar skrefið */
  cta?: { label: string; href: string };
  /** "neutral" venjulega, "warn" þegar eitthvað kallar á athygli */
  tone: "neutral" | "warn" | "calm";
}

export interface NextStepInput {
  hasData: boolean;
  uncategorizedCount: number;
  overdueTaskCount: number;
  openTaskCount: number;
  monthsBehind: number; // 0 = up to date
  month: number; // 0-indexed
}

export function nextStepV2(input: NextStepInput): NextStepResult {
  if (!input.hasData) {
    return {
      kind: "upload-first",
      title: "Byrjaðu á að hlaða inn bankayfirliti",
      subtitle: "Tekur tvær mínútur. Svo sé ég stöðuna fyrir þig.",
      cta: { label: "Hlaða inn yfirliti", href: "/upload" },
      tone: "neutral",
    };
  }

  if (input.overdueTaskCount > 0) {
    const n = input.overdueTaskCount;
    return {
      kind: "overdue-tasks",
      title: `${n} ${n === 1 ? "verkefni er" : "verkefni eru"} komin fram yfir`,
      subtitle: "Renndu yfir og klárðu eða færðu áfram.",
      cta: { label: "Skoða verkefnin", href: "/verkefni" },
      tone: "warn",
    };
  }

  if (input.monthsBehind >= 1) {
    return {
      kind: "missing-month",
      title:
        input.monthsBehind === 1
          ? "Síðasti mánuður vantar inn"
          : `${input.monthsBehind} mánuði vantar inn`,
      subtitle: "Tekur tvær mínútur að uppfæra.",
      cta: { label: "Hlaða inn yfirliti", href: "/upload" },
      tone: "warn",
    };
  }

  if (input.uncategorizedCount > 0) {
    const n = input.uncategorizedCount;
    return {
      kind: "uncategorized",
      title: `Mig vantar hjálp með ${n} ${n === 1 ? "hreyfingu" : "hreyfingar"}`,
      subtitle: "Eitt smell á flokk og þetta er búið.",
      cta: { label: "Flokka hreyfingar", href: "/peningar" },
      tone: "neutral",
    };
  }

  // Janúar (0) - apríl (3): aðalfundartími
  if (input.month <= 3) {
    return {
      kind: "annual-meeting",
      title: "Aðalfundur nálgast",
      subtitle: "Gott er að hafa ársyfirlitið tilbúið. Ég get útbúið drög.",
      cta: { label: "Útbúa skýrslu", href: "/skyrsla" },
      tone: "calm",
    };
  }

  return {
    kind: "all-good",
    title: "Allt er í lagi hjá þér",
    subtitle:
      input.openTaskCount > 0
        ? `${input.openTaskCount} ${input.openTaskCount === 1 ? "verkefni bíður" : "verkefni bíða"} en ekkert sem brennur.`
        : "Engin verkefni opin. Komdu aftur þegar nýtt yfirlit er tilbúið.",
    tone: "calm",
  };
}

// Gamla útgáfan — höldum eftir fyrir aðra notkun.
export function nextStep(input: Omit<NextStepInput, "openTaskCount" | "monthsBehind">): string {
  return nextStepV2({ ...input, openTaskCount: 0, monthsBehind: 0 }).title;
}

/**
 * Forgangsröðuð innsýnar-setning fyrir Peningar.
 */
export interface MonthlyCategorySnapshot {
  name: string;
  current: number;
  avg3: number;
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

  const biggest = [...args.categories].sort((a, b) => b.current - a.current)[0];
  if (biggest && biggest.current > 0) {
    return `Stærsti kostnaðurinn í mánuðinum var ${biggest.name}, ${formatISK(biggest.current)}.`;
  }

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
