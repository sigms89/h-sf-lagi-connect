import { useQuery } from '@tanstack/react-query';
import { db } from '@/integrations/supabase/db';
import type { Category, VendorRule } from '@/types/database';

export const CATEGORY_KEYS = {
  all: ['categories'] as const,
  list: () => [...CATEGORY_KEYS.all, 'list'] as const,
  vendorRules: (associationId?: string) => [...CATEGORY_KEYS.all, 'vendor-rules', associationId] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: CATEGORY_KEYS.list(),
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await db.from('categories').select('*').order('name_is', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Category[];
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

export function useVendorRules(associationId?: string | null) {
  return useQuery({
    queryKey: CATEGORY_KEYS.vendorRules(associationId ?? undefined),
    queryFn: async (): Promise<VendorRule[]> => {
      let query = db.from('vendor_rules').select(`*, category:categories(*), vendor:vendors(*)`).order('priority', { ascending: false });
      if (associationId) {
        query = query.or(`is_global.eq.true,association_id.eq.${associationId}`);
      } else {
        query = query.eq('is_global', true);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as VendorRule[];
    },
    staleTime: 10 * 60 * 1000,
    enabled: true,
  });
}
