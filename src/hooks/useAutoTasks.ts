// ============================================================
// Húsfélagið.is: useAutoTasks
// Auto-creates tasks from financial alert conditions on load.
// Dedup uses category + related_entity_id to avoid duplicates.
// ============================================================

import { useEffect, useRef } from 'react';
import { db } from '@/integrations/supabase/db';
import { useFinancialAlerts } from '@/hooks/useAlerts';
import { subMonths, format } from 'date-fns';
import { is } from 'date-fns/locale';
import { v5 as uuidv5 } from 'uuid';

// Deterministic namespace for generating related_entity_id from strings
const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

/** Generate a deterministic UUID from a string key */
function entityId(key: string): string {
  return uuidv5(key, NAMESPACE);
}

/** Extract first name from a full name / payer description */
function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

/** Format month in Icelandic, e.g. "mars 2026" */
function icelandicMonth(dateStr: string): string {
  const d = new Date(dateStr);
  return format(d, 'MMMM yyyy', { locale: is });
}

interface AutoTask {
  association_id: string;
  title: string;
  description: string;
  priority: string;
  category: string;
  visibility: string;
  source: string;
  created_by: null;
  related_entity_id: string | null;
  current_stage?: number;
  total_stages?: number;
}

export function useAutoTasks(associationId: string | undefined) {
  const { data: alerts = [] } = useFinancialAlerts(associationId);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!associationId || alerts.length === 0 || hasRun.current) return;
    hasRun.current = true;

    const run = async () => {
      // ── Fetch existing open auto-tasks for dedup ──
      const { data: existingTasks } = await db
        .from('tasks')
        .select('category, related_entity_id')
        .eq('association_id', associationId)
        .in('status', ['open', 'in_progress'])
        .eq('source', 'auto');

      // Build a dedup set: "category|related_entity_id"
      const existingKeys = new Set(
        (existingTasks ?? []).map(
          (t: { category: string | null; related_entity_id: string | null }) =>
            `${t.category ?? ''}|${t.related_entity_id ?? ''}`
        )
      );

      const isDuplicate = (category: string, relatedId: string | null): boolean => {
        return existingKeys.has(`${category}|${relatedId ?? ''}`);
      };

      const tasksToCreate: AutoTask[] = [];

      // ── 1. Vangreiðsla tasks ──
      for (const alert of alerts) {
        if (alert.type === 'missing_payment' && alert.vendor) {
          const relId = entityId(alert.vendor);
          if (isDuplicate('vangreiðsla', relId)) continue;

          const name = firstName(alert.vendor);
          // Extract month from alert — createdAt is based on detection time,
          // but description references the missing month
          const month = icelandicMonth(alert.createdAt);

          tasksToCreate.push({
            association_id: associationId,
            title: `Senda áminningu til ${name} vegna húsgjalds ${month}`,
            description: alert.description,
            priority: 'critical',
            category: 'vangreiðsla',
            visibility: 'board',
            source: 'auto',
            created_by: null,
            related_entity_id: relId,
            current_stage: 1,
            total_stages: 4,
          });
          existingKeys.add(`vangreiðsla|${relId}`);
        }

        // ── 2. Sjóðsstaða task ──
        if (alert.type === 'low_balance') {
          const relId = entityId('low_balance_singleton');
          if (isDuplicate('sjóðsstaða', relId)) continue;

          tasksToCreate.push({
            association_id: associationId,
            title: 'Sjóðsstaða er lág, endurskoða húsgjald',
            description: alert.description,
            priority: 'critical',
            category: 'sjóðsstaða',
            visibility: 'board',
            source: 'auto',
            created_by: null,
            related_entity_id: relId,
          });
          existingKeys.add(`sjóðsstaða|${relId}`);
        }
      }

      // ── 3. Viðhaldskostnaður check ──
      await checkMaintenanceCost(associationId, isDuplicate, existingKeys, tasksToCreate);

      // ── Insert all new tasks ──
      if (tasksToCreate.length > 0) {
        await db.from('tasks').insert(tasksToCreate);
      }
    };

    run();
  }, [associationId, alerts]);
}

/** Check if maintenance expenses exceed 40% of total expenses in last 12 months */
async function checkMaintenanceCost(
  associationId: string,
  isDuplicate: (cat: string, relId: string | null) => boolean,
  existingKeys: Set<string>,
  tasksToCreate: AutoTask[]
) {
  const relId = entityId('maintenance_ratio');
  if (isDuplicate('viðhald', relId)) return;

  const twelveMonthsAgo = format(subMonths(new Date(), 12), 'yyyy-MM-dd');

  // Fetch expenses with category info
  const { data: transactions } = await db
    .from('transactions')
    .select('amount, is_income, category_id, categories(name_is)')
    .eq('association_id', associationId)
    .eq('is_income', false)
    .gte('date', twelveMonthsAgo);

  if (!transactions || transactions.length === 0) return;

  let totalExpenses = 0;
  let maintenanceExpenses = 0;

  for (const tx of transactions as Array<{
    amount: number;
    is_income: boolean;
    category_id: string | null;
    categories: { name_is: string } | null;
  }>) {
    const amt = Math.abs(tx.amount);
    totalExpenses += amt;

    const catName = tx.categories?.name_is?.toLowerCase() ?? '';
    if (catName.includes('viðhald')) {
      maintenanceExpenses += amt;
    }
  }

  if (totalExpenses === 0) return;

  const pct = (maintenanceExpenses / totalExpenses) * 100;
  if (pct > 40) {
    tasksToCreate.push({
      association_id: associationId,
      title: `Skoða viðhaldskostnað, ${pct.toFixed(0)}% af gjöldum`,
      description: `Viðhaldskostnaður síðustu 12 mánaða er ${pct.toFixed(0)}% af heildargjöldum. Ráðlagt er að meta hvort hægt sé að draga úr kostnaði eða leita tilboða.`,
      priority: 'warning',
      category: 'viðhald',
      visibility: 'board',
      source: 'auto',
      created_by: null,
      related_entity_id: relId,
    });
    existingKeys.add(`viðhald|${relId}`);
  }
}
