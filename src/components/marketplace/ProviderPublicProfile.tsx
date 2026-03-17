// ============================================================
// Húsfélagið.is — ProviderPublicProfile
// Full public profile page for a service provider
// ============================================================

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Globe,
  Mail,
  MapPin,
  MessageSquarePlus,
  Phone,
  Star,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { is } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/integrations/supabase/db';
import { getCategoryColor } from '@/lib/categories';
import {
  useProviderReviews,
  useProviderReviewStats,
  useCanReview,
} from '@/hooks/useProviderReviews';
import { usePortfolioImages } from '@/hooks/useProviderPortfolio';
import { ProviderGallery } from '@/components/marketplace/ProviderGallery';
import { WriteReviewDialog } from '@/components/marketplace/WriteReviewDialog';
import type { ServiceProvider } from '@/types/database';

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const h = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${h} ${
            star <= Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'text-muted-foreground/20'
          }`}
        />
      ))}
    </div>
  );
}

function ReviewLabel({ numUnits, postalCode }: { numUnits?: number; postalCode?: string | null }) {
  if (!numUnits) return <span className="text-muted-foreground">Húsfélag</span>;
  const parts = [`${numUnits} íbúða húsfélag`];
  if (postalCode) parts.push(`í póstnúmeri ${postalCode}`);
  return <span className="text-muted-foreground">{parts.join(' ')}</span>;
}

export default function ProviderPublicProfile() {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  // Fetch provider
  const { data: provider, isLoading: loadingProvider } = useQuery({
    queryKey: ['provider-public', providerId],
    enabled: !!providerId,
    queryFn: async () => {
      const { data, error } = await db
        .from('service_providers')
        .select('*, service_provider_categories(category_id, categories(id, name_is, color, icon))')
        .eq('id', providerId!)
        .single();

      if (error) throw error;

      const cats = (data as any)?.service_provider_categories?.map((spc: any) => spc.categories).filter(Boolean) ?? [];

      return {
        ...data,
        service_area: Array.isArray(data.service_area) ? data.service_area : [],
        categories: cats,
      } as ServiceProvider;
    },
  });

  const { data: reviews = [] } = useProviderReviews(providerId);
  const stats = useProviderReviewStats(providerId);
  const { data: images = [] } = usePortfolioImages(providerId);
  const { data: canReviewData } = useCanReview(providerId);

  if (loadingProvider) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Þjónustuaðili fannst ekki.</p>
        <Button variant="link" onClick={() => navigate('/marketplace')}>
          Til baka
        </Button>
      </div>
    );
  }

  const SERVICE_AREA_LABELS: Record<string, string> = {
    '1': 'Reykjavík (100–199)',
    '2': 'Kópavogur / Hafnarfjörður (200–299)',
    '3': 'Vesturland (300–399)',
    '4': 'Vestfirðir (400–499)',
    '5': 'Norðurland vestra (500–599)',
    '6': 'Norðurland eystra (600–699)',
    '7': 'Austurland (700–799)',
    '8': 'Suðurland (800–899)',
    '9': 'Vestmannaeyjar (900–999)',
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 -ml-2 text-muted-foreground"
        onClick={() => navigate('/marketplace')}
      >
        <ArrowLeft className="h-4 w-4" />
        Markaðstorg
      </Button>

      {/* Hero card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 rounded-xl border-2 border-border">
              <AvatarImage src={provider.logo_url ?? undefined} alt={provider.company_name} />
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-lg font-bold">
                {getInitials(provider.company_name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold tracking-tight">{provider.company_name}</h1>
              {provider.kennitala && (
                <p className="text-xs text-muted-foreground mt-0.5">Kt. {provider.kennitala}</p>
              )}

              {/* Rating summary */}
              {stats.reviewCount > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <StarRating rating={stats.averageRating} size="lg" />
                  <span className="text-sm font-semibold">{stats.averageRating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">
                    ({stats.reviewCount} {stats.reviewCount === 1 ? 'umsögn' : 'umsagnir'})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {provider.description_is && (
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
              {provider.description_is}
            </p>
          )}

          {/* Categories */}
          {provider.categories && provider.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {provider.categories.map((cat) => {
                const colors = getCategoryColor(cat.color);
                return (
                  <Badge key={cat.id} className={`${colors.badge} text-xs border`}>
                    {cat.name_is}
                  </Badge>
                );
              })}
            </div>
          )}

          {/* Service area */}
          {provider.service_area.length > 0 && (
            <div className="flex items-start gap-2 mt-4">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex flex-wrap gap-1.5">
                {provider.service_area.map((code) => (
                  <Badge key={code} variant="outline" className="text-xs">
                    {SERVICE_AREA_LABELS[code] ?? code}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Contact */}
          <Separator className="my-4" />
          <div className="flex flex-wrap items-center gap-4">
            {provider.phone && (
              <a
                href={`tel:${provider.phone}`}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Phone className="h-4 w-4" />
                {provider.phone}
              </a>
            )}
            {provider.email && (
              <a
                href={`mailto:${provider.email}`}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-4 w-4" />
                {provider.email}
              </a>
            )}
            {provider.website && (
              <a
                href={provider.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-sm text-accent hover:underline transition-colors"
              >
                <Globe className="h-4 w-4" />
                Vefsíða
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Gallery */}
      {images.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Verkefni og myndir</CardTitle>
          </CardHeader>
          <CardContent>
            <ProviderGallery images={images} />
          </CardContent>
        </Card>
      )}

      {/* Reviews */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Umsagnir
              {stats.reviewCount > 0 && (
                <span className="text-muted-foreground font-normal ml-2">
                  ({stats.reviewCount})
                </span>
              )}
            </CardTitle>
            {canReviewData?.canReview && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => setShowReviewDialog(true)}
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                Skrifa umsögn
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">Engar umsagnir enn.</p>
              {canReviewData?.canReview && (
                <p className="text-xs text-muted-foreground mt-1">
                  Vertu fyrstur til að skrifa umsögn!
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => {
                const isUpdated =
                  review.updated_at &&
                  review.created_at &&
                  new Date(review.updated_at).getTime() - new Date(review.created_at).getTime() > 60000;

                return (
                  <div key={review.id} className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <StarRating rating={review.rating} />
                        <p className="text-xs mt-1">
                          <ReviewLabel
                            numUnits={review.association_num_units}
                            postalCode={review.association_postal_code}
                          />
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[11px] text-muted-foreground">
                          {format(new Date(review.created_at), 'd. MMM yyyy', { locale: is })}
                        </p>
                        {isUpdated && (
                          <p className="text-[10px] text-accent">
                            Uppfært {formatDistanceToNow(new Date(review.updated_at), { locale: is, addSuffix: true })}
                          </p>
                        )}
                      </div>
                    </div>

                    {review.comment && (
                      <p className="text-sm leading-relaxed">{review.comment}</p>
                    )}

                    {/* Provider response */}
                    {review.provider_response && (
                      <div className="ml-4 pl-3 border-l-2 border-accent/30 bg-accent/5 rounded-r-md py-2 pr-3">
                        <p className="text-[11px] font-medium text-accent mb-1">
                          Svar frá {provider.company_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {review.provider_response}
                        </p>
                        {review.response_at && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {format(new Date(review.response_at), 'd. MMM yyyy', { locale: is })}
                          </p>
                        )}
                      </div>
                    )}

                    <Separator />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Write review dialog */}
      {canReviewData?.canReview && canReviewData.eligibleBids[0] && (
        <WriteReviewDialog
          open={showReviewDialog}
          onClose={() => setShowReviewDialog(false)}
          providerId={provider.id}
          providerName={provider.company_name}
          associationId={canReviewData.eligibleBids[0].association_id}
          bidRequestId={canReviewData.eligibleBids[0].bid_request_id}
        />
      )}
    </div>
  );
}
