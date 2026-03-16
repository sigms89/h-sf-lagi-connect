// ============================================================
// Húsfélagið.is — useAlerts: Financial Alert Detection Engine
// Runs statistical checks on transaction history to surface
// price increases, anomalies, missing payments, and more.
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { db } from '@/integrations/supabase/db';
import { subMonths, format } from 'date-fns';
import { formatNumberIs } from '@/lib/categories';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AlertSeverity = 'critical' | 'warning' | 'info' | 'suggestion';

export type AlertType =
  | 'price_increase'
  | 'anomaly'
  | 'missing_payment'
  | 'low_balance'
  | 'bid_recommendation'
  | 'fee_adequacy'
  | 'seasonal';

export interface FinancialAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  metric?: { current: number; previous: number; change: number };
  actionLabel?: string;
  actionHref?: string;
  vendor?: string;
  category?: string;
  createdAt: string;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

interface RawTx {
  id: string;
  date: string;
  description: string;
  amount: number;
  balance: number | null;
  is_income: boolean;
  is_individual_payment: boolean;
  category_id: string | null;
  category_name: string | null;
  category_color: string | null;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / values.length;
  return Math.sqrt(variance);
}

/** yyyy-MM key from a date string */
function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

/** Severity sort order — lower = more important */
const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
  suggestion: 3,
};

function sortAlerts(alerts: FinancialAlert[]): FinancialAlert[] {
  return [...alerts].sort((a, b) => {
    const sd = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (sd !== 0) return sd;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

// ── Check A: Price Increase Detection ────────────────────────────────────────

function checkPriceIncreases(transactions: RawTx[], now: Date): FinancialAlert[] {
  const alerts: FinancialAlert[] = [];
  const expenses = transactions.filter((t) => !t.is_income && t.amount < 0);

  // Group by vendor/description key
  const vendorMap = new Map<string, { date: string; amount: number }[]>();
  for (const tx of expenses) {
    const key = tx.description.trim();
    if (!vendorMap.has(key)) vendorMap.set(key, []);
    vendorMap.get(key)!.push({ date: tx.date, amount: Math.abs(tx.amount) });
  }

  for (const [vendor, txs] of vendorMap) {
    // Need at least 6 distinct months of data
    const monthTotals = new Map<string, number>();
    for (const tx of txs) {
      const k = monthKey(tx.date);
      monthTotals.set(k, (monthTotals.get(k) ?? 0) + tx.amount);
    }
    if (monthTotals.size < 6) continue;

    const sortedMonths = Array.from(monthTotals.keys()).sort();
    const lastN = sortedMonths.slice(-6);
    const recent3 = lastN.slice(3); // latest 3
    const prev3 = lastN.slice(0, 3); // previous 3

    const recentAvg = mean(recent3.map((m) => monthTotals.get(m)!));
    const prevAvg = mean(prev3.map((m) => monthTotals.get(m)!));

    if (prevAvg === 0) continue;
    const changePct = ((recentAvg - prevAvg) / prevAvg) * 100;

    if (changePct > 20) {
      alerts.push({
        id: `price_increase_critical_${vendor.slice(0, 20).replace(/\s/g, '_')}`,
        type: 'price_increase',
        severity: 'critical',
        title: `Verðhækkun hjá ${vendor}`,
        description: `Meðalútgjöld síðustu 3 mánuðina eru ${changePct.toFixed(0)}% hærri en fyrri 3 mánuðirnir.`,
        metric: { current: recentAvg, previous: prevAvg, change: changePct },
        vendor,
        actionLabel: 'Skoða færslur',
        actionHref: `/transactions?search=${encodeURIComponent(vendor)}`,
        createdAt: now.toISOString(),
      });
    } else if (changePct > 10) {
      alerts.push({
        id: `price_increase_warning_${vendor.slice(0, 20).replace(/\s/g, '_')}`,
        type: 'price_increase',
        severity: 'warning',
        title: `Verðhækkun hjá ${vendor}`,
        description: `Meðalútgjöld síðustu 3 mánuðina eru ${changePct.toFixed(0)}% hærri en fyrri 3 mánuðirnir.`,
        metric: { current: recentAvg, previous: prevAvg, change: changePct },
        vendor,
        actionLabel: 'Skoða færslur',
        actionHref: `/transactions?search=${encodeURIComponent(vendor)}`,
        createdAt: now.toISOString(),
      });
    }
  }

  return alerts;
}

// ── Check B: Anomaly Detection ────────────────────────────────────────────────

function checkAnomalies(transactions: RawTx[], now: Date): FinancialAlert[] {
  const alerts: FinancialAlert[] = [];
  const expenses = transactions.filter((t) => !t.is_income && t.amount < 0 && t.category_id);

  // Group by category, then by month
  const catMonthMap = new Map<
    string,
    { name: string; months: Map<string, number> }
  >();

  for (const tx of expenses) {
    const catId = tx.category_id!;
    const catName = tx.category_name ?? 'Óþekktur flokkur';
    if (!catMonthMap.has(catId)) {
      catMonthMap.set(catId, { name: catName, months: new Map() });
    }
    const entry = catMonthMap.get(catId)!;
    const k = monthKey(tx.date);
    entry.months.set(k, (entry.months.get(k) ?? 0) + Math.abs(tx.amount));
  }

  const currentMonth = format(now, 'yyyy-MM');

  for (const [, { name, months }] of catMonthMap) {
    const allMonths = Array.from(months.entries()).sort(([a], [b]) => a.localeCompare(b));
    if (allMonths.length < 6) continue;

    const values = allMonths.map(([, v]) => v);
    const m = mean(values);
    const sd = stddev(values);

    const currentTotal = months.get(currentMonth) ?? 0;
    if (currentTotal === 0) continue;

    if (currentTotal > m + 2 * sd) {
      alerts.push({
        id: `anomaly_${name.slice(0, 20).replace(/\s/g, '_')}`,
        type: 'anomaly',
        severity: 'warning',
        title: `Óvenjuleg upphæð í ${name}`,
        description: `Útgjöld þessa mánaðar (${currentTotal.toLocaleString('is-IS')} kr.) eru mun yfir meðaltali (${m.toFixed(0)} kr.) í þessum flokki.`,
        metric: { current: currentTotal, previous: m, change: ((currentTotal - m) / m) * 100 },
        category: name,
        createdAt: now.toISOString(),
      });
    }
  }

  return alerts;
}

// ── Check C: Missing Payments ─────────────────────────────────────────────────

function checkMissingPayments(transactions: RawTx[], now: Date): FinancialAlert[] {
  const alerts: FinancialAlert[] = [];
  const individualIncome = transactions.filter(
    (t) => t.is_individual_payment && t.is_income
  );

  if (individualIncome.length === 0) return alerts;

  // Find the most recent complete month (previous month to avoid false positives mid-month)
  const lastMonth = format(subMonths(now, 1), 'yyyy-MM');
  const prevPrevMonth = format(subMonths(now, 2), 'yyyy-MM');

  // Collect all unique payers who paid in the month before last
  const payersPrevPrev = new Set<string>();
  const payersLast = new Set<string>();

  for (const tx of individualIncome) {
    const k = monthKey(tx.date);
    const key = tx.description.trim();
    if (k === prevPrevMonth) payersPrevPrev.add(key);
    if (k === lastMonth) payersLast.add(key);
  }

  // If someone paid 2 months ago but not last month → missing payment
  for (const payer of payersPrevPrev) {
    if (!payersLast.has(payer)) {
      alerts.push({
        id: `missing_payment_${payer.slice(0, 20).replace(/\s/g, '_')}`,
        type: 'missing_payment',
        severity: 'warning',
        title: `Vangreiðsla — ${payer}`,
        description: `Engin greiðsla frá ${payer} í ${lastMonth.slice(0, 7)} þótt greitt hafi verið mánuðinn á undan.`,
        vendor: payer,
        actionLabel: 'Skoða greiðslur',
        actionHref: `/transactions?search=${encodeURIComponent(payer)}`,
        createdAt: now.toISOString(),
      });
    }
  }

  return alerts;
}

// ── Check D: Low Balance ──────────────────────────────────────────────────────

function checkLowBalance(transactions: RawTx[], now: Date): FinancialAlert[] {
  const alerts: FinancialAlert[] = [];

  // Latest balance
  const withBalance = transactions
    .filter((t) => t.balance !== null)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (withBalance.length === 0) return alerts;
  const latestBalance = withBalance[0].balance!;

  // Average monthly expenses over last 6 months
  const sixMonthsAgo = format(subMonths(now, 6), 'yyyy-MM');
  const recentExpenses = transactions.filter(
    (t) => !t.is_income && t.amount < 0 && monthKey(t.date) >= sixMonthsAgo
  );

  const monthlyExpMap = new Map<string, number>();
  for (const tx of recentExpenses) {
    const k = monthKey(tx.date);
    monthlyExpMap.set(k, (monthlyExpMap.get(k) ?? 0) + Math.abs(tx.amount));
  }

  if (monthlyExpMap.size === 0) return alerts;
  const avgMonthlyExpenses = mean(Array.from(monthlyExpMap.values()));

  if (avgMonthlyExpenses === 0) return alerts;

  if (latestBalance < avgMonthlyExpenses) {
    alerts.push({
      id: 'low_balance_critical',
      type: 'low_balance',
      severity: 'critical',
      title: 'Mjög lágur sjóðsstaða',
      description: `Sjóðsstaða (${latestBalance.toLocaleString('is-IS')} kr.) er undir meðalmánaðarútgjöldum (${avgMonthlyExpenses.toFixed(0)} kr.).`,
      metric: { current: latestBalance, previous: avgMonthlyExpenses, change: ((latestBalance - avgMonthlyExpenses) / avgMonthlyExpenses) * 100 },
      actionLabel: 'Skoða greininguna',
      actionHref: '/analytics',
      createdAt: now.toISOString(),
    });
  } else if (latestBalance < 1.5 * avgMonthlyExpenses) {
    alerts.push({
      id: 'low_balance_warning',
      type: 'low_balance',
      severity: 'warning',
      title: 'Lágur sjóðsstaða',
      description: `Sjóðsstaða (${latestBalance.toLocaleString('is-IS')} kr.) er minni en 1,5× meðalmánaðarútgjöld.`,
      metric: { current: latestBalance, previous: avgMonthlyExpenses, change: ((latestBalance - avgMonthlyExpenses) / avgMonthlyExpenses) * 100 },
      actionLabel: 'Skoða greininguna',
      actionHref: '/analytics',
      createdAt: now.toISOString(),
    });
  }

  return alerts;
}

// ── Check E: Bid Recommendations ─────────────────────────────────────────────

function checkBidRecommendations(transactions: RawTx[], now: Date): FinancialAlert[] {
  const alerts: FinancialAlert[] = [];
  const expenses = transactions.filter((t) => !t.is_income && t.amount < 0);

  const vendorMap = new Map<string, { date: string; amount: number }[]>();
  for (const tx of expenses) {
    const key = tx.description.trim();
    if (!vendorMap.has(key)) vendorMap.set(key, []);
    vendorMap.get(key)!.push({ date: tx.date, amount: Math.abs(tx.amount) });
  }

  const threeYearsAgo = format(subMonths(now, 36), 'yyyy-MM');

  for (const [vendor, txs] of vendorMap) {
    const monthTotals = new Map<string, number>();
    for (const tx of txs) {
      const k = monthKey(tx.date);
      monthTotals.set(k, (monthTotals.get(k) ?? 0) + tx.amount);
    }

    const sortedMonths = Array.from(monthTotals.keys()).sort();
    if (sortedMonths.length < 24) continue; // need 2+ years
    if (sortedMonths[0] > threeYearsAgo) continue; // need 3+ years of data

    // Compare first 3 months avg vs last 3 months avg
    const first3 = sortedMonths.slice(0, 3);
    const last3 = sortedMonths.slice(-3);
    const firstAvg = mean(first3.map((m) => monthTotals.get(m)!));
    const lastAvg = mean(last3.map((m) => monthTotals.get(m)!));

    if (firstAvg === 0) continue;
    const cumulativeIncrease = ((lastAvg - firstAvg) / firstAvg) * 100;

    if (cumulativeIncrease > 15) {
      alerts.push({
        id: `bid_recommendation_${vendor.slice(0, 20).replace(/\s/g, '_')}`,
        type: 'bid_recommendation',
        severity: 'suggestion',
        title: `Tilboð mælt með — ${vendor}`,
        description: `Þjónustuverð frá ${vendor} hefur hækkað um ${cumulativeIncrease.toFixed(0)}% á 3+ árum. Íhugaðu að finna tilboð.`,
        vendor,
        metric: { current: lastAvg, previous: firstAvg, change: cumulativeIncrease },
        actionLabel: 'Biðja um tilboð',
        actionHref: '/marketplace',
        createdAt: now.toISOString(),
      });
    }
  }

  return alerts;
}

// ── Check F: Fee Adequacy ─────────────────────────────────────────────────────

function checkFeeAdequacy(
  transactions: RawTx[],
  now: Date,
  numUnits: number
): FinancialAlert[] {
  const alerts: FinancialAlert[] = [];
  const twelveMonthsAgo = format(subMonths(now, 12), 'yyyy-MM');

  const recent = transactions.filter((t) => monthKey(t.date) >= twelveMonthsAgo);

  let totalIncome = 0;
  let totalExpenses = 0;
  for (const tx of recent) {
    if (tx.is_income || tx.amount > 0) totalIncome += Math.abs(tx.amount);
    else totalExpenses += Math.abs(tx.amount);
  }

  if (totalExpenses === 0) return alerts;

  const deficit = totalExpenses - totalIncome;
  if (deficit > 0) {
    const monthlyDeficit = deficit / 12;
    const neededIncreasePerUnit = numUnits > 0 ? monthlyDeficit / numUnits : 0;

    alerts.push({
      id: 'fee_adequacy_warning',
      type: 'fee_adequacy',
      severity: 'warning',
      title: 'Húsgjöld standa ekki undir kostnaði',
      description: `Á síðustu 12 mánuðum eru gjöld ${deficit.toLocaleString('is-IS')} kr. umfram tekjur. Ráðlögð hækkun: ${neededIncreasePerUnit.toFixed(0)} kr./íbúð/mán.`,
      metric: { current: totalExpenses, previous: totalIncome, change: ((totalExpenses - totalIncome) / totalIncome) * 100 },
      actionLabel: 'Skoða greiningu',
      actionHref: '/analytics',
      createdAt: now.toISOString(),
    });
  }

  return alerts;
}

// ── Check G: Seasonal Patterns ────────────────────────────────────────────────

function checkSeasonalPatterns(transactions: RawTx[], now: Date): FinancialAlert[] {
  const alerts: FinancialAlert[] = [];
  const expenses = transactions.filter((t) => !t.is_income && t.amount < 0 && t.category_id);

  // Group by category × month-of-year
  const catMonthOfYearMap = new Map<
    string,
    { name: string; byMonthOfYear: Map<number, number[]> }
  >();

  for (const tx of expenses) {
    const catId = tx.category_id!;
    const catName = tx.category_name ?? 'Óþekktur flokkur';
    if (!catMonthOfYearMap.has(catId)) {
      catMonthOfYearMap.set(catId, { name: catName, byMonthOfYear: new Map() });
    }
    const entry = catMonthOfYearMap.get(catId)!;
    const monthOfYear = parseInt(tx.date.slice(5, 7), 10); // 1–12
    const year = tx.date.slice(0, 4);
    // Monthly total per year-month
    const k = `${year}-${String(monthOfYear).padStart(2, '0')}`;
    // Store by month-of-year → list of monthly totals
    if (!entry.byMonthOfYear.has(monthOfYear)) {
      entry.byMonthOfYear.set(monthOfYear, []);
    }
  }

  // Rebuild as monthly totals per category per year-month
  const catYearMonthTotals = new Map<string, { name: string; months: Map<string, number> }>();
  for (const tx of expenses) {
    const catId = tx.category_id!;
    const catName = tx.category_name ?? 'Óþekktur flokkur';
    if (!catYearMonthTotals.has(catId)) {
      catYearMonthTotals.set(catId, { name: catName, months: new Map() });
    }
    const entry = catYearMonthTotals.get(catId)!;
    const k = monthKey(tx.date);
    entry.months.set(k, (entry.months.get(k) ?? 0) + Math.abs(tx.amount));
  }

  const currentMonthNum = now.getMonth() + 1; // 1-12
  const currentMonthKey = format(now, 'yyyy-MM');

  for (const [, { name, months }] of catYearMonthTotals) {
    const allEntries = Array.from(months.entries());
    if (allEntries.length < 12) continue;

    // Get all historical totals for the same month-of-year
    const sameMonthHistorical = allEntries
      .filter(([k]) => {
        const m = parseInt(k.slice(5, 7), 10);
        return m === currentMonthNum && k !== currentMonthKey;
      })
      .map(([, v]) => v);

    if (sameMonthHistorical.length < 2) continue;

    const historicalMean = mean(sameMonthHistorical);
    const currentTotal = months.get(currentMonthKey) ?? 0;

    if (historicalMean === 0) continue;

    if (currentTotal > historicalMean * 1.3) {
      alerts.push({
        id: `seasonal_${name.slice(0, 20).replace(/\s/g, '_')}`,
        type: 'seasonal',
        severity: 'info',
        title: `Árstíðabundin hækkun — ${name}`,
        description: `Sögulega er kostnaður í ${name} þennan mánuð ${((historicalMean / mean(allEntries.map(([, v]) => v)) - 1) * 100).toFixed(0)}% yfir ársmeðaltali.`,
        category: name,
        createdAt: now.toISOString(),
      });
    }
  }

  return alerts;
}

// ── Main Hook ─────────────────────────────────────────────────────────────────

export function useFinancialAlerts(associationId: string | null | undefined) {
  return useQuery({
    queryKey: ['financial_alerts', associationId],
    queryFn: async (): Promise<FinancialAlert[]> => {
      if (!associationId) return [];

      // Fetch association info for num_units
      const { data: assoc } = await db
        .from('associations')
        .select('num_units')
        .eq('id', associationId)
        .maybeSingle();

      const numUnits: number = assoc?.num_units ?? 1;

      // Fetch all transactions (no pagination — alerts need full history)
      const { data: rawTransactions, error } = await db
        .from('transactions')
        .select(`
          id, date, description, amount, balance,
          is_income, is_individual_payment, category_id,
          category:categories(id, name_is, color)
        `)
        .eq('association_id', associationId)
        .order('date', { ascending: false })
        .limit(10000);

      if (error) throw error;

      const transactions: RawTx[] = (rawTransactions ?? []).map((t: any) => ({
        id: t.id,
        date: t.date,
        description: t.description,
        amount: t.amount,
        balance: t.balance,
        is_income: t.is_income,
        is_individual_payment: t.is_individual_payment,
        category_id: t.category_id,
        category_name: t.category?.name_is ?? null,
        category_color: t.category?.color ?? null,
      }));

      const now = new Date();
      const alerts: FinancialAlert[] = [
        ...checkPriceIncreases(transactions, now),
        ...checkAnomalies(transactions, now),
        ...checkMissingPayments(transactions, now),
        ...checkLowBalance(transactions, now),
        ...checkBidRecommendations(transactions, now),
        ...checkFeeAdequacy(transactions, now, numUnits),
        ...checkSeasonalPatterns(transactions, now),
      ];

      return sortAlerts(alerts);
    },
    enabled: !!associationId,
    staleTime: 10 * 60 * 1000, // 10 minutes — alerts don't need real-time refresh
  });
}
