// ============================================================
// Húsfélagið.is: Admin Extended Hooks (NEW)
// TanStack Query hooks for new admin tabs:
// Audit log, Users, Categories (CRUD + merge), Bid requests
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/integrations/supabase/db';
import type { Category, BidRequest } from '@/types/database';
import { toast } from 'sonner';

// ============================================================
// TYPES
// ============================================================

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  profile?: {
    full_name: string | null;
  } | null;
}

export interface AuditLogFilters {
  action?: string;
  date_from?: string;
  date_to?: string;
}

export interface AdminUser {
  id: string;
  user_id: string;
  association_id: string;
  role: string;
  is_active: boolean;
  joined_at: string | null;
  profile: {
    full_name: string | null;
    user_id: string;
  } | null;
  association: {
    id: string;
    name: string;
  } | null;
}

export interface CategoryInsert {
  name_is: string;
  name_en: string | null;
  icon: string | null;
  color: string | null;
  is_system: boolean;
  parent_category_id: string | null;
}

export interface CategoryUpdate extends Partial<CategoryInsert> {
  id: string;
}

export interface MergeCategoriesPayload {
  sourceId: string;
  targetId: string;
}

export interface AdminBidRequest {
  id: string;
  title: string;
  status: string;
  deadline: string | null;
  created_at: string | null;
  association_id: string;
  category_id: string;
  association: {
    id: string;
    name: string;
  } | null;
  category: {
    id: string;
    name_is: string;
  } | null;
  bid_count: number;
}

// ============================================================
// QUERY KEYS
// ============================================================
export const ADMIN_EXT_KEYS = {
  all: ['admin-ext'] as const,
  auditLog: (page?: number, pageSize?: number, filters?: AuditLogFilters) =>
    [...ADMIN_EXT_KEYS.all, 'audit-log', page, pageSize, filters] as const,
  users: (search?: string, page?: number) =>
    [...ADMIN_EXT_KEYS.all, 'users', search, page] as const,
  categories: () => [...ADMIN_EXT_KEYS.all, 'categories'] as const,
  bidRequests: (status?: string, search?: string, page?: number) =>
    [...ADMIN_EXT_KEYS.all, 'bid-requests', status, search, page] as const,
};

// ============================================================
// useAuditLog
// Paginated audit log with optional filters
// Note: audit_log table has old_value/new_value, we combine them as metadata
// ============================================================
export function useAuditLog(
  page = 1,
  pageSize = 25,
  filters?: AuditLogFilters
) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return useQuery({
    queryKey: ADMIN_EXT_KEYS.auditLog(page, pageSize, filters),
    queryFn: async (): Promise<{ data: AuditLogEntry[]; count: number }> => {
      let query = db
        .from('audit_log')
        .select(
          `
          id,
          user_id,
          action,
          entity_type,
          entity_id,
          old_value,
          new_value,
          created_at
        `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(from, to);

      if (filters?.action) {
        query = query.eq('action', filters.action);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      // Map old_value/new_value into a combined metadata object
      const mapped: AuditLogEntry[] = (data ?? []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        action: row.action,
        entity_type: row.entity_type,
        entity_id: row.entity_id,
        metadata: {
          ...(row.old_value ? { old_value: row.old_value } : {}),
          ...(row.new_value ? { new_value: row.new_value } : {}),
        },
        created_at: row.created_at,
        profile: null, // No FK join available; user_id shown as fallback
      }));

      return {
        data: mapped,
        count: count ?? 0,
      };
    },
    staleTime: 60 * 1000,
  });
}

// ============================================================
// useAllUsers
// All users across all associations — join association_members + profiles + associations
// ============================================================
export function useAllUsers(search?: string, page = 1, pageSize = 25) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return useQuery({
    queryKey: ADMIN_EXT_KEYS.users(search, page),
    queryFn: async (): Promise<{ data: AdminUser[]; count: number }> => {
      let query = db
        .from('association_members')
        .select(
          `
          id,
          user_id,
          association_id,
          role,
          is_active,
          joined_at,
          association:associations(id, name)
        `,
          { count: 'exact' }
        )
        .order('joined_at', { ascending: false });

      // Fetch all and do client-side profile resolution
      if (search) {
        const { data: allData, error } = await query;
        if (error) throw error;

        // Fetch profiles for name lookup
        const userIds = [...new Set((allData ?? []).map((r: any) => r.user_id))];
        const { data: profiles } = await db
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);

        const profileMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));

        const needle = search.toLowerCase();
        const withProfiles = (allData ?? []).map((row: any) => ({
          ...row,
          profile: profileMap.get(row.user_id) ?? null,
        }));

        const filtered = withProfiles.filter((row: any) => {
          const name = row.profile?.full_name ?? '';
          const assocName = row.association?.name ?? '';
          return (
            name.toLowerCase().includes(needle) ||
            assocName.toLowerCase().includes(needle)
          );
        }) as AdminUser[];

        return {
          data: filtered.slice(from, to + 1),
          count: filtered.length,
        };
      }

      // No search — use server-side pagination
      query = query.range(from, to);
      const { data, error, count } = await query;
      if (error) throw error;

      // Fetch profiles for these users
      const userIds = [...new Set((data ?? []).map((r: any) => r.user_id))];
      const { data: profiles } = await db
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const profileMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));

      const withProfiles = (data ?? []).map((row: any) => ({
        ...row,
        profile: profileMap.get(row.user_id) ?? null,
      })) as AdminUser[];

      return {
        data: withProfiles,
        count: count ?? 0,
      };
    },
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================================
// useAdminCategories
// ============================================================
export function useAdminCategories() {
  return useQuery({
    queryKey: ADMIN_EXT_KEYS.categories(),
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await db
        .from('categories')
        .select('*')
        .order('name_is', { ascending: true });

      if (error) throw error;
      return (data ?? []) as Category[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================
// useCreateCategory
// ============================================================
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CategoryInsert): Promise<Category> => {
      const { data, error } = await db
        .from('categories')
        .insert([payload])
        .select('*')
        .single();

      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_EXT_KEYS.categories() });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Flokkur stofnaður');
    },
    onError: (error: Error) => {
      toast.error(`Villa: ${error.message}`);
    },
  });
}

// ============================================================
// useUpdateCategory
// ============================================================
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: CategoryUpdate): Promise<void> => {
      const { error } = await db
        .from('categories')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_EXT_KEYS.categories() });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Flokkur uppfærður');
    },
    onError: (error: Error) => {
      toast.error(`Villa: ${error.message}`);
    },
  });
}

// ============================================================
// useDeleteCategory
// ============================================================
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await db
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_EXT_KEYS.categories() });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Flokkur eytt');
    },
    onError: (error: Error) => {
      toast.error(`Villa: ${error.message}`);
    },
  });
}

// ============================================================
// useMergeCategories
// Move all transactions + vendor_rules from source → target, then delete source
// ============================================================
export function useMergeCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sourceId, targetId }: MergeCategoriesPayload): Promise<void> => {
      if (sourceId === targetId) {
        throw new Error('Upprunalegur flokkur og markhópur mega ekki vera sami flokkurinn');
      }

      // 1. Re-point all transactions
      const { error: txError } = await db
        .from('transactions')
        .update({ category_id: targetId })
        .eq('category_id', sourceId);

      if (txError) throw txError;

      // 2. Re-point all vendor_rules
      const { error: vrError } = await db
        .from('vendor_rules')
        .update({ category_id: targetId })
        .eq('category_id', sourceId);

      if (vrError) throw vrError;

      // 3. Re-point service_provider_categories
      const { error: spcError } = await db
        .from('service_provider_categories')
        .update({ category_id: targetId })
        .eq('category_id', sourceId);

      if (spcError) throw spcError;

      // 4. Delete source category
      const { error: delError } = await db
        .from('categories')
        .delete()
        .eq('id', sourceId);

      if (delError) throw delError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_EXT_KEYS.categories() });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Flokkar sameinaðir');
    },
    onError: (error: Error) => {
      toast.error(`Villa: ${error.message}`);
    },
  });
}

// ============================================================
// useAllBidRequests
// Global view of all bid_requests with association + category + bid count
// ============================================================
export function useAllBidRequests(
  status?: string,
  search?: string,
  page = 1,
  pageSize = 25
) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return useQuery({
    queryKey: ADMIN_EXT_KEYS.bidRequests(status, search, page),
    queryFn: async (): Promise<{ data: AdminBidRequest[]; count: number }> => {
      let query = db
        .from('bid_requests')
        .select(
          `
          id,
          title,
          status,
          deadline,
          created_at,
          association_id,
          category_id,
          association:associations(id, name),
          category:categories(id, name_is),
          bids(id)
        `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(from, to);

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      const mapped: AdminBidRequest[] = (data ?? []).map((row: any) => ({
        id: row.id,
        title: row.title,
        status: row.status,
        deadline: row.deadline,
        created_at: row.created_at,
        association_id: row.association_id,
        category_id: row.category_id,
        association: row.association ?? null,
        category: row.category ?? null,
        bid_count: Array.isArray(row.bids) ? row.bids.length : 0,
      }));

      return { data: mapped, count: count ?? 0 };
    },
    staleTime: 2 * 60 * 1000,
  });
}
