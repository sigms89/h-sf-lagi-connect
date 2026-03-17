// ============================================================
// Húsfélagið.is — ProviderCard
// Card for a service provider listing
// ============================================================

import { useNavigate } from 'react-router-dom';
import { Globe, Mail, MapPin, Phone, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { ServiceProvider } from '@/types/database';
import { getCategoryColor } from '@/lib/categories';
import { useProviderReviewStats } from '@/hooks/useProviderReviews';

interface ProviderCardProps {
  provider: ServiceProvider;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function ProviderCard({ provider }: ProviderCardProps) {
  const navigate = useNavigate();
  const stats = useProviderReviewStats(provider.id);

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/marketplace/provider/${provider.id}`)}
    >
      <CardContent className="p-4 space-y-3">
        {/* Top: avatar + name */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 rounded-lg border">
            <AvatarImage src={provider.logo_url ?? undefined} alt={provider.company_name} />
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-sm font-semibold">
              {getInitials(provider.company_name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{provider.company_name}</p>
            {stats.reviewCount > 0 ? (
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-medium">{stats.averageRating.toFixed(1)}</span>
                <span className="text-[10px] text-muted-foreground">
                  ({stats.reviewCount})
                </span>
              </div>
            ) : provider.kennitala ? (
              <p className="text-xs text-muted-foreground">Kt. {provider.kennitala}</p>
            ) : null}
          </div>
        </div>

        {/* Description */}
        {provider.description_is && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {provider.description_is}
          </p>
        )}

        {/* Categories */}
        {provider.categories && provider.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {provider.categories.slice(0, 4).map((cat) => {
              const colors = getCategoryColor(cat.color);
              return (
                <Badge key={cat.id} className={`${colors.badge} text-[10px] border px-1.5 py-0`}>
                  {cat.name_is}
                </Badge>
              );
            })}
            {provider.categories.length > 4 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                +{provider.categories.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Service area */}
        {provider.service_area && provider.service_area.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">
              {provider.service_area.slice(0, 3).join(', ')}
              {provider.service_area.length > 3 &&
                ` + ${provider.service_area.length - 3} svæði`}
            </span>
          </div>
        )}

        {/* Contact footer */}
        <div className="flex items-center gap-3 pt-1 border-t">
          {provider.phone && (
            <a
              href={`tel:${provider.phone}`}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>{provider.phone}</span>
            </a>
          )}
          {provider.email && (
            <a
              href={`mailto:${provider.email}`}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              <span className="truncate max-w-[120px]">{provider.email}</span>
            </a>
          )}
          {provider.website && (
            <a
              href={provider.website}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors ml-auto"
            >
              <Globe className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
