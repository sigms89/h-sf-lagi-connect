// ============================================================
// Húsfélagið.is — Benchmarking Page (placeholder)
// ============================================================

import { Card, CardContent } from '@/components/ui/card';
import { Scale, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BenchmarkWidget } from '@/components/dashboard/BenchmarkWidget';
import { useCurrentAssociation } from '@/hooks/useAssociation';

export default function Benchmarking() {
  const { data: association } = useCurrentAssociation();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Samanburður</h1>
        <Badge variant="secondary">Beta</Badge>
      </div>

      <div className="max-w-lg">
        <BenchmarkWidget numUnits={association?.num_units} />
      </div>

      <Card className="border-dashed max-w-lg">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            <Scale className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">Fullur samanburður í vinnslu</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Nafnlaus samanburður við öll húsfélög á landsvísu. Sjáðu hvar þið getið sparað.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            Fáanlegt í Plus og Pro áskrift
          </div>
          <Button variant="outline" size="sm" disabled>
            Tilkynna mér þegar tilbúið
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
