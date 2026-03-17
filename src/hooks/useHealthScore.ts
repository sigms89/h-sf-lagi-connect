// ============================================================
// useHealthScore.ts
// Calculates a 0–100 financial health score for an association
// based on transaction data. Returns factors with Icelandic labels.
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { db } from '@/integrations/supabase/db';


// ---------------------------------------------------------------
// Types
// ---------------------------------------------------------------

export interface HealthScoreFactor {
  key: string;
  label: string;       // Icelandic
  score: number;       // 0–100 for this factor
  weight: number;      // 0–1
  status: 'good' | 'warning' | 'critical';
  detail: string;      // Icelandic explanation
}

export interface HealthScoreResult {
  score: number;       // 0–100 overall weighted score
  label: string;       // "Gott" | "Þarfnast athugunar" | "Aðgerða þörf"
  color: 'green' | 'yellow' | 'red';
  factors: HealthScoreFactor[];
}

// ---------------------------------------------------------------
// Transaction row shape (subset we need)
// ---------------------------------------------------------------

interface TxRow {
  amount: number;
  balance: number | null;
  is_income: boolean;
  is_individual_payment: boolean;
  date: string;
  category_id: string | null;
}

// ---------------------------------------------------------------
// Score helpers
// ---------------------------------------------------------------

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

function factorStatus(score: number): 'good' | 'warning' | 'critical' {
  if (score >= 70) return 'good';
  if (score >= 40) return 'warning';
  return 'critical';
}

// ---------------------------------------------------------------
// Factor calculators — ALL scores are Math.round()'d
// ---------------------------------------------------------------

/** Factor 1 — Tekjur vs gjöld (30%): income/expense ratio */
function calcIncomeExpense(txs: TxRow[]): HealthScoreFactor {
  const totalIncome = txs.filter((t) => t.is_income).reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalExpense = txs.filter((t) => !t.is_income).reduce((s, t) => s + Math.abs(t.amount), 0);

  let score: number;
  let detail: string;

  if (totalExpense === 0) {
    score = totalIncome > 0 ? 100 : 50;
    detail = 'Engin útgjöld skráð á tímabilinu.';
  } else {
    const ratio = totalIncome / totalExpense;
    score = Math.round(clamp(ratio * 100));
    const pct = ((ratio - 1) * 100).toFixed(1);
    if (ratio >= 1) {
      detail = `Tekjur eru ${Math.abs(Number(pct))}% umfram gjöld.`;
    } else {
      detail = `Gjöld eru ${Math.abs(Number(pct))}% umfram tekjur.`;
    }
  }

  return {
    key: 'income_expense',
    label: 'Tekjur vs gjöld',
    score,
    weight: 0.3,
    status: factorStatus(score),
    detail,
  };
}

/** Factor 2 — Sjóðsstaða (25%): balance vs avg monthly expenses */
function calcCashPosition(txs: TxRow[]): HealthScoreFactor {
  const sorted = [...txs].sort((a, b) => b.date.localeCompare(a.date));
  const latestBalance = sorted.find((t) => t.balance != null)?.balance ?? 0;

  const now = new Date();
  const twelveMonthsAgo = subMonths(now, 12);
  const recentExpenses = txs.filter(
    (t) => !t.is_income && new Date(t.date) >= twelveMonthsAgo,
  );
  const totalRecentExpenses = recentExpenses.reduce((s, t) => s + Math.abs(t.amount), 0);
  const avgMonthlyExpense = totalRecentExpenses / 12;

  let score: number;
  let detail: string;

  if (avgMonthlyExpense === 0) {
    score = 50;
    detail = 'Ekki næg gögn til að reikna sjóðsstöðu.';
  } else {
    const ratio = latestBalance / avgMonthlyExpense;
    if (ratio >= 3) {
      score = 100;
    } else if (ratio >= 0) {
      score = Math.round(clamp((ratio / 3) * 100));
    } else {
      score = 0;
    }
    const months = ratio.toFixed(1);
    detail = `Sjóðsstaða samsvarar ${months} mánaða útgjöldum.`;
  }

  return {
    key: 'cash_position',
    label: 'Sjóðsstaða',
    score,
    weight: 0.25,
    status: factorStatus(score),
    detail,
  };
}

/** Factor 3 — Greiðsluhlutfall (20%): % individual payments received last month */
function calcPaymentRate(txs: TxRow[]): HealthScoreFactor {
  const now = new Date();
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const lastMonthPayments = txs.filter((t) => {
    const d = new Date(t.date);
    return t.is_individual_payment && d >= lastMonthStart && d <= lastMonthEnd;
  });

  const expectedPayments = txs.filter((t) => {
    const d = new Date(t.date);
    return t.is_individual_payment && t.is_income && d >= lastMonthStart && d <= lastMonthEnd;
  });

  let score: number;
  let detail: string;

  if (expectedPayments.length === 0) {
    const totalIndividual = lastMonthPayments.length;
    if (totalIndividual === 0) {
      score = 50;
      detail = 'Engar einstaklingsgreiðslur skráðar síðasta mánuð.';
    } else {
      const received = lastMonthPayments.filter((t) => t.is_income).length;
      score = Math.round(clamp((received / totalIndividual) * 100));
      detail = `${received} af ${totalIndividual} greiðslum mótteknar síðasta mánuð.`;
    }
  } else {
    const receivedCount = lastMonthPayments.filter((t) => t.is_income).length;
    const expectedCount = expectedPayments.length;
    score = Math.round(clamp((receivedCount / expectedCount) * 100));
    detail = `${receivedCount} af ${expectedCount} greiðslum mótteknar síðasta mánuð.`;
  }

  return {
    key: 'payment_rate',
    label: 'Greiðsluhlutfall',
    score,
    weight: 0.2,
    status: factorStatus(score),
    detail,
  };
}

/**
 * Factor 4 — Viðvaranir (15%)
 */
function calcAlerts(txs: TxRow[]): HealthScoreFactor {
  const now = new Date();
  const twelveMonthsAgo = subMonths(now, 12);

  const monthlyExpenses: Record<string, number> = {};
  txs.forEach((t) => {
    const d = new Date(t.date);
    if (!t.is_income && d >= twelveMonthsAgo) {
      const key = format(d, 'yyyy-MM');
      monthlyExpenses[key] = (monthlyExpenses[key] ?? 0) + Math.abs(t.amount);
    }
  });

  const monthValues = Object.values(monthlyExpenses);
  const avgMonthlyExpense =
    monthValues.length > 0
      ? monthValues.reduce((s, v) => s + v, 0) / monthValues.length
      : 0;

  let warnings = 0;
  let criticals = 0;

  if (avgMonthlyExpense > 0) {
    monthValues.forEach((v) => {
      const ratio = v / avgMonthlyExpense;
      if (ratio > 2) {
        criticals++;
      } else if (ratio > 1.5) {
        warnings++;
      }
    });
  }

  const rawScore = 100 - criticals * 20 - warnings * 10;
  const score = Math.round(clamp(rawScore));

  let detail: string;
  if (criticals === 0 && warnings === 0) {
    detail = 'Engar viðvaranir á síðustu 12 mánuðum.';
  } else {
    detail = `${criticals} alvarlegar og ${warnings} viðvaranir á síðustu 12 mánuðum.`;
  }

  return {
    key: 'alerts',
    label: 'Viðvaranir',
    score,
    weight: 0.15,
    status: factorStatus(score),
    detail,
  };
}

/**
 * Factor 5 — Viðhaldskostnaður (10%)
 */
function calcMaintenanceRatio(
  txs: TxRow[],
  maintenanceCategoryIds: Set<string>,
): HealthScoreFactor {
  const expenses = txs.filter((t) => !t.is_income);
  const totalExpenses = expenses.reduce((s, t) => s + Math.abs(t.amount), 0);
  const maintenanceExpenses = expenses
    .filter((t) => t.category_id != null && maintenanceCategoryIds.has(t.category_id!))
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  let score: number;
  let detail: string;

  if (totalExpenses === 0 || maintenanceCategoryIds.size === 0) {
    score = 50;
    detail = 'Ekki næg gögn til að meta viðhaldskostnað.';
  } else {
    const pct = (maintenanceExpenses / totalExpenses) * 100;
    const pctStr = pct.toFixed(1);

    if (pct >= 15 && pct <= 25) {
      score = 100;
      detail = `Viðhaldskostnaður er ${pctStr}% af heildargjöldum, innan við markmiðsbils.`;
    } else if (pct < 15) {
      score = Math.round(clamp((pct / 15) * 100));
      detail = `Viðhaldskostnaður er ${pctStr}%, lægri en ráðlögð 15–25%.`;
    } else {
      score = Math.round(clamp(((50 - pct) / 25) * 100));
      detail = `Viðhaldskostnaður er ${pctStr}%, hærri en ráðlögð 15–25%.`;
    }
  }

  return {
    key: 'maintenance',
    label: 'Viðhaldskostnaður',
    score,
    weight: 0.1,
    status: factorStatus(score),
    detail,
  };
}

// ---------------------------------------------------------------
// Aggregate score
// ---------------------------------------------------------------

function aggregateScore(factors: HealthScoreFactor[]): HealthScoreResult {
  const weightedSum = factors.reduce((s, f) => s + f.score * f.weight, 0);
  const totalWeight = factors.reduce((s, f) => s + f.weight, 0);
  const score = Math.round(totalWeight > 0 ? weightedSum / totalWeight : 0);

  let label: string;
  let color: 'green' | 'yellow' | 'red';

  if (score >= 70) {
    label = 'Gott';
    color = 'green';
  } else if (score >= 40) {
    label = 'Þarfnast athugunar';
    color = 'yellow';
  } else {
    label = 'Aðgerða þörf';
    color = 'red';
  }

  return { score, label, color, factors };
}

// ---------------------------------------------------------------
// Query function
// ---------------------------------------------------------------

async function fetchHealthScore(associationId: string): Promise<HealthScoreResult> {
  const { data: txs, error: txError } = await (db as any)
    .from('transactions')
    .select('amount, balance, is_income, is_individual_payment, date, category_id')
    .eq('association_id', associationId);

  if (txError) throw txError;

  const transactions: TxRow[] = txs ?? [];

  const { data: cats, error: catError } = await (db as any)
    .from('categories')
    .select('id, name_is');

  if (catError) throw catError;

  const maintenanceCategoryIds = new Set<string>(
    (cats ?? [])
      .filter((c: { id: string; name_is: string }) => {
        const n = (c.name_is ?? '').toLowerCase();
        return n.includes('viðhald') || n.includes('viðgerð') || n.includes('maintenance');
      })
      .map((c: { id: string }) => c.id),
  );

  const factors: HealthScoreFactor[] = [
    calcIncomeExpense(transactions),
    calcCashPosition(transactions),
    calcPaymentRate(transactions),
    calcAlerts(transactions),
    calcMaintenanceRatio(transactions, maintenanceCategoryIds),
  ];

  return aggregateScore(factors);
}

// ---------------------------------------------------------------
// Hook
// ---------------------------------------------------------------

export function useHealthScore(associationId: string | null | undefined) {
  return useQuery<HealthScoreResult>({
    queryKey: ['health_score', associationId],
    queryFn: () => fetchHealthScore(associationId!),
    enabled: Boolean(associationId),
    staleTime: 5 * 60 * 1000,
  });
}
