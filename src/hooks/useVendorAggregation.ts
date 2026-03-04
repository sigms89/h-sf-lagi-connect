import { useQuery } from '@tanstack/react-query';
import { db } from '@/integrations/supabase/db';
import { format, subMonths } from 'date-fns';

export interface VendorSummary {
  vendorId: string;
  vendorName: string;
  totalSpend: number;
  transactionCount: number;
  lastTransactionDate: string;
}

export function useVendorAggregation(
  associationId: string | null | undefined
) {
  return useQuery({
    queryKey: ['vendor-aggregation', associationId],
    queryFn: async (): Promise<VendorSummary[]> => {
      if (!associationId) return [];

      const { data, error } = await db
        .from('transactions')
        .select('amount, date, is_income, vendor_id, vendor:vendors(id, name)')
        .eq('association_id', associationId)
        .eq('is_income', false)
        .not('vendor_id', 'is', null)
        .order('date', { ascending: false });

      if (error) throw error;

      const txList = (data ?? []) as Array<{
        amount: number;
        date: string;
        is_income: boolean;
        vendor_id: string | null;
        vendor: { id: string; name: string } | null;
      }>;

      // Aggregate by vendor
      const vendorMap = new Map<
        string,
        {
          name: string;
          totalSpend: number;
          transactionCount: number;
          lastDate: string;
        }
      >();

      for (const tx of txList) {
        if (!tx.vendor_id || !tx.vendor) continue;
        const existing = vendorMap.get(tx.vendor_id);
        if (existing) {
          existing.totalSpend += Math.abs(tx.amount);
          existing.transactionCount += 1;
          if (tx.date > existing.lastDate) {
            existing.lastDate = tx.date;
          }
        } else {
          vendorMap.set(tx.vendor_id, {
            name: tx.vendor.name,
            totalSpend: Math.abs(tx.amount),
            transactionCount: 1,
            lastDate: tx.date,
          });
        }
      }

      const results: VendorSummary[] = [];
      for (const [vendorId, v] of vendorMap) {
        results.push({
          vendorId,
          vendorName: v.name,
          totalSpend: v.totalSpend,
          transactionCount: v.transactionCount,
          lastTransactionDate: v.lastDate,
        });
      }

      // Sort by total spend descending
      return results.sort((a, b) => b.totalSpend - a.totalSpend);
    },
    enabled: !!associationId,
    staleTime: 5 * 60 * 1000,
  });
}
