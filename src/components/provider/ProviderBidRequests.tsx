import type { ServiceProvider } from '@/types/database';

interface Props { provider: ServiceProvider; }

export function ProviderBidRequests({ provider }: Props) {
  return <div className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">Tilboðsbeiðnir — kemur fljótlega</p></div>;
}
