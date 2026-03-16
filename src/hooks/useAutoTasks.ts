// ============================================================
// Húsfélagið.is — useAutoTasks
// Auto-creates tasks from financial alert conditions on load
// ============================================================

import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useFinancialAlerts } from '@/hooks/useAlerts';

export function useAutoTasks(associationId: string | undefined) {
  const { data: alerts = [] } = useFinancialAlerts(associationId);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!associationId || alerts.length === 0 || hasRun.current) return;
    hasRun.current = true;

    const run = async () => {
      // Fetch existing open tasks to avoid duplicates
      const { data: existingTasks } = await supabase
        .from('tasks')
        .select('title')
        .eq('association_id', associationId)
        .in('status', ['open', 'in_progress']);

      const existingTitles = new Set((existingTasks ?? []).map((t: any) => t.title));

      const tasksToCreate: Array<{
        association_id: string;
        title: string;
        description: string;
        priority: string;
        category: string;
      }> = [];

      for (const alert of alerts) {
        // Missing payments → task per resident
        if (alert.type === 'missing_payment' && alert.vendor) {
          const title = `Innheimta vangreiðslu — ${alert.vendor}`;
          if (!existingTitles.has(title)) {
            tasksToCreate.push({
              association_id: associationId,
              title,
              description: alert.description,
              priority: 'critical',
              category: 'vangreiðsla',
            });
            existingTitles.add(title);
          }
        }

        // Low balance → single task
        if (alert.type === 'low_balance') {
          const title = 'Sjóðsstaða er lág — endurskoða húsgjald';
          if (!existingTitles.has(title)) {
            tasksToCreate.push({
              association_id: associationId,
              title,
              description: alert.description,
              priority: 'critical',
              category: 'sjóðsstaða',
            });
            existingTitles.add(title);
          }
        }
      }

      if (tasksToCreate.length > 0) {
        await supabase.from('tasks').insert(tasksToCreate);
      }
    };

    run();
  }, [associationId, alerts]);
}
