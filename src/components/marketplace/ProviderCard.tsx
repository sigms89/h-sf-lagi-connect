import type { ServiceProvider } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  provider: ServiceProvider;
}

export function ProviderCard({ provider }: Props) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="font-medium text-sm">{provider.company_name}</p>
        <p className="text-xs text-muted-foreground mt-1">{provider.description_is ?? 'Engin lýsing'}</p>
      </CardContent>
    </Card>
  );
}
