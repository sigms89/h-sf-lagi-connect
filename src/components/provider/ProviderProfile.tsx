import type { ServiceProvider } from '@/types/database';

interface Props { provider: ServiceProvider; }

export function ProviderProfile({ provider }: Props) {
  return <div className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">Prófíll — kemur fljótlega</p></div>;
}
