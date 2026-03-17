// ============================================================
// Húsfélagið.is — useProviderPortfolio
// CRUD for provider portfolio images via storage
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, supabase } from '@/integrations/supabase/db';
import { toast } from 'sonner';

export interface PortfolioImage {
  id: string;
  provider_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export function usePortfolioImages(providerId: string | undefined) {
  return useQuery({
    queryKey: ['portfolio-images', providerId],
    enabled: !!providerId,
    queryFn: async () => {
      const { data, error } = await db
        .from('provider_portfolio_images')
        .select('*')
        .eq('provider_id', providerId!)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data ?? []) as PortfolioImage[];
    },
  });
}

export function useUploadPortfolioImage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      providerId: string;
      file: File;
      caption?: string;
    }) => {
      if (params.file.size > 5 * 1024 * 1024) {
        throw new Error('Mynd má ekki vera stærri en 5MB');
      }

      const ext = params.file.name.split('.').pop() ?? 'jpg';
      const fileName = `${params.providerId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('provider-media')
        .upload(fileName, params.file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('provider-media')
        .getPublicUrl(fileName);

      // Get current max sort_order
      const { data: existing } = await db
        .from('provider_portfolio_images')
        .select('sort_order')
        .eq('provider_id', params.providerId)
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextOrder = existing && existing.length > 0 ? (existing[0] as any).sort_order + 1 : 0;

      const { error: insertError } = await db
        .from('provider_portfolio_images')
        .insert({
          provider_id: params.providerId,
          image_url: urlData.publicUrl,
          caption: params.caption || null,
          sort_order: nextOrder,
        });

      if (insertError) throw insertError;
    },
    onSuccess: (_, params) => {
      qc.invalidateQueries({ queryKey: ['portfolio-images', params.providerId] });
      toast.success('Mynd hlaðið upp');
    },
    onError: (err: any) => {
      toast.error(`Villa: ${err.message}`);
    },
  });
}

export function useDeletePortfolioImage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: { imageId: string; providerId: string; imageUrl: string }) => {
      // Delete from DB
      const { error } = await db
        .from('provider_portfolio_images')
        .delete()
        .eq('id', params.imageId);

      if (error) throw error;

      // Try to delete from storage (extract path from URL)
      try {
        const url = new URL(params.imageUrl);
        const pathMatch = url.pathname.match(/provider-media\/(.+)$/);
        if (pathMatch) {
          await supabase.storage.from('provider-media').remove([pathMatch[1]]);
        }
      } catch {
        // Storage cleanup is best-effort
      }
    },
    onSuccess: (_, params) => {
      qc.invalidateQueries({ queryKey: ['portfolio-images', params.providerId] });
      toast.success('Mynd fjarlægð');
    },
    onError: (err: any) => {
      toast.error(`Villa: ${err.message}`);
    },
  });
}
